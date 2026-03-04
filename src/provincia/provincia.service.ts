import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Provincia } from '../generated/prisma/client';

@Injectable()
export class ProvinciaService {
  constructor(private prisma: PrismaService) {}

  async findOne(
    where: Prisma.ProvinciaWhereUniqueInput,
  ): Promise<Provincia | null> {
    return this.prisma.provincia.findUnique({ where });
  }

  async findAll(): Promise<Provincia[]> {
    return this.prisma.provincia.findMany();
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ProvinciaWhereUniqueInput;
    where?: Prisma.ProvinciaWhereInput;
    orderBy?: Prisma.ProvinciaOrderByWithRelationInput;
  }): Promise<Provincia[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.provincia.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }
}
