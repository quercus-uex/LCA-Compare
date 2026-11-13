import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ResultadoImpacto } from '../generated/prisma/client';

/** Cultivo, parcela y ubicación de cada resultado, que usa el informe */
const RESULTADO_IMPACTO_LOCATION_INCLUDE = {
  cultivo: {
    include: {
      parcela: {
        include: { poblacion: { include: { provincia: true } } },
      },
    },
  },
} satisfies Prisma.ResultadoImpactoInclude;

export type ResultadoImpactoWithRelations = Prisma.ResultadoImpactoGetPayload<{
  include: typeof RESULTADO_IMPACTO_LOCATION_INCLUDE;
}>;

@Injectable()
export class ResultadoImpactoService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(
    where: Prisma.ResultadoImpactoWhereUniqueInput,
  ): Promise<Prisma.ResultadoImpactoGetPayload<{
    include: { impacto: true; cultivo: { include: { parcela: true } } };
  }> | null> {
    return this.prisma.resultadoImpacto.findUnique({
      where,
      include: {
        impacto: true,
        cultivo: {
          include: { parcela: true },
        },
      },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ResultadoImpactoWhereUniqueInput;
    where?: Prisma.ResultadoImpactoWhereInput;
    orderBy?: Prisma.ResultadoImpactoOrderByWithRelationInput;
  }): Promise<ResultadoImpactoWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.resultadoImpacto.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: RESULTADO_IMPACTO_LOCATION_INCLUDE,
    });
  }

  /** Solo los datos de impacto, para calcular medias sin cargar las relaciones */
  async findManyDatos(
    where: Prisma.ResultadoImpactoWhereInput,
  ): Promise<Pick<ResultadoImpacto, 'datos'>[]> {
    return this.prisma.resultadoImpacto.findMany({
      where,
      select: { datos: true },
    });
  }

  async create(
    data: Prisma.ResultadoImpactoCreateInput,
  ): Promise<ResultadoImpacto> {
    return this.prisma.resultadoImpacto.create({ data });
  }

  async delete(
    where: Prisma.ResultadoImpactoWhereUniqueInput,
  ): Promise<ResultadoImpacto> {
    return this.prisma.resultadoImpacto.delete({ where });
  }
}
