import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Parcela, Cultivo } from '../generated/prisma/client';
import { Polygon } from 'geojson';
import type { ParcelaPoblacion } from 'common/parcela';
import { parseImpactoDatos } from '../stats/helpers/impacto-datos.helpers';
import {
  getCategoryAmounts,
  type PartialCategoryAmounts,
} from '../stats/helpers/stats-aggregation.helpers';

const POBLACION_SELECT = {
  select: {
    id: true,
    nombre: true,
    provincia: { select: { id: true, nombre: true } },
  },
} satisfies Prisma.Parcela$poblacionArgs;

export type ParcelaResumenRow = Parcela & {
  poblacion: ParcelaPoblacion | null;
  ultimoCultivo: Pick<
    Cultivo,
    'id' | 'tipo' | 'fechaInicioCampania' | 'superficieCultivada'
  > | null;
  numCultivos: number;
};

export type ParcelaDetalleRow = Parcela & {
  poblacion: ParcelaPoblacion | null;
  cultivos: Array<Cultivo & { impactoTotal: PartialCategoryAmounts | null }>;
};

@Injectable()
export class ParcelaService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(
    where: Prisma.ParcelaWhereUniqueInput,
  ): Promise<Parcela | null> {
    return this.prisma.parcela.findUnique({
      where,
      include: {
        cultivos: {
          orderBy: { fechaInicioCampania: 'desc' },
        },
      },
    });
  }

  /** Parcelas de un propietario con su ubicación, su último cultivo y su número de campañas */
  async findResumenByPropietario(
    idPropietario: string,
  ): Promise<ParcelaResumenRow[]> {
    const parcelas = await this.prisma.parcela.findMany({
      where: { idPropietario },
      orderBy: { nombre: 'asc' },
      include: {
        poblacion: POBLACION_SELECT,
        cultivos: {
          orderBy: { fechaInicioCampania: 'desc' },
          take: 1,
          select: {
            id: true,
            tipo: true,
            fechaInicioCampania: true,
            superficieCultivada: true,
          },
        },
        _count: { select: { cultivos: true } },
      },
    });

    return parcelas.map(({ cultivos, _count, ...parcela }) => ({
      ...parcela,
      ultimoCultivo: cultivos[0] ?? null,
      numCultivos: _count.cultivos,
    }));
  }

  /** Geometrías de las parcelas de un propietario que tienen polígono */
  async getGeomsByPropietario(
    idPropietario: string,
  ): Promise<Map<string, Polygon>> {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; geojson: unknown }>
    >`
      SELECT "id", ST_AsGeoJSON("geom")::json AS geojson
      FROM "Parcela"
      WHERE "idPropietario" = ${idPropietario} AND "geom" IS NOT NULL
    `;

    return new Map(rows.map((r) => [r.id, r.geojson as Polygon]));
  }

  /** Parcela con su ubicación y sus cultivos (del más reciente al más antiguo) con el impacto total por categoría */
  async findDetalle(id: string): Promise<ParcelaDetalleRow | null> {
    const parcela = await this.prisma.parcela.findUnique({
      where: { id },
      include: {
        poblacion: POBLACION_SELECT,
        cultivos: {
          orderBy: { fechaInicioCampania: 'desc' },
          include: { resultadoImpacto: { select: { datos: true } } },
        },
      },
    });
    if (!parcela) return null;

    return {
      ...parcela,
      cultivos: parcela.cultivos.map(({ resultadoImpacto, ...cultivo }) => ({
        ...cultivo,
        impactoTotal: resultadoImpacto
          ? getCategoryAmounts(parseImpactoDatos(resultadoImpacto.datos))
          : null,
      })),
    };
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ParcelaWhereUniqueInput;
    where?: Prisma.ParcelaWhereInput;
    orderBy?:
      | Prisma.ParcelaOrderByWithRelationInput
      | Prisma.ParcelaOrderByWithRelationInput[];
    include?: Prisma.ParcelaInclude;
  }): Promise<Parcela[]> {
    const { skip, take, cursor, where, orderBy, include } = params;
    return this.prisma.parcela.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include,
    });
  }

  create(
    data: Prisma.XOR<
      Prisma.ParcelaCreateInput,
      Prisma.ParcelaUncheckedCreateInput
    >,
  ): Promise<Parcela> {
    return this.prisma.parcela.create({ data });
  }

  async setGeom(id: string, geoJson: Polygon): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "Parcela"
      SET "geom" = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geoJson)}), 4326)
      WHERE "id" = ${id}
    `;
  }

  async getGeom(id: string): Promise<Polygon | null> {
    const rows = await this.prisma.$queryRaw<Array<{ geojson: unknown }>>`
      SELECT ST_AsGeoJSON("geom")::json AS geojson
      FROM "Parcela"
      WHERE "id" = ${id}
      LIMIT 1
    `;

    return (rows?.[0]?.geojson as Polygon) ?? null;
  }

  /** Ids de las parcelas cuyo polígono está a `range` metros o menos del punto */
  async findManyByPointRange(
    lat: number,
    long: number,
    range: number,
  ): Promise<Pick<Parcela, 'id'>[]> {
    return this.prisma.$queryRaw<Array<Pick<Parcela, 'id'>>>`
      WITH target AS (SELECT ST_SetSRID(ST_MakePoint(${long}, ${lat}), 4326)::geography AS geo)
      SELECT p.id
      FROM "Parcela" p
      JOIN target t ON TRUE
      WHERE ST_DWithin(p.geom::geography, t.geo, ${range})
    `;
  }

  async update(params: {
    where: Prisma.ParcelaWhereUniqueInput;
    data: Prisma.XOR<
      Prisma.ParcelaUpdateInput,
      Prisma.ParcelaUncheckedUpdateInput
    >;
  }): Promise<Parcela> {
    const { where, data } = params;
    return this.prisma.parcela.update({
      data,
      where,
    });
  }

  /** Elimina la parcela junto con sus cultivos y los resultados de estos */
  async deleteWithCultivos(id: string): Promise<Parcela> {
    return this.prisma.$transaction(async (tx) => {
      const cultivos = await tx.cultivo.findMany({
        where: { idParcela: id },
        select: { idResultadoImpacto: true },
      });
      const idsResultado = cultivos
        .map((c) => c.idResultadoImpacto)
        .filter((idResultado): idResultado is string => idResultado !== null);

      await tx.cultivo.deleteMany({ where: { idParcela: id } });
      await tx.resultadoImpacto.deleteMany({
        where: { id: { in: idsResultado } },
      });
      return tx.parcela.delete({ where: { id } });
    });
  }

  async count(where?: Prisma.ParcelaWhereInput): Promise<number> {
    return this.prisma.parcela.count({ where });
  }
}
