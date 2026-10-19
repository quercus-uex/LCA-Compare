/**
 * Generador de datos sintéticos para instancias demo. Es determinista (misma
 * semilla, mismos datos) y no accede a la base de datos ni a servicios
 * externos: los polígonos se generan alrededor de cada municipio en lugar de
 * consultarse a SIGPAC/Catastro, por lo que no corresponden a parcelas reales.
 */
import type { Polygon } from 'geojson';

export const DEMO_IMPACT_KEYS = [
  'impacto_fertilizantes',
  'impacto_manejo_cultivo',
  'impacto_pesticidas',
  'impacto_sistema_riego',
] as const;

type ComponentKey = (typeof DEMO_IMPACT_KEYS)[number];

// `type` y no `interface` para que sea asignable a los campos Json de Prisma
export type ImpactoItem = {
  category: string;
  amount: number;
  unit: string;
};

export type DemoResultado = Record<
  ComponentKey | 'impacto_total',
  ImpactoItem[]
>;

// Impacto por kg de producto de un tomate de regadío (ver
// examples/ingest_example.json); el resto de cultivos se escala a partir de él
const BASE_CATEGORIES: { category: string; unit: string }[] = [
  { category: 'Climate change', unit: 'kg CO2 eq' },
  { category: 'Acidification', unit: 'mol H+ eq' },
  { category: 'Eutrophication: freshwater', unit: 'kg P eq' },
  { category: 'Eutrophication: marine', unit: 'kg N eq' },
  { category: 'Eutrophication: terrestrial', unit: 'mol N eq' },
  { category: 'Water use', unit: 'm3 world eq' },
  { category: 'Land use', unit: 'Pt' },
  { category: 'Particulate matter formation', unit: 'disease inc.' },
  { category: 'Ecotoxicity: freshwater', unit: 'CTUe' },
  { category: 'Human toxicity: carcinogenic', unit: 'CTUh' },
  { category: 'Human toxicity: non-carcinogenic', unit: 'CTUh' },
];

const BASE_AMOUNTS: Record<ComponentKey, number[]> = {
  impacto_fertilizantes: [
    0.0412, 0.00031, 1.8e-5, 0.00026, 0.00135, 0.0021, 0.42, 2.1e-9, 0.185,
    3.2e-11, 5.4e-10,
  ],
  impacto_manejo_cultivo: [
    0.0285, 0.00014, 4.2e-6, 1.1e-5, 0.00024, 0.0034, 3.95, 1.3e-9, 0.094,
    1.9e-11, 2.8e-10,
  ],
  impacto_pesticidas: [
    0.0031, 1.2e-5, 6e-7, 1.5e-6, 1.9e-5, 0.0002, 0.03, 1.1e-10, 1.62, 4.1e-12,
    3.9e-10,
  ],
  impacto_sistema_riego: [
    0.0218, 9.5e-5, 7.9e-6, 6.4e-6, 0.00012, 2.86, 0.21, 6.8e-10, 0.137,
    2.6e-11, 3.1e-10,
  ],
};

interface CropProfile {
  tipo: string;
  /** kg/ha */
  rendimiento: number;
  /** m³/ha */
  agua: number;
  ciclo: number;
  /** Mes (1-12) y día de inicio de campaña */
  inicio: [number, number];
  /** Rango de superficie de la parcela en ha */
  superficie: [number, number];
  /** Multiplicador por kg respecto al tomate, por componente */
  factor: Record<ComponentKey, number>;
}

export const CROPS: Record<string, CropProfile> = {
  tomate: {
    tipo: 'Tomate',
    rendimiento: 90000,
    agua: 6000,
    ciclo: 143,
    inicio: [4, 15],
    superficie: [5, 20],
    factor: {
      impacto_fertilizantes: 1,
      impacto_manejo_cultivo: 1,
      impacto_pesticidas: 1,
      impacto_sistema_riego: 1,
    },
  },
  maiz: {
    tipo: 'Maíz',
    rendimiento: 12000,
    agua: 6500,
    ciclo: 150,
    inicio: [5, 1],
    superficie: [10, 40],
    factor: {
      impacto_fertilizantes: 6,
      impacto_manejo_cultivo: 5.25,
      impacto_pesticidas: 2.25,
      impacto_sistema_riego: 7.5,
    },
  },
  arroz: {
    tipo: 'Arroz',
    rendimiento: 8000,
    agua: 12000,
    ciclo: 140,
    inicio: [5, 10],
    superficie: [15, 50],
    factor: {
      impacto_fertilizantes: 6.75,
      impacto_manejo_cultivo: 10.1,
      impacto_pesticidas: 5.6,
      impacto_sistema_riego: 18,
    },
  },
  olivo: {
    tipo: 'Olivo',
    rendimiento: 6000,
    agua: 2500,
    ciclo: 240,
    inicio: [3, 1],
    superficie: [5, 30],
    factor: {
      impacto_fertilizantes: 5.25,
      impacto_manejo_cultivo: 7.5,
      impacto_pesticidas: 6,
      impacto_sistema_riego: 6,
    },
  },
  vinedo: {
    tipo: 'Viñedo',
    rendimiento: 9000,
    agua: 2000,
    ciclo: 210,
    inicio: [3, 15],
    superficie: [5, 25],
    factor: {
      impacto_fertilizantes: 3,
      impacto_manejo_cultivo: 6,
      impacto_pesticidas: 8,
      impacto_sistema_riego: 3.5,
    },
  },
  trigo: {
    tipo: 'Trigo',
    rendimiento: 4000,
    agua: 300,
    ciclo: 230,
    inicio: [11, 5],
    superficie: [20, 80],
    factor: {
      impacto_fertilizantes: 7.9,
      impacto_manejo_cultivo: 6.75,
      impacto_pesticidas: 6.75,
      impacto_sistema_riego: 0.7,
    },
  },
  almendro: {
    tipo: 'Almendro',
    rendimiento: 1500,
    agua: 4000,
    ciclo: 230,
    inicio: [2, 15],
    superficie: [5, 25],
    factor: {
      impacto_fertilizantes: 18,
      impacto_manejo_cultivo: 24,
      impacto_pesticidas: 18,
      impacto_sistema_riego: 30,
    },
  },
  cerezo: {
    tipo: 'Cerezo',
    rendimiento: 10000,
    agua: 4500,
    ciclo: 200,
    inicio: [3, 1],
    superficie: [2, 10],
    factor: {
      impacto_fertilizantes: 4.5,
      impacto_manejo_cultivo: 7.2,
      impacto_pesticidas: 8.1,
      impacto_sistema_riego: 5.4,
    },
  },
};

export interface DemoMunicipio {
  /** Código del país en `Pais.codigo` */
  pais: 'ES' | 'PT';
  /** `Provincia.idCatastro` y `Poblacion.idCatastro` de los datos iniciales */
  provincia: number;
  poblacion: number;
  nombre: string;
  lat: number;
  lon: number;
  cultivos: (keyof typeof CROPS)[];
}

export const MUNICIPIOS: DemoMunicipio[] = [
  {
    pais: 'ES',
    provincia: 6,
    poblacion: 44,
    nombre: 'Don Benito',
    lat: 38.956,
    lon: -5.861,
    cultivos: ['tomate', 'maiz'],
  },
  {
    pais: 'ES',
    provincia: 10,
    poblacion: 68,
    nombre: 'Coria',
    lat: 39.984,
    lon: -6.536,
    cultivos: ['maiz', 'tomate'],
  },
  {
    pais: 'ES',
    provincia: 6,
    poblacion: 11,
    nombre: 'Almendralejo',
    lat: 38.683,
    lon: -6.407,
    cultivos: ['vinedo', 'olivo'],
  },
  {
    pais: 'ES',
    provincia: 6,
    poblacion: 158,
    nombre: 'Zafra',
    lat: 38.425,
    lon: -6.417,
    cultivos: ['olivo', 'trigo'],
  },
  {
    pais: 'ES',
    provincia: 10,
    poblacion: 151,
    nombre: 'Plasencia',
    lat: 40.03,
    lon: -6.09,
    cultivos: ['cerezo'],
  },
  {
    pais: 'ES',
    provincia: 41,
    poblacion: 24,
    nombre: 'Carmona',
    lat: 37.471,
    lon: -5.642,
    cultivos: ['trigo', 'olivo'],
  },
  {
    pais: 'ES',
    provincia: 23,
    poblacion: 9,
    nombre: 'Baeza',
    lat: 37.993,
    lon: -3.471,
    cultivos: ['olivo'],
  },
  {
    pais: 'ES',
    provincia: 14,
    poblacion: 38,
    nombre: 'Lucena',
    lat: 37.409,
    lon: -4.485,
    cultivos: ['olivo'],
  },
  {
    pais: 'ES',
    provincia: 13,
    poblacion: 87,
    nombre: 'Valdepeñas',
    lat: 38.762,
    lon: -3.385,
    cultivos: ['vinedo'],
  },
  {
    pais: 'ES',
    provincia: 13,
    poblacion: 82,
    nombre: 'Tomelloso',
    lat: 39.159,
    lon: -3.022,
    cultivos: ['vinedo', 'trigo'],
  },
  {
    pais: 'ES',
    provincia: 31,
    poblacion: 232,
    nombre: 'Tudela',
    lat: 42.062,
    lon: -1.605,
    cultivos: ['maiz', 'tomate'],
  },
  {
    pais: 'ES',
    provincia: 4,
    poblacion: 104,
    nombre: 'El Ejido',
    lat: 36.776,
    lon: -2.815,
    cultivos: ['tomate'],
  },
  {
    pais: 'ES',
    provincia: 30,
    poblacion: 24,
    nombre: 'Lorca',
    lat: 37.677,
    lon: -1.701,
    cultivos: ['almendro'],
  },
  {
    pais: 'ES',
    provincia: 46,
    poblacion: 237,
    nombre: 'Sueca',
    lat: 39.202,
    lon: -0.311,
    cultivos: ['arroz'],
  },
  {
    pais: 'PT',
    provincia: 7,
    poblacion: 5,
    nombre: 'Évora',
    lat: 38.571,
    lon: -7.909,
    cultivos: ['olivo', 'vinedo'],
  },
  {
    pais: 'PT',
    provincia: 2,
    poblacion: 5,
    nombre: 'Beja',
    lat: 38.015,
    lon: -7.865,
    cultivos: ['olivo', 'almendro', 'trigo'],
  },
  {
    pais: 'PT',
    provincia: 2,
    poblacion: 13,
    nombre: 'Serpa',
    lat: 37.944,
    lon: -7.598,
    cultivos: ['olivo'],
  },
];

export interface DemoUsuarioSeed {
  nombre: string;
  apellidos: string;
  email: string;
  municipios: string[];
}

export const USUARIOS: DemoUsuarioSeed[] = [
  {
    nombre: 'María',
    apellidos: 'Sánchez Robles',
    email: 'maria.sanchez@example.com',
    municipios: ['Don Benito', 'Coria'],
  },
  {
    nombre: 'Antonio',
    apellidos: 'Gallego Pérez',
    email: 'antonio.gallego@example.com',
    municipios: ['Almendralejo', 'Zafra'],
  },
  {
    nombre: 'Lucía',
    apellidos: 'Fernández Ortega',
    email: 'lucia.fernandez@example.com',
    municipios: ['Plasencia', 'Carmona'],
  },
  {
    nombre: 'Javier',
    apellidos: 'Moreno Castillo',
    email: 'javier.moreno@example.com',
    municipios: ['Baeza', 'Lucena'],
  },
  {
    nombre: 'Carmen',
    apellidos: 'Ruiz Navarro',
    email: 'carmen.ruiz@example.com',
    municipios: ['Valdepeñas', 'Tomelloso'],
  },
  {
    nombre: 'Iñaki',
    apellidos: 'Etxeberria Goñi',
    email: 'inaki.etxeberria@example.com',
    municipios: ['Tudela'],
  },
  {
    nombre: 'Rosa',
    apellidos: 'Martínez López',
    email: 'rosa.martinez@example.com',
    municipios: ['El Ejido', 'Lorca', 'Sueca'],
  },
  {
    nombre: 'João',
    apellidos: 'Silva Pereira',
    email: 'joao.silva@example.com',
    municipios: ['Évora', 'Beja', 'Serpa'],
  },
];

export const PRIMER_ANIO = 2021;
export const ULTIMO_ANIO = 2025;

export interface DemoCultivo {
  tipo: string;
  fechaInicioCampania: Date;
  superficieCultivada: number;
  produccion: number;
  consumoAgua: number;
  ciclo: number;
  resultado: DemoResultado;
}

export interface DemoParcela {
  nombre: string;
  municipio: DemoMunicipio;
  esParcelaReferencia: boolean;
  geom: Polygon;
  cultivos: DemoCultivo[];
}

export interface DemoUsuario extends DemoUsuarioSeed {
  parcelas: DemoParcela[];
}

const PARAJES = [
  'La Vega',
  'El Cortijo',
  'Los Llanos',
  'La Dehesa',
  'El Pozo',
  'Las Huertas',
  'La Solana',
  'El Molino',
  'Los Arenales',
  'La Rivera',
];

const PARAJES_PT = [
  'Herdade do Monte',
  'Quinta da Ribeira',
  'Monte Novo',
  'Herdade da Serra',
  'Quinta do Vale',
];

/** mulberry32: PRNG pequeño y determinista */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    between: (min: number, max: number) => min + next() * (max - min),
    int: (min: number, max: number) =>
      Math.floor(min + next() * (max - min + 1)),
    pick: <T>(items: readonly T[]): T =>
      items[Math.floor(next() * items.length)],
  };
}

type Random = ReturnType<typeof createRandom>;

const precision = (value: number, digits = 3) =>
  Number(value.toPrecision(digits));

const round = (value: number, decimals = 2) =>
  Math.round(value * 10 ** decimals) / 10 ** decimals;

/**
 * Rectángulo girado de `hectareas` de superficie, situado a unos kilómetros
 * del centro del municipio.
 */
export function buildPolygon(
  random: Random,
  lat: number,
  lon: number,
  hectareas: number,
): Polygon {
  const metersPerDegLat = 111_320;
  const metersPerDegLon = 111_320 * Math.cos((lat * Math.PI) / 180);

  const distance = random.between(1500, 6000);
  const bearing = random.between(0, 2 * Math.PI);
  const centerLat = lat + (distance * Math.cos(bearing)) / metersPerDegLat;
  const centerLon = lon + (distance * Math.sin(bearing)) / metersPerDegLon;

  const area = hectareas * 10_000;
  const ratio = random.between(1, 2.2);
  const width = Math.sqrt(area / ratio);
  const length = width * ratio;
  const angle = random.between(0, Math.PI);

  const corners = [
    [-length / 2, -width / 2],
    [length / 2, -width / 2],
    [length / 2, width / 2],
    [-length / 2, width / 2],
  ].map(([x, y]) => {
    const dx = x * Math.cos(angle) - y * Math.sin(angle);
    const dy = x * Math.sin(angle) + y * Math.cos(angle);
    return [
      round(centerLon + dx / metersPerDegLon, 6),
      round(centerLat + dy / metersPerDegLat, 6),
    ];
  });

  return { type: 'Polygon', coordinates: [[...corners, corners[0]]] };
}

/**
 * Resultado de ACV por kg de producto. `eficiencia` > 1 empeora todos los
 * componentes; cada componente añade además un pequeño ruido propio.
 */
export function buildResultado(
  random: Random,
  crop: CropProfile,
  eficiencia: number,
): DemoResultado {
  const resultado = {} as DemoResultado;

  for (const key of DEMO_IMPACT_KEYS) {
    const componentNoise = random.between(0.95, 1.05);
    resultado[key] = BASE_CATEGORIES.map(({ category, unit }, i) => ({
      category,
      unit,
      amount: precision(
        BASE_AMOUNTS[key][i] * crop.factor[key] * eficiencia * componentNoise,
      ),
    }));
  }

  resultado.impacto_total = BASE_CATEGORIES.map(({ category, unit }, i) => ({
    category,
    unit,
    amount: precision(
      DEMO_IMPACT_KEYS.reduce((sum, key) => sum + resultado[key][i].amount, 0),
    ),
  }));

  return resultado;
}

/**
 * Genera usuarios con 2-3 parcelas por municipio y entre 3 y 5 campañas
 * consecutivas por parcela. Los impactos mejoran ligeramente año a año y la
 * primera parcela de cada tipo de cultivo se marca como parcela de referencia.
 */
export function generateDemoData(seed = 2025): DemoUsuario[] {
  const random = createRandom(seed);
  const municipios = new Map(MUNICIPIOS.map((m) => [m.nombre, m]));
  const tiposConReferencia = new Set<string>();

  return USUARIOS.map((usuario) => {
    const parcelas: DemoParcela[] = [];

    for (const nombreMunicipio of usuario.municipios) {
      const municipio = municipios.get(nombreMunicipio);
      if (!municipio) {
        throw new Error(`Municipio demo desconocido: ${nombreMunicipio}`);
      }
      const parajes = municipio.pais === 'PT' ? PARAJES_PT : PARAJES;
      const usados = new Set<string>();

      const numParcelas = random.int(2, 3);
      for (let p = 0; p < numParcelas; p++) {
        const crop = CROPS[municipio.cultivos[p % municipio.cultivos.length]];
        let paraje = random.pick(parajes);
        while (usados.has(paraje)) paraje = random.pick(parajes);
        usados.add(paraje);

        const hectareas = round(random.between(...crop.superficie), 1);
        // Cada parcela tiene un rendimiento ambiental propio y estable
        const eficienciaParcela = random.between(0.8, 1.25);
        const numCampanias = random.int(3, 5);
        const ultimoAnio = random.next() < 0.8 ? ULTIMO_ANIO : ULTIMO_ANIO - 1;
        const primerAnio = Math.max(PRIMER_ANIO, ultimoAnio - numCampanias + 1);

        const cultivos: DemoCultivo[] = [];
        for (let anio = primerAnio; anio <= ultimoAnio; anio++) {
          const rendimientoAnual = random.between(0.85, 1.15);
          const mejora = 1 - 0.03 * (anio - PRIMER_ANIO);
          const ruido = random.between(0.92, 1.08);
          const superficie = round(hectareas * random.between(0.85, 1));
          const [mes, dia] = crop.inicio;

          cultivos.push({
            tipo: crop.tipo,
            fechaInicioCampania: new Date(Date.UTC(anio, mes - 1, dia)),
            superficieCultivada: superficie,
            produccion: Math.round(
              superficie * crop.rendimiento * rendimientoAnual,
            ),
            consumoAgua: Math.round(
              superficie * crop.agua * random.between(0.9, 1.1),
            ),
            ciclo: crop.ciclo + random.int(-7, 7),
            resultado: buildResultado(
              random,
              crop,
              (eficienciaParcela * mejora * ruido) / rendimientoAnual,
            ),
          });
        }

        const esParcelaReferencia = !tiposConReferencia.has(crop.tipo);
        tiposConReferencia.add(crop.tipo);

        parcelas.push({
          nombre: `${municipio.nombre} - ${paraje}`,
          municipio,
          esParcelaReferencia,
          geom: buildPolygon(random, municipio.lat, municipio.lon, hectareas),
          cultivos,
        });
      }
    }

    return { ...usuario, parcelas };
  });
}
