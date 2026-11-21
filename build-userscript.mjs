import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { buildGuide } from './rank-pokemon.mjs';

const dataFile = new URL('./pokepedia-data.json', import.meta.url);
const scriptFile = new URL('./pokeafk-market-filtros.user.js', import.meta.url);
const start = '/* GUIDE_DATA_START */';
const end = '/* GUIDE_DATA_END */';

const snapshot = JSON.parse(await readFile(dataFile, 'utf8'));
const rows = Array.isArray(snapshot) ? snapshot : snapshot.species;
if (!Array.isArray(rows) || rows.length === 0) {
  throw new Error('A Poképédia não forneceu espécies para compilar.');
}

// competitive-data.json comes from collect-competitive.mjs (Smogon/Showdown Gen 3 references).
const competitive = JSON.parse(await readFile(new URL('./competitive-data.json', import.meta.url), 'utf8'));
// HMs are sold at the Celadon Store, so they count; TMs only come from the random TM Box and do not.
const guide = buildGuide(rows, { megaForms: snapshot.megaForms ?? [], competitive, machines: snapshot.hms ?? [] });
const profiles = Object.values(guide.profiles);
if (profiles.length === 0
  || Object.values(guide.species).some(species => species.finals.some(id => !guide.profiles[id]))) {
  throw new Error('O guia precisa de perfis válidos para todas as evoluções finais que referencia.');
}

// Separate records so the Tampermonkey editor can display the embedded data efficiently.
function formatTable(table) {
  return '{\n' + Object.entries(table)
    .map(([id, entry]) => `      ${JSON.stringify(id)}: ${JSON.stringify(entry)}`)
    .join(',\n') + '\n    }';
}

// Keep only what the userscript reads; the notes already carry the DPS, duel and Smogon details.
const EMBEDDED = ['tier', 'score', 'role', 'priority', 'natures', 'moves', 'note'];
for (const profile of Object.values(guide.profiles)) {
  delete profile.unmeasured;
  for (const mode of ['pve', 'pvp']) {
    const build = profile[mode];
    const smogon = build.smogon;
    profile[mode] = Object.fromEntries(EMBEDDED.map(field => [field, build[field]]));
    if (smogon) {
      profile[mode].smogon = { tier: smogon.tier, ...(smogon.slots ? { covered: smogon.covered, slots: smogon.slots } : {}) };
    }
  }
}
const { species, profiles: profileTable, ...metadata } = guide;
// Types by dex ("fire" or "water/flying"), used by the daily to avoid trainers with a type edge.
const types = Object.fromEntries(rows.map(row => [row.id, row.types.join('/')]));
const fields = [
  ...Object.entries(metadata).map(([name, value]) => `${JSON.stringify(name)}: ${JSON.stringify(value)}`),
  `"types": ${JSON.stringify(types)}`,
  `"species": ${formatTable(species)}`,
  `"profiles": ${formatTable(profileTable)}`,
];
const payload = `{\n    ${fields.join(',\n    ')}\n  }`;

const original = await readFile(scriptFile, 'utf8');
const from = original.indexOf(start);
const to = original.indexOf(end, from + start.length);
if (from < 0 || to < 0 || original.indexOf(start, from + start.length) >= 0) {
  throw new Error('Marcadores da Poképédia ausentes ou duplicados no userscript.');
}

const compiled = original.slice(0, from + start.length) + ' ' + payload + ' ' + original.slice(to);
if (compiled !== original) {
  const temporary = new URL(`./.pokeafk-market-filtros.${process.pid}.tmp`, import.meta.url);
  try {
    await writeFile(temporary, compiled, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, scriptFile);
  } finally {
    await rm(temporary, { force: true });
  }
}
console.log(`${Object.keys(species).length} espécies, ${profiles.length} perfis compilados.`);
