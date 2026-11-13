// Recorrido visual de la web en móvil, tablet y escritorio.
//
// Saca una captura de página completa de cada vista en los tamaños de pantalla
// más habituales de cada formato y compone una imagen por formato (vistas en
// filas, tamaños en columnas) para revisar de un vistazo cómo se adapta cada una.
//
// Requisitos: backend y `pnpm web:dev` arrancados, y una cuenta de administrador
// con parcelas, resultados y alguna organización con miembros (las vistas que
// dependen de datos que la cuenta no tiene se omiten y se avisa por consola).
//
//   SHOTS_EMAIL=… SHOTS_PASSWORD=… pnpm screenshots [opciones]
//
//   --format=mobile,tablet   solo esos formatos (mobile, tablet, desktop)
//   --view=parcelas,admin    solo las vistas cuyo id empiece por alguno de esos; el
//                            resto se conserva de la pasada anterior
//   --out=carpeta            carpeta de salida (por defecto utils/screenshots)
//
//   SHOTS_WEB_URL (http://localhost:5173) y SHOTS_API_URL (http://localhost:8000)
//   cambian dónde están la web y la API; con SHOTS_DEBUG=1 los fallos muestran el
//   registro completo de Playwright.
//
// Resultado: <out>/<formato>.png (el mosaico), <out>/<formato>/<tamaño>/<vista>.png
// (cada captura) y <out>/report.json, con los elementos que se salen por la derecha
// de la pantalla en cada captura (desbordamiento horizontal).

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Playwright ya es dependencia del backend (genera los informes en PDF)
const { chromium } = createRequire(join(ROOT, 'apps/server/package.json'))('playwright');

const WEB = process.env.SHOTS_WEB_URL ?? 'http://localhost:5173';
const API = process.env.SHOTS_API_URL ?? 'http://localhost:8000';

// Tamaños CSS (no píxeles físicos) más habituales de cada formato
const FORMATS = {
  mobile: {
    title: 'Móvil',
    columnWidth: 320,
    sizes: [
      { id: '360x800', label: 'Android', width: 360, height: 800 },
      { id: '390x844', label: 'iPhone 12–15', width: 390, height: 844 },
      { id: '430x932', label: 'iPhone Pro Max', width: 430, height: 932 },
    ],
  },
  tablet: {
    title: 'Tablet',
    columnWidth: 400,
    sizes: [
      { id: '768x1024', label: 'iPad vertical', width: 768, height: 1024 },
      { id: '820x1180', label: 'iPad Air vertical', width: 820, height: 1180 },
      { id: '1024x768', label: 'iPad horizontal', width: 1024, height: 768 },
    ],
  },
  desktop: {
    title: 'Escritorio',
    columnWidth: 560,
    sizes: [
      { id: '1366x768', label: 'Portátil', width: 1366, height: 768 },
      { id: '1536x864', label: 'Portátil con escalado', width: 1536, height: 864 },
      { id: '1920x1080', label: 'Full HD', width: 1920, height: 1080 },
    ],
  },
};

const isTouch = (format) => format !== 'desktop';

/**
 * Vistas del recorrido. `path` recibe los ids de ejemplo sacados de la API (y
 * devuelve `null` si la cuenta no tiene los datos); `prepare` deja la página en
 * el estado que se quiere capturar (un menú abierto, un resultado calculado) y
 * devuelve `false` si en ese tamaño no aplica
 */
const VIEWS = [
  { id: 'login', title: 'Inicio de sesión', path: () => '/auth/login', anonymous: true },
  { id: 'landing', title: 'Inicio', path: () => '/' },
  { id: 'nav-menu', title: 'Menú de navegación', path: () => '/parcelas', touchOnly: true, prepare: openNavMenu, viewportOnly: true },
  { id: 'notificaciones', title: 'Notificaciones', path: () => '/parcelas', prepare: openNotifications, viewportOnly: true },
  { id: 'parcelas', title: 'Parcelas · tarjetas', path: () => '/parcelas' },
  { id: 'parcelas-tabla', title: 'Parcelas · tabla', path: () => '/parcelas?vista=tabla' },
  { id: 'parcelas-mapa', title: 'Parcelas · mapa', path: () => '/parcelas?vista=mapa' },
  { id: 'parcela', title: 'Detalle de parcela', path: (d) => d.parcela && `/parcelas/${d.parcela}` },
  { id: 'resultado', title: 'Resultado de impacto', path: (d) => d.resultado && `/resultados/${d.resultado}` },
  { id: 'compare', title: 'Comparador', path: () => '/compare' },
  { id: 'compare-resultado', title: 'Comparador · resultado', path: () => '/compare', prepare: runComparison },
  { id: 'estadisticas', title: 'Estadísticas', path: () => '/estadisticas' },
  { id: 'organizaciones', title: 'Organizaciones', path: () => '/organizaciones' },
  { id: 'organizacion', title: 'Organización · miembros', path: (d) => d.organizacion && `/organizaciones/${d.organizacion}` },
  { id: 'organizacion-solicitar', title: 'Organización · solicitar', path: (d) => d.organizacion && `/organizaciones/${d.organizacion}?tab=solicitar` },
  { id: 'organizacion-ajustes', title: 'Organización · ajustes', path: (d) => d.organizacion && `/organizaciones/${d.organizacion}?tab=ajustes` },
  { id: 'miembro', title: 'Parcelas de un miembro', path: (d) => d.miembro && `/organizaciones/${d.organizacion}/miembros/${d.miembro}` },
  { id: 'admin', title: 'Administración · usuarios', path: () => '/admin' },
  { id: 'admin-cultivos', title: 'Administración · cultivos', path: () => '/admin?tab=cultivos' },
  { id: 'no-encontrada', title: 'Página no encontrada', path: () => '/no-existe' },
];

async function openNavMenu(page) {
  const button = page.getByRole('button', { name: 'Abrir menú' });
  // Desde lg la navegación ya está a la vista y no hay menú que abrir
  if (!(await button.isVisible())) return false;
  await button.click();
}

async function openNotifications(page) {
  await page.getByRole('navigation').getByRole('button', { name: /notificaci/i }).first().click();
}

/** Referencia: viñedos; objetivo: olivares. Así se ve la comparativa completa */
async function runComparison(page) {
  const cards = page.locator('div:has(> input[name="compare-filters"])');
  const fill = async (card, crop) => {
    // Por debajo de xl cada tarjeta de filtros es un plegable (con título visible):
    // se abre para rellenarla y se vuelve a plegar para que se vea el resultado.
    // El checkbox invisible que lo controla tapa el título, de ahí `force`
    const title = card.locator('.collapse-title');
    const collapsible = await title.isVisible();
    const apply = card.getByRole('button', { name: 'Aplicar filtros' });
    if (collapsible) {
      await title.click({ force: true });
      await apply.waitFor();
      await page.waitForTimeout(300); // animación del plegable
    }
    const target = card.getByRole('switch', { name: 'Objetivo' });
    if (await target.count()) await target.check();
    await card.getByRole('switch', { name: 'Tipo de cultivo' }).check();
    await card.getByRole('combobox', { name: 'Tipo de cultivo' }).selectOption({ label: crop });
    await apply.click();
    await page.waitForLoadState('networkidle');
    if (collapsible) await title.click({ force: true });
  };
  await fill(cards.first(), 'Viñedo');
  await fill(cards.last(), 'Olivo');
}

// ---------------------------------------------------------------------------

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = ''] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);
const list = (value) => (value ? value.split(',').map((v) => v.trim()).filter(Boolean) : undefined);
const formatIds = list(args.format) ?? Object.keys(FORMATS);
const viewFilter = list(args.view);
const OUT = resolve(args.out ?? join(ROOT, 'utils/screenshots'));

for (const id of formatIds) {
  if (!FORMATS[id]) throw new Error(`Formato desconocido: ${id} (usa ${Object.keys(FORMATS).join(', ')})`);
}

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

/** Ids de ejemplo para las vistas de detalle: lo primero que tenga datos */
async function sampleIds(token) {
  const ids = {};
  for (const parcela of (await api('/parcela', token)) ?? []) {
    const detalle = await api(`/parcela/${parcela.id}`, token);
    const cultivo = detalle?.cultivos?.find((c) => c.idResultadoImpacto);
    ids.parcela ??= parcela.id;
    if (cultivo) {
      ids.parcela = parcela.id;
      ids.resultado = cultivo.idResultadoImpacto;
      break;
    }
  }
  for (const org of (await api('/organizaciones', token))?.administradas ?? []) {
    const detalle = await api(`/organizaciones/${org.id}`, token);
    ids.organizacion ??= org.id;
    const miembro = detalle?.miembros?.[0]?.usuario?.id;
    if (miembro) {
      ids.organizacion = org.id;
      ids.miembro = miembro;
      break;
    }
  }
  return ids;
}

/** Elementos visibles que acaban más allá del borde derecho de la pantalla */
const findOverflow = () => {
  const width = document.documentElement.clientWidth;
  const clipped = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const { overflowX } = getComputedStyle(p);
      if (overflowX !== 'visible') return true;
    }
    return false;
  };
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 4).join('.') : '';
    const text = (el.innerText ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}${text ? ` «${text}»` : ''}`;
  };
  const offenders = [...document.body.querySelectorAll('*')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.right > width + 1 && !clipped(el);
  });
  // Solo los más externos: sus hijos desbordan por arrastre
  const outermost = offenders.filter((el) => !offenders.some((o) => o !== el && o.contains(el)));
  return {
    pageScrollsSideways: document.documentElement.scrollWidth > width + 1,
    elements: outermost.slice(0, 8).map((el) => `${describe(el)} (hasta ${Math.round(el.getBoundingClientRect().right)} px)`),
  };
};

async function settle(page) {
  await page.waitForLoadState('networkidle');
  // Esqueletos, gráficas y teselas del mapa terminan de pintarse después de la última petición
  await page.waitForTimeout(1200);
}

async function capture(browser, token, ids) {
  const report = {};
  for (const format of formatIds) {
    const { sizes } = FORMATS[format];
    report[format] = {};
    for (const size of sizes) {
      const dir = join(OUT, format, size.id);
      mkdirSync(dir, { recursive: true });
      const contexts = {};
      const contextFor = async (anonymous) => {
        const key = anonymous ? 'anon' : 'auth';
        if (!contexts[key]) {
          contexts[key] = await browser.newContext({
            viewport: { width: size.width, height: size.height },
            isMobile: isTouch(format),
            hasTouch: isTouch(format),
            locale: 'es-ES',
          });
          await contexts[key].addInitScript((t) => {
            localStorage.setItem('lca-compare-language', 'es');
            if (t) localStorage.setItem('token', t);
          }, anonymous ? null : token);
        }
        return contexts[key];
      };

      for (const view of VIEWS) {
        if (view.touchOnly && !isTouch(format)) continue;
        if (viewFilter && !viewFilter.some((v) => view.id.startsWith(v))) continue;
        const path = view.path(ids);
        if (!path) {
          if (size === sizes[0]) console.warn(`  · ${view.id}: la cuenta no tiene datos para esta vista, se omite`);
          continue;
        }
        const page = await (await contextFor(view.anonymous)).newPage();
        try {
          await page.goto(WEB + path);
          await settle(page);
          if (view.prepare) {
            if ((await view.prepare(page)) === false) continue;
            await settle(page);
          }
          const overflow = await page.evaluate(findOverflow);
          await page.screenshot({ path: join(dir, `${view.id}.png`), fullPage: !view.viewportOnly });
          report[format][view.id] ??= {};
          report[format][view.id][size.id] = overflow;
          const flag = overflow.pageScrollsSideways ? '  ⚠ scroll horizontal' : overflow.elements.length ? '  ⚠ desborda' : '';
          console.log(`  ${format} ${size.id} ${view.id}${flag}`);
        } catch (error) {
          console.warn(`  ✗ ${format} ${size.id} ${view.id}: ${error.message.split('\n').slice(0, process.env.SHOTS_DEBUG ? 15 : 1).join('\n')}`);
        } finally {
          await page.close();
        }
      }
      await Promise.all(Object.values(contexts).map((c) => c.close()));
    }
  }
  return report;
}

/**
 * Compone el mosaico de un formato en un canvas: vistas en filas y tamaños en
 * columnas, cada captura escalada al ancho de la columna. Se dibuja en canvas y
 * no con una captura de página porque el mosaico supera la altura que Chromium
 * puede capturar de una vez
 */
async function composeSheet(browser, format, report) {
  const { title, sizes, columnWidth } = FORMATS[format];
  const rows = VIEWS.filter((view) => report[view.id]).map((view) => ({
    title: view.title,
    id: view.id,
    cells: sizes.map((size) => {
      const file = join(OUT, format, size.id, `${view.id}.png`);
      const overflow = report[view.id][size.id];
      if (!overflow) return null;
      return {
        src: `data:image/png;base64,${readFileSync(file).toString('base64')}`,
        warn: overflow.pageScrollsSideways ? 'scroll horizontal' : overflow.elements.length ? 'desborda' : '',
      };
    }),
  }));
  if (!rows.length) return;

  const page = await browser.newPage();
  const dataUrl = await page.evaluate(
    async ({ title, sizes, columnWidth, rows }) => {
      const load = (src) => new Promise((ok, ko) => {
        const img = new Image();
        img.onload = () => ok(img);
        img.onerror = ko;
        img.src = src;
      });
      for (const row of rows) for (const cell of row.cells) if (cell) cell.img = await load(cell.src);

      const MAX = 32000; // límite de alto de un canvas en Chromium
      const LABEL = 220, GAP = 24, HEADER = 110, CAPTION = 28;
      const naturalHeight = (scale) => HEADER + rows.reduce((sum, row) => sum + CAPTION + GAP + Math.max(...row.cells.map((c) => (c ? c.img.height * scale(c) : 0))), 0);
      let factor = 1;
      const scaleOf = (cell) => (columnWidth * factor) / cell.img.width;
      while (naturalHeight(scaleOf) > MAX) factor *= 0.9;
      const col = Math.round(columnWidth * factor);

      const canvas = document.createElement('canvas');
      canvas.width = LABEL + sizes.length * (col + GAP) + GAP;
      canvas.height = Math.ceil(naturalHeight(scaleOf));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f1f5f4';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#0f2a2e';
      ctx.font = '600 28px system-ui, sans-serif';
      ctx.fillText(`${title} · ${new Date().toLocaleString('es-ES')}`, GAP, 24);
      ctx.font = '600 16px system-ui, sans-serif';
      sizes.forEach((size, i) => {
        const x = LABEL + i * (col + GAP);
        ctx.fillText(`${size.width}×${size.height}`, x, 70);
        ctx.font = '14px system-ui, sans-serif';
        ctx.fillStyle = '#4b5d60';
        ctx.fillText(size.label, x + ctx.measureText(`${size.width}×${size.height}`).width + 50, 72);
        ctx.font = '600 16px system-ui, sans-serif';
        ctx.fillStyle = '#0f2a2e';
      });

      let y = HEADER;
      for (const row of rows) {
        const height = Math.max(...row.cells.map((c) => (c ? c.img.height * scaleOf(c) : 0)));
        ctx.strokeStyle = '#c9d4d2';
        ctx.beginPath();
        ctx.moveTo(GAP, y - GAP / 2);
        ctx.lineTo(canvas.width - GAP, y - GAP / 2);
        ctx.stroke();
        ctx.fillStyle = '#0f2a2e';
        ctx.font = '600 16px system-ui, sans-serif';
        ctx.fillText(row.title, GAP, y + CAPTION);
        ctx.fillStyle = '#4b5d60';
        ctx.font = '13px ui-monospace, monospace';
        ctx.fillText(row.id, GAP, y + CAPTION + 24);
        row.cells.forEach((cell, i) => {
          const x = LABEL + i * (col + GAP);
          if (!cell) return;
          const h = cell.img.height * scaleOf(cell);
          ctx.drawImage(cell.img, x, y + CAPTION, col, h);
          ctx.strokeStyle = '#9fb1ae';
          ctx.strokeRect(x - 0.5, y + CAPTION - 0.5, col + 1, h + 1);
          if (cell.warn) {
            ctx.fillStyle = '#b91c1c';
            ctx.font = '600 13px system-ui, sans-serif';
            ctx.fillText(`⚠ ${cell.warn}`, x, y + 6);
          }
        });
        y += CAPTION + GAP + height;
      }
      return canvas.toDataURL('image/png');
    },
    { title, sizes, columnWidth, rows },
  );
  await page.close();
  const file = join(OUT, `${format}.png`);
  writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`Mosaico: ${relative(process.cwd(), file)}`);
}

const token = await login();
const ids = await sampleIds(token);
// Con --view solo se rehacen esas vistas: el resto de capturas del informe anterior se conservan
const reportFile = join(OUT, 'report.json');
const previous = viewFilter && existsSync(reportFile) ? JSON.parse(readFileSync(reportFile, 'utf8')) : {};
if (!viewFilter) for (const format of formatIds) rmSync(join(OUT, format), { recursive: true, force: true });
const browser = await chromium.launch();
try {
  const captured = await capture(browser, token, ids);
  const report = { ...previous };
  for (const [format, views] of Object.entries(captured)) report[format] = { ...previous[format], ...views };
  for (const format of formatIds) await composeSheet(browser, format, report[format]);
  writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
} finally {
  await browser.close();
}
