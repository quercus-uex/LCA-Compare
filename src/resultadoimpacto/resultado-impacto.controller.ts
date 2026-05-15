import { ResultadoImpactoService } from './resultado-impacto.service';
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser, type UserJwt } from '../auth/auth-user.decorator';
import { ParcelaService } from '../parcela/parcela.service';
import { CultivoService } from '../cultivo/cultivo.service';
import {ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse} from "@nestjs/swagger";
import {ApiErrorDto} from "../common/dto/api-error.dto";
import {ApiResponseDto} from "../common/dto/api-response.dto";
import {ResultadoImpactoDto} from "./dto/resultado-impacto.dto";
import { ResultadoImpactoCompareDto } from "./dto/resultado-impacto-compare.dto";

@ApiTags('Resultado de ACV')
@ApiBearerAuth()
@Controller('/resultado')
export class ResultadoImpactoController {
  constructor(
    private readonly resultadoImpactoService: ResultadoImpactoService,
    private readonly parcelaService: ParcelaService,
    private readonly cultivoService: CultivoService,
  ) {}

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un resultado de ACV por ID' })
  @ApiUnauthorizedResponse({
    description: 'Usuario no autenticado o usuario no es propietario de la parcela',
    type: ApiErrorDto,
  })
  @ApiOkResponse({
    description: 'Resultado de ACV',
    type: ApiResponseDto(ResultadoImpactoDto)
  })
  async getById(@AuthUser() user: UserJwt, @Param('id') id: string) {
    const resultado = await this.resultadoImpactoService.findOne({ id });
    if (!resultado) throw new NotFoundException();
    if (resultado.cultivo!.parcela.idPropietario !== user.sub)
      throw new UnauthorizedException('No eres el propietario de esta parcela');

    return { data: resultado };
  }

  meanOfImpacts(results: { category: string; unit: string; amount: number }[]) {
    const total = new Map<
      string,
      { category: string; unit: string; amount: number; count: number }
    >();

    for (const i of results) {
      const prev = total.get(i.category);
      if (!prev) {
        total.set(i.category, { ...i, count: 1 });
      } else {
        prev.amount += i.amount;
        prev.count += 1;
      }
    }

    return Array.from(total.values()).map(
      ({ category, unit, amount, count }) => ({
        category,
        unit,
        amount: amount / count,
      }),
    );
  }

  getDiffString(value1: number, value2: number) {
    const percentage = ((value1 - value2) / value2) * 100;
    const sign = percentage >= 0 ? '+' : '-';
    return `${sign}${percentage.toFixed(2)}`;
  }

  @UseGuards(AuthGuard)
  @Get(':id/compare')
  @ApiOperation({ summary: 'Comparar un resultado de ACV respecto a los disponibles en un rango desde el mismo' })
  @ApiUnauthorizedResponse({
    description: 'Usuario no autenticado o usuario no es propietario de la parcela',
    type: ApiErrorDto,
  })
  @ApiOkResponse({
    description: 'Comparativa de ACV',
    type: ApiResponseDto(ResultadoImpactoCompareDto)
  })
  async compareById(
    @AuthUser() user: UserJwt,
    @Param('id') id: string,
    @Query('range') range: number,
  ) {
    const resultado = await this.resultadoImpactoService.findOne({ id });
    if (!resultado) throw new NotFoundException();
    if (resultado.cultivo!.parcela.idPropietario !== user.sub)
      throw new UnauthorizedException('No eres el propietario de esta parcela');

    const parcelas = await this.parcelaService.findManyByRange(
      resultado.cultivo!.idParcela,
      range,
    );

    const cultivos = await Promise.all(
      parcelas.map((p) => this.cultivoService.findMostRecentByParcelaId(p.id)),
    );

    const resultados = await this.resultadoImpactoService.findMany({
      where: {
        cultivo: { id: { in: cultivos.map((c) => c!.id) } },
        idImpacto: resultado.idImpacto,
      },
    });

    const impactos = [
      'impacto_total',
      'impacto_pesticidas',
      'impacto_fertilizantes',
      'impacto_sistema_riego',
      'impacto_manejo_cultivo',
    ];

    const nearbyMean = Object.fromEntries(
      impactos.map((i) => [
        i,
        (() => {
          const mean = this.meanOfImpacts(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-argument
            resultados.map((r) => r.datos![i]).flat(),
          );

          return mean.map((m) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            const originalAmount = resultado.datos![i].find(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              (r) => r.category === m.category,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ).amount;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return { ...m, diff: this.getDiffString(m.amount, originalAmount) };
          });
        })(),
      ]),
    );

    return {
      data: {
        resultado,
        nearbyMean,
      },
    };
  }
}
