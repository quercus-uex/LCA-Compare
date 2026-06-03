export type Pais = {
  id: string;
  nombre: string;
  codigo: string;
};

export type Provincia = {
  id: string;
  nombre: string;
  idCatastro: number;
  idPais: string;
  pais?: Pais;
};

export type Poblacion = {
  id: string;
  idProvincia: string;
  idCatastro: number;
  nombre: string;
  provincia?: Provincia;
};
