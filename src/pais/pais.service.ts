import { Injectable } from '@nestjs/common';
import { Prisma, Pais } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaisService {
  constructor(private prisma: PrismaService) {}

  async findOne(where: Prisma.PaisWhereUniqueInput): Promise<Pais | null> {
    return this.prisma.pais.findUnique({
      where,
    });
  }

  async findAll() {
    return this.prisma.pais.findMany();
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PaisWhereUniqueInput;
    where?: Prisma.PaisWhereInput;
    orderBy?: Prisma.PaisOrderByWithRelationInput;
  }): Promise<Pais[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.pais.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async create(data: Prisma.PaisCreateInput): Promise<Pais> {
    return this.prisma.pais.create({ data });
  }

  async update(params: {
    where: Prisma.PaisWhereUniqueInput;
    data: Prisma.PaisUpdateInput;
  }): Promise<Pais> {
    const { where, data } = params;
    return this.prisma.pais.update({ data, where });
  }

  async delete(where: Prisma.PaisWhereUniqueInput): Promise<Pais> {
    return this.prisma.pais.delete({ where });
  }

  async count(where?: Prisma.PaisWhereInput): Promise<number> {
    return this.prisma.pais.count({ where });
  }
}
