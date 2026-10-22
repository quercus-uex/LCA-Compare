import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../generated/prisma/client';

type AdminErrorBody = {
  statusCode: number;
  error: string;
  message: string;
  fields?: string[];
};

function uniqueFields(error: Prisma.PrismaClientKnownRequestError): string[] {
  // Con el adaptador de pg el campo llega en driverAdapterError, no en target
  const meta = error.meta as
    | {
        target?: string[] | string;
        driverAdapterError?: { cause?: { constraint?: { fields?: string[] } } };
      }
    | undefined;
  const fields =
    meta?.driverAdapterError?.cause?.constraint?.fields ?? meta?.target ?? [];
  return (Array.isArray(fields) ? fields : [fields]).map((field) =>
    field.replaceAll('"', ''),
  );
}

/**
 * Traduce los errores de Prisma del panel de administración a respuestas
 * HTTP con un código estable que el frontend puede mostrar.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class AdminPrismaExceptionFilter implements ExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(error);
    response.status(body.statusCode).json(body);
  }

  private toBody(error: Prisma.PrismaClientKnownRequestError): AdminErrorBody {
    switch (error.code) {
      case 'P2002': {
        const fields = uniqueFields(error);
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'duplicate',
          message: `Ya existe un registro con el mismo valor en: ${fields.join(', ')}`,
          fields,
        };
      }
      case 'P2003':
      case 'P2014':
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'in-use',
          message:
            'No se puede completar la operación porque hay registros relacionados',
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'not-found',
          message: 'El registro no existe',
        };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'unknown',
          message: 'Internal server error',
        };
    }
  }
}
