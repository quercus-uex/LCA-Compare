import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_PASSWORD,
      },
    });
  }

  async sendNewUserMail(to: string, password: string) {
    await this.transporter.sendMail({
      to,
      subject: 'Alta en LCA Compare',
      text: `Has sido dado de alta en LCA Compare. Tu contraseña es ${password}.`,
    });
  }
}
