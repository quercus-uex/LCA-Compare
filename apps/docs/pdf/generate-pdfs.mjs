#!/usr/bin/env node

import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(docsRoot, '..', '..');
const buildRoot = path.join(docsRoot, 'build');
const outputRoot = scriptDir;
const tempRoot = path.join(tmpdir(), 'lca-capture-bridge-compare-doc-pdf');

for (const envPath of [path.join(repoRoot, '.env'), path.join(docsRoot, '.env')]) {
  if (!existsSync(envPath)) continue;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (key in process.env) continue;
    let value = rawValue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
  break;
}

const docs = [
  {category: 'intro', route: 'introduccion', id: 'introduccion'},
  {category: 'lcaCapture', route: 'lca-capture/introduccion', id: 'lca-capture-introduccion'},
  {category: 'lcaCapture', route: 'lca-capture/autenticacion', id: 'lca-capture-autenticacion'},
  {category: 'lcaCapture', route: 'lca-capture/caudalimetro', id: 'lca-capture-caudalimetro'},
  {category: 'lcaCapture', route: 'lca-capture/fertilizante', id: 'lca-capture-fertilizante'},
  {category: 'lcaCapture', route: 'lca-capture/tractor-parcela', id: 'lca-capture-tractor-parcela'},
  {category: 'lcaCapture', route: 'lca-capture/tractor-sector', id: 'lca-capture-tractor-sector'},
  {category: 'bridge', route: 'openlca-bridge/introduccion', id: 'bridge-introduccion'},
  {category: 'bridge', route: 'openlca-bridge/despliegue', id: 'bridge-despliegue'},
  {category: 'bridge', route: 'openlca-bridge/uso', id: 'bridge-uso'},
  {category: 'bridge', route: 'openlca-bridge/json-entrada', id: 'bridge-json-entrada'},
  {category: 'bridge', route: 'openlca-bridge/procesos', id: 'bridge-procesos'},
  {category: 'bridge', route: 'openlca-bridge/desarrollo', id: 'bridge-desarrollo'},
  {category: 'compare', route: 'acv-compare/introduccion', id: 'compare-introduccion'},
  {category: 'compare', route: 'acv-compare/despliegue', id: 'compare-despliegue'},
  {category: 'compare', route: 'acv-compare/uso', id: 'compare-uso'},
  {category: 'compare', route: 'acv-compare/desarrollo', id: 'compare-desarrollo'},
];

const redactedSecrets = buildRedactedSecrets();

const locales = {
  es: {
    htmlLang: 'es-ES',
    buildPrefix: '',
    output: 'documentacion-lca-capture-lca-bridge-lca-compare-es.pdf',
    title: 'LCA Capture / LCA Bridge / LCA Compare',
    subtitle: 'Documentación técnica de los servicios',
    scope: 'API de sensores, arquitectura, despliegue, uso, desarrollo y modelo operativo',
    toc: 'Índice',
    categories: {lcaCapture: 'LCA Capture', intro: 'Introducción', bridge: 'LCA Bridge', compare: 'LCA Compare'},
  },
  en: {
    htmlLang: 'en-US',
    buildPrefix: 'en',
    output: 'documentation-lca-capture-lca-bridge-lca-compare-en.pdf',
    title: 'LCA Capture / LCA Bridge / LCA Compare',
    subtitle: 'Technical service documentation',
    scope: 'Sensor API, architecture, deployment, usage, development, and operational model',
    toc: 'Table of Contents',
    categories: {lcaCapture: 'LCA Capture', intro: 'Introduction', bridge: 'LCA Bridge', compare: 'LCA Compare'},
  },
  pt: {
    htmlLang: 'pt-PT',
    buildPrefix: 'pt',
    output: 'documentacao-lca-capture-lca-bridge-lca-compare-pt.pdf',
    title: 'LCA Capture / LCA Bridge / LCA Compare',
    subtitle: 'Documentação técnica dos serviços',
    scope: 'API de sensores, arquitetura, implantação, utilização, desenvolvimento e modelo operacional',
    toc: 'Índice',
    categories: {lcaCapture: 'LCA Capture', intro: 'Introdução', bridge: 'LCA Bridge', compare: 'LCA Compare'},
  },
};

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function decodeEntities(value) {
  return value
    .replace(/&#x0*a;/gi, '\n')
    .replace(/&#10;/g, '\n')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'");
}

function buildRedactedSecrets() {
  const clientId = process.env.LCA_CAPTURE_CLIENT_ID;
  const clientSecret = process.env.LCA_CAPTURE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('LCA_CAPTURE_CLIENT_ID and LCA_CAPTURE_CLIENT_SECRET must be defined in the environment.');
  }

  return {
    'lca-capture-auth-credentials': `clientId: ${clientId}\nclientSecret: ${clientSecret}`,
    'lca-capture-auth-request': `POST https://monitoriza.dtagro.es/api/acv/auth\nContent-Type: application/json\n\n{\n  "clientId": "${clientId}",\n  "clientSecret": "${clientSecret}"\n}`,
  };
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
}

function localeBuildRoot(locale) {
  return locale.buildPrefix ? path.join(buildRoot, locale.buildPrefix) : buildRoot;
}

function imageFileUrl(locale, src) {
  if (!src.startsWith('/')) return src;

  const relativePath = src.slice(1);
  const localizedPath = path.join(localeBuildRoot(locale), relativePath);
  const defaultPath = path.join(buildRoot, relativePath);
  return pathToFileURL(existsSync(localizedPath) ? localizedPath : defaultPath).href;
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? '';
}

function extractBalancedDiv(html) {
  const opening = /<div\b[^>]*class=(?:"[^"]*\btheme-doc-markdown\b[^"]*\bmarkdown\b[^"]*"|'[^']*\btheme-doc-markdown\b[^']*\bmarkdown\b[^']*'|[^\s>]*\btheme-doc-markdown\b[^\s>]*)[^>]*>/i.exec(html);
  if (!opening) return null;

  const contentStart = opening.index + opening[0].length;
  const tagRegex = /<\/?div\b[^>]*>/gi;
  tagRegex.lastIndex = contentStart;

  let depth = 1;
  let match;
  while ((match = tagRegex.exec(html))) {
    if (match[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) return html.slice(contentStart, match.index);
    } else {
      depth += 1;
    }
  }

  return null;
}

function findMatchingDivEnd(html, openingTagEnd) {
  const tagRegex = /<\/?div\b[^>]*>/gi;
  tagRegex.lastIndex = openingTagEnd;

  let depth = 1;
  let match;
  while ((match = tagRegex.exec(html))) {
    if (match[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) return {innerEnd: match.index, outerEnd: tagRegex.lastIndex};
    } else {
      depth += 1;
    }
  }

  return null;
}

function transformAdmonitions(html) {
  const admonitionRegex = /<div\b[^>]*class=(?:"[^"]*\btheme-admonition\b[^"]*"|'[^']*\btheme-admonition\b[^']*'|[^\s>]*\btheme-admonition\b[^\s>]*)[^>]*>/i;
  let output = '';
  let remaining = html;
  let match;

  while ((match = admonitionRegex.exec(remaining))) {
    const openingTag = match[0];
    const openingEnd = match.index + openingTag.length;
    const bounds = findMatchingDivEnd(remaining, openingEnd);
    if (!bounds) break;

    const type = openingTag.match(/theme-admonition-([a-z-]+)/i)?.[1] ?? 'note';
    const inner = remaining.slice(openingEnd, bounds.innerEnd);
    const headingPattern = /<div\b[^>]*class=(?:"[^"]*admonitionHeading[^"]*"|'[^']*admonitionHeading[^']*'|[^\s>]*admonitionHeading[^\s>]*)[^>]*>(.*?)<\/div>/is;
    const contentPattern = /<div\b[^>]*class=(?:"[^"]*admonitionContent[^"]*"|'[^']*admonitionContent[^']*'|[^\s>]*admonitionContent[^\s>]*)[^>]*>(.*?)<\/div>/is;
    const headingMatch = inner.match(headingPattern);
    const contentMatch = inner.match(contentPattern);
    const title = stripTags((headingMatch?.[1] ?? type).replace(/<svg\b[^>]*>.*?<\/svg>/gis, '')).toUpperCase();
    const body = contentMatch?.[1]
      ?? inner.replace(headingPattern, '');

    output += remaining.slice(0, match.index);
    output += `<aside data-admonition="${type}"><p data-admonition-title>${escapeHtml(title)}</p><div data-admonition-body>${body}</div></aside>`;
    remaining = remaining.slice(bounds.outerEnd);
  }

  return output + remaining;
}

function revealRedactedSecrets(html) {
  return html.replace(/<pre\b([^>]*)\bdata-secret-id=(?:"([^"]*)"|'([^']*)'|([^\s>]+))([^>]*)>.*?<\/pre>/gis, (_match, before, doubleQuoted, singleQuoted, unquoted, after) => {
    const secretId = decodeEntities(doubleQuoted ?? singleQuoted ?? unquoted ?? '');
    const secret = redactedSecrets[secretId];
    if (!secret) return _match;

    const attributes = `${before}${after}`
      .replace(/\sdata-secret-id=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '')
      .replace(/\sclass=(?:"[^"]*\bredacted-secret\b[^"]*"|'[^']*\bredacted-secret\b[^']*'|[^\s>]*\bredacted-secret\b[^\s>]*)/i, '')
      .trim();
    const preAttributes = attributes ? ` ${attributes}` : '';
    return `<pre${preAttributes}><code>${escapeHtml(secret)}</code></pre>`;
  });
}

function cleanContent(html, locale) {
  return revealRedactedSecrets(transformAdmonitions(html))
    .replace(/<a\b(?=[^>]*\bclass=(?:"[^"]*\bhash-link\b[^"]*"|'[^']*\bhash-link\b[^']*'|[^\s>]*\bhash-link\b[^\s>]*))[^>]*>.*?<\/a>/gis, '')
    .replace(/<button\b[^>]*>.*?<\/button>/gis, '')
    .replace(/<svg\b[^>]*>.*?<\/svg>/gis, '')
    .replace(/<img\b[^>]*>/gi, (tag) => {
      const src = getAttribute(tag, 'src');
      const alt = getAttribute(tag, 'alt');
      const altAttribute = alt ? ` alt="${escapeHtml(decodeEntities(alt))}"` : '';
      return `<img src="${imageFileUrl(locale, src)}"${altAttribute}/>`;
    })
    .replace(/\shref=(?:"\/docs\/[^"]*"|'\/docs\/[^']*'|\/docs\/[^\s>]*)/gi, '')
    .replace(/\sclass=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\sstyle=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\saria-hidden=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\stabindex=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

function extractDoc(locale, doc) {
  const file = path.join(localeBuildRoot(locale), 'docs', doc.route, 'index.html');
  if (!existsSync(file)) throw new Error(`Missing built page: ${file}`);

  const rawContent = extractBalancedDiv(readFileSync(file, 'utf8'));
  if (!rawContent) throw new Error(`No markdown content found in ${file}`);

  const content = cleanContent(rawContent, locale);
  const title = stripTags(content.match(/<h1\b[^>]*>(.*?)<\/h1>/is)?.[1] ?? doc.route);
  return {title, html: content};
}

function buildHtml(locale) {
  let lastCategory = null;
  const sections = [];
  const tocItems = [];

  for (const doc of docs) {
    const extracted = extractDoc(locale, doc);
    if (lastCategory !== doc.category) {
      const categoryId = `section-${doc.category}`;
      sections.push(`<section class="part" id="${categoryId}"><h1>${escapeHtml(locale.categories[doc.category])}</h1></section>`);
      tocItems.push(`<li class="toc-section"><a href="#${categoryId}">${escapeHtml(locale.categories[doc.category])}</a></li>`);
      lastCategory = doc.category;
    }

    sections.push(`<section class="doc-section" id="${doc.id}">${extracted.html}</section>`);
    tocItems.push(`<li class="toc-item"><a href="#${doc.id}">${escapeHtml(extracted.title)}</a></li>`);
  }

  return `<!doctype html>
<html lang="${locale.htmlLang}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(locale.title)}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 18mm 22mm;
      @top-left { content: string(chapter); color: #607168; font-size: 8.5pt; }
      @bottom-right { content: counter(page); color: #607168; font-size: 8.5pt; }
    }
    @page cover { margin: 0; @top-left { content: none; } @bottom-right { content: none; } }
    @page toc { @top-left { content: none; } }
    * { box-sizing: border-box; }
    html { color: #17211b; font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif; font-size: 10.5pt; line-height: 1.55; }
    body { margin: 0; }
    .cover { page: cover; min-height: 297mm; padding: 36mm 30mm 26mm; color: white; background: linear-gradient(145deg, #0f3b2e 0%, #176243 54%, #c99a31 100%); page-break-after: always; }
    .cover-mark { width: 22mm; height: 22mm; margin-bottom: 34mm; border: 1.4mm solid rgba(255,255,255,.8); border-radius: 6mm; }
    .cover h1 { margin: 0; max-width: 150mm; font-size: 35pt; line-height: 1.04; letter-spacing: -.035em; }
    .cover h2 { margin: 6mm 0 0; max-width: 145mm; font-size: 18pt; font-weight: 500; color: #f8f1d2; }
    .cover p { margin: 15mm 0 0; max-width: 128mm; font-size: 12pt; color: rgba(255,255,255,.9); }
    .toc { page: toc; page-break-after: always; }
    .toc h1 { margin: 0 0 12mm; color: #0f3b2e; font-size: 25pt; }
    .toc ol { margin: 0; padding: 0; list-style: none; }
    .toc li { border-bottom: .2mm solid #dce7df; padding: 2.4mm 0; }
    .toc a { color: #17211b; text-decoration: none; }
    .toc a::after { content: leader('.') target-counter(attr(href), page); color: #607168; }
    .toc-section { font-weight: 700; background: #f7faf8; padding-left: 2mm !important; }
    .toc-item { padding-left: 7mm !important; }
    .part { min-height: 132mm; display: flex; align-items: center; page-break-before: always; page-break-after: always; border-left: 2mm solid #c99a31; padding-left: 12mm; }
    .part h1 { margin: 0; color: #0f3b2e; font-size: 34pt; letter-spacing: -.035em; }
    .doc-section { page-break-before: always; }
    .doc-section > h1:first-child { string-set: chapter content(); margin-top: 0; color: #0f3b2e; font-size: 25pt; line-height: 1.08; border-bottom: .6mm solid #c99a31; padding-bottom: 4mm; }
    h2 { margin: 9mm 0 3mm; color: #164734; font-size: 17pt; line-height: 1.2; page-break-after: avoid; }
    h3 { margin: 6mm 0 2mm; color: #2e5a45; font-size: 12.5pt; line-height: 1.25; page-break-after: avoid; }
    h4 { margin: 5mm 0 1.5mm; color: #2e5a45; font-size: 10.5pt; page-break-after: avoid; }
    p { margin: 0 0 3.2mm; }
    ul, ol { margin: 0 0 4mm 6mm; padding-left: 4mm; }
    li { margin: 1.2mm 0; }
    a { color: #176243; }
    code { font-family: "JetBrains Mono", "Fira Code", Consolas, monospace; font-size: 8.6pt; color: #0f3b2e; background: #edf5ef; border-radius: 1.2mm; padding: .3mm 1mm; }
    pre { white-space: pre-wrap; word-break: break-word; margin: 3mm 0 5mm; padding: 4mm; color: #22312a; background: #f5f7f5; border: .25mm solid #dce7df; border-left: 1.2mm solid #c99a31; border-radius: 2mm; font-family: "JetBrains Mono", "Fira Code", Consolas, monospace; font-size: 8.2pt; line-height: 1.42; page-break-inside: avoid; }
    pre code { display: block; padding: 0; background: transparent; color: inherit; font-size: inherit; }
    div { max-width: 100%; }
    table { width: 100%; margin: 4mm 0 5mm; border-collapse: collapse; font-size: 8.8pt; page-break-inside: avoid; }
    th { color: white; background: #176243; font-weight: 700; }
    th, td { border: .25mm solid #cfdcd4; padding: 2mm 2.4mm; vertical-align: top; }
    tr:nth-child(even) td { background: #f7faf8; }
    img { display: block; max-width: 165mm; max-height: 175mm; width: auto; height: auto; margin: 5mm auto; border-radius: 2mm; object-fit: contain; }
    aside[data-admonition] { margin: 5mm 0; padding: 3.5mm 4.5mm; border: .35mm solid #cfdcd4; border-left: 1.6mm solid #607168; border-radius: 2mm; background: #f7faf8; page-break-inside: avoid; }
    aside[data-admonition="tip"] { border-left-color: #178f58; background: #f0faf4; }
    aside[data-admonition="note"] { border-left-color: #4c7fb0; background: #f3f8fc; }
    aside[data-admonition="info"] { border-left-color: #4c7fb0; background: #f3f8fc; }
    aside[data-admonition="warning"] { border-left-color: #c99a31; background: #fff8e8; }
    aside[data-admonition="caution"] { border-left-color: #c99a31; background: #fff8e8; }
    aside[data-admonition="danger"] { border-left-color: #b64d4d; background: #fff2f2; }
    [data-admonition-title] { margin: 0 0 1.8mm; color: #0f3b2e; font-size: 8.5pt; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    [data-admonition-body] > :last-child { margin-bottom: 0; }
    blockquote { margin: 4mm 0; padding: 2mm 4mm; border-left: 1mm solid #c99a31; background: #f7faf8; color: #3f5148; }
    hr { border: 0; border-top: .4mm solid #dce7df; margin: 8mm 0; }
  </style>
</head>
<body>
  <section class="cover">
    <div class="cover-mark"></div>
    <h1>${escapeHtml(locale.title)}</h1>
    <h2>${escapeHtml(locale.subtitle)}</h2>
    <p>${escapeHtml(locale.scope)}</p>
  </section>
  <nav class="toc">
    <h1>${escapeHtml(locale.toc)}</h1>
    <ol>${tocItems.join('\n')}</ol>
  </nav>
  ${sections.join('\n')}
</body>
</html>`;
}

function assertPrerequisites() {
  if (!existsSync(buildRoot)) {
    throw new Error('Docusaurus build not found. Run `pnpm docs:build` from the repository root first.');
  }

  try {
    execFileSync('prince', ['--version'], {stdio: 'ignore'});
  } catch {
    throw new Error('Prince is required to generate the PDFs. Install it and rerun this script.');
  }
}

assertPrerequisites();
mkdirSync(outputRoot, {recursive: true});
mkdirSync(tempRoot, {recursive: true});

for (const locale of Object.values(locales)) {
  const htmlFile = path.join(tempRoot, `documentation-${locale.htmlLang}.html`);
  const pdfFile = path.join(outputRoot, locale.output);
  writeFileSync(htmlFile, buildHtml(locale), 'utf8');
  execFileSync('prince', [htmlFile, '-o', pdfFile], {stdio: 'inherit'});
  console.log(pdfFile);
}
