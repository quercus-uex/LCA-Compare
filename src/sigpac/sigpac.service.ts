import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SigpacResponseDto } from './dto/sigpac-response.dto';
import { Feature, Polygon } from 'geojson';
import { SigpacDto } from '../ventum/dto/ventum-input.dto';

const SIGPAC_BASE_URL =
  'https://desarrollo.tragsatec.es/ogc-api-feature/collections/recintos/items';

@Injectable()
export class SigpacService {
  constructor(private readonly httpService: HttpService) {}

  async getPolygon(sigpac: SigpacDto): Promise<Feature<Polygon>> {
    const { provincia, municipio, parcela, poligono } = sigpac;

    const url = new URL(SIGPAC_BASE_URL);
    url.searchParams.set('f', 'json');
    url.searchParams.set(
      'filter',
      `provincia = ${provincia} AND` +
        `municipio = ${municipio} AND` +
        //`agregado = ${agregado} AND` +
        //`zona = ${zona} AND` +
        `poligono = ${poligono} AND` +
        `parcela = ${parcela}`, //+
        //`recinto = ${recinto}`,
    );
    const res = await firstValueFrom(this.httpService.get(url.toString()));
    const data = res.data as SigpacResponseDto;
    return data.features[0];
  }
}
