// Assembles poke-tools.user.js from the files in src/. Every module of the "tiers" group shares
// one scope (they were one file and call each other's functions), so their order matters for the
// top-level constants. The daily, the monitor and the dodge run in their own scopes. Each group
// runs only if it is turned on in the userscript manager's menu (src/settings.js).
import { readFile, rename, rm, writeFile } from 'node:fs/promises';

const OUTPUT = 'poke-tools.user.js';
const GROUPS = [
  { id: 'tiers', files: [
    'tiers/common.js', 'tiers/badges.js', 'market/filters.js', 'tiers/dialog.js', 'market/panel.js',
    'tiers/styles.js', 'market/state.js', 'market/tier-sort.js', 'tiers/observer.js',
  ] },
  { id: 'daily', files: ['daily.js'] },
  { id: 'monitor', files: ['data/dex.js', 'monitor.js'] },
  { id: 'dodge', files: ['dodge.js'] },
];

const read = file => readFile(new URL(`./src/${file}`, import.meta.url), 'utf8');
const indent = (text, by) => text.replace(/\s+$/, '').split('\n')
  .map(line => (line ? ' '.repeat(by) + line : line)).join('\n');
const section = async file => `// ==== src/${file} ====\n${(await read(file)).replace(/\s+$/, '')}`;

const meta = (await read('meta.js')).trim();
if (!meta.startsWith('// ==UserScript==') || !meta.endsWith('// ==/UserScript==')) {
  throw new Error('src/meta.js precisa ser só o cabeçalho do userscript.');
}

const parts = [await section('settings.js'), await section('data/guide.js')];
for (const { id, files } of GROUPS) {
  const body = (await Promise.all(files.map(section))).join('\n\n');
  parts.push(`if (moduleEnabled('${id}')) (() => {\n${indent(body, 2)}\n})();`);
}

const output = `${meta}

// Gerado por build-userscript.mjs a partir de src/. Não edite este arquivo: edite src/ e rode
// node build-userscript.mjs.
(() => {
  'use strict';

${indent(parts.join('\n\n'), 2)}
})();
`;

const target = new URL(`./${OUTPUT}`, import.meta.url);
const original = await readFile(target, 'utf8').catch(() => null);
if (original !== output) {
  const temporary = new URL(`./.${OUTPUT}.${process.pid}.tmp`, import.meta.url);
  try {
    await writeFile(temporary, output, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
}
const version = meta.match(/@version\s+(\S+)/)?.[1];
console.log(`${OUTPUT} v${version}: ${output.split('\n').length} linhas, ${Math.round(output.length / 1024)} KB.`);
