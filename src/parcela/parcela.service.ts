import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Parcela } from '../generated/prisma/client';

@Injectable()
export class ParcelaService {
  constructor(private prisma: PrismaService) {}

  async findOne(
    where: Prisma.ParcelaWhereUniqueInput,
  ): Promise<Parcela | null> {
    return this.prisma.parcela.findUnique({
      where,
    });
  }

  async findAll(params: {
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

  async create(data: Prisma.ParcelaCreateInput): Promise<Parcela> {
    return this.prisma.parcela.create({ data });
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
