// Generates tierlist.html: a standalone personal page with both tier lists (PvE and competitive).
// Two move sets: the original one (level-up moves + Celadon HMs) and a separate list that also counts
// the TMs (they only drop at random from the TM Box, so the original list leaves them out).
// Sprites load from pokeafk.io; each card links to the species page on the Poképédia.
// The "Golpes" tab lists every move of the game with the game's description and a ranking
// (moves-info.mjs); clicking a move anywhere on the page opens its details.
import { readFile, writeFile } from 'node:fs/promises';
import { buildGuide } from './rank-pokemon.mjs';
import { buildFarms, REGION_NAMES } from './farms.mjs';
import { describeMove, moveMetrics, moveTiers } from './moves-info.mjs';

const snapshot = JSON.parse(await readFile(new URL('./pokepedia-data.json', import.meta.url), 'utf8'));
const competitive = JSON.parse(await readFile(new URL('./competitive-data.json', import.meta.url), 'utf8'));
const guide = buildGuide(snapshot.species, { megaForms: snapshot.megaForms, competitive, machines: snapshot.hms ?? [] });
const tmGuide = buildGuide(snapshot.species, { megaForms: snapshot.megaForms, competitive,
  machines: [...(snapshot.hms ?? []), ...(snapshot.tms ?? [])], focusPunchFails: true });

const LEGENDARY = new Set([144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386]);
const byId = new Map(snapshot.species.map(species => [species.id, species]));
const hmNames = new Set((snapshot.hms ?? []).map(hm => hm.move.name));
const tmNames = new Set((snapshot.tms ?? []).map(tm => tm.move.name));

const entries = Object.values(guide.profiles).map(profile => {
  const dex = profile.baseId ?? profile.id;
  const key = byId.get(dex)?.key ?? String(dex);
  const mode = build => ({
    tier: build.tier, score: build.score, role: build.role, moves: build.moves,
    natures: build.natures, priority: build.priority, note: build.note,
    ...(build.smogon ? { gen3: build.smogon.tier, covered: build.smogon.covered, slots: build.smogon.slots } : {}),
  });
  return {
    id: String(profile.id), dex, name: profile.name, types: profile.types.map(type => type.toLowerCase()),
    stats: profile.stats, mega: Boolean(profile.isMega), legendary: LEGENDARY.has(dex),
    sprite: `https://pokeafk.io/assets/mon/front/${profile.id}.png`,
    wiki: `https://pokeafk.io/pokepedia/pokemon/${key}`,
    pve: mode(profile.pve), pvp: mode(profile.pvp),
    tm: { pve: mode(tmGuide.profiles[profile.id].pve), pvp: mode(tmGuide.profiles[profile.id].pvp) },
  };
});

const farms = buildFarms(snapshot, guide).map(line => ({
  ...line,
  sprite: `https://pokeafk.io/assets/mon/front/${line.dex}.png`,
  wiki: `https://pokeafk.io/pokepedia/pokemon/${byId.get(line.dex)?.key ?? line.dex}`,
  hunts: line.hunts.map(({ perHour, odds, ...hunt }) => ({ ...hunt, hours: Math.round(hunt.hours * 10) / 10 })),
}));
// Every move of the game once: level-up (how many species learn it), HM or TM.
const moveSources = new Map();
const addMove = (move, { species, machine }) => {
  const entry = moveSources.get(move.key) ?? { move, learn: new Set(), machine: null };
  if (species) entry.learn.add(species);
  if (machine) entry.machine = machine;
  moveSources.set(move.key, entry);
};
for (const species of snapshot.species) {
  for (const move of species.moves ?? []) {
    if (move.natural === false || (move.method && !['level', 'level-up'].includes(move.method))) continue;
    addMove(move, { species: species.id });
  }
}
for (const hm of snapshot.hms ?? []) addMove(hm.move, { machine: 'HM' });
for (const tm of snapshot.tms ?? []) addMove(tm.move, { machine: 'TM' });
const round = (value, digits = 2) => (Number.isFinite(value) ? Math.round(value * 10 ** digits) / 10 ** digits : null);
const moveRows = [...moveSources.values()].map(({ move, learn, machine }) => {
  const metrics = moveMetrics(move);
  return {
    name: move.name, type: move.type, category: move.category, power: move.power ?? null, hits: metrics.hits,
    accuracy: move.alwaysHits || !move.accuracy ? null : move.accuracy, cooldown: move.cooldown ?? null, cast: round(metrics.cast),
    shape: move.target, range: move.range ?? null, radius: move.radius ?? null, reach: metrics.reach,
    tiles: metrics.tiles, targets: round(metrics.targets), huntMult: round(metrics.huntMult), dodge: round(metrics.dodge),
    damage: metrics.damage ?? null, dps: round(metrics.dps, 1), hunt: metrics.hunt ?? null, pvp: metrics.pvp ?? null,
    kind: metrics.kind, fixed: metrics.fixed, variable: move.powerMode === 'variable',
    learn: learn.size, machine, desc: describeMove(move),
  };
});
// Hunt and PvP: tier letter by percentile and a note where 100 = the best move.
for (const field of ['hunt', 'pvp']) {
  const tierOf = moveTiers(moveRows, field);
  const top = Math.max(...moveRows.map(row => row[field] ?? 0));
  for (const row of moveRows) {
    row[field + 'Tier'] = tierOf(row[field]);
    row[field] = row[field] === null ? null : round(100 * row[field] / top, 1);
  }
}
moveRows.sort((a, b) => a.name.localeCompare(b.name, 'en'));

const data = {
  generated: new Date().toISOString().slice(0, 10), thresholds: guide.tierThresholds, tmThresholds: tmGuide.tierThresholds,
  hms: [...hmNames], tms: [...tmNames], entries, farms, moves: moveRows,
};

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tier list pokeAFK</title>
<style>
  :root {
    --bg: #eef3fb; --panel: #ffffff; --ink: #152964; --muted: #4c5d84; --line: #d4e0f2; --accent: #1958b8;
    --card: #f8fbff; --hm-bg: #e9f1ff; --hm-ink: #1d4f9c; --tm-bg: #e6f6ea; --tm-ink: #1f6b35;
    --S: #ff8a8a; --A: #ffbf7f; --B: #ffdf7f; --C: #bfe8a0; --D: #9fc6f5;
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f1625; --panel: #172238; --ink: #e5ecfa; --muted: #9fb0d0; --line: #2b3a57; --accent: #6ea2ff;
      --card: #1b2840; --hm-bg: #1f3358; --hm-ink: #b7cfff; --tm-bg: #1c3a2a; --tm-ink: #a9e2b8;
      --S: #d9605f; --A: #d08a4c; --B: #c9a945; --C: #6fa257; --D: #4f7fbf;
      color-scheme: dark;
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 14px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  header { position: sticky; top: 0; z-index: 5; background: var(--panel); border-bottom: 1px solid var(--line); }
  .bar { max-width: 1400px; margin: 0 auto; padding: 12px 16px; display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: center; }
  h1 { margin: 0; font-size: 18px; font-weight: 800; margin-right: auto; }
  h1 small { font-weight: 500; color: var(--muted); font-size: 12px; margin-left: 6px; }
  .seg { display: inline-flex; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
  .seg button { border: 0; background: transparent; color: inherit; font: inherit; font-weight: 700; padding: 8px 12px; cursor: pointer; min-height: 36px; }
  .seg button[aria-pressed="true"] { background: var(--accent); color: #fff; }
  select, input[type="search"] { font: inherit; color: inherit; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 7px 10px; min-height: 36px; }
  input[type="search"] { width: 200px; }
  .types { max-width: 1400px; margin: 0 auto; padding: 0 16px 12px; display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { border: 0; border-radius: 999px; padding: 3px 10px; font: inherit; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #fff; background: var(--t); cursor: pointer; opacity: .45; }
  .chip[aria-pressed="true"] { opacity: 1; box-shadow: 0 0 0 2px var(--panel), 0 0 0 4px var(--t); }
  main { max-width: 1400px; margin: 0 auto; padding: 16px; }
  .help { color: var(--muted); margin: 0 0 14px; max-width: 900px; }
  .row { display: grid; grid-template-columns: 84px 1fr; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: var(--panel); margin-bottom: 12px; }
  .label { background: var(--tier); color: #1b1b1b; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 8px; }
  .label b { font-size: 34px; line-height: 1; font-weight: 900; }
  .label span { font-size: 11px; font-weight: 700; opacity: .8; text-align: center; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px; padding: 10px; align-content: start; }
  .empty { padding: 18px; color: var(--muted); }
  .card { display: grid; grid-template-columns: 68px 1fr; gap: 4px 10px; padding: 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--card); color: inherit; text-decoration: none; min-width: 0; }
  a.card:hover, a.card:focus-visible, article.card:hover { border-color: var(--accent); outline: none; box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent); }
  .sprite { grid-row: span 3; width: 68px; height: 68px; image-rendering: pixelated; object-fit: contain; align-self: start; }
  .sprite img { display: block; width: 68px; height: 68px; image-rendering: pixelated; object-fit: contain; }
  a.name { color: inherit; text-decoration: none; }
  a.name:hover, a.name:focus-visible { text-decoration: underline; }
  .top { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
  .name { font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dex { color: var(--muted); font-size: 11px; }
  .score { margin-left: auto; font-weight: 800; font-variant-numeric: tabular-nums; }
  .tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .type { border-radius: 4px; padding: 0 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #fff; background: var(--t); }
  .tag { border-radius: 4px; padding: 0 6px; font-size: 10px; font-weight: 800; background: #ece6fb; color: #4d2d93; }
  .moves { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 3px; font-size: 12px; }
  .mv { font: inherit; color: inherit; text-align: left; border: 0; cursor: pointer; min-width: 0; padding: 2px 6px; border-radius: 5px; background: color-mix(in srgb, var(--line) 55%, transparent); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mv:hover { box-shadow: inset 0 0 0 1px var(--accent); }
  .mv:focus-visible, .sort:focus-visible, .x:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
  .mv.hm { background: var(--hm-bg); color: var(--hm-ink); font-weight: 700; }
  .mv.tm { background: var(--tm-bg); color: var(--tm-ink); font-weight: 700; }
  .mv.tm::after { content: " TM"; font-size: 9px; font-weight: 800; opacity: .75; }
  .tablewrap { border: 1px solid var(--line); border-radius: 12px; background: var(--panel); overflow-x: auto; }
  table.mvt { width: 100%; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
  .mvt th, .mvt td { padding: 6px 8px; text-align: right; white-space: nowrap; border-bottom: 1px solid var(--line); }
  .mvt th:first-child, .mvt td:first-child, .mvt th:last-child, .mvt td:last-child { text-align: left; }
  .mvt th { font-size: 11px; text-transform: uppercase; letter-spacing: .02em; color: var(--muted); }
  .mvt tbody tr:nth-child(even) { background: color-mix(in srgb, var(--line) 22%, transparent); }
  .sort { font: inherit; color: inherit; text-transform: inherit; letter-spacing: inherit; background: none; border: 0; padding: 4px 0; cursor: pointer; }
  .sort::after { content: " ↕"; opacity: .35; }
  th[aria-sort="ascending"] .sort, th[aria-sort="descending"] .sort { color: var(--accent); }
  th[aria-sort="ascending"] .sort::after { content: " ↑"; opacity: 1; }
  th[aria-sort="descending"] .sort::after { content: " ↓"; opacity: 1; }
  .mvt .mv { font-weight: 800; padding: 2px 6px; margin-right: 4px; }
  .mvt .cat { color: var(--muted); font-size: 11px; }
  .tier { display: inline-block; min-width: 1.6em; margin-right: 4px; padding: 0 4px; border-radius: 4px; text-align: center; font-weight: 900; color: #1b1b1b; background: var(--tier); }
  .muted { color: var(--muted); }
  dialog { width: min(560px, calc(100vw - 32px)); max-height: calc(100vh - 32px); padding: 0; border: 1px solid var(--line); border-radius: 12px; background: var(--panel); color: var(--ink); }
  dialog::backdrop { background: rgb(5 10 25 / .5); }
  .dlg-head { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid var(--line); }
  .dlg-head h2 { margin: 0 auto 0 0; font-size: 18px; }
  .x { font: inherit; font-size: 20px; line-height: 1; color: inherit; background: none; border: 1px solid var(--line); border-radius: 8px; min-width: 36px; min-height: 36px; cursor: pointer; }
  .dlg-body { padding: 12px 14px 16px; }
  .dlg-body p { margin: 0 0 12px; }
  .facts { display: grid; grid-template-columns: max-content 1fr; gap: 4px 14px; margin: 0 0 12px; font-size: 13px; }
  .facts dt { color: var(--muted); }
  .facts dd { margin: 0; font-variant-numeric: tabular-nums; }
  .users { font-size: 13px; }
  .users b { display: block; margin-top: 6px; }
  .was { border-radius: 4px; padding: 0 6px; font-size: 10px; font-weight: 800; color: #1b1b1b; background: var(--tier); }
  .notice { margin: 0 0 14px; padding: 8px 12px; max-width: 900px; border-radius: 8px; background: var(--tm-bg); color: var(--tm-ink); font-weight: 600; }
  .meta { grid-column: 1 / -1; font-size: 11.5px; color: var(--muted); }
  .meta b { color: var(--ink); }
  .evo { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 4px; font-size: 12px; }
  .evo span { padding: 2px 6px; border-radius: 5px; background: color-mix(in srgb, var(--line) 55%, transparent); }
  .evo b { display: inline-block; min-width: 1.4em; margin-left: 2px; padding: 0 4px; border-radius: 4px; text-align: center; color: #1b1b1b; background: var(--tier); font-weight: 900; }
  .farm-place { grid-column: 2; font-size: 12px; font-weight: 700; min-width: 0; }
  .price { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
  .price b { color: var(--ink); font-size: 13px; }
  .farm { grid-template-columns: 56px 1fr; }
  .farm .sprite { width: 56px; height: 56px; grid-row: span 2; }
  .farm .sprite img { width: 56px; height: 56px; }
  .hunts { grid-column: 1 / -1; display: grid; gap: 3px; margin: 2px 0 0; padding: 0; list-style: none; font-size: 12px; }
  .hunts li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0 8px; padding: 3px 6px; border-radius: 5px; background: color-mix(in srgb, var(--line) 45%, transparent); }
  .hunts li:first-child { box-shadow: inset 3px 0 0 var(--accent); }
  .hunts b { font-weight: 800; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hunts .rate { font-weight: 800; font-variant-numeric: tabular-nums; text-align: right; }
  .hunts small { grid-column: 1 / -1; color: var(--muted); font-size: 11px; font-variant-numeric: tabular-nums; }
  .hunts .all { color: var(--tm-ink); background: var(--tm-bg); border-radius: 4px; padding: 0 4px; font-weight: 700; }
  .more { grid-column: 1 / -1; font: inherit; font-size: 12px; font-weight: 700; color: var(--accent); background: none; border: 0; padding: 2px 0; text-align: left; cursor: pointer; }
  .more:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
  [hidden] { display: none !important; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  footer { color: var(--muted); font-size: 12px; padding: 4px 16px 24px; max-width: 1400px; margin: 0 auto; }
  @media (max-width: 760px) {
    .mvt thead { display: none; }
    .mvt, .mvt tbody, .mvt tr, .mvt td { display: block; }
    .mvt tr { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 12px; padding: 10px 12px; border-bottom: 1px solid var(--line); }
    .mvt td { padding: 0; border: 0; text-align: left; white-space: normal; }
    .mvt td::before { content: attr(data-label) " "; color: var(--muted); font-size: 11px; }
    .mvt td:first-child { grid-column: 1 / -1; margin-bottom: 4px; }
    .mvt td:first-child::before { content: none; }
  }
  @media (max-width: 600px) {
    header { position: static; }
    .row { grid-template-columns: 1fr; }
    .label { flex-direction: row; gap: 10px; justify-content: flex-start; padding: 6px 12px; }
    .label b { font-size: 24px; }
    input[type="search"] { width: 100%; }
  }
</style>
</head>
<body>
<header>
  <div class="bar">
    <h1>Tier list pokeAFK <small id="count"></small></h1>
    <div class="seg" role="group" aria-label="Lista">
      <button type="button" data-mode="pve" aria-pressed="true">PvE (caça)</button>
      <button type="button" data-mode="pvp" aria-pressed="false">Competitivo</button>
      <button type="button" data-mode="farm" aria-pressed="false">Farms de shiny</button>
      <button type="button" data-mode="moves" aria-pressed="false">Golpes</button>
    </div>
    <div class="seg" role="group" aria-label="Golpes considerados" id="moveset">
      <button type="button" data-moves="base" aria-pressed="true" title="Lista original: golpes por nível e HMs da Loja de Celadon">Sem TMs</button>
      <button type="button" data-moves="tm" aria-pressed="false" title="Lista à parte: também conta as TMs">Com TMs</button>
    </div>
    <select id="category" aria-label="Categoria">
      <option value="normal">Espécies normais</option>
      <option value="special">Lendários e Megas</option>
      <option value="all">Todas</option>
    </select>
    <select id="role" aria-label="Perfil">
      <option value="">Todos os perfis</option>
      <option value="physical">Físico</option>
      <option value="special">Especial</option>
      <option value="mixed">Misto</option>
      <option value="support">Suporte</option>
    </select>
    <select id="mvsort" aria-label="Ordenar golpes" hidden>
      <option value="hunt">Melhor para caçar</option>
      <option value="pvp">Melhor no PvP</option>
      <option value="tiles">Maior área</option>
      <option value="reach">Maior alcance</option>
      <option value="damage">Maior dano</option>
      <option value="dps">Maior DPS</option>
      <option value="name">Nome</option>
    </select>
    <select id="mvkind" aria-label="Categoria do golpe" hidden>
      <option value="">Todos os golpes</option>
      <option value="damage">Golpes de dano</option>
      <option value="physical">Físicos</option>
      <option value="special">Especiais</option>
      <option value="status">Status</option>
    </select>
    <select id="mvorigin" aria-label="Origem do golpe" hidden>
      <option value="">Qualquer origem</option>
      <option value="level">Por nível</option>
      <option value="HM">HM</option>
      <option value="TM">TM</option>
    </select>
    <select id="region" aria-label="Região" hidden>
      <option value="">Todas as regiões</option>
      ${Object.entries(REGION_NAMES).map(([id, name]) => `<option value="${id}">${name}</option>`).join('')}
    </select>
    <input type="search" id="search" placeholder="Buscar Pokémon" aria-label="Buscar">
  </div>
  <div class="types" id="types" aria-label="Filtrar por tipo"></div>
</header>
<main>
  <p class="notice" id="notice" hidden>Lista à parte, com as TMs: os movesets também contam as TMs que cada espécie aprende (em verde), que só saem ao acaso da TM Box. Notas e tiers são calculados só entre as builds com TMs; o selo "sem TMs" mostra a tier da lista original quando ela muda.</p>
  <p class="help" id="help"></p>
  <div id="rows"></div>
</main>
<dialog id="move-dialog" aria-labelledby="move-title">
  <div class="dlg-head"><h2 id="move-title"></h2><button type="button" class="x" data-close aria-label="Fechar">×</button></div>
  <div class="dlg-body" id="move-body"></div>
</dialog>
<footer>Gerado em ${data.generated} com dados da Poképédia e referências da Smogon (Gen 3). Sem TMs (lista original): golpes por nível da linha evolutiva e HMs da Loja de Celadon (em azul). Com TMs (lista à parte): também as TMs compatíveis (em verde). Uma HM ou TM só entra no moveset quando ganha mais de 3% do melhor golpe gratuito. Regras e dados do modelo na pasta referencia/ do repositório. Clique no nome de um Pokémon para abrir a página dele na Poképédia e num golpe para ver a descrição.</footer>
<script>
const DATA = ${JSON.stringify(data)};
const TYPE_COLORS = { normal: '#9a9a6e', fighting: '#c63129', flying: '#8e78e8', poison: '#a542a5', ground: '#d4ad4c', rock: '#a8922e', bug: '#93a51a', ghost: '#735a9c', steel: '#8f8fb3', fire: '#ef7a28', water: '#4f7fee', grass: '#5fb53c', electric: '#e7b800', psychic: '#f0507f', ice: '#5fc4c4', dragon: '#6a35f0', dark: '#6b5444' };
const TYPE_NAMES = { normal: 'Normal', fighting: 'Lutador', flying: 'Voador', poison: 'Venenoso', ground: 'Terrestre', rock: 'Pedra', bug: 'Inseto', ghost: 'Fantasma', steel: 'Aço', fire: 'Fogo', water: 'Água', grass: 'Planta', electric: 'Elétrico', psychic: 'Psíquico', ice: 'Gelo', dragon: 'Dragão', dark: 'Sombrio' };
const ROLES = { physical: 'Físico', special: 'Especial', mixed: 'Misto', support: 'Suporte' };
const STATS = { hp: 'HP', atk: 'Atq', def: 'Def', spa: 'Atq. Esp.', spd: 'Def. Esp.', spe: 'Vel' };
const HELP = {
  pve: 'Dano por segundo numa caça de 60 s, como o AUTO joga: golpe pronto mais forte, recargas e preparo, área pelo tamanho (quantos do bando de 3 cada forma alcança, 75% em cada) e reforços renovados quando acabam. Os golpes de dano seguem o ataque principal do Pokémon (Atq ou Atq. Esp.; com menos de 15% de diferença, os dois). Nota 100 = espécie normal com mais dano.',
  pvp: 'Duelos 1 contra 1 de até 180 s, sem troca, contra atacantes físico e especial de referência (80%): o Pokémon precisa ganhar sozinho. Golpe com preparo longo é desviado com mais facilidade, área grande quase não, e corpo a corpo e golpes que seguem o alvo sempre acertam. Atacar de longe afasta o atacante corpo a corpo, estágio de Velocidade (Agility, Dragon Dance) dobra a velocidade do passo e a esquiva, e quem prepara um golpe não desvia. Os golpes seguem o ataque principal. Somada a isso, a referência competitiva da Gen 3 ajustada ao que a espécie aprende (20%).',
  moves: 'Todos os golpes do jogo (por nível, HM e TM), com a descrição do próprio jogo: clique num golpe. Caça = poder por segundo × área (quantos do bando de 3 a forma alcança, 75% em cada). PvP = poder por segundo × chance de não ser desviado × alcance (de longe, o atacante corpo a corpo não chega). Poder por segundo = poder × acertos × precisão ÷ o maior entre 1,2 s, recarga e preparo. Nota 100 = o melhor golpe; as letras usam os cortes das espécies (S = 8% melhores). Não contam atributos nem mesmo tipo: servem para comparar golpes. Dano fixo e poder variável ficam sem nota.',
  farm: 'Para caçar shiny: cada linha evolutiva cuja evolução final é tier S ou A (PvE ou Competitivo), com as hunts de todas as regiões onde aparece algum Pokémon da linha. A fileira mostra a melhor tier entre as evoluções. Primeiro vêm as hunts com maior taxa de captura do shiny (menor preço de captura do shiny, pela tabela do jogo; os primeiros estágios são os mais baratos), depois as com mais shinies por hora e as de nível mais baixo. Todo selvagem tem 1 chance em 2.000 de ser shiny; em Outland, 1 em 1.000; em Nightmare todos são shiny. Horas por shiny supõem 270 selvagens por hora, a estimativa do MAPA, sem boosts.',
};
const PVP_NAME = { pve: 'PvE', pvp: 'Comp' };
const ON = { land: '', surf: 'Surf', old: 'Vara velha', good: 'Vara boa', super: 'Super vara' };
const REGIONS = ${JSON.stringify(REGION_NAMES)};
const money = new Intl.NumberFormat('pt-BR');
const HM = new Set(DATA.hms);
const TM = new Set(DATA.tms);
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const state = { mode: 'pve', moves: 'base', category: 'normal', role: '', query: '', types: new Set(), mvSort: 'hunt', mvDir: 'desc', mvKind: '', mvOrigin: '', region: '' };
try { Object.assign(state, JSON.parse(localStorage.getItem('pafk-tierlist') || '{}'), { types: new Set() }); } catch {}
if (!HELP[state.mode]) state.mode = 'pve';
if (state.moves !== 'tm') state.moves = 'base';
const buildOf = entry => (state.moves === 'tm' ? entry.tm : entry)[state.mode];
const save = () => {
  try {
    localStorage.setItem('pafk-tierlist', JSON.stringify({ mode: state.mode, moves: state.moves, category: state.category, role: state.role,
      mvSort: state.mvSort, mvDir: state.mvDir, mvKind: state.mvKind, mvOrigin: state.mvOrigin, region: state.region }));
  } catch {}
};
const MOVES = new Map(DATA.moves.map(move => [move.name, move]));
const SHAPES = { cone: 'Cone', circle: 'Círculo em volta', field: 'Campo em volta', area: 'Área no alvo', leap: 'Salto', beam: 'Feixe', projectile: 'Projétil', dash: 'Investida', melee: 'Corpo a corpo', homing: 'Segue o alvo', rampage: 'Fúria', self: 'No próprio', borrow: 'Usa outro golpe', trap: 'Armadilha' };
const CATEGORIES = { physical: 'Físico', special: 'Especial', status: 'Status' };
const KINDS = { boost: 'Reforço', debuff: 'Enfraquece o alvo', ailment: 'Estado no alvo', heal: 'Cura', protect: 'Proteção', weather: 'Clima', control: 'Controle', none: 'Sem efeito no jogo' };
const seconds = value => number.format(value) + ' s';
const percent = value => Math.round(value * 100) + '%';
// Shape and size in words: "Cone de 4 passos", "Área de raio 1 a até 6 passos"...
function shapeText(move) {
  const steps = value => value + (value === 1 ? ' passo' : ' passos');
  switch (move.shape) {
    case 'cone': return 'Cone de ' + steps(move.radius || move.range || 1) + ' à frente';
    case 'circle': case 'field': return (move.shape === 'field' ? 'Campo' : 'Círculo') + ' de raio ' + (move.radius || 1) + ' em volta do usuário';
    case 'area': return 'Área de raio ' + (move.radius || 1) + ' a até ' + steps(move.range || 1);
    case 'leap': return 'Salto de até ' + steps(move.range || 1) + ', área de raio ' + (move.radius || 1) + ' onde cai';
    case 'beam': return 'Feixe de ' + steps(move.range || 1) + ' em linha reta';
    case 'projectile': return 'Projétil até ' + steps(move.range || 1);
    case 'dash': return 'Investida de até ' + steps(move.range || 1);
    case 'homing': return 'Segue o alvo até ' + steps(move.range || 1);
    case 'melee': return 'Corpo a corpo';
    case 'rampage': return 'Fúria: vários golpes corpo a corpo seguidos';
    default: return SHAPES[move.shape] || move.shape;
  }
}
function damageText(move) {
  if (move.category === 'status') return '—';
  if (move.fixed) return 'fixo';
  if (move.variable || !move.power) return 'varia';
  return move.hits > 1 ? move.power + '×' + number.format(move.hits) : String(move.power);
}
function originText(move) {
  return [move.learn ? 'nível (' + move.learn + (move.learn === 1 ? ' espécie' : ' espécies') + ')' : '', move.machine || ''].filter(Boolean).join(' + ');
}
function tierBadge(tier, value, label) {
  const span = document.createElement('span');
  if (!tier) { span.className = 'muted'; span.textContent = '—'; return span; }
  const chip = document.createElement('span'); chip.className = 'tier'; chip.style.setProperty('--tier', 'var(--' + tier + ')');
  chip.textContent = tier; chip.title = label + ' ' + tier;
  span.append(chip, number.format(value));
  return span;
}
function moveButton(name, extraClass) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'mv' + (extraClass ? ' ' + extraClass : ''); button.dataset.move = name; button.textContent = name;
  const info = MOVES.get(name);
  button.title = name + (extraClass ? ' (' + extraClass.toUpperCase() + ')' : '') + (info && info.desc ? ': ' + info.desc : '') + ' Clique para ver os detalhes.';
  return button;
}

const dialog = document.getElementById('move-dialog');
function openMove(name) {
  const move = MOVES.get(name);
  if (!move) return;
  document.getElementById('move-title').textContent = move.name;
  const body = document.getElementById('move-body');
  body.replaceChildren();
  const tags = document.createElement('div'); tags.className = 'tags';
  const type = document.createElement('span'); type.className = 'type'; type.style.setProperty('--t', TYPE_COLORS[move.type] || '#888');
  type.textContent = TYPE_NAMES[move.type] || move.type;
  const category = document.createElement('span'); category.className = 'tag'; category.textContent = CATEGORIES[move.category] || move.category;
  tags.append(type, category);
  if (move.kind !== 'damage') { const kind = document.createElement('span'); kind.className = 'tag'; kind.textContent = KINDS[move.kind] || move.kind; tags.append(kind); }
  const desc = document.createElement('p');
  desc.textContent = move.desc || (move.category === 'status' ? shapeText(move) + '.' : 'Só causa dano, sem efeito extra.');
  tags.style.marginBottom = '10px';
  const facts = document.createElement('dl'); facts.className = 'facts';
  const fact = (label, value) => {
    if (value === null || value === undefined || value === '') return;
    const dt = document.createElement('dt'); dt.textContent = label;
    const dd = document.createElement('dd');
    if (value instanceof Node) dd.append(value); else dd.textContent = value;
    facts.append(dt, dd);
  };
  fact('Poder', damageText(move));
  fact('Precisão', move.accuracy ? move.accuracy + '%' : 'sempre acerta');
  fact('Recarga', move.cooldown ? seconds(move.cooldown) : null);
  fact('Preparo', move.cast ? seconds(move.cast) : 'sai na hora');
  fact('Forma', shapeText(move));
  if (move.category !== 'status') {
    fact('Área', move.tiles + (move.tiles === 1 ? ' quadrado' : ' quadrados') + ' · na caça acerta ' + number.format(move.targets) + ' do bando de 3 (dano total ' + percent(move.huntMult) + ')');
    fact('Desvio no PvP', move.dodge ? percent(move.dodge) + ' de chance de o alvo sair a tempo' : 'não dá para desviar');
    if (move.dps) fact('Poder por segundo', number.format(move.dps));
    fact('Para caçar', tierBadge(move.huntTier, move.hunt, 'Caça'));
    fact('No PvP', tierBadge(move.pvpTier, move.pvp, 'PvP'));
  }
  fact('Origem', originText(move));
  const users = document.createElement('div'); users.className = 'users';
  const list = state.moves === 'tm' ? 'tm' : 'base';
  for (const mode of ['pve', 'pvp']) {
    const names = DATA.entries.filter(entry => (list === 'tm' ? entry.tm : entry)[mode].moves.includes(move.name))
      .sort((a, b) => (list === 'tm' ? b.tm : b)[mode].score - (list === 'tm' ? a.tm : a)[mode].score).map(entry => entry.name);
    const title = document.createElement('b');
    title.textContent = 'Nos movesets recomendados ' + (mode === 'pve' ? 'de PvE' : 'do Competitivo') + (list === 'tm' ? ' (com TMs)' : ' (sem TMs)') + ': ' + names.length;
    const text = document.createElement('span'); text.className = 'muted';
    text.textContent = names.length ? names.slice(0, 12).join(', ') + (names.length > 12 ? ' e mais ' + (names.length - 12) : '') : 'nenhum';
    users.append(title, text);
  }
  body.append(tags, desc, facts, users);
  if (!dialog.open) dialog.showModal();
}
dialog.addEventListener('click', event => {
  if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
});
document.addEventListener('click', event => {
  const button = event.target.closest('[data-move]');
  if (button) openMove(button.dataset.move);
});

const typesBox = document.getElementById('types');
for (const [type, color] of Object.entries(TYPE_COLORS)) {
  const chip = document.createElement('button');
  chip.type = 'button'; chip.className = 'chip'; chip.style.setProperty('--t', color);
  chip.textContent = TYPE_NAMES[type]; chip.dataset.type = type; chip.setAttribute('aria-pressed', 'false');
  chip.addEventListener('click', () => {
    state.types.has(type) ? state.types.delete(type) : state.types.add(type);
    render();
  });
  typesBox.append(chip);
}
const key = text => text.normalize('NFD').replace(/\\p{Diacritic}/gu, '').toLowerCase();

function card(entry) {
  const build = buildOf(entry);
  const link = document.createElement('article');
  link.className = 'card';
  link.title = build.note;
  const pic = document.createElement('a');
  pic.className = 'sprite'; pic.href = entry.wiki; pic.target = '_blank'; pic.rel = 'noopener noreferrer'; pic.tabIndex = -1; pic.setAttribute('aria-hidden', 'true');
  const img = document.createElement('img');
  img.src = entry.sprite; img.alt = ''; img.loading = 'lazy'; img.width = 68; img.height = 68;
  pic.append(img);
  const top = document.createElement('div'); top.className = 'top';
  top.innerHTML = '<a class="name" target="_blank" rel="noopener noreferrer"></a><span class="dex"></span><span class="score"></span>';
  top.querySelector('.name').textContent = entry.name;
  top.querySelector('.name').href = entry.wiki;
  top.querySelector('.name').title = 'Abrir ' + entry.name + ' na Poképédia';
  top.querySelector('.dex').textContent = '#' + String(entry.dex).padStart(3, '0');
  top.querySelector('.score').textContent = number.format(build.score);
  const tags = document.createElement('div'); tags.className = 'tags';
  for (const type of entry.types) {
    const t = document.createElement('span'); t.className = 'type'; t.style.setProperty('--t', TYPE_COLORS[type] || '#888');
    t.textContent = TYPE_NAMES[type] || type; tags.append(t);
  }
  if (entry.mega || entry.legendary) {
    const t = document.createElement('span'); t.className = 'tag'; t.textContent = entry.mega ? 'Mega' : 'Lendário'; tags.append(t);
  }
  const original = entry[state.mode];
  if (state.moves === 'tm' && original.tier !== build.tier) {
    const t = document.createElement('span'); t.className = 'was'; t.style.setProperty('--tier', 'var(--' + original.tier + ')');
    t.textContent = 'sem TMs ' + original.tier;
    t.title = 'Na lista original (sem TMs): tier ' + original.tier + ', nota ' + number.format(original.score);
    tags.append(t);
  }
  const role = document.createElement('div'); role.className = 'tags';
  role.innerHTML = '<span class="dex"></span>';
  role.firstChild.textContent = (ROLES[build.role] || build.role) + (state.mode === 'pvp' && build.gen3 ? ' · Gen 3 ' + build.gen3 + (build.slots ? ' ' + build.covered + '/' + build.slots : '') : '');
  const moves = document.createElement('div'); moves.className = 'moves';
  for (const name of build.moves) {
    const machine = HM.has(name) ? 'hm' : state.moves === 'tm' && TM.has(name) ? 'tm' : '';
    moves.append(moveButton(name, machine));
  }
  const meta = document.createElement('div'); meta.className = 'meta';
  meta.innerHTML = 'Natureza <b></b> · IVs <b></b>';
  const [nature] = build.natures || [];
  meta.children[0].textContent = nature || '—';
  meta.children[1].textContent = (build.priority || []).map(stat => STATS[stat] || stat).join(' → ') || '—';
  link.append(pic, top, tags, role, moves, meta);
  return link;
}

// The "Golpes" tab: a sortable table (cards on narrow screens).
const MOVE_COLUMNS = [
  { key: 'name', label: 'Golpe', dir: 'asc' },
  { key: 'hunt', label: 'Caça', dir: 'desc' },
  { key: 'pvp', label: 'PvP', dir: 'desc' },
  { key: 'damage', label: 'Dano', dir: 'desc' },
  { key: 'dps', label: 'Poder/s', dir: 'desc' },
  { key: 'tiles', label: 'Área', dir: 'desc' },
  { key: 'reach', label: 'Alcance', dir: 'desc' },
  { key: 'cooldown', label: 'Recarga', dir: 'asc' },
  { key: 'cast', label: 'Preparo', dir: 'asc' },
  { key: 'dodge', label: 'Desvio PvP', dir: 'asc' },
  { key: 'origin', label: 'Origem', dir: null },
];
function moveCell(row, label, content) {
  const td = document.createElement('td'); td.dataset.label = label;
  if (content instanceof Node) td.append(content); else td.textContent = content;
  row.append(td);
}
function renderMoves() {
  const query = key(state.query.trim());
  const list = DATA.moves.filter(move => {
    if (state.types.size && !state.types.has(move.type)) return false;
    if (state.mvKind === 'damage' && move.category === 'status') return false;
    if (['physical', 'special', 'status'].includes(state.mvKind) && move.category !== state.mvKind) return false;
    if (state.mvOrigin === 'level' && !move.learn) return false;
    if ((state.mvOrigin === 'HM' || state.mvOrigin === 'TM') && move.machine !== state.mvOrigin) return false;
    return !query || key(move.name).includes(query) || key(move.desc).includes(query);
  });
  const sortKey = state.mvSort;
  const sign = state.mvDir === 'asc' ? 1 : -1;
  list.sort((a, b) => {
    if (sortKey === 'name') return sign * a.name.localeCompare(b.name, 'en');
    const x = a[sortKey], y = b[sortKey];
    const missingX = x === null || x === undefined, missingY = y === null || y === undefined;
    if (missingX !== missingY) return missingX ? 1 : -1;
    return (missingX ? 0 : sign * (x - y)) || a.name.localeCompare(b.name, 'en');
  });
  document.getElementById('count').textContent = list.length + ' golpes';
  const table = document.createElement('table'); table.className = 'mvt';
  const caption = document.createElement('caption'); caption.className = 'sr-only'; caption.textContent = 'Golpes do jogo';
  const head = document.createElement('thead'); const headRow = document.createElement('tr');
  for (const column of MOVE_COLUMNS) {
    const th = document.createElement('th'); th.scope = 'col';
    if (column.dir) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'sort'; button.textContent = column.label;
      button.addEventListener('click', () => {
        state.mvDir = state.mvSort === column.key ? (state.mvDir === 'asc' ? 'desc' : 'asc') : column.dir;
        state.mvSort = column.key;
        render();
      });
      if (state.mvSort === column.key) th.setAttribute('aria-sort', state.mvDir === 'asc' ? 'ascending' : 'descending');
      th.append(button);
    } else th.textContent = column.label;
    headRow.append(th);
  }
  head.append(headRow);
  const body = document.createElement('tbody');
  for (const move of list) {
    const row = document.createElement('tr');
    const name = document.createElement('span');
    const type = document.createElement('span'); type.className = 'type'; type.style.setProperty('--t', TYPE_COLORS[move.type] || '#888');
    type.textContent = TYPE_NAMES[move.type] || move.type;
    const cat = document.createElement('span'); cat.className = 'cat';
    cat.textContent = ' ' + (move.kind === 'damage' ? CATEGORIES[move.category] : KINDS[move.kind] || CATEGORIES[move.category]);
    name.append(moveButton(move.name, ''), type, cat);
    moveCell(row, '', name);
    moveCell(row, 'Caça', tierBadge(move.huntTier, move.hunt, 'Caça'));
    moveCell(row, 'PvP', tierBadge(move.pvpTier, move.pvp, 'PvP'));
    moveCell(row, 'Dano', damageText(move));
    moveCell(row, 'Poder/s', move.dps ? number.format(move.dps) : '—');
    moveCell(row, 'Área', move.category === 'status' ? '—' : move.tiles + (move.targets > 1 ? ' (' + number.format(move.targets) + ' na caça)' : ''));
    moveCell(row, 'Alcance', String(move.reach));
    moveCell(row, 'Recarga', move.cooldown ? seconds(move.cooldown) : '—');
    moveCell(row, 'Preparo', move.cast ? seconds(move.cast) : '—');
    moveCell(row, 'Desvio PvP', move.category === 'status' ? '—' : move.dodge ? percent(move.dodge) : '0%');
    moveCell(row, 'Origem', originText(move));
    body.append(row);
  }
  table.append(caption, head, body);
  const wrap = document.createElement('div'); wrap.className = 'tablewrap';
  if (list.length) wrap.append(table);
  else wrap.innerHTML = '<p class="empty">Nenhum golpe com esses filtros.</p>';
  document.getElementById('rows').replaceChildren(wrap);
}

const HUNTS_SHOWN = 4;
const openLines = new Set();
const huntName = hunt => hunt.place + (ON[hunt.on] ? ' · ' + ON[hunt.on] : '');

function huntItem(hunt) {
  const item = document.createElement('li');
  const place = document.createElement('b');
  place.textContent = hunt.name + ' · ' + huntName(hunt);
  const rate = document.createElement('span'); rate.className = 'rate';
  rate.textContent = hunt.shinyPrice ? '₽' + money.format(hunt.shinyPrice) : '';
  rate.title = 'Preço de captura do shiny (tabela do jogo): quanto menor, maior a chance de cada bola';
  const meta = document.createElement('small');
  const levels = hunt.levels[0] === hunt.levels[1] ? hunt.levels[0] : hunt.levels[0] + '–' + hunt.levels[1];
  meta.append(REGIONS[hunt.region] + ' · Nv. ' + levels
    + (hunt.badge ? ' · ' + hunt.badge + (hunt.badge === 1 ? ' insígnia' : ' insígnias') : '')
    + (hunt.share < 100 ? ' · ' + hunt.share + '% ' + (hunt.on === 'land' || hunt.on === 'surf' ? 'da hunt' : 'da pesca') : '') + ' · ');
  if (hunt.allShiny) {
    const all = document.createElement('span'); all.className = 'all'; all.textContent = 'todos shiny';
    meta.append(all);
  } else {
    meta.append('~' + number.format(hunt.hours) + ' h por shiny');
  }
  item.title = hunt.name + ' em ' + huntName(hunt) + ' (' + REGIONS[hunt.region] + ')';
  item.append(place, rate, meta);
  return item;
}

function farmCard(line, hunts) {
  const card = document.createElement('article');
  card.className = 'card farm';
  const link = document.createElement('a');
  link.className = 'sprite'; link.href = line.wiki; link.target = '_blank'; link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', line.name + ' na Poképédia');
  const img = document.createElement('img'); img.src = line.sprite; img.alt = ''; img.loading = 'lazy'; img.width = 56; img.height = 56;
  link.append(img);
  const top = document.createElement('div'); top.className = 'top';
  const name = document.createElement('a');
  name.className = 'name'; name.href = line.wiki; name.target = '_blank'; name.rel = 'noopener noreferrer';
  name.textContent = line.name;
  const dex = document.createElement('span'); dex.className = 'dex'; dex.textContent = '#' + String(line.dex).padStart(3, '0');
  top.append(name, dex);
  const evo = document.createElement('div'); evo.className = 'evo';
  for (const final of line.finals) {
    const item = document.createElement('span');
    item.append((final.id === line.dex ? '' : '→ ') + final.name);
    for (const mode of ['pve', 'pvp']) {
      const badge = document.createElement('b');
      badge.style.setProperty('--tier', 'var(--' + final[mode] + ')');
      badge.textContent = final[mode];
      badge.title = PVP_NAME[mode] + ' ' + final[mode];
      item.append(badge);
    }
    evo.append(item);
  }
  evo.style.gridColumn = '2';
  const list = document.createElement('ul'); list.className = 'hunts';
  const open = openLines.has(line.dex);
  list.append(...(open ? hunts : hunts.slice(0, HUNTS_SHOWN)).map(huntItem));
  card.append(link, top, evo, list);
  if (hunts.length > HUNTS_SHOWN) {
    const more = document.createElement('button');
    more.type = 'button'; more.className = 'more';
    const rest = hunts.length - HUNTS_SHOWN;
    more.textContent = open ? 'Mostrar menos' : 'Mais ' + rest + (rest === 1 ? ' hunt' : ' hunts');
    more.setAttribute('aria-expanded', String(open));
    more.addEventListener('click', () => {
      if (open) openLines.delete(line.dex); else openLines.add(line.dex);
      card.replaceWith(farmCard(line, hunts));
    });
    card.append(more);
  }
  return card;
}

function renderFarms() {
  const query = key(state.query.trim());
  const lines = [];
  let huntCount = 0;
  for (const line of DATA.farms) {
    if (state.types.size && !line.types.some(type => state.types.has(type))) continue;
    const named = !query || key(line.name).includes(query) || line.finals.some(final => key(final.name).includes(query));
    const hunts = line.hunts.filter(hunt => (!state.region || hunt.region === state.region)
      && (named || key(hunt.name).includes(query) || key(hunt.place).includes(query)));
    if (!hunts.length) continue;
    lines.push([line, hunts]);
    huntCount += hunts.length;
  }
  document.getElementById('count').textContent = lines.length + ' Pokémon · ' + huntCount + ' hunts';
  document.getElementById('rows').replaceChildren(...['S', 'A'].map(tier => {
    const row = document.createElement('section'); row.className = 'row'; row.setAttribute('aria-label', 'Evolução tier ' + tier);
    const label = document.createElement('div'); label.className = 'label'; label.style.setProperty('--tier', 'var(--' + tier + ')');
    label.innerHTML = '<b></b><span></span>';
    label.firstChild.textContent = tier;
    label.lastChild.textContent = 'evolui para ' + tier;
    const cards = document.createElement('div'); cards.className = 'cards';
    const members = lines.filter(([line]) => line.best === tier);
    if (members.length) cards.append(...members.map(([line, hunts]) => farmCard(line, hunts)));
    else cards.innerHTML = '<p class="empty">Nenhuma hunt com esses filtros.</p>';
    row.append(label, cards);
    return row;
  }));
}

function render() {
  for (const button of document.querySelectorAll('[data-mode]')) button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
  for (const button of document.querySelectorAll('[data-moves]')) button.setAttribute('aria-pressed', String(button.dataset.moves === state.moves));
  for (const chip of typesBox.children) chip.setAttribute('aria-pressed', String(state.types.has(chip.dataset.type)));
  document.getElementById('category').value = state.category;
  document.getElementById('role').value = state.role;
  document.getElementById('help').textContent = HELP[state.mode];
  const farm = state.mode === 'farm';
  const movesTab = state.mode === 'moves';
  document.getElementById('category').hidden = farm || movesTab;
  document.getElementById('role').hidden = farm || movesTab;
  document.getElementById('moveset').hidden = farm || movesTab;
  document.getElementById('notice').hidden = farm || movesTab || state.moves !== 'tm';
  for (const id of ['mvsort', 'mvkind', 'mvorigin']) document.getElementById(id).hidden = !movesTab;
  document.getElementById('region').hidden = !farm;
  document.getElementById('region').value = state.region;
  document.getElementById('mvsort').value = MOVE_COLUMNS.some(column => column.key === state.mvSort) && state.mvSort !== 'cooldown' && state.mvSort !== 'cast' && state.mvSort !== 'dodge' ? state.mvSort : '';
  document.getElementById('mvkind').value = state.mvKind;
  document.getElementById('mvorigin').value = state.mvOrigin;
  document.getElementById('search').placeholder = farm ? 'Buscar Pokémon ou lugar' : movesTab ? 'Buscar golpe ou efeito' : 'Buscar Pokémon';
  if (movesTab) {
    renderMoves();
    save();
    return;
  }
  if (farm) {
    renderFarms();
    save();
    return;
  }
  const query = key(state.query.trim());
  const list = DATA.entries.filter(entry => {
    const special = entry.mega || entry.legendary;
    if (state.category === 'normal' && special) return false;
    if (state.category === 'special' && !special) return false;
    if (state.role && buildOf(entry).role !== state.role) return false;
    if (state.types.size && !entry.types.some(type => state.types.has(type))) return false;
    return !query || key(entry.name).includes(query);
  }).sort((a, b) => buildOf(b).score - buildOf(a).score || a.name.localeCompare(b.name, 'pt-BR'));
  document.getElementById('count').textContent = list.length + ' Pokémon' + (state.moves === 'tm' ? ' · com TMs' : '');
  const thresholds = (state.moves === 'tm' ? DATA.tmThresholds : DATA.thresholds)[state.mode];
  const rows = document.getElementById('rows');
  rows.replaceChildren(...['S', 'A', 'B', 'C', 'D'].map(tier => {
    const row = document.createElement('section'); row.className = 'row'; row.setAttribute('aria-label', 'Tier ' + tier);
    const label = document.createElement('div'); label.className = 'label'; label.style.setProperty('--tier', 'var(--' + tier + ')');
    label.innerHTML = '<b></b><span></span>';
    label.firstChild.textContent = tier;
    label.lastChild.textContent = tier === 'D' ? 'abaixo de ' + number.format(thresholds.C) : 'nota ' + number.format(thresholds[tier]) + '+';
    const cards = document.createElement('div'); cards.className = 'cards';
    const members = list.filter(entry => buildOf(entry).tier === tier);
    if (members.length) cards.append(...members.map(card));
    else cards.innerHTML = '<p class="empty">Nenhum Pokémon com esses filtros.</p>';
    row.append(label, cards);
    return row;
  }));
  save();
}

for (const button of document.querySelectorAll('[data-mode]')) button.addEventListener('click', () => { state.mode = button.dataset.mode; render(); });
for (const button of document.querySelectorAll('[data-moves]')) button.addEventListener('click', () => { state.moves = button.dataset.moves; render(); });
document.getElementById('category').addEventListener('change', event => { state.category = event.target.value; render(); });
document.getElementById('role').addEventListener('change', event => { state.role = event.target.value; render(); });
document.getElementById('search').addEventListener('input', event => { state.query = event.target.value; render(); });
document.getElementById('mvsort').addEventListener('change', event => {
  state.mvSort = event.target.value;
  state.mvDir = (MOVE_COLUMNS.find(column => column.key === state.mvSort) || {}).dir || 'desc';
  render();
});
document.getElementById('mvkind').addEventListener('change', event => { state.mvKind = event.target.value; render(); });
document.getElementById('mvorigin').addEventListener('change', event => { state.mvOrigin = event.target.value; render(); });
document.getElementById('region').addEventListener('change', event => { state.region = event.target.value; render(); });
render();
</script>
</body>
</html>
`;

await writeFile(new URL('./tierlist.html', import.meta.url), html, 'utf8');
console.log(`tierlist.html gerado com ${entries.length} Pokémon (sem TMs e com TMs) e ${farms.length} linhas para shiny (${farms.reduce((sum, line) => sum + line.hunts.length, 0)} hunts).`);
