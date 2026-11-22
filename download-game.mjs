// Baixa uma cópia do cliente do pokeAFK (HTML, módulos JS e JSON de /assets/) para
// game-copy/, que fica fora do git (.gitignore). Serve para consultar o código e os dados
// do jogo sem baixar tudo de novo a cada pergunta. Rode de novo quando o jogo atualizar.
//
//   node download-game.mjs
//
// Só lê arquivos públicos do site; nada é executado. Os nomes dos módulos têm hash
// (main-CVi8lii0.js), então a pasta é apagada antes de cada download.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://pokeafk.io/';
const PAGES = ['https://pokeafk.io/', 'https://pokeafk.io/pokepedia/'];
const OUTPUT = fileURLToPath(new URL('./game-copy/', import.meta.url));

async function fetchText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${response.status} em ${url}`);
  return response.text();
}

// Caminho local espelhando o site: /assets/maps/world.json → game-copy/assets/maps/world.json;
// páginas terminadas em / viram index.html.
function localPath(url) {
  const path = decodeURIComponent(new URL(url).pathname);
  return OUTPUT + (path.endsWith('/') ? `${path}index.html` : path).replace(/^\//, '');
}

// Referências a outros arquivos do jogo: src/href no HTML, imports relativos ("./x.js")
// e caminhos absolutos de /assets/ (módulos e JSON carregados por fetch).
function references(text, base) {
  const found = [];
  for (const match of text.matchAll(/(?:src|href)="([^"]+\.(?:js|json))"/g)) found.push(match[1]);
  for (const match of text.matchAll(/["'`](\.{1,2}\/[\w./-]+\.js|\/assets\/[\w./-]+\.(?:js|json))["'`]/g)) found.push(match[1]);
  return found.map(reference => new URL(reference, base).href).filter(url => url.startsWith(SITE));
}

await rm(OUTPUT, { recursive: true, force: true });
const queue = [...PAGES];
const seen = new Set();
const files = [];
const failures = [];
while (queue.length) {
  const url = queue.shift();
  if (seen.has(url)) continue;
  seen.add(url);
  let text;
  try {
    text = await fetchText(url);
  } catch (error) {
    failures.push(error.message);
    continue;
  }
  const path = localPath(url);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text);
  files.push({ url, bytes: Buffer.byteLength(text) });
  queue.push(...references(text, url));
}

files.sort((a, b) => a.url.localeCompare(b.url));
await writeFile(OUTPUT + 'download.json', JSON.stringify({
  downloadedAt: new Date().toISOString(),
  files,
  failures,
}, null, 2) + '\n');
const megabytes = files.reduce((total, file) => total + file.bytes, 0) / 1e6;
console.log(`game-copy/: ${files.length} arquivos, ${megabytes.toFixed(1)} MB.`);
if (failures.length) console.log(`Falharam ${failures.length}:\n${failures.join('\n')}`);
