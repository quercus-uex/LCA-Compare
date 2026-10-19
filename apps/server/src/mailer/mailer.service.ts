import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

/**
 * El envío de correo es opcional. Sin MAILER_EMAIL y MAILER_PASSWORD no se crea
 * el transporte y los envíos se omiten. Con MAILER_HOST se usa ese servidor
 * SMTP (MAILER_PORT, 587 por defecto); sin él, se usa Gmail.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly from?: string;
  transporter?: nodemailer.Transporter;

  constructor() {
    const user = process.env.MAILER_EMAIL?.trim();
    const pass = process.env.MAILER_PASSWORD;
    if (!user || !pass) {
      this.logger.warn(
        'MAILER_EMAIL/MAILER_PASSWORD not set: e-mail sending is disabled',
      );
      return;
    }

    const host = process.env.MAILER_HOST?.trim();
    const port = Number(process.env.MAILER_PORT) || 587;
    this.from = user;
    this.transporter = nodemailer.createTransport(
      host
        ? { host, port, secure: port === 465, auth: { user, pass } }
        : { service: 'gmail', auth: { user, pass } },
    );
  }

  isConfigured(): boolean {
    return this.transporter !== undefined;
  }

  async sendNewUserMail(to: string, password: string) {
    if (!this.transporter) {
      this.logger.warn('E-mail sending is disabled: new-user mail not sent');
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: 'Alta en LCA Compare',
      text: `Has sido dado de alta en LCA Compare. Tu contraseña es ${password}.`,
    });
  }
}
