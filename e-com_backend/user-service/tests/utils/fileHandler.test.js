describe('fileHandler utility', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('should export docClient and TABLE_NAME in test environment', () => {
    jest.doMock('aws-xray-sdk', () => ({
      captureAWSv3Client: jest.fn((c) => c)
    }));
    const AWSXRay = require('aws-xray-sdk');
    const fileHandler = require('../../src/utils/fileHandler');

    expect(fileHandler.docClient).toBeDefined();
    expect(AWSXRay.captureAWSv3Client).not.toHaveBeenCalled();
  });

  test('should wrap DynamoDB client with AWSXRay in non-test environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    jest.doMock('aws-xray-sdk', () => ({
      captureAWSv3Client: jest.fn((c) => c)
    }));
    const AWSXRay = require('aws-xray-sdk');
    const fileHandler = require('../../src/utils/fileHandler');

    expect(AWSXRay.captureAWSv3Client).toHaveBeenCalled();
    expect(fileHandler.docClient).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });
});
