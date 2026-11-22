import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { buildGuide } from './rank-pokemon.mjs';

const dataFile = new URL('./pokepedia-data.json', import.meta.url);
const guideFile = new URL('./src/data/guide.js', import.meta.url);
const dexFile = new URL('./src/data/dex.js', import.meta.url);
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

// Species by dex number, "Name:firstType", for the account monitor (sprite of the wild Pokémon,
// which the HUD shows only by name).
const dex = [''];
for (const row of rows) dex[row.id] = `${row.name}:${row.types[0]}`;
const dexPayload = JSON.stringify([...dex].map(entry => entry ?? ''));

// The tables were laid out for a nested scope; the source files sit at the top level.
const guideText = `const MARKET_GUIDE = ${start} ${payload} ${end};`.replace(/\n {2}/g, '\n');
await writeAtomic(guideFile, '// Gerado por build-data.mjs a partir de pokepedia-data.json e competitive-data.json. Não edite à mão.\n'
  + `${guideText}\n`);
await writeAtomic(dexFile, '// Gerado por build-data.mjs: espécies por número da Pokédex, "Nome:tipo". Não edite à mão.\n'
  + `const DEX = /* DEX_DATA_START */ ${dexPayload} /* DEX_DATA_END */;\n`);

async function writeAtomic(file, text) {
  const original = await readFile(file, 'utf8').catch(() => null);
  if (original === text) return;
  const temporary = new URL(`${file.pathname.split('/').pop()}.${process.pid}.tmp`, file);
  try {
    await writeFile(temporary, text, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
}
console.log(`${Object.keys(species).length} espécies, ${profiles.length} perfis compilados.`);
console.log('Rode node build-userscript.mjs para montar poke-tools.user.js.');
