const logger = require('../../src/utils/logger');
describe('logger utils', () => {
  test('logger methods log to console', () => {
    logger.info('test', { key: 'val' });
    logger.warn('test', { key: 'val' });
    logger.error('test', { key: 'val' });
  });
});
