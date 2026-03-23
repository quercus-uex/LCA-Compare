import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Parcela } from '../generated/prisma/client';
import { Polygon } from 'geojson';

@Injectable()
export class ParcelaService {
  constructor(private prisma: PrismaService) {}

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

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ParcelaWhereUniqueInput;
    where?: Prisma.ParcelaWhereInput;
    orderBy?: Prisma.UsuarioOrderByWithRelationInput;
  }): Promise<Parcela[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.parcela.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  create(data: Prisma.ParcelaCreateInput): Promise<Parcela> {
    return this.prisma.parcela.create({ data });
  }

  async addGeom(geoJson: Polygon, id: string): Promise<Parcela | null> {
    await this.prisma.$executeRaw`
      UPDATE "Parcela"
      SET "geom" = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geoJson)}), 4326)
      WHERE "id" = ${id}
    `;
    return await this.findOne({ id });
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

  async findManyByRange(id: string, range: number): Promise<Parcela[]> {
    return this.prisma.$queryRaw<Array<Parcela>>`
      WITH target AS (SELECT geom::geography AS geo FROM "Parcela" WHERE id = ${id})
      SELECT p.*
      FROM "Parcela" p
      JOIN target t ON TRUE
      WHERE p.id <> ${id}
        AND ST_DWithin(p.geom::geography, t.geo, ${range})
    `;
  }

  async findManyByPointRange(
    lat: number,
    long: number,
    range: number,
  ): Promise<Parcela[]> {
    return this.prisma.$queryRaw<Array<Parcela>>`
      WITH target AS (SELECT ST_SetSRID(ST_MakePoint(${long}, ${lat}), 4326)::geography AS geo)
      SELECT p.*
      FROM "Parcela" p
      JOIN target t ON TRUE
      WHERE ST_DWithin(p.geom::geography, t.geo, ${range})
    `;
  }

  async update(params: {
    where: Prisma.ParcelaWhereUniqueInput;
    data: Prisma.ParcelaUpdateInput;
  }): Promise<Parcela> {
    const { where, data } = params;
    return this.prisma.parcela.update({
      data,
      where,
    });
  }

  async delete(where: Prisma.ParcelaWhereUniqueInput): Promise<Parcela> {
    return this.prisma.parcela.delete({ where });
  }
}
