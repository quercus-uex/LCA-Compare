import {
  andWhere,
  cultivoAdminSearch,
  metodoImpactoAdminSearch,
  paisAdminSearch,
  parcelaAdminSearch,
  poblacionAdminSearch,
  provinciaAdminSearch,
  usuarioAdminSearch,
  organizacionAdminSearch,
  consentimientoAdminSearch,
} from './admin-search.helpers';

const contains = (search: string) => ({
  contains: search,
  mode: 'insensitive',
});

describe('admin search helpers', () => {
  it.each([
    {
      name: 'usuarioAdminSearch',
      search: usuarioAdminSearch,
      fields: ['nombre', 'apellidos', 'email', 'rol'],
      related: [],
    },
    {
      name: 'parcelaAdminSearch',
      search: parcelaAdminSearch,
      fields: ['nombre', 'sigpac', 'refCat', 'ptIdParcela', 'idPropietario'],
      related: [
        { propietario: { nombre: contains('term') } },
        { propietario: { apellidos: contains('term') } },
        { propietario: { email: contains('term') } },
        { poblacion: { nombre: contains('term') } },
      ],
    },
    {
      name: 'cultivoAdminSearch',
      search: cultivoAdminSearch,
      fields: ['tipo', 'idParcela'],
      related: [{ parcela: { nombre: contains('term') } }],
    },
    {
      name: 'metodoImpactoAdminSearch',
      search: metodoImpactoAdminSearch,
      fields: ['id', 'nombre'],
      related: [],
    },
    {
      name: 'paisAdminSearch',
      search: paisAdminSearch,
      fields: ['nombre', 'codigo'],
      related: [],
    },
    {
      name: 'provinciaAdminSearch',
      search: provinciaAdminSearch,
      fields: ['nombre', 'idPais'],
      related: [{ pais: { nombre: contains('term') } }],
    },
    {
      name: 'poblacionAdminSearch',
      search: poblacionAdminSearch,
      fields: ['nombre', 'idProvincia'],
      related: [{ provincia: { nombre: contains('term') } }],
    },
    {
      name: 'organizacionAdminSearch',
      search: organizacionAdminSearch,
      fields: ['nombre', 'idAdministrador'],
      related: [
        { administrador: { nombre: contains('term') } },
        { administrador: { apellidos: contains('term') } },
        { administrador: { email: contains('term') } },
      ],
    },
    {
      name: 'consentimientoAdminSearch',
      search: consentimientoAdminSearch,
      fields: ['estado', 'idOrganizacion', 'idUsuario'],
      related: [
        { organizacion: { nombre: contains('term') } },
        { usuario: { nombre: contains('term') } },
        { usuario: { apellidos: contains('term') } },
        { usuario: { email: contains('term') } },
      ],
    },
  ])(
    '$name searches its fields and relations',
    ({ search, fields, related }) => {
      expect(search(' term ')).toEqual({
        OR: [
          ...fields.map((field) => ({ [field]: contains('term') })),
          ...related,
        ],
      });
    },
  );

  it.each([undefined, '', '   '])('returns undefined for search %p', (term) => {
    expect(usuarioAdminSearch(term)).toBeUndefined();
  });

  it('also searches the term without accents', () => {
    expect(paisAdminSearch('Mérida')).toEqual({
      OR: [
        { nombre: contains('Mérida') },
        { codigo: contains('Mérida') },
        { nombre: contains('Merida') },
        { codigo: contains('Merida') },
      ],
    });
  });

  it('matches by exact id when the search is a UUID', () => {
    const id = '0f8fad5b-d9cb-469f-a165-70867728950e';

    expect(paisAdminSearch(id)).toEqual({
      OR: [{ nombre: contains(id) }, { codigo: contains(id) }, { id }],
    });
  });

  describe('andWhere', () => {
    it('returns undefined when no condition is defined', () => {
      expect(andWhere(undefined, undefined)).toBeUndefined();
    });

    it('returns a single defined condition unchanged', () => {
      const where = { idPoblacion: null };

      expect(andWhere(undefined, where)).toBe(where);
    });

    it('combines several conditions with AND', () => {
      const search: Record<string, unknown> = {
        OR: [{ nombre: contains('term') }],
      };

      expect(andWhere(search, { idPoblacion: null })).toEqual({
        AND: [search, { idPoblacion: null }],
      });
    });
  });
});
