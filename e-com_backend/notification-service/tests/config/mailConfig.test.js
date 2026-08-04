const { createTransporter } = require('../../src/config/mailConfig');
describe('mailConfig', () => {
  test('createTransporter returns transporter', () => {
    const t = createTransporter();
    expect(t).toBeDefined();
  });
});
