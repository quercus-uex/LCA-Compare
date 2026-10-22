import type { IconType } from 'react-icons';
import { FiBox, FiFlag, FiHome, FiLayers, FiMap, FiUsers, FiZap } from 'react-icons/fi';
import { CROP_TYPE_OPTIONS } from '../../hooks/use-crop-type-label.ts';

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

export type Item = Record<string, unknown>;

export const isEntity = (value: string | null): value is Entity =>
  ENTITIES.includes(value as Entity);

export const ROLES = ['admin', 'usuario'] as const;

/** Grupos del menú lateral: datos de la plataforma y catálogos de referencia */
export const ENTITY_GROUPS: { labelKey: string; entities: Entity[] }[] = [
  { labelKey: 'admin.groups.data', entities: ['usuarios', 'parcelas', 'cultivos'] },
  {
    labelKey: 'admin.groups.catalogs',
    entities: ['metodos-impacto', 'paises', 'provincias', 'poblaciones'],
  },
];

const text = (item: Item, key: string): string => {
  const value = item[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
};

const related = (item: Item, key: string): Item | null => {
  const value = item[key];
  return value && typeof value === 'object' ? (value as Item) : null;
};

const joinText = (...parts: string[]) => parts.filter(Boolean).join(' ');

/** Cómo se muestra un registro de cada entidad cuando otra lo referencia */
export const ENTITY_DISPLAY: Record<Entity, { label: (item: Item) => string; detail?: (item: Item) => string }> = {
  usuarios: {
    label: (item) => joinText(text(item, 'nombre'), text(item, 'apellidos')),
    detail: (item) => text(item, 'email'),
  },
  parcelas: { label: (item) => text(item, 'nombre') },
  cultivos: { label: (item) => text(item, 'tipo') },
  'metodos-impacto': { label: (item) => text(item, 'nombre') },
  paises: { label: (item) => text(item, 'nombre'), detail: (item) => text(item, 'codigo') },
  provincias: {
    label: (item) => text(item, 'nombre'),
    detail: (item) => text(related(item, 'pais') ?? {}, 'nombre'),
  },
  poblaciones: {
    label: (item) => text(item, 'nombre'),
    detail: (item) => text(related(item, 'provincia') ?? {}, 'nombre'),
  },
};

export type ColumnConfig =
  | { kind: 'text'; key: string; labelKey: string; value: (item: Item) => string; mono?: boolean; primary?: boolean }
  | { kind: 'role'; key: string; labelKey: string }
  | { kind: 'boolean'; key: string; labelKey: string }
  | { kind: 'date'; key: string; labelKey: string }
  | { kind: 'number'; key: string; labelKey: string; unitKey?: string }
  | { kind: 'crop'; key: string; labelKey: string }
  | { kind: 'parcelId'; key: string; labelKey: string }
  | {
      kind: 'link';
      key: string;
      labelKey: string;
      entity: Entity;
      relation: string;
      // Texto destacado cuando la relación es opcional y no está asignada
      missingKey?: string;
    };

export type FieldConfig = {
  name: string;
  labelKey: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'checkbox' | 'select' | 'fk';
  required?: boolean | 'create';
  helpKey?: string;
  helpEditKey?: string;
  options?: readonly { value: string; labelKey: string }[];
  entity?: Entity;
  relation?: string;
  step?: string;
  lockedOnEdit?: boolean;
  span?: 'full';
};

export type EntityConfig = {
  icon: IconType;
  labelKey: string;
  // Sufijo de las claves admin.createTitles/editTitles/deleteTitles (dependen del género)
  titleKey: string;
  descriptionKey: string;
  columns: ColumnConfig[];
  formFields: FieldConfig[];
};

export const CONFIG: Record<Entity, EntityConfig> = {
  usuarios: {
    icon: FiUsers,
    labelKey: 'admin.entities.usuarios',
    titleKey: 'usuarios',
    descriptionKey: 'admin.descriptions.usuarios',
    columns: [
      {
        kind: 'text',
        key: 'nombre',
        labelKey: 'admin.fields.nombre',
        value: (item) => joinText(text(item, 'nombre'), text(item, 'apellidos')),
        primary: true,
      },
      { kind: 'text', key: 'email', labelKey: 'admin.fields.email', value: (item) => text(item, 'email') },
      { kind: 'role', key: 'rol', labelKey: 'admin.fields.rol' },
    ],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text', required: true },
      { name: 'apellidos', labelKey: 'admin.fields.apellidos', type: 'text', required: true },
      { name: 'email', labelKey: 'admin.fields.email', type: 'email', required: true, span: 'full' },
      {
        name: 'passwordHash',
        labelKey: 'admin.fields.password',
        type: 'password',
        required: 'create',
        helpEditKey: 'admin.help.passwordEdit',
      },
      {
        name: 'rol',
        labelKey: 'admin.fields.rol',
        type: 'select',
        required: true,
        options: ROLES.map((r) => ({ value: r, labelKey: `admin.roles.${r}` })),
      },
    ],
  },
  parcelas: {
    icon: FiMap,
    labelKey: 'admin.entities.parcelas',
    titleKey: 'parcelas',
    descriptionKey: 'admin.descriptions.parcelas',
    columns: [
      { kind: 'text', key: 'nombre', labelKey: 'admin.fields.nombre', value: (item) => text(item, 'nombre'), primary: true },
      { kind: 'parcelId', key: 'identificador', labelKey: 'admin.fields.identificador' },
      { kind: 'link', key: 'idPropietario', labelKey: 'admin.fields.propietario', entity: 'usuarios', relation: 'propietario' },
      {
        kind: 'link',
        key: 'idPoblacion',
        labelKey: 'admin.fields.poblacion',
        entity: 'poblaciones',
        relation: 'poblacion',
        missingKey: 'admin.parcelas.noPoblacion',
      },
      { kind: 'boolean', key: 'esParcelaReferencia', labelKey: 'admin.fields.referencia' },
    ],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text', required: true, span: 'full' },
      {
        name: 'idPropietario',
        labelKey: 'admin.fields.propietario',
        type: 'fk',
        entity: 'usuarios',
        relation: 'propietario',
        required: true,
      },
      {
        name: 'idPoblacion',
        labelKey: 'admin.fields.poblacion',
        type: 'fk',
        entity: 'poblaciones',
        relation: 'poblacion',
        helpKey: 'admin.help.poblacion',
      },
      { name: 'sigpac', labelKey: 'admin.fields.sigpac', type: 'text', helpKey: 'admin.help.sigpac' },
      { name: 'refCat', labelKey: 'admin.fields.refCat', type: 'text' },
      { name: 'ptIdParcela', labelKey: 'admin.fields.ptIdParcela', type: 'text' },
      {
        name: 'esParcelaReferencia',
        labelKey: 'admin.fields.esParcelaReferencia',
        type: 'checkbox',
        helpKey: 'admin.help.esParcelaReferencia',
        span: 'full',
      },
    ],
  },
  cultivos: {
    icon: FiBox,
    labelKey: 'admin.entities.cultivos',
    titleKey: 'cultivos',
    descriptionKey: 'admin.descriptions.cultivos',
    columns: [
      { kind: 'crop', key: 'tipo', labelKey: 'admin.fields.tipo' },
      { kind: 'link', key: 'idParcela', labelKey: 'admin.fields.parcela', entity: 'parcelas', relation: 'parcela' },
      { kind: 'date', key: 'fechaInicioCampania', labelKey: 'admin.fields.fechaInicioCampania' },
      { kind: 'number', key: 'superficieCultivada', labelKey: 'admin.fields.superficieCultivada', unitKey: 'common.units.hectares' },
      { kind: 'number', key: 'produccion', labelKey: 'admin.fields.produccion', unitKey: 'common.units.tonsPerHectare' },
      { kind: 'number', key: 'ciclo', labelKey: 'admin.fields.ciclo', unitKey: 'common.units.days' },
    ],
    formFields: [
      {
        name: 'tipo',
        labelKey: 'admin.fields.tipo',
        type: 'select',
        required: true,
        options: CROP_TYPE_OPTIONS,
      },
      {
        name: 'idParcela',
        labelKey: 'admin.fields.parcela',
        type: 'fk',
        entity: 'parcelas',
        relation: 'parcela',
        required: true,
      },
      { name: 'fechaInicioCampania', labelKey: 'admin.fields.fechaInicioCampania', type: 'date', required: true },
      { name: 'ciclo', labelKey: 'admin.fields.cicloDias', type: 'number', required: true, step: '1' },
      { name: 'superficieCultivada', labelKey: 'admin.fields.superficieHa', type: 'number', required: true, step: 'any' },
      { name: 'produccion', labelKey: 'admin.fields.produccionTHa', type: 'number', required: true, step: 'any' },
      { name: 'consumoAgua', labelKey: 'admin.fields.consumoAguaLHa', type: 'number', required: true, step: 'any' },
    ],
  },
  'metodos-impacto': {
    icon: FiZap,
    labelKey: 'admin.entities.metodosImpacto',
    titleKey: 'metodosImpacto',
    descriptionKey: 'admin.descriptions.metodosImpacto',
    columns: [
      { kind: 'text', key: 'nombre', labelKey: 'admin.fields.nombre', value: (item) => text(item, 'nombre'), primary: true },
      { kind: 'text', key: 'id', labelKey: 'admin.fields.uuidOpenLca', value: (item) => text(item, 'id'), mono: true },
    ],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text', required: true, span: 'full' },
      {
        name: 'id',
        labelKey: 'admin.fields.uuidOpenLca',
        type: 'text',
        required: true,
        lockedOnEdit: true,
        helpKey: 'admin.help.metodoId',
        span: 'full',
      },
    ],
  },
  paises: {
    icon: FiFlag,
    labelKey: 'admin.entities.paises',
    titleKey: 'paises',
    descriptionKey: 'admin.descriptions.paises',
    columns: [
      { kind: 'text', key: 'nombre', labelKey: 'admin.fields.nombre', value: (item) => text(item, 'nombre'), primary: true },
      { kind: 'text', key: 'codigo', labelKey: 'admin.fields.codigo', value: (item) => text(item, 'codigo'), mono: true },
    ],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text', required: true },
      { name: 'codigo', labelKey: 'admin.fields.codigo', type: 'text', required: true, helpKey: 'admin.help.codigoPais' },
    ],
  },
  provincias: {
    icon: FiLayers,
    labelKey: 'admin.entities.provincias',
    titleKey: 'provincias',
    descriptionKey: 'admin.descriptions.provincias',
    columns: [
      { kind: 'text', key: 'nombre', labelKey: 'admin.fields.nombre', value: (item) => text(item, 'nombre'), primary: true },
      { kind: 'number', key: 'idCatastro', labelKey: 'admin.fields.idCatastro' },
      { kind: 'link', key: 'idPais', labelKey: 'admin.fields.pais', entity: 'paises', relation: 'pais' },
    ],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text', required: true, span: 'full' },
      { name: 'idCatastro', labelKey: 'admin.fields.idCatastro', type: 'number', required: true, step: '1', helpKey: 'admin.help.idCatastro' },
      { name: 'idPais', labelKey: 'admin.fields.pais', type: 'fk', entity: 'paises', relation: 'pais', required: true },
    ],
  },
  poblaciones: {
    icon: FiHome,
    labelKey: 'admin.entities.poblaciones',
    titleKey: 'poblaciones',
    descriptionKey: 'admin.descriptions.poblaciones',
    columns: [
      { kind: 'text', key: 'nombre', labelKey: 'admin.fields.nombre', value: (item) => text(item, 'nombre'), primary: true },
      { kind: 'number', key: 'idCatastro', labelKey: 'admin.fields.idCatastro' },
      { kind: 'link', key: 'idProvincia', labelKey: 'admin.fields.provincia', entity: 'provincias', relation: 'provincia' },
    ],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text', required: true, span: 'full' },
      { name: 'idCatastro', labelKey: 'admin.fields.idCatastro', type: 'number', required: true, step: '1', helpKey: 'admin.help.idCatastro' },
      {
        name: 'idProvincia',
        labelKey: 'admin.fields.provincia',
        type: 'fk',
        entity: 'provincias',
        relation: 'provincia',
        required: true,
      },
    ],
  },
};
