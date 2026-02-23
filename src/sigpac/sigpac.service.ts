import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SigpacResponseDto } from './dto/sigpac-response.dto';

const SIGPAC_BASE_URL =
  'https://desarrollo.tragsatec.es/ogc-api-feature/collections/recintos/items';

@Injectable()
export class SigpacService {
  constructor(private readonly httpService: HttpService) {}

  async getPolygon(sigpac: string): Promise<number[][]> {
    const [provincia, municipio, agregado, zona, poligono, parcela, recinto] =
      sigpac.split(':');

    const url = new URL(SIGPAC_BASE_URL);
    url.searchParams.set('f', 'json');
    url.searchParams.set(
      'filter',
      `provincia = ${provincia} AND` +
        `municipio = ${municipio} AND` +
        `agregado = ${agregado} AND` +
        `zona = ${zona} AND` +
        `poligono = ${poligono} AND` +
        `parcela = ${parcela} AND` +
        `recinto = ${recinto}`,
    );
    const res = await firstValueFrom(this.httpService.get(url.toString()));
    const data = res.data as SigpacResponseDto;
    return data.features[0].geometry.coordinates[0];
  }
}
