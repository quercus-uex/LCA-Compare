export interface SigpacResponseDto {
  type: string;
  features: {
    type: string;
    id: number;
    properties: {
      dn_pk: number;
      provincia: number;
      municipio: number;
      agregado: number;
      zona: number;
      poligono: number;
      parcela: number;
      recinto: number;
      pendiente_media: number;
      altitud: number;
    };
    geometry: {
      type: string;
      coordinates: [[number[]]];
    };
  }[];
  numberMatched: number;
  numberReturned: number;
}
