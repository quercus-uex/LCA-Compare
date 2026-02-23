import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CatastroResponseDto } from './dto/catastro-response.dto';
import { SigpacPointItem } from './dto/sigpac-point-response.dto';

const CATASTRO_BASE_URL =
  'https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCoordenadas.svc/json/Consulta_CPMRC';

const SIGPAC_POINT_QUERY_BASE_URL =
  'https://sigpac-hubcloud.es/servicioconsultassigpac/query/recinfobypoint/4326';

@Injectable()
export class CatastroService {
  constructor(private readonly httpService: HttpService) {}

  async getPolygon(refCat: string): Promise<number[][]> {
    const url = new URL(CATASTRO_BASE_URL);
    url.searchParams.set('RefCat', refCat.substring(0, 14));
    url.searchParams.set('SRS', 'EPSG:4326');
    const res = await firstValueFrom(this.httpService.get(url.toString()));
    const data = res.data as CatastroResponseDto;

    let sigpacUrl = SIGPAC_POINT_QUERY_BASE_URL;
    sigpacUrl += `/${data.Consulta_CPMRCResult.coordenadas.coord[0].geo.xcen}`;
    sigpacUrl += `/${data.Consulta_CPMRCResult.coordenadas.coord[0].geo.ycen}.json`;

    const sigpacRes = await firstValueFrom(this.httpService.get(sigpacUrl));
    const sigpacData = sigpacRes.data as Array<SigpacPointItem>;
    const polygonString = sigpacData[0].wkt;
    const match = polygonString
      .trim()
      .match(/^POLYGON(?:\s+Z)?\s*\(\(\s*(.+?)\s*\)\)\s*$/i);

    if (!match) return [];

    return match[1].split(',').map((pair) => {
      const [xStr, yStr] = pair.trim().split(/\s+/);
      return [Number(yStr), Number(xStr)];
    });
  }
}
