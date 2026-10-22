import { Prisma } from '../../generated/prisma/client';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const contains = (search: string) => ({
  contains: search,
  mode: 'insensitive' as const,
});

const stripAccents = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Construye un OR de búsqueda: texto parcial en `fields` y en las relaciones
 * de `related`, más coincidencia exacta por `id` cuando la búsqueda es un UUID
 * (los enlaces entre tablas del panel navegan buscando por id).
 *
 * También busca el texto sin tildes, porque parte de los datos de referencia
 * se guardaron sin ellas (p. ej. «Merida»).
 */
function searchWhere<TWhere extends Record<string, unknown>>(
  fields: ReadonlyArray<keyof TWhere & string>,
  search: string | undefined,
  related: (search: string) => TWhere[] = () => [],
): TWhere | undefined {
  const term = search?.trim();
  if (!term) return undefined;
  const terms = [...new Set([term, stripAccents(term)])];
  const or: Record<string, unknown>[] = terms.flatMap((t) => [
    ...fields.map((field) => ({ [field]: contains(t) })),
    ...related(t),
  ]);
  if (UUID_PATTERN.test(term)) or.push({ id: term });
  return { OR: or } as unknown as TWhere;
}

export const usuarioAdminSearch = (
  search?: string,
): Prisma.UsuarioWhereInput | undefined =>
  searchWhere<Prisma.UsuarioWhereInput>(
    ['nombre', 'apellidos', 'email', 'rol'],
    search,
  );

export const parcelaAdminSearch = (
  search?: string,
): Prisma.ParcelaWhereInput | undefined =>
  searchWhere<Prisma.ParcelaWhereInput>(
    ['nombre', 'sigpac', 'refCat', 'ptIdParcela', 'idPropietario'],
    search,
    (term) => [
      { propietario: { nombre: contains(term) } },
      { propietario: { apellidos: contains(term) } },
      { propietario: { email: contains(term) } },
      { poblacion: { nombre: contains(term) } },
    ],
  );

export const cultivoAdminSearch = (
  search?: string,
): Prisma.CultivoWhereInput | undefined =>
  searchWhere<Prisma.CultivoWhereInput>(
    ['tipo', 'idParcela'],
    search,
    (term) => [{ parcela: { nombre: contains(term) } }],
  );

export const metodoImpactoAdminSearch = (
  search?: string,
): Prisma.MetodoImpactoWhereInput | undefined =>
  searchWhere<Prisma.MetodoImpactoWhereInput>(['id', 'nombre'], search);

export const paisAdminSearch = (
  search?: string,
): Prisma.PaisWhereInput | undefined =>
  searchWhere<Prisma.PaisWhereInput>(['nombre', 'codigo'], search);

export const provinciaAdminSearch = (
  search?: string,
): Prisma.ProvinciaWhereInput | undefined =>
  searchWhere<Prisma.ProvinciaWhereInput>(
    ['nombre', 'idPais'],
    search,
    (term) => [{ pais: { nombre: contains(term) } }],
  );

export const poblacionAdminSearch = (
  search?: string,
): Prisma.PoblacionWhereInput | undefined =>
  searchWhere<Prisma.PoblacionWhereInput>(
    ['nombre', 'idProvincia'],
    search,
    (term) => [{ provincia: { nombre: contains(term) } }],
  );

/** Combina la búsqueda con filtros adicionales sin perder ninguno */
export function andWhere<TWhere extends Record<string, unknown>>(
  ...conditions: (TWhere | undefined)[]
): TWhere | undefined {
  const defined = conditions.filter((c): c is TWhere => c !== undefined);
  if (defined.length <= 1) return defined[0];
  return { AND: defined } as unknown as TWhere;
}
