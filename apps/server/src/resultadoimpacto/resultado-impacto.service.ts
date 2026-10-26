import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ResultadoImpacto } from '../generated/prisma/client';
import { ParcelaService } from '../parcela/parcela.service';
import { CultivoService } from '../cultivo/cultivo.service';

@Injectable()
export class ResultadoImpactoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parcelaService: ParcelaService,
    private readonly cultivoService: CultivoService,
  ) {}

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
  }): Promise<
    Prisma.ResultadoImpactoGetPayload<{
      include: {
        cultivo: {
          include: {
            parcela: {
              include: { poblacion: { include: { provincia: true } } };
            };
          };
        };
      };
    }>[]
  > {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.resultadoImpacto.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        cultivo: {
          include: {
            parcela: {
              include: { poblacion: { include: { provincia: true } } },
            },
          },
        },
      },
    });
  }

  /**
   * Resultados de la campaña más reciente de cada parcela dentro del radio,
   * elegida entre las campañas que cumplen `cultivoWhere` (tipo, años).
   */
  async findManyAroundPoint(
    lat: number,
    long: number,
    range: number,
    cultivoWhere: Prisma.CultivoWhereInput = {},
  ): Promise<ResultadoImpacto[]> {
    const parcelas = await this.parcelaService.findManyByPointRange(
      lat,
      long,
      range,
    );
    const cultivos = await this.cultivoService.findMostRecentByParcelaIdBulk(
      parcelas.map((p) => p.id),
      cultivoWhere,
    );
    return this.prisma.resultadoImpacto.findMany({
      where: { cultivo: { id: { in: cultivos.map((c) => c.id) } } },
      include: {
        cultivo: {
          include: {
            parcela: {
              include: { poblacion: { include: { provincia: true } } },
            },
          },
        },
      },
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
