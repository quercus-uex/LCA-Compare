const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
const mockCreateTransport = jest
  .fn()
  .mockReturnValue({ sendMail: mockSendMail });

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: mockCreateTransport },
}));

import { MailerService } from './mailer.service';

describe('MailerService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.MAILER_EMAIL = 'test@gmail.com';
    process.env.MAILER_PASSWORD = 'app-password';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('creates a Gmail transport using MAILER_EMAIL and MAILER_PASSWORD from the environment', () => {
    new MailerService();

    expect(mockCreateTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: {
        user: 'test@gmail.com',
        pass: 'app-password',
      },
    });
  });

  it('sends new user mail with recipient, subject, and password in text', async () => {
    const service = new MailerService();

    await service.sendNewUserMail('user@example.com', 'secret123');

    expect(mockSendMail).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'Alta en ACV Compare',
      text: expect.stringContaining('secret123'),
    });
  });
});
