import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Poblacion } from '../generated/prisma/client';

@Injectable()
export class PoblacionService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(
    where: Prisma.PoblacionWhereUniqueInput,
  ): Promise<Poblacion | null> {
    return this.prisma.poblacion.findUnique({
      where,
    });
  }

  async findAll(): Promise<Poblacion[]> {
    return this.prisma.poblacion.findMany({
      include: { provincia: { include: { pais: true } } },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PoblacionWhereUniqueInput;
    where?: Prisma.PoblacionWhereInput;
    orderBy?: Prisma.PoblacionOrderByWithRelationInput;
  }): Promise<Poblacion[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.poblacion.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: { provincia: { include: { pais: true } } },
    });
  }

  async create(data: Prisma.PoblacionCreateInput): Promise<Poblacion> {
    return this.prisma.poblacion.create({ data });
  }

  async update(params: {
    where: Prisma.PoblacionWhereUniqueInput;
    data: Prisma.PoblacionUpdateInput;
  }): Promise<Poblacion> {
    const { where, data } = params;
    return this.prisma.poblacion.update({ data, where });
  }

  async delete(where: Prisma.PoblacionWhereUniqueInput): Promise<Poblacion> {
    return this.prisma.poblacion.delete({ where });
  }

  async count(where?: Prisma.PoblacionWhereInput): Promise<number> {
    return this.prisma.poblacion.count({ where });
  }
}
