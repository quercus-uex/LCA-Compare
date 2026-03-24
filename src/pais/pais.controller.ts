import { Controller, Get } from '@nestjs/common';
import { PaisService } from './pais.service';

@Controller('/pais')
export class PaisController {
  constructor(private readonly paisService: PaisService) {}

  @Get('')
  async getAll() {
    return { data: await this.paisService.findAll() };
  }
}
