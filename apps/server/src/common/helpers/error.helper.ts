/** Mensaje legible de un error capturado, sea o no una instancia de `Error` */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
