export interface CatastroResponseDto {
  Consulta_CPMRCResult: {
    control: {
      cucoor: number;
    };
    coordenadas: {
      coord: {
        pc: {
          pc1: string;
          pc2: string;
        };
        geo: {
          xcen: string;
          ycen: string;
          srs: string;
        };
        ldt: string;
      }[];
    };
  };
}
