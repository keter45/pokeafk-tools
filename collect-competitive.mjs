// Collects Gen 3 (ADV) competitive references from Smogon and Pokémon Showdown into competitive-data.json.
// Older generations are only used when Smogon has no Gen 3 analysis for the species.
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const competitiveSources = {
  gen3Sets: 'https://data.pkmn.cc/sets/gen3.json',
  gen2Sets: 'https://data.pkmn.cc/sets/gen2.json',
  gen1Sets: 'https://data.pkmn.cc/sets/gen1.json',
  gen3Tiers: 'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods/gen3/formats-data.ts',
  gen3Random: 'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/random-battles/gen3/sets.json',
};

// Gen 3 spellings that differ from the names used by Smogon.
const MOVE_ALIASES = { highjumpkick: 'hijumpkick', feintattack: 'faintattack' };
const SPECIES_ALIASES = { 29: 'nidoranf', 32: 'nidoranm' };

export function normalizeName(name) {
  const key = String(name).toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  return MOVE_ALIASES[key] ?? key;
}

async function download(url, parse) {
  const response = await fetch(url, { headers: { 'user-agent': 'pokeafk-market-filtros data collector' } });
  if (!response.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${response.status}`);
  return parse === 'json' ? response.json() : response.text();
}

function parseTiers(source) {
  const tiers = {};
  for (const [, id, tier] of source.matchAll(/^\t(\w+): \{\s*\n\s*tier: "([^"]+)"/gm)) tiers[id] = tier;
  if (Object.keys(tiers).length < 300) throw new Error('A tabela de tiers da Gen 3 veio incompleta.');
  return tiers;
}

function collectSets(table, generation) {
  const byName = new Map();
  for (const [name, formats] of Object.entries(table)) {
    const sets = [];
    for (const [format, entries] of Object.entries(formats)) {
      for (const [label, set] of Object.entries(entries)) {
        if (!Array.isArray(set.moves) || !set.moves.length) continue;
        sets.push({
          generation, format, name: label,
          slots: set.moves.map(slot => [].concat(slot).map(normalizeName)),
          labels: set.moves.map(slot => [].concat(slot).join(' / ')),
        });
      }
    }
    if (sets.length) byName.set(normalizeName(name), sets);
  }
  return byName;
}

export async function collectCompetitive(gameSpecies) {
  const [gen3, gen2, gen1, tierSource, random] = await Promise.all([
    download(competitiveSources.gen3Sets, 'json'),
    download(competitiveSources.gen2Sets, 'json'),
    download(competitiveSources.gen1Sets, 'json'),
    download(competitiveSources.gen3Tiers, 'text'),
    download(competitiveSources.gen3Random, 'json'),
  ]);
  const tiers = parseTiers(tierSource);
  const setsByGeneration = [collectSets(gen3, 3), collectSets(gen2, 2), collectSets(gen1, 1)];

  const species = {};
  for (const { id, name } of gameSpecies) {
    const key = SPECIES_ALIASES[id] ?? normalizeName(name);
    const sets = setsByGeneration.map(table => table.get(key)).find(Boolean) ?? [];
    const randomEntry = random[key];
    const entry = {
      tier: tiers[key] ?? null,
      ...(randomEntry ? {
        randomLevel: randomEntry.level,
        randomMoves: [...new Set(randomEntry.sets.flatMap(set => set.movepool).map(normalizeName))],
      } : {}),
      sets,
    };
    if (entry.tier || entry.sets.length || entry.randomLevel) species[id] = entry;
  }
  return { sources: competitiveSources, collectedAt: new Date().toISOString().slice(0, 10), species };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const snapshot = JSON.parse(await readFile(new URL('./pokepedia-data.json', import.meta.url), 'utf8'));
  const result = await collectCompetitive(snapshot.species);
  const target = new URL('./competitive-data.json', import.meta.url);
  const temporary = new URL(`./.competitive-data.${process.pid}.tmp`, import.meta.url);
  const rows = Object.entries(result.species).map(([id, entry]) => `    ${JSON.stringify(id)}: ${JSON.stringify(entry)}`);
  const text = `{\n  "sources": ${JSON.stringify(result.sources)},\n  "collectedAt": ${JSON.stringify(result.collectedAt)},\n  "species": {\n${rows.join(',\n')}\n  }\n}\n`;
  try {
    await writeFile(temporary, text, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
  const withSets = Object.values(result.species).filter(entry => entry.sets.length).length;
  console.log(`${Object.keys(result.species).length} espécies com referência competitiva, ${withSets} com sets da Smogon.`);
}
