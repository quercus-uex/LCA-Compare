export const ADMIN_MAX_TAKE = 100;

function toNonNegativeInt(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

/**
 * Convierte los parámetros `skip`/`take` de la query. Los valores no válidos
 * se ignoran (en lugar de llegar a Prisma como NaN) y `take` se limita.
 */
export function parseAdminPagination(
  skip?: string,
  take?: string,
): { skip?: number; take?: number } {
  const parsedTake = toNonNegativeInt(take);
  return {
    skip: toNonNegativeInt(skip),
    take:
      parsedTake === undefined
        ? undefined
        : Math.min(parsedTake, ADMIN_MAX_TAKE),
  };
}
