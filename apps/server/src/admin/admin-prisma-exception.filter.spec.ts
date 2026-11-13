import { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { AdminPrismaExceptionFilter } from './admin-prisma-exception.filter';

function prismaError(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError('error', {
    code,
    clientVersion: 'test',
    meta,
  });
}

describe('AdminPrismaExceptionFilter', () => {
  let filter: AdminPrismaExceptionFilter;
  let status: jest.Mock;
  let json: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new AdminPrismaExceptionFilter();
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;
  });

  it('maps unique constraint violations to 409 with the conflicting fields', () => {
    filter.catch(
      prismaError('P2002', {
        driverAdapterError: {
          cause: { constraint: { fields: ['"email"'] } },
        },
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'duplicate', fields: ['email'] }),
    );
  });

  it('falls back to meta.target for the conflicting fields', () => {
    filter.catch(prismaError('P2002', { target: ['codigo'] }), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ fields: ['codigo'] }),
    );
  });

  it.each(['P2003', 'P2014'])(
    'maps relation violation %s to 409 in-use',
    (code) => {
      filter.catch(prismaError(code), host);

      expect(status).toHaveBeenCalledWith(409);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'in-use' }),
      );
    },
  );

  it.each([
    {
      driverAdapterError: {
        cause: { constraint: { index: 'Organizacion_idAdministrador_fkey' } },
      },
    },
    { field_name: 'Organizacion_idAdministrador_fkey (index)' },
  ])(
    'explains that a user who administers organizations cannot be deleted (%p)',
    (meta) => {
      filter.catch(prismaError('P2003', meta), host);

      expect(status).toHaveBeenCalledWith(409);
      expect(json).toHaveBeenCalledWith({
        statusCode: 409,
        error: 'in-use',
        message:
          'No se puede eliminar el usuario porque administra organizaciones: transfiere o elimina antes esas organizaciones',
      });
    },
  );

  it('keeps the generic in-use message for other foreign keys', () => {
    filter.catch(
      prismaError('P2003', {
        driverAdapterError: {
          cause: { constraint: { index: 'Parcela_idPropietario_fkey' } },
        },
      }),
      host,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'No se puede completar la operación porque hay registros relacionados',
      }),
    );
  });

  it('maps missing records to 404', () => {
    filter.catch(prismaError('P2025'), host);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('keeps any other Prisma error as a generic 500', () => {
    filter.catch(prismaError('P1001'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Internal server error' }),
    );
  });
});
