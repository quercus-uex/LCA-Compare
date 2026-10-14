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
    delete process.env.MAILER_HOST;
    delete process.env.MAILER_PORT;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('creates a Gmail transport using MAILER_EMAIL and MAILER_PASSWORD from the environment', () => {
    const service = new MailerService();

    expect(mockCreateTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: {
        user: 'test@gmail.com',
        pass: 'app-password',
      },
    });
    expect(service.isConfigured()).toBe(true);
  });

  it('creates a generic SMTP transport when MAILER_HOST is set', () => {
    process.env.MAILER_HOST = 'smtp.example.com';
    process.env.MAILER_PORT = '465';

    new MailerService();

    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: {
        user: 'test@gmail.com',
        pass: 'app-password',
      },
    });
  });

  it('sends new user mail with sender, recipient, subject, and password in text', async () => {
    const service = new MailerService();

    await service.sendNewUserMail('user@example.com', 'secret123');

    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'test@gmail.com',
      to: 'user@example.com',
      subject: 'Alta en LCA Compare',
      text: expect.stringContaining('secret123'),
    });
  });

  it('does not create a transport nor send mail when SMTP credentials are missing', async () => {
    delete process.env.MAILER_EMAIL;
    process.env.MAILER_PASSWORD = '';

    const service = new MailerService();

    expect(mockCreateTransport).not.toHaveBeenCalled();
    expect(service.isConfigured()).toBe(false);
    await expect(
      service.sendNewUserMail('user@example.com', 'secret123'),
    ).resolves.toBeUndefined();
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
