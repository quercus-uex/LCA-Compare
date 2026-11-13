// Capturas de LCA Compare para la documentación (apps/docs/static/img/acv-compare/).
//
// Rehace cada imagen desde la aplicación en marcha, con el mismo encuadre: la vista
// completa, una parte de ella o un control resaltado con un recuadro rojo. También
// descarga un informe PDF real y convierte su primera página a PNG, y renderiza el
// esquema ER de utils/docs-er.html.
//
// Requisitos: backend y `pnpm web:dev` arrancados, una cuenta de administrador con
// parcelas y resultados (también como propietario: «Mis parcelas» muestra las suyas),
// y `pdftoppm` (poppler) para el informe.
//
//   SHOTS_EMAIL=… SHOTS_PASSWORD=… pnpm docs:screenshots [--only=parcela,informe]
//
//   SHOTS_WEB_URL (http://localhost:5173) y SHOTS_API_URL (http://localhost:8000)
//   cambian dónde están la web y la API.
//
// Revisa las imágenes antes de publicarlas: muestran los datos de la cuenta usada.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Playwright ya es dependencia del backend (genera los informes en PDF)
const { chromium } = createRequire(join(ROOT, 'apps/server/package.json'))('playwright');

const WEB = process.env.SHOTS_WEB_URL ?? 'http://localhost:5173';
const API = process.env.SHOTS_API_URL ?? 'http://localhost:8000';
const OUT = join(ROOT, 'apps/docs/static/img/acv-compare');

const DESKTOP = { width: 1280, height: 720 };
const WIDE = { width: 1440, height: 900 };

/**
 * Imágenes de la documentación. `path` recibe los ids de ejemplo; `prepare` deja la
 * página lista; `shoot` hace la captura (por defecto, la ventana)
 */
const SHOTS = [
  {
    id: 'mis_parcelas',
    path: () => '/estadisticas',
    viewport: DESKTOP,
    shoot: (page, file) => shootNav(page, file, 'Mis parcelas'),
  },
  { id: 'mis_parcelas_ruta', path: () => '/parcelas', viewport: DESKTOP },
  { id: 'parcela_ejemplo', path: (d) => d.parcela && `/parcelas/${d.parcela}`, viewport: DESKTOP },
  {
    id: 'acv_parcela',
    path: (d) => d.resultado && `/resultados/${d.resultado}`,
    viewport: DESKTOP,
    shoot: (page, file) => cardOf(page, 'Impactos por categoría').screenshot({ path: file }),
  },
  {
    id: 'boton_comparador',
    path: () => '/parcelas',
    viewport: DESKTOP,
    shoot: (page, file) => shootNav(page, file, 'Comparador'),
  },
  {
    id: 'ejemplo_comparativa_acv',
    path: () => '/compare',
    viewport: { width: 1440, height: 1000 },
    prepare: runComparison,
    shoot: async (page, file) => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: file });
    },
  },
  {
    id: 'boton_generar_informe',
    path: () => '/compare',
    viewport: WIDE,
    prepare: runComparison,
    shoot: (page, file) =>
      shootAround(page, file, page.getByRole('button', { name: 'Generar informe' }), { left: 0.6, right: 1.4, top: 0.6, bottom: 1.4 }),
  },
  {
    id: 'informe_acv',
    path: () => '/compare',
    viewport: WIDE,
    prepare: runComparison,
    shoot: shootReport,
  },
  { id: 'panel_admin', path: () => '/admin?tab=parcelas', viewport: { width: 1280, height: 640 } },
  // A 1,5x para que el texto de las tablas se lea nítido al escalar la imagen
  { id: 'esquema-er', scale: 1.5, shoot: shootErDiagram },
];

/** Referencia: viñedos; objetivo: olivares. Con ambos conjuntos se ve la comparativa completa */
async function runComparison(page) {
  const cards = page.locator('div:has(> input[name="compare-filters"])');
  const fill = async (card, crop) => {
    const target = card.getByRole('switch', { name: 'Objetivo' });
    if (await target.count()) await target.check();
    await card.getByRole('switch', { name: 'Tipo de cultivo' }).check();
    await card.getByRole('combobox', { name: 'Tipo de cultivo' }).selectOption({ label: crop });
    await card.getByRole('button', { name: 'Aplicar filtros' }).click();
    await page.waitForLoadState('networkidle');
  };
  await fill(cards.first(), 'Viñedo');
  await fill(cards.last(), 'Olivo');
}

const navLink = (page, name) => page.getByRole('navigation').getByRole('link', { name, exact: true }).first();

/** Tarjeta que contiene el encabezado indicado */
const cardOf = (page, heading) =>
  page.getByRole('heading', { name: heading }).locator('xpath=ancestor::*[contains(@class, "card")][1]');

/** Recuadro rojo alrededor de un control, como en el resto de capturas de la guía */
async function highlight(locator) {
  await locator.evaluate((el) => {
    el.style.outline = '3px solid #dc2626';
    el.style.outlineOffset = '3px';
    el.style.borderRadius = getComputedStyle(el).borderRadius || '0.5rem';
  });
}

/** Barra de navegación (de la marca al último enlace) con un enlace resaltado */
async function shootNav(page, file, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await highlight(navLink(page, name));
  const nav = await page.locator('nav').first().boundingBox();
  const last = await navLink(page, 'Organizaciones').boundingBox();
  if (!nav || !last) throw new Error('la barra de navegación no está visible');
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: last.x + last.width + 32, height: nav.y + nav.height + 16 } });
}

/** Captura el control resaltado con un margen proporcional a su tamaño en cada lado */
async function shootAround(page, file, locator, margin) {
  await highlight(locator);
  // `clip` va en coordenadas de la página y `boundingBox` en las de la ventana: sin desplazamiento coinciden
  await page.evaluate(() => window.scrollTo(0, 0));
  const box = await locator.boundingBox();
  if (!box) throw new Error('el control no está visible');
  const viewport = page.viewportSize();
  const x = Math.max(0, box.x - box.width * margin.left);
  const y = Math.max(0, box.y - box.height * margin.top);
  const right = Math.min(viewport.width, box.x + box.width * (1 + margin.right));
  const bottom = Math.min(viewport.height, box.y + box.height * (1 + margin.bottom));
  await page.screenshot({ path: file, clip: { x, y, width: right - x, height: bottom - y } });
}

/** Descarga el informe de la comparativa y convierte su primera página a PNG */
async function shootReport(page, file) {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 180_000 }),
    page.getByRole('button', { name: 'Generar informe' }).click(),
  ]);
  const dir = mkdtempSync(join(tmpdir(), 'lca-docs-report-'));
  try {
    const pdf = join(dir, 'informe.pdf');
    await download.saveAs(pdf);
    execFileSync('pdftoppm', ['-png', '-r', '80', '-f', '1', '-l', '1', '-singlefile', pdf, file.replace(/\.png$/, '')]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function shootErDiagram(page, file) {
  await page.setViewportSize({ width: 1800, height: 1400 });
  await page.goto(pathToFileURL(join(ROOT, 'utils/docs-er.html')).href);
  await page.locator('#canvas').screenshot({ path: file });
}

// ---------------------------------------------------------------------------

const only = process.argv.find((a) => a.startsWith('--only='))?.slice('--only='.length).split(',');

async function api(path, token) {
  const res = await fetch(API + path, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) return undefined;
  const body = await res.json();
  return body.data ?? body;
}

async function login() {
  const { SHOTS_EMAIL: email, SHOTS_PASSWORD: password } = process.env;
  if (!email || !password) throw new Error('Faltan SHOTS_EMAIL y SHOTS_PASSWORD (una cuenta de administrador)');
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`No se pudo iniciar sesión en ${API} (${res.status})`);
  const body = await res.json();
  return (body.data ?? body).accessToken;
}

/** Primera parcela propia con un resultado de impacto */
async function sampleIds(token) {
  for (const parcela of (await api('/parcela', token)) ?? []) {
    const cultivo = (await api(`/parcela/${parcela.id}`, token))?.cultivos?.find((c) => c.idResultadoImpacto);
    if (cultivo) return { parcela: parcela.id, resultado: cultivo.idResultadoImpacto };
  }
  return {};
}

const token = await login();
const ids = await sampleIds(token);
const browser = await chromium.launch();
let failed = 0;
try {
  for (const shot of SHOTS) {
    if (only && !only.includes(shot.id)) continue;
    const file = join(OUT, `${shot.id}.png`);
    const context = await browser.newContext({
      viewport: shot.viewport ?? DESKTOP,
      deviceScaleFactor: shot.scale ?? 1,
      locale: 'es-ES',
      acceptDownloads: true,
    });
    await context.addInitScript((t) => {
      localStorage.setItem('lca-compare-language', 'es');
      localStorage.setItem('token', t);
    }, token);
    const page = await context.newPage();
    try {
      if (shot.path) {
        const path = shot.path(ids);
        if (!path) {
          console.warn(`  · ${shot.id}: la cuenta no tiene parcelas con resultados, se omite`);
          continue;
        }
        await page.goto(WEB + path);
        await page.waitForLoadState('networkidle');
        if (shot.prepare) await shot.prepare(page);
        // Gráficas, mapas y esqueletos terminan de pintarse después de la última petición
        await page.waitForTimeout(1500);
      }
      await (shot.shoot ? shot.shoot(page, file) : page.screenshot({ path: file }));
      console.log(`  ${shot.id}.png`);
    } catch (error) {
      failed++;
      console.warn(`  ✗ ${shot.id}: ${error.message.split('\n')[0]}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (failed) process.exitCode = 1;
