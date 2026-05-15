import { Controller, Get } from '@nestjs/common';
import { PaisService } from './pais.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseArrayDto } from '../common/dto/api-response-array.dto';
import { PaisDto } from './dto/pais.dto';

@ApiTags('País')
@Controller('/pais')
export class PaisController {
  constructor(private readonly paisService: PaisService) {}

  @Get('')
  @ApiOperation({ summary: 'Obtener todos los países' })
  @ApiOkResponse({
    description: 'Países',
    type: ApiResponseArrayDto(PaisDto),
  })
  async getAll() {
    return { data: await this.paisService.findAll() };
  }
}
