import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Feature, Polygon } from 'geojson';
import { firstValueFrom } from 'rxjs';
import { PredialResponseDto } from './dto/predial-response.dto';
import proj4 from 'proj4';

const PREDIAL_BASE_URL =
  'https://snic.dgterritorio.gov.pt/geoportal/dgt_snic2/api/app/search/predio/nic';

@Injectable()
export class PredialService {
  constructor(private readonly httpService: HttpService) {}

  async getPolygon(predial: string): Promise<Feature<Polygon>> {
    const url = new URL(PREDIAL_BASE_URL);
    url.searchParams.set('filter', predial.replaceAll(' ', ''));
    const res = await firstValueFrom(
      this.httpService.get(url.toString(), {
        headers: {
          Referer: 'https://snic.dgterritorio.gov.pt/visualizadorCadastro',
        },
      }),
    );
    const data = res.data as PredialResponseDto;
    const coords = data.wkt_3857
      .replace(/^\w+\(\(/, '')
      .replace(/\)\)$/, '')
      .split('),(')
      .map((ring) =>
        ring.split(',').map((pair) => {
          const [x, y] = pair.trim().split(' ').map(Number);
          return proj4('EPSG:3857', 'WGS84', [x, y]);
        }),
      );
    return {
      type: 'Feature',
      properties: {
        provincia: Number.parseInt(data.dico.slice(0, 2)),
        poblacion: Number.parseInt(data.dico.slice(2, 4)),
      },
      geometry: {
        type: 'Polygon',
        coordinates: coords,
      },
    };
  }
}
