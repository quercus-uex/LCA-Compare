export const API_BASE_URL = '/api';

export const DOCS_URL = 'https://acv-compare-docs.netlify.app';
export const AVATAR_URL = '/avatar-default.png';

export const ADMIN_PAGE_SIZE = 15;
export const ADMIN_LOOKUP_TAKE = 20;

export const DEFAULT_MAP_CENTER = { lat: 39.46292681484013, lng: -6.329063770806773 } as const;
export const UBICACION_RANGE_MIN = 1;
export const UBICACION_RANGE_MAX = 100000;

import type { ImpactKey } from 'common/impact';

/** Etapas del cultivo que suman el impacto total, en el orden en que se muestran */
export const IMPACT_STAGE_KEYS = [
  'impacto_pesticidas',
  'impacto_fertilizantes',
  'impacto_sistema_riego',
  'impacto_manejo_cultivo',
] as const satisfies readonly ImpactKey[];

export const IMPACT_LABEL_KEYS: Readonly<Record<ImpactKey, string>> = {
  impacto_total: 'common.fields.total',
  impacto_pesticidas: 'common.fields.pesticides',
  impacto_fertilizantes: 'common.fields.fertilizers',
  impacto_sistema_riego: 'common.fields.irrigationSystem',
  impacto_manejo_cultivo: 'common.fields.cropManagement',
};

export {
  DEFAULT_EF_CATEGORY,
  EF_CATEGORIES,
  type EfCategoryId,
  IMPACT_KEYS,
  type ImpactKey,
  getEfCategory,
  getEfCategoryId,
} from 'common/impact';
