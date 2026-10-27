import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ResultadoImpacto } from '../generated/prisma/client';
import { ParcelaService } from '../parcela/parcela.service';

@Injectable()
export class ResultadoImpactoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parcelaService: ParcelaService,
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
   * Resultados de todas las campañas de las parcelas dentro del radio. El tipo
   * de cultivo y los años se filtran después, igual que con el resto de
   * filtros de ubicación.
   */
  async findManyAroundPoint(
    lat: number,
    long: number,
    range: number,
  ): Promise<Pick<ResultadoImpacto, 'id'>[]> {
    const parcelas = await this.parcelaService.findManyByPointRange(
      lat,
      long,
      range,
    );
    return this.prisma.resultadoImpacto.findMany({
      where: { cultivo: { idParcela: { in: parcelas.map((p) => p.id) } } },
      select: { id: true },
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
