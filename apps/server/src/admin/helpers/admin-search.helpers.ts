import { Prisma } from '../../generated/prisma/client';

function searchWhere<TWhere extends Record<string, unknown>>(
  fields: ReadonlyArray<keyof TWhere & string>,
  search: string | undefined,
): TWhere | undefined {
  if (!search) return undefined;
  const or = fields.map((field) => ({
    [field]: { contains: search, mode: 'insensitive' as const },
  }));
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
  );

export const cultivoAdminSearch = (
  search?: string,
): Prisma.CultivoWhereInput | undefined =>
  searchWhere<Prisma.CultivoWhereInput>(['tipo', 'idParcela'], search);

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
  searchWhere<Prisma.ProvinciaWhereInput>(['nombre', 'idPais'], search);

export const poblacionAdminSearch = (
  search?: string,
): Prisma.PoblacionWhereInput | undefined =>
  searchWhere<Prisma.PoblacionWhereInput>(['nombre', 'idProvincia'], search);
