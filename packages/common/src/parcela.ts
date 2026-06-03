export type Cultivo = {
  id: string;
  fechaInicioCampania: string;
  superficieCultivada: number;
  produccion: number;
  consumoAgua: number;
  ciclo: number;
  tipo: string;
  idParcela: string;
  idResultadoImpacto: string;
};

export type Parcela = {
  id: string;
  sigpac: string | null;
  refCat: string | null;
  ptIdParcela: string | null;
  nombre: string;
  idPropietario: string;
  idPoblacion: string;
};
