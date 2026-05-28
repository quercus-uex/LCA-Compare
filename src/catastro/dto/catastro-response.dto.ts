export interface CatastroResponseDto {
  FeatureCollection: {
    member: {
      'cp:CadastralParcel': {
        'cp:geometry': {
          'gml:MultiSurface': {
            'gml:surfaceMember': {
              'gml:Surface': {
                'gml:patches': {
                  'gml:PolygonPatch': {
                    'gml:exterior': {
                      'gml:LinearRing': {
                        'gml:posList': {
                          '#text': string;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}
