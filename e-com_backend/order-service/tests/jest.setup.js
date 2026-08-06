process.env.AWS_REGION = 'ap-southeast-1';
process.env.DYNAMODB_TABLE_NAME = 'test-table';
process.env.PRODUCTS_TABLE_NAME = 'test-products';
process.env.WISHLISTS_TABLE = 'test-wishlists';
process.env.REVIEWS_TABLE = 'test-reviews';
process.env.BRANDS_TABLE = 'test-brands';
process.env.COGNITO_USER_POOL_ID = 'test-pool-id';
process.env.COGNITO_CLIENT_ID = 'test-client-id';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.SERVICE_NAME = 'test-service';
process.env.SMTP_USER = 'test-user';
process.env.SMTP_FROM = 'test-from';
process.env.NOTIFICATION_OWNER_EMAIL = 'owner@test.com';
process.env.CATEGORY_SERVICE_URL = 'https://category-service';
process.env.COUPON_SERVICE_URL = 'https://coupon-service';
process.env.ORDER_SERVICE_URL = 'https://order-service';
process.env.INVENTORY_SERVICE_URL = 'https://inventory-service';
process.env.PRODUCT_SERVICE_URL = 'https://product-service';
process.env.PAYMENT_SERVICE_URL = 'https://payment-service';
process.env.USER_SERVICE_URL = 'https://user-service';
process.env.PAYMENT_EVENTS_TOPIC_ARN = 'arn:aws:sns:ap-southeast-1:123456789012:payment-events';
process.env.INTERNAL_SERVICE_KEY = 'secret-token';
process.env.INTERNAL_SERVICE_TOKEN = 'secret-token';

global.docClientSendMock = jest.fn().mockImplementation(() => Promise.resolve({ Items: [] }));
global.sqsSendMock = jest.fn();
global.snsSendMock = jest.fn();
global.s3SendMock = jest.fn();
global.cognitoSendMock = jest.fn();
global.eventBridgeSendMock = jest.fn();
global.sendMailMock = jest.fn();
global.axiosMock = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};
global.awsJwtVerifyMock = {
  verify: jest.fn()
};

jest.mock('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: {
      from: jest.fn().mockReturnValue({
        send: (...args) => global.docClientSendMock(...args)
      })
    },
    PutCommand: jest.fn().mockImplementation((args) => args),
    GetCommand: jest.fn().mockImplementation((args) => args),
    ScanCommand: jest.fn().mockImplementation((args) => args),
    UpdateCommand: jest.fn().mockImplementation((args) => args),
    DeleteCommand: jest.fn().mockImplementation((args) => args),
    BatchGetCommand: jest.fn().mockImplementation((args) => args),
    QueryCommand: jest.fn().mockImplementation((args) => args),
  };
}, { virtual: true });

jest.mock('@aws-sdk/client-dynamodb', () => {
  return {
    DynamoDBClient: jest.fn().mockImplementation(() => ({
      send: (...args) => global.docClientSendMock(...args)
    })),
    DescribeTableCommand: jest.fn().mockImplementation((args) => args),
    CreateTableCommand: jest.fn().mockImplementation((args) => args),
  };
}, { virtual: true });

jest.mock('@aws-sdk/client-sqs', () => {
  return {
    SQSClient: jest.fn().mockImplementation(() => ({
      send: (...args) => global.sqsSendMock(...args)
    })),
    SendMessageCommand: jest.fn().mockImplementation((args) => args),
  };
}, { virtual: true });

jest.mock('@aws-sdk/client-sns', () => {
  return {
    SNSClient: jest.fn().mockImplementation(() => ({
      send: (...args) => global.snsSendMock(...args)
    })),
    PublishCommand: jest.fn().mockImplementation((args) => args),
  };
}, { virtual: true });

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: (...args) => global.s3SendMock(...args)
    })),
    PutObjectCommand: jest.fn().mockImplementation((args) => args),
    DeleteObjectCommand: jest.fn().mockImplementation((args) => args),
  };
}, { virtual: true });

jest.mock('@aws-sdk/client-eventbridge', () => {
  return {
    EventBridgeClient: jest.fn().mockImplementation(() => ({
      send: (...args) => global.eventBridgeSendMock(...args)
    })),
    PutEventsCommand: jest.fn().mockImplementation((args) => args),
  };
}, { virtual: true });

jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  return {
    CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
      send: (...args) => global.cognitoSendMock(...args)
    })),
    AdminAddUserToGroupCommand: jest.fn().mockImplementation((args) => args),
  };
}, { virtual: true });

jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: (...args) => global.axiosMock.get(...args),
    post: (...args) => global.axiosMock.post(...args),
    put: (...args) => global.axiosMock.put(...args),
    delete: (...args) => global.axiosMock.delete(...args),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    }
  };
  return {
    ...mockAxiosInstance,
    create: jest.fn().mockReturnValue(mockAxiosInstance),
    get: (...args) => global.axiosMock.get(...args),
    post: (...args) => global.axiosMock.post(...args),
    put: (...args) => global.axiosMock.put(...args),
    delete: (...args) => global.axiosMock.delete(...args),
  };
}, { virtual: true });

jest.mock('uuid', () => ({
  v6: jest.fn().mockReturnValue('mock-uuid-v6'),
  v4: jest.fn().mockReturnValue('mock-uuid'),
}), { virtual: true });

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: (...args) => global.sendMailMock(...args)
  })
}), { virtual: true });

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    const doc = {
      pipedRes: null,
      on: jest.fn().mockImplementation(function(event, cb) {
        if (event === 'end') cb();
        return proxy;
      }),
      pipe: jest.fn().mockImplementation(function(res) {
        doc.pipedRes = res;
        return proxy;
      }),
      end: jest.fn().mockImplementation(function() {
        if (doc.pipedRes) {
          if (typeof doc.pipedRes.end === 'function') doc.pipedRes.end();
          const finishListeners = doc.pipedRes.on.mock.calls.filter(c => c[0] === 'finish');
          for (const listener of finishListeners) {
            listener[1]();
          }
        }
        return proxy;
      }),
    };

    const proxy = new Proxy(doc, {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        }
        return jest.fn().mockReturnValue(proxy);
      }
    });

    return proxy;
  });
}, { virtual: true });

jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: {
    create: jest.fn().mockImplementation(() => ({
      verify: (...args) => global.awsJwtVerifyMock.verify(...args)
    }))
  }
}), { virtual: true });
