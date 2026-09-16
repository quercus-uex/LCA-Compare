import type { FkConfig } from './id-lookup-field.component.tsx';

export const ENTITIES = [
  'usuarios',
  'parcelas',
  'cultivos',
  'metodos-impacto',
  'paises',
  'provincias',
  'poblaciones',
] as const;

export type Entity = (typeof ENTITIES)[number];

export const ENTITY_LABEL_KEYS: Record<Entity, string> = {
  usuarios: 'admin.entities.usuarios',
  parcelas: 'admin.entities.parcelas',
  cultivos: 'admin.entities.cultivos',
  'metodos-impacto': 'admin.entities.metodosImpacto',
  paises: 'admin.entities.paises',
  provincias: 'admin.entities.provincias',
  poblaciones: 'admin.entities.poblaciones',
};

export type FieldConfig = {
  name: string;
  labelKey: string;
  type: 'text' | 'email' | 'password' | 'number' | 'datetime-local' | 'checkbox';
  optional?: boolean;
};

export const CONFIG: Record<
  Entity,
  { tableFields: string[]; formFields: FieldConfig[] }
> = {
  usuarios: {
    tableFields: ['nombre', 'apellidos', 'email', 'rol'],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text' },
      { name: 'apellidos', labelKey: 'admin.fields.apellidos', type: 'text' },
      { name: 'email', labelKey: 'admin.fields.email', type: 'email' },
      {
        name: 'passwordHash',
        labelKey: 'admin.fields.passwordHash',
        type: 'password',
        optional: true,
      },
      { name: 'rol', labelKey: 'admin.fields.rol', type: 'text' },
    ],
  },
  parcelas: {
    tableFields: ['nombre', 'sigpac', 'refCat', 'esParcelaReferencia', 'idPropietario'],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text' },
      { name: 'sigpac', labelKey: 'admin.fields.sigpac', type: 'text' },
      { name: 'refCat', labelKey: 'admin.fields.refCat', type: 'text' },
      { name: 'ptIdParcela', labelKey: 'admin.fields.ptIdParcela', type: 'text' },
      { name: 'idPropietario', labelKey: 'admin.fields.idPropietario', type: 'text' },
      { name: 'idPoblacion', labelKey: 'admin.fields.idPoblacion', type: 'text' },
      { name: 'esParcelaReferencia', labelKey: 'admin.fields.esParcelaReferencia', type: 'checkbox' },
    ],
  },
  cultivos: {
    tableFields: [
      'tipo',
      'fechaInicioCampania',
      'superficieCultivada',
      'produccion',
    ],
    formFields: [
      { name: 'tipo', labelKey: 'admin.fields.tipo', type: 'text' },
      {
        name: 'fechaInicioCampania',
        labelKey: 'admin.fields.fechaInicioCampania',
        type: 'datetime-local',
      },
      { name: 'superficieCultivada', labelKey: 'admin.fields.superficieCultivada', type: 'number' },
      { name: 'produccion', labelKey: 'admin.fields.produccion', type: 'number' },
      { name: 'consumoAgua', labelKey: 'admin.fields.consumoAgua', type: 'number' },
      { name: 'ciclo', labelKey: 'admin.fields.ciclo', type: 'number' },
      { name: 'idParcela', labelKey: 'admin.fields.idParcela', type: 'text' },
    ],
  },
  'metodos-impacto': {
    tableFields: ['id', 'nombre'],
    formFields: [
      { name: 'id', labelKey: 'admin.fields.id', type: 'text' },
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text' },
    ],
  },
  paises: {
    tableFields: ['nombre', 'codigo'],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text' },
      { name: 'codigo', labelKey: 'admin.fields.codigo', type: 'text' },
    ],
  },
  provincias: {
    tableFields: ['nombre', 'idCatastro', 'idPais'],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text' },
      { name: 'idCatastro', labelKey: 'admin.fields.idCatastro', type: 'number' },
      { name: 'idPais', labelKey: 'admin.fields.idPais', type: 'text' },
    ],
  },
  poblaciones: {
    tableFields: ['nombre', 'idCatastro', 'idProvincia'],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text' },
      { name: 'idCatastro', labelKey: 'admin.fields.idCatastro', type: 'number' },
      { name: 'idProvincia', labelKey: 'admin.fields.idProvincia', type: 'text' },
    ],
  },
};

export const ROLES = ['admin', 'usuario'] as const;

export const TABLE_FK_LINKS: Record<string, Entity> = {
  idPropietario: 'usuarios',
  idPoblacion: 'poblaciones',
  idPais: 'paises',
  idProvincia: 'provincias',
};

export const FK_REFERENCES: Record<string, FkConfig> = {
  idPropietario: { entity: 'usuarios', displayFields: ['nombre', 'apellidos'], endpoint: 'usuarios' },
  idPoblacion: { entity: 'poblaciones', displayFields: ['nombre'], endpoint: 'poblaciones' },
  idParcela: { entity: 'parcelas', displayFields: ['nombre'], endpoint: 'parcelas' },
  idPais: { entity: 'paises', displayFields: ['nombre'], endpoint: 'paises' },
  idProvincia: { entity: 'provincias', displayFields: ['nombre'], endpoint: 'provincias' },
};