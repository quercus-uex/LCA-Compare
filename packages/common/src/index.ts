export {
  EF_CATEGORIES,
  IMPACT_KEYS,
  getEfCategoryId,
  normalizeEfName,
  type EfCategoryId,
  type ImpactKey,
} from './impact.js';

export { STATS_MIN_PARCELAS } from './stats.js';

export type {
  CategoryValues,
  GlobalStatsQuery,
  KpiDto,
  ProvinciaRankingItemDto,
  PoblacionRankingItemDto,
  EvolucionTemporalItemDto,
  DistribucionCultivoItemDto,
  GlobalStatsDto,
} from './stats.js';

export type {
  CompareExportFormat,
  CompareExportScope,
  CompareFilterDto,
  CompareQueryItemDto,
  CompareQueryDto,
  CompareReportLanguage,
  CompareResultItemDto,
  CompareResultDto,
  CompareTraceDto,
  CompareTraceFiltersDto,
  CompareTracePropietarioDto,
  CompareTraceResultDto,
  CompareTraceSetDto,
} from './compare.js';

export type { Pais, Provincia, Poblacion } from './location.js';

export type {
  Cultivo,
  CultivoConImpacto,
  CultivoResumen,
  Parcela,
  ParcelaDetalle,
  ParcelaPoblacion,
  ParcelaResumen,
} from './parcela.js';

export type { Usuario } from './usuario.js';

export type { LoginSuccessDto, LoginDto } from './auth.js';

export type {
  ApiResponse,
  ApiResponseArray,
  ApiErrorDto,
  ResultadoImpactoItemDto,
  ResultadoImpactoDto,
} from './api.js';

export {
  CAMPANIA_MIN_ANIO,
  CONSENTIMIENTO_ESTADOS,
  NOTIFICACION_TIPOS,
  campaniaMaxAnio,
} from './organizacion.js';

export type {
  AccesoOrganizacion,
  AvisoDatos,
  AvisoDto,
  CampaniaConsentimiento,
  ConsentimientoEstado,
  ConsentimientoRespuesta,
  CreateOrganizacionDto,
  MarcarAvisosLeidosDto,
  MembresiaOrganizacion,
  MiembroOrganizacion,
  MiembroParcelasDto,
  MisOrganizacionesDto,
  NotificacionesDto,
  NotificacionTipo,
  OrganizacionDetalle,
  OrganizacionResumen,
  ResponderConsentimientosDto,
  SolicitarConsentimientoDto,
  SolicitudConsentimientoResultadoDto,
  SolicitudPendienteDto,
  TransferirOrganizacionDto,
  UpdateOrganizacionDto,
  UsuarioBasico,
} from './organizacion.js';
