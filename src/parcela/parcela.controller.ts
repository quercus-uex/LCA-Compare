import {
  Controller,
  Get,
  UseGuards,
  Param,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ParcelaService } from './parcela.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser, type UserJwt } from '../auth/auth-user.decorator';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { ApiResponseArrayDto } from '../common/dto/api-response-array.dto';
import { ParcelaDto, ParcelaWithGeomDto } from './dto/parcela.dto';

@ApiTags('Parcela')
@ApiBearerAuth()
@Controller('/parcela')
export class ParcelaController {
  constructor(private readonly parcelaService: ParcelaService) {}

  @UseGuards(AuthGuard)
  @Get('')
  @ApiOperation({ summary: 'Obtener las parcelas del usuario autenticado' })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas',
    type: ApiErrorDto,
  })
  @ApiOkResponse({
    description: 'Parcelas del usuario',
    type: ApiResponseArrayDto(ParcelaDto),
  })
  async getByAuthUser(@AuthUser() user: UserJwt) {
    return {
      data: await this.parcelaService.findMany({
        where: { idPropietario: user.sub },
      }),
    };
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una parcela por ID' })
  @ApiNotFoundResponse({
    description: 'Parcela no encontrada',
    type: ApiErrorDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Credenciales inválidas o usuario no es propietario de la parcela',
    type: ApiErrorDto,
  })
  @ApiOkResponse({
    description: 'Parcela',
    type: ApiResponseDto(ParcelaWithGeomDto),
  })
  async getById(@AuthUser() user: UserJwt, @Param('id') id: string) {
    const parcela = await this.parcelaService.findOne({ id });
    if (!parcela) throw new NotFoundException();
    if (parcela.idPropietario !== user.sub)
      throw new UnauthorizedException('No eres el propietario de esta parcela');

    return {
      data: {
        ...parcela,
        geom: await this.parcelaService.getGeom(id),
      },
    };
  }
}
