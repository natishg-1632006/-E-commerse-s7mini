const { sendEmail } = require('../../src/services/emailService');
describe('emailService', () => {
  test('sendEmail uses nodemailer', async () => {
    global.sendMailMock.mockResolvedValue({ messageId: '123' });
    const res = await sendEmail({ to: 'user@test.com', subject: 'sub', text: 'body' });
    expect(res.messageId).toBe('123');
  });

  test('sendEmail throws error if to is missing', async () => {
    await expect(sendEmail({ subject: 'sub' })).rejects.toThrow('Recipient email is required');
  });
});
