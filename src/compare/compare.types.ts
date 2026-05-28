import { Prisma } from '../generated/prisma/client';

export const IMPACT_KEYS = [
  'impacto_fertilizantes',
  'impacto_manejo_cultivo',
  'impacto_pesticidas',
  'impacto_sistema_riego',
  'impacto_total',
] as const;

export type ResultadoImpactoWithRelations = Prisma.ResultadoImpactoGetPayload<{
  include: {
    cultivo: {
      include: {
        parcela: {
          include: { poblacion: { include: { provincia: true } } };
        };
      };
    };
  };
}>;
