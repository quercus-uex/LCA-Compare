import { Prisma } from '../generated/prisma/client';
export {
  EF_CATEGORIES,
  IMPACT_KEYS,
  type EfCategoryId,
  type ImpactKey,
} from 'common/impact';

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
