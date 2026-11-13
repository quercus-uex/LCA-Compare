import type { SigpacDto } from '../capture/dto/capture-input.dto';

/** Clave SIGPAC con la que se guarda una parcela (`Parcela.sigpac`) */
export function toSigpacKey({
  provincia,
  municipio,
  poligono,
  parcela,
}: SigpacDto): string {
  return `${provincia}:${municipio}:0:0:${poligono}:${parcela}:1`;
}
