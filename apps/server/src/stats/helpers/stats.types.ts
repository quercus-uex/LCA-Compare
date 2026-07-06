import type { Prisma } from '../../generated/prisma/client';

export type CultivoWithGeo = Prisma.CultivoGetPayload<{
  include: {
    parcela: {
      include: {
        poblacion: {
          include: {
            provincia: true;
          };
        };
      };
    };
  };
}>;

export type CultivoWithFecha = Pick<
  CultivoWithGeo,
  'idResultadoImpacto' | 'fechaInicioCampania'
>;
