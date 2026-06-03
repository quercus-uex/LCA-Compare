import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CatastroResponseDto } from './dto/catastro-response.dto';
import { Feature, Polygon } from 'geojson';
import { XMLParser } from 'fast-xml-parser';

const CATASTRO_BASE_URL =
  'https://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx?service=wfs&version=2&request=getfeature&STOREDQUERIE_ID=GetParcel&srsname=EPSG::4326';

@Injectable()
export class CatastroService {
  parser: XMLParser;

  constructor(private readonly httpService: HttpService) {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
  }

  async getPolygon(refCat: string): Promise<Feature<Polygon>> {
    const url = new URL(CATASTRO_BASE_URL);
    url.searchParams.set('refcat', refCat);
    const res = await firstValueFrom(this.httpService.get(url.toString()));
    const xml = this.parser.parse(res.data as string) as CatastroResponseDto;

    const member = xml.FeatureCollection.member;
    const posList =
      member['cp:CadastralParcel']['cp:geometry']['gml:MultiSurface'][
        'gml:surfaceMember'
      ]['gml:Surface']['gml:patches']['gml:PolygonPatch']['gml:exterior'][
        'gml:LinearRing'
      ]['gml:posList'];

    const coords = posList['#text'].trim().split(/\s+/).map(Number);
    const polygon: number[][] = [];
    for (let i = 0; i < coords.length; i += 2) {
      polygon.push([coords[i + 1], coords[i]]); // lat,lon -> lon,lat
    }

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [polygon],
      },
    };
  }
}
