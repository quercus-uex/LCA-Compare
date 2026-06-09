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

  async findMostRecentByParcelaIdBulk(ids: string[]): Promise<Cultivo[]> {
    return this.prisma.cultivo.findMany({
      where: { idParcela: { in: ids } },
      orderBy: { fechaInicioCampania: 'desc' },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CultivoWhereUniqueInput;
    where?: Prisma.CultivoWhereInput;
    orderBy?: Prisma.CultivoOrderByWithRelationInput;
  }): Promise<Cultivo[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.cultivo.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async create(data: Prisma.CultivoCreateInput): Promise<Cultivo> {
    return this.prisma.cultivo.create({ data });
  }

  async update(params: {
    where: Prisma.CultivoWhereUniqueInput;
    data: Prisma.CultivoUpdateInput;
  }): Promise<Cultivo> {
    const { where, data } = params;
    return this.prisma.cultivo.update({ data, where });
  }

  async delete(where: Prisma.CultivoWhereUniqueInput): Promise<Cultivo> {
    return this.prisma.cultivo.delete({ where });
  }

  async count(where?: Prisma.CultivoWhereInput): Promise<number> {
    return this.prisma.cultivo.count({ where });
  }
}
