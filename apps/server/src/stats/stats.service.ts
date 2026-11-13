import { Injectable } from '@nestjs/common';
import type { GlobalStatsDto, GlobalStatsQuery } from 'common/stats';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizacionAccesoService } from '../organizacion/organizacion-acceso.service';
import { aggregateEvolucionByYear } from './helpers/evolucion-temporal.helpers';
import { computeKpis } from './helpers/kpi.helpers';
import {
  rankPoblaciones,
  rankProvincias,
} from './helpers/rank-by-location.helpers';
import {
  STATS_CULTIVO_SELECT,
  computeDistribucionCultivos,
  filterRows,
  toStatsRows,
  uniqueSorted,
  type StatsRow,
} from './helpers/stats-rows.helpers';

/**
 * Los datos cambian poco y la página es pública: se cargan todos los cultivos
 * una vez y se agregan en memoria para cada combinación de filtros.
 */
export const STATS_DATASET_TTL_MS = 60_000;

@Injectable()
export class StatsService {
  private dataset: { rows: StatsRow[]; loadedAt: number } | null = null;
  private loading: Promise<StatsRow[]> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly accesoService: OrganizacionAccesoService,
  ) {}

  async getGlobalStats(query: GlobalStatsQuery = {}): Promise<GlobalStatsDto> {
    const { anio, tipoCultivo, idOrganizacion } = query;
    const rows = await this.getRows(idOrganizacion);

    const filtered = filterRows(rows, { anio, tipoCultivo });
    const previous =
      anio === undefined
        ? null
        : filterRows(rows, { anio: anio - 1, tipoCultivo });
    const provincias = rankProvincias(filtered);
    const poblaciones = rankPoblaciones(filtered);

    return {
      kpis: computeKpis(filtered, previous),
      rankingProvincias: provincias.ranking,
      rankingPoblaciones: poblaciones.ranking,
      zonasOcultas: {
        provincias: provincias.ocultas,
        poblaciones: poblaciones.ocultas,
      },
      evolucionTemporal: aggregateEvolucionByYear(
        filterRows(rows, { tipoCultivo }),
      ),
      distribucionCultivos: computeDistribucionCultivos(
        filterRows(rows, { anio }),
      ),
      aniosDisponibles: uniqueSorted(rows.map((r) => r.anio)),
      tiposCultivoDisponibles: uniqueSorted(rows.map((r) => r.tipo)),
    };
  }

  /**
   * Cultivos del dataset; con organización, solo los de las campañas que le
   * han consentido (quién puede pedirlo lo comprueba el controlador). Los
   * consentimientos se leen en cada petición: la caché es común a todos.
   */
  private async getRows(idOrganizacion?: string): Promise<StatsRow[]> {
    if (!idOrganizacion) return this.getDataset();

    const [rows, consentimientos] = await Promise.all([
      this.getDataset(),
      this.accesoService.getConsentimientosAceptados(idOrganizacion),
    ]);
    const consentidos = new Set(
      consentimientos.map(({ idUsuario, anio }) => `${idUsuario}:${anio}`),
    );
    return rows.filter((r) => consentidos.has(`${r.idPropietario}:${r.anio}`));
  }

  invalidateCache(): void {
    this.dataset = null;
    this.loading = null;
  }

  private getDataset(): Promise<StatsRow[]> {
    if (
      this.dataset &&
      Date.now() - this.dataset.loadedAt < STATS_DATASET_TTL_MS
    ) {
      return Promise.resolve(this.dataset.rows);
    }

    // Las peticiones simultáneas comparten la misma carga. Si se invalida la
    // caché mientras tanto, el resultado de esa carga ya no se guarda
    if (!this.loading) {
      const loading = this.loadDataset().then(
        (rows) => {
          if (this.loading === loading) {
            this.dataset = { rows, loadedAt: Date.now() };
            this.loading = null;
          }
          return rows;
        },
        (error: unknown) => {
          if (this.loading === loading) this.loading = null;
          throw error;
        },
      );
      this.loading = loading;
    }
    return this.loading;
  }

  private async loadDataset(): Promise<StatsRow[]> {
    const cultivos = await this.prisma.cultivo.findMany({
      select: STATS_CULTIVO_SELECT,
    });
    return toStatsRows(cultivos);
  }
}
