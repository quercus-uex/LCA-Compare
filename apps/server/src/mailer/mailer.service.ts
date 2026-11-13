import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { NotificacionTipo } from 'common/organizacion';

/** Avisos que se envían por correo al miembro afectado */
export type AvisoMiembroTipo = Extract<
  NotificacionTipo,
  | 'consentimiento_revocado'
  | 'miembro_expulsado'
  | 'organizacion_eliminada'
  | 'administracion_transferida'
>;

/** «2023», «2023 y 2024», «2022, 2023 y 2024» */
export function formatAnios(anios: number[]): string {
  const sorted = [...anios].sort((a, b) => a - b).map(String);
  if (sorted.length <= 1) return sorted.join('');
  return `${sorted.slice(0, -1).join(', ')} y ${sorted.at(-1)}`;
}

const AVISOS_MIEMBRO: Record<
  AvisoMiembroTipo,
  (organizacion: string, anios?: string) => { subject: string; text: string }
> = {
  consentimiento_revocado: (organizacion, anios) => ({
    subject: `${organizacion} ya no tiene acceso a tus campañas`,
    text: `La organización ${organizacion} ha dejado de tener acceso a los datos de tus campañas${anios ? ` ${anios}` : ''} en LCA Compare.`,
  }),
  miembro_expulsado: (organizacion, anios) => ({
    subject: `Ya no eres miembro de ${organizacion}`,
    text: `La organización ${organizacion} te ha retirado de sus miembros en LCA Compare y ya no tiene acceso a los datos de tus campañas${anios ? ` ${anios}` : ''}.`,
  }),
  organizacion_eliminada: (organizacion) => ({
    subject: `La organización ${organizacion} se ha eliminado`,
    text: `La organización ${organizacion} se ha eliminado de LCA Compare. Ya no tiene acceso a tus datos y sus solicitudes pendientes se han cancelado.`,
  }),
  administracion_transferida: (organizacion) => ({
    subject: `Ahora administras ${organizacion}`,
    text: `Se te ha transferido la administración de la organización ${organizacion} en LCA Compare. Ya puedes gestionar sus miembros y consultar los datos que han consentido.`,
  }),
};

/**
 * El envío de correo es opcional. Sin MAILER_EMAIL y MAILER_PASSWORD no se crea
 * el transporte y los envíos se omiten. Con MAILER_HOST se usa ese servidor
 * SMTP (MAILER_PORT, 587 por defecto); sin él, se usa Gmail.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly from?: string;
  private readonly transporter?: nodemailer.Transporter;

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

  async sendNewUserMail(to: string, password: string) {
    await this.send(
      to,
      'Alta en LCA Compare',
      `Has sido dado de alta en LCA Compare. Tu contraseña es ${password}.`,
    );
  }

  /** Aviso al usuario de que una organización le pide acceso a sus campañas */
  async sendSolicitudConsentimientoMail(
    to: string,
    nombreOrganizacion: string,
    anios: number[],
  ) {
    await this.send(
      to,
      `Solicitud de acceso de ${nombreOrganizacion} en LCA Compare`,
      `La organización ${nombreOrganizacion} te pide acceso a los datos de tus campañas ${formatAnios(anios)} en LCA Compare. ` +
        'Entra en la aplicación para aceptar o rechazar la solicitud desde tus notificaciones.',
    );
  }

  /** Avisos de una organización a uno de sus miembros */
  async sendAvisoOrganizacionMail(
    to: string,
    tipo: AvisoMiembroTipo,
    nombreOrganizacion: string,
    anios?: number[],
  ) {
    const { subject, text } = AVISOS_MIEMBRO[tipo](
      nombreOrganizacion,
      anios?.length ? formatAnios(anios) : undefined,
    );
    await this.send(to, subject, text);
  }

  private async send(to: string, subject: string, text: string) {
    if (!this.transporter) {
      this.logger.warn(`E-mail sending is disabled: "${subject}" not sent`);
      return;
    }

    await this.transporter.sendMail({ from: this.from, to, subject, text });
  }
}
