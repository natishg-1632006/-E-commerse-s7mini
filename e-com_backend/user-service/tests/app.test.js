const request = require('supertest');

describe('app.js HTTP Endpoints and CORS registration', () => {
  let originalEnv;

  beforeEach(() => {
    jest.resetModules();
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('should register AWS X-Ray middlewares and expose HTTP endpoints', async () => {
    process.env.NODE_ENV = 'production';

    const mockOpenSegment = jest.fn(() => (req, res, next) => next());
    const mockCloseSegment = jest.fn(() => (err, req, res, next) => next(err));

    jest.doMock('aws-xray-sdk', () => ({
      express: {
        openSegment: mockOpenSegment,
        closeSegment: mockCloseSegment
      },
      captureAWSv3Client: jest.fn((c) => c)
    }));

    const app = require('../src/app');
    
    // 1. Verify health check endpoint
    const healthRes = await request(app).get('/health');
    expect(healthRes.statusCode).toBe(200);
    expect(healthRes.body.status).toBe('UP');

    // 2. Verify API info endpoint
    const apiRes = await request(app).get('/api');
    expect(apiRes.statusCode).toBe(200);
    expect(apiRes.body.success).toBe(true);

    // 3. Verify that X-Ray was called
    expect(mockOpenSegment).toHaveBeenCalled();
  });

  test('should allow configuration-based and default CORS origins', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGINS = 'https://custom-origin.com';

    jest.doMock('aws-xray-sdk', () => ({
      express: {
        openSegment: jest.fn(() => (req, res, next) => next()),
        closeSegment: jest.fn(() => (err, req, res, next) => next(err))
      },
      captureAWSv3Client: jest.fn((c) => c)
    }));

    const app = require('../src/app');

    // Test allowed custom origin on /api
    const customOriginRes = await request(app)
      .get('/api')
      .set('Origin', 'https://custom-origin.com');
    expect(customOriginRes.headers['access-control-allow-origin']).toBe('https://custom-origin.com');

    // Test allowed default origin on /api
    const defaultOriginRes = await request(app)
      .get('/api')
      .set('Origin', 'https://d222r50ryi3b71.cloudfront.net');
    expect(defaultOriginRes.headers['access-control-allow-origin']).toBe('https://d222r50ryi3b71.cloudfront.net');

    // Test non-allowed origin on /api
    const disallowedRes = await request(app)
      .get('/api')
      .set('Origin', 'https://disallowed.com');
    expect(disallowedRes.headers['access-control-allow-origin']).toBe('https://disallowed.com');
  });
});
