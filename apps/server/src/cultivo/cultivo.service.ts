import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Cultivo } from '../generated/prisma/client';

@Injectable()
export class CultivoService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(
    where: Prisma.CultivoWhereUniqueInput,
  ): Promise<Cultivo | null> {
    return this.prisma.cultivo.findUnique({
      where,
    });
  }

  async findMostRecentByParcelaId(id: string): Promise<Cultivo | null> {
    return this.prisma.cultivo.findFirst({
      where: { idParcela: id },
      orderBy: { fechaInicioCampania: 'desc' },
    });
  }

  /**
   * Devuelve solo la campaña más reciente de cada parcela indicada, elegida
   * entre las campañas que cumplen `where` (p. ej. tipo de cultivo y años).
   */
  async findMostRecentByParcelaIdBulk(
    ids: string[],
    where: Prisma.CultivoWhereInput = {},
  ): Promise<Cultivo[]> {
    const cultivos = await this.prisma.cultivo.findMany({
      where: { ...where, idParcela: { in: ids } },
      orderBy: [{ idParcela: 'asc' }, { fechaInicioCampania: 'desc' }],
    });

    // Al venir ordenados por fecha descendente dentro de cada parcela, el
    // primer cultivo de cada parcela es su campaña más reciente
    const masRecientes = new Map<string, Cultivo>();
    for (const cultivo of cultivos) {
      if (!masRecientes.has(cultivo.idParcela)) {
        masRecientes.set(cultivo.idParcela, cultivo);
      }
    }
    return [...masRecientes.values()];
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CultivoWhereUniqueInput;
    where?: Prisma.CultivoWhereInput;
    orderBy?:
      | Prisma.CultivoOrderByWithRelationInput
      | Prisma.CultivoOrderByWithRelationInput[];
    include?: Prisma.CultivoInclude;
  }): Promise<Cultivo[]> {
    const { skip, take, cursor, where, orderBy, include } = params;

    return this.prisma.cultivo.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include,
    });
  }

  async create(
    data: Prisma.XOR<
      Prisma.CultivoCreateInput,
      Prisma.CultivoUncheckedCreateInput
    >,
  ): Promise<Cultivo> {
    return this.prisma.cultivo.create({ data });
  }

  async update(params: {
    where: Prisma.CultivoWhereUniqueInput;
    data: Prisma.XOR<
      Prisma.CultivoUpdateInput,
      Prisma.CultivoUncheckedUpdateInput
    >;
  }): Promise<Cultivo> {
    const { where, data } = params;
    return this.prisma.cultivo.update({ data, where });
  }

  async delete(where: Prisma.CultivoWhereUniqueInput): Promise<Cultivo> {
    return this.prisma.cultivo.delete({ where });
  }

  /** Elimina el cultivo y su resultado de impacto, que no tiene sentido sin él */
  async deleteWithResultado(id: string): Promise<Cultivo> {
    return this.prisma.$transaction(async (tx) => {
      const cultivo = await tx.cultivo.delete({ where: { id } });
      if (cultivo.idResultadoImpacto) {
        await tx.resultadoImpacto.delete({
          where: { id: cultivo.idResultadoImpacto },
        });
      }
      return cultivo;
    });
  }

  async count(where?: Prisma.CultivoWhereInput): Promise<number> {
    return this.prisma.cultivo.count({ where });
  }
}
