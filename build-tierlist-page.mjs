// Generates tierlist.html: a standalone personal page with both tier lists (PvE and competitive).
// Sprites load from pokeafk.io; each card links to the species page on the Poképédia.
import { readFile, writeFile } from 'node:fs/promises';
import { buildGuide } from './rank-pokemon.mjs';

const snapshot = JSON.parse(await readFile(new URL('./pokepedia-data.json', import.meta.url), 'utf8'));
const competitive = JSON.parse(await readFile(new URL('./competitive-data.json', import.meta.url), 'utf8'));
const guide = buildGuide(snapshot.species, { megaForms: snapshot.megaForms, competitive, machines: snapshot.hms ?? [] });

const LEGENDARY = new Set([144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386]);
const byId = new Map(snapshot.species.map(species => [species.id, species]));
const hmNames = new Set((snapshot.hms ?? []).map(hm => hm.move.name));

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
  };
});

const data = { generated: new Date().toISOString().slice(0, 10), thresholds: guide.tierThresholds, hms: [...hmNames], entries };

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tier list pokeAFK</title>
<style>
  :root {
    --bg: #eef3fb; --panel: #ffffff; --ink: #152964; --muted: #4c5d84; --line: #d4e0f2; --accent: #1958b8;
    --card: #f8fbff; --hm-bg: #e9f1ff; --hm-ink: #1d4f9c;
    --S: #ff8a8a; --A: #ffbf7f; --B: #ffdf7f; --C: #bfe8a0; --D: #9fc6f5;
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f1625; --panel: #172238; --ink: #e5ecfa; --muted: #9fb0d0; --line: #2b3a57; --accent: #6ea2ff;
      --card: #1b2840; --hm-bg: #1f3358; --hm-ink: #b7cfff;
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
  a.card { display: grid; grid-template-columns: 68px 1fr; gap: 4px 10px; padding: 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--card); color: inherit; text-decoration: none; min-width: 0; }
  a.card:hover, a.card:focus-visible { border-color: var(--accent); outline: none; box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent); }
  .sprite { grid-row: span 3; width: 68px; height: 68px; image-rendering: pixelated; object-fit: contain; align-self: start; }
  .top { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
  .name { font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dex { color: var(--muted); font-size: 11px; }
  .score { margin-left: auto; font-weight: 800; font-variant-numeric: tabular-nums; }
  .tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .type { border-radius: 4px; padding: 0 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #fff; background: var(--t); }
  .tag { border-radius: 4px; padding: 0 6px; font-size: 10px; font-weight: 800; background: #ece6fb; color: #4d2d93; }
  .moves { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 3px; font-size: 12px; }
  .moves span { padding: 2px 6px; border-radius: 5px; background: color-mix(in srgb, var(--line) 55%, transparent); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .moves span.hm { background: var(--hm-bg); color: var(--hm-ink); font-weight: 700; }
  .meta { grid-column: 1 / -1; font-size: 11.5px; color: var(--muted); }
  .meta b { color: var(--ink); }
  footer { color: var(--muted); font-size: 12px; padding: 4px 16px 24px; max-width: 1400px; margin: 0 auto; }
  @media (max-width: 600px) {
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
    <input type="search" id="search" placeholder="Buscar Pokémon" aria-label="Buscar Pokémon">
  </div>
  <div class="types" id="types" aria-label="Filtrar por tipo"></div>
</header>
<main>
  <p class="help" id="help"></p>
  <div id="rows"></div>
</main>
<footer>Gerado em ${data.generated} com dados da Poképédia e referências da Smogon (Gen 3). Golpes por nível da linha evolutiva e HMs da Loja de Celadon (destacadas em azul); TMs ficam de fora. Clique num Pokémon para abrir a página dele na Poképédia.</footer>
<script>
const DATA = ${JSON.stringify(data)};
const TYPE_COLORS = { normal: '#9a9a6e', fighting: '#c63129', flying: '#8e78e8', poison: '#a542a5', ground: '#d4ad4c', rock: '#a8922e', bug: '#93a51a', ghost: '#735a9c', steel: '#8f8fb3', fire: '#ef7a28', water: '#4f7fee', grass: '#5fb53c', electric: '#e7b800', psychic: '#f0507f', ice: '#5fc4c4', dragon: '#6a35f0', dark: '#6b5444' };
const TYPE_NAMES = { normal: 'Normal', fighting: 'Lutador', flying: 'Voador', poison: 'Venenoso', ground: 'Terrestre', rock: 'Pedra', bug: 'Inseto', ghost: 'Fantasma', steel: 'Aço', fire: 'Fogo', water: 'Água', grass: 'Planta', electric: 'Elétrico', psychic: 'Psíquico', ice: 'Gelo', dragon: 'Dragão', dark: 'Sombrio' };
const ROLES = { physical: 'Físico', special: 'Especial', mixed: 'Misto', support: 'Suporte' };
const STATS = { hp: 'HP', atk: 'Atq', def: 'Def', spa: 'Atq. Esp.', spd: 'Def. Esp.', spe: 'Vel' };
const HELP = {
  pve: 'Dano por segundo numa caça de 60 s, como o AUTO joga: golpe pronto mais forte, área em bandos e reforços renovados quando acabam. Nota 100 = espécie normal com mais dano.',
  pvp: 'Duelos de até 180 s contra atacantes físico e especial de referência (70%) mais a referência competitiva da Gen 3 ajustada ao que a espécie aprende (30%).',
};
const HM = new Set(DATA.hms);
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const state = { mode: 'pve', category: 'normal', role: '', query: '', types: new Set() };
try { Object.assign(state, JSON.parse(localStorage.getItem('pafk-tierlist') || '{}'), { types: new Set() }); } catch {}

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
  const build = entry[state.mode];
  const link = document.createElement('a');
  link.className = 'card'; link.href = entry.wiki; link.target = '_blank'; link.rel = 'noopener noreferrer';
  link.title = build.note;
  const img = document.createElement('img');
  img.className = 'sprite'; img.src = entry.sprite; img.alt = ''; img.loading = 'lazy'; img.width = 68; img.height = 68;
  const top = document.createElement('div'); top.className = 'top';
  top.innerHTML = '<span class="name"></span><span class="dex"></span><span class="score"></span>';
  top.querySelector('.name').textContent = entry.name;
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
  const role = document.createElement('div'); role.className = 'tags';
  role.innerHTML = '<span class="dex"></span>';
  role.firstChild.textContent = (ROLES[build.role] || build.role) + (state.mode === 'pvp' && build.gen3 ? ' · Gen 3 ' + build.gen3 + (build.slots ? ' ' + build.covered + '/' + build.slots : '') : '');
  const moves = document.createElement('div'); moves.className = 'moves';
  for (const name of build.moves) {
    const m = document.createElement('span'); m.textContent = name; m.title = HM.has(name) ? name + ' (HM)' : name;
    if (HM.has(name)) m.className = 'hm';
    moves.append(m);
  }
  const meta = document.createElement('div'); meta.className = 'meta';
  meta.innerHTML = 'Natureza <b></b> · IVs <b></b>';
  const [nature] = build.natures || [];
  meta.children[0].textContent = nature || '—';
  meta.children[1].textContent = (build.priority || []).map(stat => STATS[stat] || stat).join(' → ') || '—';
  link.append(img, top, tags, role, moves, meta);
  return link;
}

function render() {
  for (const button of document.querySelectorAll('[data-mode]')) button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
  for (const chip of typesBox.children) chip.setAttribute('aria-pressed', String(state.types.has(chip.dataset.type)));
  document.getElementById('category').value = state.category;
  document.getElementById('role').value = state.role;
  document.getElementById('help').textContent = HELP[state.mode];
  const query = key(state.query.trim());
  const list = DATA.entries.filter(entry => {
    const special = entry.mega || entry.legendary;
    if (state.category === 'normal' && special) return false;
    if (state.category === 'special' && !special) return false;
    if (state.role && entry[state.mode].role !== state.role) return false;
    if (state.types.size && !entry.types.some(type => state.types.has(type))) return false;
    return !query || key(entry.name).includes(query);
  }).sort((a, b) => b[state.mode].score - a[state.mode].score || a.name.localeCompare(b.name, 'pt-BR'));
  document.getElementById('count').textContent = list.length + ' Pokémon';
  const thresholds = DATA.thresholds[state.mode];
  const rows = document.getElementById('rows');
  rows.replaceChildren(...['S', 'A', 'B', 'C', 'D'].map(tier => {
    const row = document.createElement('section'); row.className = 'row'; row.setAttribute('aria-label', 'Tier ' + tier);
    const label = document.createElement('div'); label.className = 'label'; label.style.setProperty('--tier', 'var(--' + tier + ')');
    label.innerHTML = '<b></b><span></span>';
    label.firstChild.textContent = tier;
    label.lastChild.textContent = tier === 'D' ? 'abaixo de ' + number.format(thresholds.C) : 'nota ' + number.format(thresholds[tier]) + '+';
    const cards = document.createElement('div'); cards.className = 'cards';
    const members = list.filter(entry => entry[state.mode].tier === tier);
    if (members.length) cards.append(...members.map(card));
    else cards.innerHTML = '<p class="empty">Nenhum Pokémon com esses filtros.</p>';
    row.append(label, cards);
    return row;
  }));
  try { localStorage.setItem('pafk-tierlist', JSON.stringify({ mode: state.mode, category: state.category, role: state.role })); } catch {}
}

for (const button of document.querySelectorAll('[data-mode]')) button.addEventListener('click', () => { state.mode = button.dataset.mode; render(); });
document.getElementById('category').addEventListener('change', event => { state.category = event.target.value; render(); });
document.getElementById('role').addEventListener('change', event => { state.role = event.target.value; render(); });
document.getElementById('search').addEventListener('input', event => { state.query = event.target.value; render(); });
render();
</script>
</body>
</html>
`;

await writeFile(new URL('./tierlist.html', import.meta.url), html, 'utf8');
console.log(`tierlist.html gerado com ${entries.length} Pokémon.`);
