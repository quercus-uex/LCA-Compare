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

  async findManyAroundParcela(
    parcelaId: string,
    range: number,
  ): Promise<
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
    const parcelas = await this.parcelaService.findManyByRange(
      parcelaId,
      range,
    );
    const cultivos = await this.cultivoService.findMostRecentByParcelaIdBulk(
      parcelas.map((p) => p.id),
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

  async findManyAroundPoint(
    lat: number,
    long: number,
    range: number,
  ): Promise<ResultadoImpacto[]> {
    const parcelas = await this.parcelaService.findManyByPointRange(
      lat,
      long,
      range,
    );
    const cultivos = await this.cultivoService.findMostRecentByParcelaIdBulk(
      parcelas.map((p) => p.id),
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

  async findManyByTipoCultivo(tipo: string): Promise<ResultadoImpacto[]> {
    const cultivos = await this.cultivoService.findMany({ where: { tipo } });
    return this.prisma.resultadoImpacto.findMany({
      where: { cultivo: { id: { in: cultivos.map((c) => c.id) } } },
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
