const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
const mockCreateTransport = jest
  .fn()
  .mockReturnValue({ sendMail: mockSendMail });

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: mockCreateTransport },
}));

import { MailerService, formatAnios } from './mailer.service';

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
    new MailerService();

    expect(mockCreateTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: {
        user: 'test@gmail.com',
        pass: 'app-password',
      },
    });
  });

  it.each([
    { MAILER_PORT: '465', port: 465, secure: true },
    { MAILER_PORT: undefined, port: 587, secure: false },
  ])(
    'creates a generic SMTP transport when MAILER_HOST is set (MAILER_PORT=$MAILER_PORT)',
    ({ MAILER_PORT, port, secure }) => {
      process.env.MAILER_HOST = 'smtp.example.com';
      if (MAILER_PORT) process.env.MAILER_PORT = MAILER_PORT;

      new MailerService();

      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port,
        secure,
        auth: {
          user: 'test@gmail.com',
          pass: 'app-password',
        },
      });
    },
  );

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

  it('sends the consent request mail with the organization and the years', async () => {
    const service = new MailerService();

    await service.sendSolicitudConsentimientoMail(
      'user@example.com',
      'Cooperativa Sur',
      [2025, 2023, 2024],
    );

    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'test@gmail.com',
      to: 'user@example.com',
      subject: 'Solicitud de acceso de Cooperativa Sur en LCA Compare',
      text: expect.stringContaining(
        'Cooperativa Sur te pide acceso a los datos de tus campañas 2023, 2024 y 2025',
      ),
    });
  });

  it.each([
    [
      'consentimiento_revocado',
      [2024],
      'Cooperativa Sur ya no tiene acceso a tus campañas',
      'campañas 2024',
    ],
    [
      'miembro_expulsado',
      [2023, 2024],
      'Ya no eres miembro de Cooperativa Sur',
      'campañas 2023 y 2024',
    ],
    [
      'organizacion_eliminada',
      undefined,
      'La organización Cooperativa Sur se ha eliminado',
      'se ha eliminado',
    ],
    [
      'administracion_transferida',
      undefined,
      'Ahora administras Cooperativa Sur',
      'Se te ha transferido la administración',
    ],
  ] as const)(
    'sends the %s notice mail',
    async (tipo, anios, subject, textFragment) => {
      const service = new MailerService();

      await service.sendAvisoOrganizacionMail(
        'user@example.com',
        tipo,
        'Cooperativa Sur',
        anios ? [...anios] : undefined,
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@gmail.com',
        to: 'user@example.com',
        subject,
        text: expect.stringContaining(textFragment),
      });
    },
  );

  it.each([
    [[], ''],
    [[2024], '2024'],
    [[2024, 2023], '2023 y 2024'],
    [[2025, 2022, 2023], '2022, 2023 y 2025'],
  ])('formats the years %p as "%s"', (anios, expected) => {
    expect(formatAnios(anios)).toBe(expected);
  });

  it('does not create a transport nor send any mail when SMTP credentials are missing', async () => {
    delete process.env.MAILER_EMAIL;
    process.env.MAILER_PASSWORD = '';

    const service = new MailerService();

    expect(mockCreateTransport).not.toHaveBeenCalled();
    await expect(
      service.sendNewUserMail('user@example.com', 'secret123'),
    ).resolves.toBeUndefined();
    await expect(
      service.sendSolicitudConsentimientoMail(
        'user@example.com',
        'Org',
        [2024],
      ),
    ).resolves.toBeUndefined();
    await expect(
      service.sendAvisoOrganizacionMail(
        'user@example.com',
        'organizacion_eliminada',
        'Org',
      ),
    ).resolves.toBeUndefined();
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
