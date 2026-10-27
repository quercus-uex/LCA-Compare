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
