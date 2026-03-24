import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Poblacion } from '../generated/prisma/client';

@Injectable()
export class PoblacionService {
  constructor(private prisma: PrismaService) {}

  async findOne(
    where: Prisma.PoblacionWhereUniqueInput,
  ): Promise<Poblacion | null> {
    return this.prisma.poblacion.findUnique({
      where,
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
}
