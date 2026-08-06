const request = require('supertest');

describe('inventory-service app.js endpoints and CORS rules', () => {
  let originalEnv;

  beforeEach(() => {
    jest.resetModules();
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('should register AWS X-Ray and endpoints in production', async () => {
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
    
    // Verify endpoints
    const healthRes = await request(app).get('/health');
    expect(healthRes.statusCode).toBe(200);

    const apiRes = await request(app).get('/api');
    expect(apiRes.statusCode).toBe(200);

    expect(mockOpenSegment).toHaveBeenCalled();
  });

  test('should validate CORS rules dynamically', async () => {
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

    const customRes = await request(app)
      .get('/api')
      .set('Origin', 'https://custom-origin.com');
    expect(customRes.headers['access-control-allow-origin']).toBe('https://custom-origin.com');

    const defaultRes = await request(app)
      .get('/api')
      .set('Origin', 'https://d222r50ryi3b71.cloudfront.net');
    expect(defaultRes.headers['access-control-allow-origin']).toBe('https://d222r50ryi3b71.cloudfront.net');

    const disallowedRes = await request(app)
      .get('/api')
      .set('Origin', 'https://disallowed.com');
    expect(disallowedRes.headers['access-control-allow-origin']).toBeUndefined();
  });
});
