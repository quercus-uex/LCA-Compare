import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, MetodoImpacto } from '../generated/prisma/client';

@Injectable()
export class MetodoImpactoService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(
    where: Prisma.MetodoImpactoWhereUniqueInput,
  ): Promise<MetodoImpacto | null> {
    return this.prisma.metodoImpacto.findUnique({ where });
  }

  async findAll(): Promise<MetodoImpacto[]> {
    return this.prisma.metodoImpacto.findMany();
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.MetodoImpactoWhereUniqueInput;
    where?: Prisma.MetodoImpactoWhereInput;
    orderBy?: Prisma.MetodoImpactoOrderByWithRelationInput;
  }): Promise<MetodoImpacto[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.metodoImpacto.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async create(data: Prisma.MetodoImpactoCreateInput): Promise<MetodoImpacto> {
    return this.prisma.metodoImpacto.create({ data });
  }

  async update(params: {
    where: Prisma.MetodoImpactoWhereUniqueInput;
    data: Prisma.MetodoImpactoUpdateInput;
  }): Promise<MetodoImpacto> {
    const { where, data } = params;
    return this.prisma.metodoImpacto.update({ data, where });
  }

  async delete(
    where: Prisma.MetodoImpactoWhereUniqueInput,
  ): Promise<MetodoImpacto> {
    return this.prisma.metodoImpacto.delete({ where });
  }

  async count(where?: Prisma.MetodoImpactoWhereInput): Promise<number> {
    return this.prisma.metodoImpacto.count({ where });
  }
}
