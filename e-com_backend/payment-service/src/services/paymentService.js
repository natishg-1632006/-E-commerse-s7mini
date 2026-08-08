const { v4: uuidv4 } = require('uuid');
const { PutCommand, GetCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, PAYMENTS_TABLE } = require('../utils/fileHandler');
const { getOrderById } = require('../utils/orderApi');
const { PAYMENT_STATUS, ORDER_STATUS } = require('../constants/paymentConstants');
const { publishPaymentEvent } = require('./snsService');
const Razorpay = require('razorpay');

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured in environment variables');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const publishOrderEvent = async (eventType, payment) => {
  const order = await getOrderById(payment.orderId);
  await publishPaymentEvent(eventType, payment, order);
};

// Payment service publishes events to SNS instead of calling Order/Inventory directly.
// The publish helper is in `snsService.js` and will throw on failure, but this service
// treats publish failures as non-fatal notifications.

// ─── Service functions ────────────────────────────────────────────────────────

const createPayment = async (orderId, userId, paymentMethod) => {
  const order = await getOrderById(orderId);
  if (!order)
    throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  if (order.userId !== userId)
    throw Object.assign(new Error('Unauthorized: userId does not match order'), { statusCode: 403 });
  if (order.orderStatus === ORDER_STATUS.CANCELLED || order.orderStatus === ORDER_STATUS.EXPIRED)
    throw Object.assign(new Error(`Cannot create payment for a ${order.orderStatus.toLowerCase()} order`), { statusCode: 400 });
  if (order.paymentStatus === PAYMENT_STATUS.PAID)
    throw Object.assign(new Error('Order is already paid'), { statusCode: 400 });

  const isCOD = paymentMethod === 'COD';
  const now = new Date().toISOString();

  if (isCOD) {
    const payment = {
      paymentid: uuidv4(),
      orderId,
      userId,
      amount: order.totalAmount,
      paymentMethod,
      transactionId: `COD-${uuidv4().split('-')[0].toUpperCase()}`,
      status: PAYMENT_STATUS.PAID,
      createdAt: now,
    };

    await docClient.send(new PutCommand({ TableName: PAYMENTS_TABLE, Item: payment }));
    console.log(`[Payment] Created | paymentId: ${payment.paymentid} | orderId: ${orderId} | userId: ${userId} | method: ${paymentMethod} | amount: ${payment.amount} | timestamp: ${now}`);

    try {
      console.log('[SNS] Publishing PAYMENT_SUCCESS (COD)');
      await publishOrderEvent('PAYMENT_SUCCESS', payment);
    } catch (err) {
      console.error('[SNS] Publish failed:', err);
    }

    return payment;
  } else {
    // Legacy support fallback: redirects to Razorpay Order creation instead
    return createRazorpayOrder(orderId, userId);
  }
};

const createRazorpayOrder = async (orderId, userId) => {
  const order = await getOrderById(orderId);
  if (!order)
    throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  if (order.userId !== userId)
    throw Object.assign(new Error('Unauthorized: userId does not match order'), { statusCode: 403 });
  if (order.orderStatus === ORDER_STATUS.CANCELLED || order.orderStatus === ORDER_STATUS.EXPIRED)
    throw Object.assign(new Error(`Cannot create payment for a ${order.orderStatus.toLowerCase()} order`), { statusCode: 400 });
  if (order.paymentStatus === PAYMENT_STATUS.PAID)
    throw Object.assign(new Error('Order is already paid'), { statusCode: 400 });

  const amountInPaise = Math.round(order.totalAmount * 100);
  const razorpay = getRazorpayInstance();
  
  console.log(`[Razorpay] Creating Order | amount: ${amountInPaise} paise | receipt: ${orderId}`);
  const rpOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: orderId
  });

  let payment = await getPaymentByOrderId(orderId);
  const now = new Date().toISOString();

  if (payment) {
    if (payment.status === PAYMENT_STATUS.PAID) {
      throw Object.assign(new Error('Order is already paid'), { statusCode: 400 });
    }
    const { Attributes } = await docClient.send(
      new UpdateCommand({
        TableName: PAYMENTS_TABLE,
        Key: { paymentid: payment.paymentid },
        UpdateExpression: 'SET transactionId = :txn, razorpayOrderId = :rpId, updatedAt = :at',
        ExpressionAttributeValues: {
          ':txn': rpOrder.id,
          ':rpId': rpOrder.id,
          ':at': now,
        },
        ReturnValues: 'ALL_NEW',
      })
    );
    payment = Attributes;
  } else {
    payment = {
      paymentid: uuidv4(),
      orderId,
      userId,
      amount: order.totalAmount,
      paymentMethod: 'Card', 
      transactionId: rpOrder.id,
      razorpayOrderId: rpOrder.id,
      status: PAYMENT_STATUS.PENDING,
      createdAt: now,
    };
    await docClient.send(new PutCommand({ TableName: PAYMENTS_TABLE, Item: payment }));
    console.log(`[Payment] Created Pending | paymentId: ${payment.paymentid} | orderId: ${orderId} | razorpayOrderId: ${rpOrder.id}`);
  }

  return {
    razorpayOrderId: rpOrder.id,
    amount: amountInPaise,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID,
    internalOrderId: orderId
  };
};

const verifyPayment = async (orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature, userId) => {
  // Validate signature
  const crypto = require('crypto');
  const text = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');

  const isValid = (expectedSignature === razorpaySignature);
  if (!isValid) {
    console.error(`[Payment] Signature mismatch | orderId: ${orderId} | expected: ${expectedSignature} | received: ${razorpaySignature}`);
    throw Object.assign(new Error('Invalid payment signature'), { statusCode: 400 });
  }

  const payment = await getPaymentByOrderId(orderId);
  if (!payment) {
    throw Object.assign(new Error('Payment record not found for this order'), { statusCode: 404 });
  }
  if (payment.userId !== userId) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });
  }

  // Idempotency: already marked PAID
  if (payment.status === PAYMENT_STATUS.PAID) {
    console.log(`[Payment] Idempotency: payment for order ${orderId} is already PAID.`);
    return payment;
  }

  const now = new Date().toISOString();
  const { Attributes } = await docClient.send(
    new UpdateCommand({
      TableName: PAYMENTS_TABLE,
      Key: { paymentid: payment.paymentid },
      UpdateExpression: 'SET #status = :status, transactionId = :txn, razorpayPaymentId = :rpPayId, updatedAt = :at',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': PAYMENT_STATUS.PAID,
        ':txn': razorpayPaymentId,
        ':rpPayId': razorpayPaymentId,
        ':at': now,
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  console.log(`[Payment] Verified Success | paymentId: ${payment.paymentid} | orderId: ${orderId} | txnId: ${razorpayPaymentId}`);
  try {
    console.log('[SNS] Publishing PAYMENT_SUCCESS');
    await publishOrderEvent('PAYMENT_SUCCESS', Attributes);
  } catch (err) {
    console.error('[SNS] Publish failed', err);
  }

  return Attributes;
};

const handleWebhook = async (rawBody, signature, body) => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error('Razorpay webhook secret is not configured');
  }

  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody || '')
    .digest('hex');

  if (expectedSignature !== signature) {
    console.error('[Webhook] Signature verification failed');
    throw Object.assign(new Error('Invalid webhook signature'), { statusCode: 400 });
  }

  console.log(`[Webhook] Received Razorpay event: ${body.event}`);
  const paymentEntity = body.payload?.payment?.entity;
  const razorpayPaymentId = paymentEntity?.id;
  const razorpayOrderId = paymentEntity?.order_id;
  const paymentMethod = paymentEntity?.method;

  let payment = null;
  if (razorpayOrderId) {
    const { Items = [] } = await docClient.send(
      new ScanCommand({
        TableName: PAYMENTS_TABLE,
        FilterExpression: 'razorpayOrderId = :rpId',
        ExpressionAttributeValues: { ':rpId': razorpayOrderId }
      })
    );
    payment = Items[0];
  }

  if (!payment) {
    console.warn(`[Webhook] Payment record not found for razorpayOrderId: ${razorpayOrderId}`);
    return { processed: false, reason: 'Payment not found' };
  }

  const now = new Date().toISOString();

  if (body.event === 'payment.captured') {
    if (payment.status === PAYMENT_STATUS.PAID) {
      console.log(`[Webhook] Idempotency: Payment ${payment.paymentid} already marked as PAID.`);
      return { processed: true, status: 'already_paid' };
    }

    const { Attributes } = await docClient.send(
      new UpdateCommand({
        TableName: PAYMENTS_TABLE,
        Key: { paymentid: payment.paymentid },
        UpdateExpression: 'SET #status = :status, transactionId = :txn, razorpayPaymentId = :rpPayId, paymentMethod = :method, updatedAt = :at',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': PAYMENT_STATUS.PAID,
          ':txn': razorpayPaymentId,
          ':rpPayId': razorpayPaymentId,
          ':method': paymentMethod || 'Card',
          ':at': now,
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    console.log(`[Webhook] Payment Captured Success | paymentId: ${payment.paymentid} | orderId: ${payment.orderId}`);
    try {
      await publishOrderEvent('PAYMENT_SUCCESS', Attributes);
    } catch (err) {
      console.error('[SNS] Publish failed', err);
    }
    return { processed: true, status: 'PAID' };
  }

  if (body.event === 'payment.failed') {
    if (payment.status === PAYMENT_STATUS.FAILED) {
      console.log(`[Webhook] Idempotency: Payment ${payment.paymentid} already marked as FAILED.`);
      return { processed: true, status: 'already_failed' };
    }
    if (payment.status === PAYMENT_STATUS.PAID) {
      console.warn(`[Webhook] Skip FAILED event: Payment ${payment.paymentid} is already paid.`);
      return { processed: false, reason: 'Already paid' };
    }

    const { Attributes } = await docClient.send(
      new UpdateCommand({
        TableName: PAYMENTS_TABLE,
        Key: { paymentid: payment.paymentid },
        UpdateExpression: 'SET #status = :status, updatedAt = :at',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': PAYMENT_STATUS.FAILED,
          ':at': now,
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    console.log(`[Webhook] Payment Captured Failed | paymentId: ${payment.paymentid} | orderId: ${payment.orderId}`);
    try {
      await publishOrderEvent('PAYMENT_FAILED', Attributes);
    } catch (err) {
      console.error('[SNS] Publish failed', err);
    }
    return { processed: true, status: 'FAILED' };
  }

  return { processed: false, reason: 'Unsupported event type' };
};

const getPaymentById = async (paymentid) => {
  const { Item } = await docClient.send(
    new GetCommand({ TableName: PAYMENTS_TABLE, Key: { paymentid } })
  );
  return Item || null;
};

const getPaymentByOrderId = async (orderId) => {
  const { Items = [] } = await docClient.send(
    new ScanCommand({
      TableName: PAYMENTS_TABLE,
      FilterExpression: 'orderId = :orderId',
      ExpressionAttributeValues: { ':orderId': orderId },
    })
  );
  return Items[0] || null;
};

const updatePaymentStatus = async (paymentid, status, transactionId) => {
  const payment = await getPaymentById(paymentid);
  if (!payment)
    throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  if (payment.status === status)
    throw Object.assign(new Error(`Payment is already ${status}`), { statusCode: 400 });
  if (payment.status === PAYMENT_STATUS.REFUNDED)
    throw Object.assign(new Error('Cannot update a refunded payment'), { statusCode: 400 });
  if (payment.status === PAYMENT_STATUS.PAID && status !== PAYMENT_STATUS.REFUNDED)
    throw Object.assign(new Error('A paid payment can only be moved to REFUNDED'), { statusCode: 400 });

  const order = await getOrderById(payment.orderId);
  const now = new Date().toISOString();

  if (status === PAYMENT_STATUS.PAID) {
    const txnId =
      transactionId ||
      payment.transactionId ||
      `DEV-TXN-${uuidv4().split('-')[0].toUpperCase()}`;

    const { Attributes } = await docClient.send(
      new UpdateCommand({
        TableName: PAYMENTS_TABLE,
        Key: { paymentid },
        UpdateExpression: 'SET #status = :status, transactionId = :txn, updatedAt = :at',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': PAYMENT_STATUS.PAID,
          ':txn': txnId,
          ':at': now,
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    console.log(`[Payment] Paid | paymentId: ${paymentid} | orderId: ${payment.orderId} | userId: ${payment.userId} | amount: ${payment.amount} | transactionId: ${txnId} | timestamp: ${now}`);
    try {
      console.log('[Payment] Payment Updated');
      console.log('[SNS] Publishing PAYMENT_SUCCESS');
      await publishOrderEvent('PAYMENT_SUCCESS', Attributes);
    } catch (err) {
      console.error('[SNS] Publish failed', err);
    }

    return Attributes;
  }

  if (status === PAYMENT_STATUS.FAILED) {
    const { Attributes } = await docClient.send(
      new UpdateCommand({
        TableName: PAYMENTS_TABLE,
        Key: { paymentid },
        UpdateExpression: 'SET #status = :status, updatedAt = :at',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': PAYMENT_STATUS.FAILED,
          ':at': now,
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    console.log(`[Payment] Failed | paymentId: ${paymentid} | orderId: ${payment.orderId} | userId: ${payment.userId} | timestamp: ${now}`);
    try {
      console.log('[Payment] Payment Updated');
      console.log('[SNS] Publishing PAYMENT_FAILED');
      await publishOrderEvent('PAYMENT_FAILED', Attributes);
    } catch (err) {
      console.error('[SNS] Publish failed', err);
    }

    return Attributes;
  }

  if (status === PAYMENT_STATUS.REFUNDED) {
    if (payment.status !== PAYMENT_STATUS.PAID)
      throw Object.assign(new Error('Only PAID payments can be refunded'), { statusCode: 400 });

    const { Attributes } = await docClient.send(
      new UpdateCommand({
        TableName: PAYMENTS_TABLE,
        Key: { paymentid },
        UpdateExpression: 'SET #status = :status, updatedAt = :at',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': PAYMENT_STATUS.REFUNDED,
          ':at': now,
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    console.log(`[Payment] Refunded | paymentId: ${paymentid} | orderId: ${payment.orderId} | userId: ${payment.userId} | timestamp: ${now}`);
    try {
      console.log('[Payment] Payment Updated');
      console.log('[SNS] Publishing PAYMENT_REFUNDED');
      await publishOrderEvent('PAYMENT_REFUNDED', Attributes);
    } catch (err) {
      console.error('[SNS] Publish failed', err);
    }

    return Attributes;
  }
};

const getAllPayments = async () => {
  const { Items = [] } = await docClient.send(
    new ScanCommand({ TableName: PAYMENTS_TABLE })
  );
  return Items;
};

module.exports = {
  createPayment,
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  getPaymentById,
  getPaymentByOrderId,
  updatePaymentStatus,
  getAllPayments,
};
