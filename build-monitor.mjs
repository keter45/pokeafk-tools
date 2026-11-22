// Writes the species table of the account monitor (pokeafk-monitor.user.js): index = dex number,
// value = "Name:type" (first type, used for the portrait background). The monitor uses it to find
// the sprite of the wild Pokémon being hunted, which the HUD shows only by name.
import { readFile, rename, rm, writeFile } from 'node:fs/promises';

const start = '/* DEX_DATA_START */';
const end = '/* DEX_DATA_END */';
const scriptFile = new URL('./pokeafk-monitor.user.js', import.meta.url);
const snapshot = JSON.parse(await readFile(new URL('./pokepedia-data.json', import.meta.url), 'utf8'));

const table = [''];
for (const species of snapshot.species) table[species.id] = `${species.name}:${species.types[0]}`;
const payload = JSON.stringify([...table].map(entry => entry ?? ''));

const original = await readFile(scriptFile, 'utf8');
const from = original.indexOf(start);
const to = original.indexOf(end, from + start.length);
if (from < 0 || to < 0 || original.indexOf(start, from + start.length) >= 0) {
  throw new Error('Marcadores DEX_DATA ausentes ou duplicados no monitor.');
}
const compiled = `${original.slice(0, from + start.length)} ${payload} ${original.slice(to)}`;
if (compiled !== original) {
  const temporary = new URL(`./.pokeafk-monitor.${process.pid}.tmp`, import.meta.url);
  try {
    await writeFile(temporary, compiled, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, scriptFile);
  } finally {
    await rm(temporary, { force: true });
  }
}
console.log(`${table.length - 1} espécies no monitor.`);
