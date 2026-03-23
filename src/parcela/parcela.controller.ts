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

@Controller('/parcela')
export class ParcelaController {
  constructor(private readonly parcelaService: ParcelaService) {}

  @UseGuards(AuthGuard)
  @Get('')
  async getByAuthUser(@AuthUser() user: UserJwt) {
    return {
      data: await this.parcelaService.findMany({
        where: { idPropietario: user.sub },
      }),
    };
  }

  @UseGuards(AuthGuard)
  @Get(':id')
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
