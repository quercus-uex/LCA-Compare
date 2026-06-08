import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { CatastroService } from './catastro.service';

const CATASTRO_WFS_URL =
  'https://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx?service=wfs&version=2&request=getfeature&STOREDQUERIE_ID=GetParcel&srsname=EPSG::4326';

function makePosListXml(posList: string): string {
  return `<FeatureCollection>
  <member>
    <cp:CadastralParcel>
      <cp:geometry>
        <gml:MultiSurface>
          <gml:surfaceMember>
            <gml:Surface>
              <gml:patches>
                <gml:PolygonPatch>
                  <gml:exterior>
                    <gml:LinearRing>
                      <gml:posList srsDimension="2">${posList}</gml:posList>
                    </gml:LinearRing>
                  </gml:exterior>
                </gml:PolygonPatch>
              </gml:patches>
            </gml:Surface>
          </gml:surfaceMember>
        </gml:MultiSurface>
      </cp:geometry>
    </cp:CadastralParcel>
  </member>
</FeatureCollection>`;
}

describe('CatastroService', () => {
  let httpService: jest.Mocked<Pick<HttpService, 'get'>>;
  let service: CatastroService;

  beforeEach(() => {
    httpService = { get: jest.fn() };
    service = new CatastroService(httpService as unknown as HttpService);
  });

  it('requests the WFS parcel endpoint with the cadastral reference as refcat', async () => {
    const xml = makePosListXml('40.0 -3.0 40.1 -3.1 40.0 -3.0');
    httpService.get.mockReturnValue(of({ data: xml } as any));

    await service.getPolygon('ABC123');

    const calledUrl = new URL(httpService.get.mock.calls[0][0]);
    expect(calledUrl.origin + calledUrl.pathname).toBe(
      CATASTRO_WFS_URL.split('?')[0],
    );
    expect(calledUrl.searchParams.get('refcat')).toBe('ABC123');
  });

  it('parses a minimal gml:posList into a GeoJSON Feature<Polygon> with lon/lat coordinates', async () => {
    const xml = makePosListXml('40.0 -3.0 40.1 -3.1 40.2 -3.2 40.0 -3.0');
    httpService.get.mockReturnValue(of({ data: xml } as any));

    const result = await service.getPolygon('ABC123');

    expect(result.type).toBe('Feature');
    expect(result.properties).toEqual({});
    expect(result.geometry.type).toBe('Polygon');
    expect(result.geometry.coordinates).toEqual([
      [
        [-3.0, 40.0],
        [-3.1, 40.1],
        [-3.2, 40.2],
        [-3.0, 40.0],
      ],
    ]);
  });
});
