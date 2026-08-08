const { sendEmail } = require('./emailService');

const SUBJECTS = {
  PAYMENT_SUCCESS: "Payment Successful - New Order Received",
  ORDER_CREATED: "Your Order has been Placed",
  ORDER_CONFIRMED: "Your Payment was Successful",
  ORDER_PROCESSING: "Your Order is Being Processed",
  ORDER_PACKED: "Your Order has been Packed",
  ORDER_SHIPPED: "Your Order has been Shipped",
  ORDER_OUT_FOR_DELIVERY: "Your Order is Out for Delivery",
  ORDER_DELIVERED: "Your Order has been Delivered",
  ORDER_COMPLETED: "Thank You for Shopping With Us",
  ORDER_CANCELLED: "Your Order has been Cancelled",
};

const getOrderStatusBadgeColor = (status) => {
  const s = String(status || '').toUpperCase();
  if (s.includes('CONFIRMED') || s.includes('PAID') || s.includes('DELIVERED') || s.includes('COMPLETED') || s.includes('SUCCESS')) return '#10B981'; // Green
  if (s.includes('PROCESS') || s.includes('PACK') || s.includes('SHIP') || s.includes('PLACED') || s.includes('CREATED')) return '#3B82F6'; // Blue
  if (s.includes('CANCEL') || s.includes('FAIL')) return '#EF4444'; // Red
  return '#F59E0B'; // Amber
};

const buildPremiumEmail = (title, message, isCancellation = false) => {
  const displayOrderId = message.displayId || message.orderId || 'N/A';
  const orderDate = message.timestamp ? new Date(message.timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const statusBadgeColor = getOrderStatusBadgeColor(message.eventType || message.orderStatus);

  // Build items rows
  const items = Array.isArray(message.items) ? message.items : [];
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #1E293B; text-align: left;">
        <div style="font-weight: bold; color: #0F172A;">${item.name || 'Product'}</div>
        ${item.brand ? `<div style="font-size: 11px; color: #64748B;">Brand: ${item.brand}</div>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #1E293B; text-align: center;">
        ${item.quantity || 0}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #1E293B; text-align: right;">
        ₹${Number(item.price || 0).toLocaleString('en-IN')}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0F172A; font-weight: bold; text-align: right;">
        ₹${(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  // Shipping Address html
  const address = message.shippingAddress || {};
  const addressHtml = address.address ? `
    <div style="padding: 16px; background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; font-size: 12px; color: #475569; line-height: 1.6; text-align: left;">
      <div style="font-weight: bold; color: #0F172A; margin-bottom: 6px;">Shipping To:</div>
      <div style="font-weight: bold; color: #1E293B; font-size: 13px; margin-bottom: 2px;">${address.fullName || message.customerName || 'Customer'}</div>
      <div>${address.address}</div>
      <div>${address.city}, ${address.state} - ${address.pincode}</div>
      <div>Phone: ${address.phone || 'N/A'}</div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F1F5F9; padding: 20px 10px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); overflow: hidden; border: 1px solid #E2E8F0;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">NatCart</h1>
                  <p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px;">Tech Store</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 32px 24px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="text-align: center; padding-bottom: 24px;">
                        <span style="display: inline-block; padding: 6px 14px; background-color: ${statusBadgeColor}15; color: ${statusBadgeColor}; font-size: 11px; font-weight: 900; text-transform: uppercase; border-radius: 50px; letter-spacing: 1px;">
                          ${message.orderStatus || 'Status Update'}
                        </span>
                        <h2 style="margin: 12px 0 0 0; color: #0F172A; font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">
                          ${title}
                        </h2>
                        <p style="margin: 6px 0 0 0; color: #64748B; font-size: 13px; font-weight: 500;">
                          Hello ${message.customerName || 'Customer'}, here is the latest update for your order.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Order Info Grid -->
                    <tr>
                      <td style="padding: 16px 0; border-top: 1px dashed #E2E8F0; border-bottom: 1px dashed #E2E8F0;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td width="50%" style="font-size: 12px; color: #64748B; padding: 4px 0; text-align: left;">
                              Order ID: <strong style="color: #1E293B;">${displayOrderId}</strong>
                            </td>
                            <td width="50%" style="font-size: 12px; color: #64748B; padding: 4px 0; text-align: right;">
                              Date: <strong style="color: #1E293B;">${orderDate}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td width="50%" style="font-size: 12px; color: #64748B; padding: 4px 0; text-align: left;">
                              Payment Method: <strong style="color: #1E293B; text-transform: uppercase;">${message.paymentMethod || 'Razorpay'}</strong>
                            </td>
                            <td width="50%" style="font-size: 12px; color: #64748B; padding: 4px 0; text-align: right;">
                              Payment Status: <strong style="color: #1E293B; text-transform: uppercase;">${message.paymentStatus || 'Pending'}</strong>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Cancellation Reason (if applicable) -->
                    ${isCancellation ? `
                      <tr>
                        <td style="padding: 20px 0 10px 0;">
                          <div style="padding: 14px; background-color: #FEF2F2; border-radius: 12px; border: 1px solid #FEE2E2; color: #991B1B; font-size: 12px; font-weight: bold; line-height: 1.6; text-align: left;">
                            Cancellation Reason: ${message.reason || "Cancelled by customer"}
                          </div>
                        </td>
                      </tr>
                    ` : ''}

                    <!-- Products Table -->
                    ${items.length > 0 ? `
                      <tr>
                        <td style="padding: 24px 0 16px 0;">
                          <h3 style="margin: 0 0 12px 0; color: #0F172A; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Items Ordered</h3>
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                            <thead>
                              <tr style="background-color: #F8FAFC;">
                                <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 2px solid #E2E8F0;">Product Details</th>
                                <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 2px solid #E2E8F0;">Qty</th>
                                <th style="padding: 12px; text-align: right; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 2px solid #E2E8F0;">Price</th>
                                <th style="padding: 12px; text-align: right; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 2px solid #E2E8F0;">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${itemsHtml}
                              <!-- Summary Rows -->
                              <tr>
                                <td colspan="2" style="padding: 12px 12px 4px 12px; font-size: 12px; color: #64748B; text-align: right; font-weight: bold;">Subtotal</td>
                                <td colspan="2" style="padding: 12px 12px 4px 12px; font-size: 12px; color: #0F172A; text-align: right; font-weight: bold;">
                                  ₹${Number(message.totalAmount || message.amount || 0).toLocaleString('en-IN')}
                                </td>
                              </tr>
                              <tr>
                                <td colspan="2" style="padding: 4px 12px 4px 12px; font-size: 12px; color: #64748B; text-align: right; font-weight: bold;">Shipping</td>
                                <td colspan="2" style="padding: 4px 12px 4px 12px; font-size: 12px; color: #10B981; text-align: right; font-weight: 900;">FREE</td>
                              </tr>
                              <tr>
                                <td colspan="2" style="padding: 8px 12px 12px 12px; font-size: 14px; color: #0F172A; text-align: right; font-weight: 900; border-top: 1px solid #E2E8F0;">Total Amount</td>
                                <td colspan="2" style="padding: 8px 12px 12px 12px; font-size: 16px; color: #0F172A; text-align: right; font-weight: 900; border-top: 1px solid #E2E8F0;">
                                  ₹${Number(message.totalAmount || message.amount || 0).toLocaleString('en-IN')}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ` : ''}

                    <!-- Shipping Address Card -->
                    <tr>
                      <td style="padding: 16px 0 24px 0;">
                        ${addressHtml}
                      </td>
                    </tr>

                    <!-- Action Button -->
                    <tr>
                      <td style="text-align: center; padding-top: 8px;">
                        <a href="https://d222r50ryi3b71.cloudfront.net/orders" style="display: inline-block; padding: 14px 28px; background-color: #2563EB; color: #FFFFFF; font-size: 12px; font-weight: 900; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.15); text-transform: uppercase; letter-spacing: 0.5px; transition: background-color 0.2s;">
                          Track Your Order
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #F8FAFC; padding: 24px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 11px; color: #64748B;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; color: #475569;">NatCart E-Commerce Platform</p>
                  <p style="margin: 0 0 16px 0;">If you have any questions, please contact our 24/7 customer support.</p>
                  <p style="margin: 0;">This is an automated transaction receipt. Please do not reply directly to this email.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const buildPremiumEmailText = (title, message, isCancellation = false) => {
  const displayOrderId = message.displayId || message.orderId || 'N/A';
  const orderDate = message.timestamp ? new Date(message.timestamp).toLocaleString('en-IN') : new Date().toLocaleDateString('en-IN');
  const items = Array.isArray(message.items) ? message.items : [];
  const itemsText = items.map(item => `* ${item.name || 'Product'} x ${item.quantity || 0} (Price: ₹${Number(item.price || 0).toLocaleString('en-IN')})`).join('\n');
  const address = message.shippingAddress || {};
  const addressText = address.address ? `
Shipping To:
${address.fullName || message.customerName}
${address.address}
${address.city}, ${address.state} - ${address.pincode}
Phone: ${address.phone || 'N/A'}
  ` : '';

  return `
========================================
${title.toUpperCase()}
========================================

Hello ${message.customerName || 'Customer'},

Here is the latest update for your order.

Order ID: ${displayOrderId}
Status: ${message.orderStatus || 'Status Update'}
Date: ${orderDate}
Payment Method: ${message.paymentMethod || 'Razorpay'}
Payment Status: ${message.paymentStatus || 'Pending'}
Total: ₹${Number(message.totalAmount || message.amount || 0).toLocaleString('en-IN')}

${isCancellation ? `Cancellation Reason: ${message.reason || "Cancelled by customer"}\n` : ''}
${items.length > 0 ? `Items Ordered:\n${itemsText}\n` : ''}
${addressText}

Track your order details here: https://d222r50ryi3b71.cloudfront.net/orders

Thank you for shopping with us!
NatCart Tech Store
========================================
  `;
};

const buildEmailPayload = (message) => {
  const displayOrderId = message.displayId || message.orderId || 'N/A';
  const subject = `Payment Successful - New Order Received [${displayOrderId}]`;
  
  const html = buildPremiumEmail("Payment Success - New Order Received", {
    ...message,
    orderStatus: 'PAYMENT_SUCCESS'
  });
  
  const text = buildPremiumEmailText("Payment Success - New Order Received", {
    ...message,
    orderStatus: 'PAYMENT_SUCCESS'
  });

  return { subject, html, text };
};

const buildOrderStatusEmail = (message) => {
  const subject = SUBJECTS[message.eventType] || `Order Update - ${message.orderStatus || 'Info'}`;
  const isCancelled = message.eventType === "ORDER_CANCELLED";
  
  const html = buildPremiumEmail(subject, message, isCancelled);
  const text = buildPremiumEmailText(subject, message, isCancelled);

  return { subject, html, text };
};

const sendNotification = async (message) => {
  if (!message || typeof message !== "object") {
    throw new Error("Notification payload is required");
  }

  let recipient;
  let emailPayload;

  if (message.eventType === "PAYMENT_SUCCESS") {
    recipient = process.env.NOTIFICATION_OWNER_EMAIL;
    emailPayload = buildEmailPayload(message);
  } else {
    recipient = message.email;
    emailPayload = buildOrderStatusEmail(message);
  }

  await sendEmail({
    to: recipient,
    subject: emailPayload.subject,
    html: emailPayload.html,
    text: emailPayload.text,
  });

  console.log(`[Notification] Email sent to ${recipient}`);

  return {
    success: true,
  };
};

module.exports = { sendNotification };
