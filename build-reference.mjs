// Generates referencia/: the game data the ranking uses, categorised, so updating the tier list does
// not need a new search. Moves by shape (area, range, cooldown, cast), species by main attack stat
// and speed, and the model constants. referencia/mecanicas.md is written by hand (sources and rules).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import {
  MODEL, areaMultiplier, battleStats, dodgeChance, escapeTiles, gcdFor, huntTargets, mainStat, moveReach,
} from './rank-pokemon.mjs';

const root = new URL('./referencia/', import.meta.url);
const snapshot = JSON.parse(await readFile(new URL('./pokepedia-data.json', import.meta.url), 'utf8'));

const SHAPES = {
  cone: 'Cone (à frente do usuário)', circle: 'Círculo em volta do usuário', field: 'Campo em volta do usuário',
  area: 'Área no ponto mirado', leap: 'Salto (área onde cai)', beam: 'Feixe (linha reta)', projectile: 'Projétil',
  dash: 'Investida', melee: 'Corpo a corpo', homing: 'Segue o alvo', rampage: 'Fúria (vários golpes seguidos)',
  self: 'No próprio Pokémon', borrow: 'Usa outro golpe', trap: 'Armadilha',
};
const CATEGORY = { physical: 'Físico', special: 'Especial', status: 'Status' };
const MAIN = { physical: 'Físico (Atq)', special: 'Especial (Atq. Esp.)', mixed: 'Misto' };
const fmt = (value, digits = 1) => (value === null || value === undefined || Number.isNaN(value) ? '—'
  : Number(value).toLocaleString('pt-BR', { maximumFractionDigits: digits }));
const pct = value => (value ? `${Math.round(value * 100)}%` : '—');

// Every move once, with where it comes from.
const moves = new Map();
const add = (move, origin) => {
  const entry = moves.get(move.key) ?? { move, levelUp: new Set(), machines: new Set() };
  if (origin.species) entry.levelUp.add(origin.species);
  if (origin.machine) entry.machines.add(origin.machine);
  moves.set(move.key, entry);
};
for (const species of snapshot.species) {
  for (const move of species.moves ?? []) {
    if (move.natural === false || (move.method && !['level', 'level-up'].includes(move.method))) continue;
    add(move, { species: species.name });
  }
}
for (const machine of snapshot.hms ?? []) add(machine.move, { machine: 'HM' });
for (const machine of snapshot.tms ?? []) add(machine.move, { machine: 'TM' });

const moveRows = [...moves.values()].map(({ move, levelUp, machines }) => {
  const cast = (move.cast ?? 0) + (move.hitSpan ?? 0);
  const damaging = move.category !== 'status' && move.power > 1;
  const hits = move.hits ?? move.estimatedHits ?? 1;
  const targets = damaging ? huntTargets(move) : null;
  return {
    key: move.key, name: move.name, type: move.type, category: move.category, shape: move.target,
    power: move.power ?? null, hits, accuracy: move.accuracy ?? null, cooldown: move.cooldown ?? null, cast,
    range: move.range ?? null, radius: move.radius ?? null, reach: moveReach(move),
    huntTargets: targets && Math.round(targets * 100) / 100,
    huntDamage: targets && Math.round(areaMultiplier(targets) * 100) / 100,
    escapeTiles: escapeTiles(move), pvpDodge: Math.round(dodgeChance(move) * 100) / 100,
    // Power per second at the base interval (1.2 s): no stats, STAB or area, only for comparing.
    powerPerSecond: damaging ? Math.round(move.power * hits * (move.accuracy ? move.accuracy / 100 : 1)
      / Math.max(MODEL.GCD.base, move.cooldown ?? 0, cast) * 10) / 10 : null,
    effect: move.effect, levelUp: levelUp.size, machine: [...machines].join('/') || null,
  };
}).sort((a, b) => a.name.localeCompare(b.name, 'en'));

const speciesRows = [...snapshot.species, ...(snapshot.megaForms ?? [])].map(species => {
  const stats = battleStats(species.stats);
  return {
    id: species.id, name: species.name, types: species.types, base: species.stats,
    main: mainStat(species.stats), mega: Boolean(species.baseId), evolves: Boolean(species.evolutions?.length),
    total: Object.values(species.stats).reduce((sum, value) => sum + value, 0),
    interval: Math.round(gcdFor(stats.spe) * 100) / 100,
  };
});

// Markdown: moves grouped by shape.
const moveTable = rows => [
  '| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Origem |',
  '|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|',
  ...rows.map(row => `| ${row.name} | ${row.type} | ${CATEGORY[row.category] ?? row.category} | ${fmt(row.power, 0)}${row.hits > 1 ? `×${fmt(row.hits)}` : ''} `
    + `| ${row.accuracy ? row.accuracy + '%' : 'sempre'} | ${fmt(row.cooldown)} s | ${row.cast ? fmt(row.cast, 2) + ' s' : '—'} `
    + `| ${fmt(row.range, 0)} | ${fmt(row.radius, 0)} | ${fmt(row.huntTargets, 2)} | ${row.huntDamage ? fmt(row.huntDamage * 100, 0) + '%' : '—'} `
    + `| ${pct(row.pvpDodge)} | ${fmt(row.powerPerSecond)} | ${[row.levelUp ? `nível (${row.levelUp})` : '', row.machine ?? ''].filter(Boolean).join(' + ')} |`),
];
const golpes = [
  '# Golpes por forma',
  '',
  `Gerado por \`build-reference.mjs\` a partir de \`pokepedia-data.json\` (${moveRows.length} golpes de nível, HM e TM). Não edite à mão.`,
  '',
  '- **Recarga**: espera do próprio golpe. A espera real é o maior entre ela, o intervalo do Pokémon (pela Velocidade) e o preparo.',
  '- **Preparo**: tempo até o golpe sair (cast + duração dos acertos). Na caça só atrasa; no PvP dá tempo de desviar.',
  '- **Alcance / Raio**: em quadrados (1 passo = 1 quadrado).',
  '- **Alvos na caça**: quantos do bando de 3 a forma alcança, em média; **Dano na caça**: dano total em relação a um alvo (75% em cada com 2 ou mais).',
  '- **Desvio PvP**: chance estimada de o alvo sair da marca a tempo (só formas que marcam o chão; corpo a corpo e "segue o alvo" nunca).',
  '- **Poder/s**: poder × acertos × precisão ÷ max(1,2 s, recarga, preparo). Só para comparar golpes; não conta atributos, mesmo tipo nem área.',
  '- **Origem**: nível (quantas espécies aprendem), HM (Loja de Celadon) ou TM (TM Box; entra só na lista com TMs).',
  '',
];
const byShape = new Map();
for (const row of moveRows) {
  const list = byShape.get(row.shape) ?? [];
  list.push(row);
  byShape.set(row.shape, list);
}
const shapeOrder = Object.keys(SHAPES);
for (const shape of [...byShape.keys()].sort((a, b) => shapeOrder.indexOf(a) - shapeOrder.indexOf(b))) {
  const rows = byShape.get(shape).sort((a, b) => (b.powerPerSecond ?? -1) - (a.powerPerSecond ?? -1) || a.name.localeCompare(b.name, 'en'));
  golpes.push(`## ${SHAPES[shape] ?? shape} (${rows.length})`, '', ...moveTable(rows), '');
}

// Markdown: species grouped by main attack stat.
const especies = [
  '# Espécies por ataque principal',
  '',
  `Gerado por \`build-reference.mjs\`. Ataque principal pelos atributos base: Atq ou Atq. Esp. pelo menos ${Math.round((MODEL.MAIN_STAT_RATIO - 1) * 100)}% maior; abaixo disso, misto.`,
  'Os golpes de dano recomendados seguem o principal (o misto usa os dois). Intervalo = espera mínima entre golpes no nível 100, IV 31, natureza neutra.',
  'A Velocidade só muda o intervalo; o passo (267 ms) muda com estágio de Velocidade e paralisia (veja `mecanicas.md`).',
  '',
];
for (const main of ['physical', 'special', 'mixed']) {
  const rows = speciesRows.filter(row => row.main === main).sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10) || a.mega - b.mega);
  especies.push(`## ${MAIN[main]} (${rows.length})`, '',
    '| # | Espécie | Tipos | PS | Atq | Def | Atq. Esp. | Def. Esp. | Vel | Total | Intervalo | Evolui |',
    '|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|',
    ...rows.map(row => `| ${row.id} | ${row.name} | ${row.types.join('/')} | ${row.base.hp} | ${row.base.atk} | ${row.base.def} `
      + `| ${row.base.spa} | ${row.base.spd} | ${row.base.spe} | ${row.total} | ${fmt(row.interval, 2)} s | ${row.evolves ? 'sim' : '—'} |`),
    '');
}

// Constants of the model, so a change in rank-pokemon.mjs shows up here.
const constantes = [
  '# Constantes do ranking',
  '',
  'Gerado por `build-reference.mjs` a partir de `MODEL` em `rank-pokemon.mjs`. O que cada uma faz está em `mecanicas.md`.',
  '',
  '```json',
  JSON.stringify(MODEL, null, 2),
  '```',
  '',
];

await mkdir(root, { recursive: true });
await writeFile(new URL('golpes.md', root), golpes.join('\n'), 'utf8');
await writeFile(new URL('especies.md', root), especies.join('\n'), 'utf8');
await writeFile(new URL('constantes.md', root), constantes.join('\n'), 'utf8');
await writeFile(new URL('dados.json', root), JSON.stringify({
  source: snapshot.sourceUrl, catalogSha256: snapshot.sha256, model: MODEL, moves: moveRows, species: speciesRows,
}, null, 1) + '\n', 'utf8');
console.log(`referencia/: ${moveRows.length} golpes, ${speciesRows.length} espécies.`);
