// Tiers e recomendações: constantes, dados do guia e selos de tier compartilhados pelo mercado, mapa e ficha.
const STORAGE_KEY = 'pokeafk-market-filtros:v1';
const NATURES = [
  'Adamant', 'Bashful', 'Bold', 'Brave', 'Calm', 'Careful', 'Docile',
  'Gentle', 'Hardy', 'Hasty', 'Impish', 'Jolly', 'Lax', 'Lonely', 'Mild',
  'Modest', 'Naive', 'Naughty', 'Quiet', 'Quirky', 'Rash', 'Relaxed',
  'Sassy', 'Serious', 'Timid',
];
const STATS = [
  ['hp', 'HP', 'HP'], ['atk', 'Atq', 'ATQ'], ['def', 'Def', 'DEF'],
  ['spa', 'Atq. Esp.', 'AT.E'], ['spd', 'Def. Esp.', 'DF.E'], ['spe', 'Vel', 'VEL'],
];
const STAT_KEYS = new Map(STATS.map(([stat, , label]) => [label, stat]));
const STAT_LABELS = new Map(STATS.map(([stat, label]) => [stat, label]));
// Nature chart: rows are the raised stat, columns the lowered one; the diagonal is neutral.
const NATURE_STATS = ['atk', 'def', 'spa', 'spd', 'spe'];
const NATURE_CHART = [
  ['Hardy', 'Lonely', 'Adamant', 'Naughty', 'Brave'],
  ['Bold', 'Docile', 'Impish', 'Lax', 'Relaxed'],
  ['Modest', 'Mild', 'Bashful', 'Rash', 'Quiet'],
  ['Calm', 'Gentle', 'Careful', 'Quirky', 'Sassy'],
  ['Timid', 'Hasty', 'Jolly', 'Naive', 'Serious'],
];
const NATURE_EFFECTS = new Map(NATURE_CHART.flatMap((row, up) =>
  row.map((nature, down) => [nature, { up: NATURE_STATS[up], down: NATURE_STATS[down] }])));
function natureEffect(nature) {
  const effect = NATURE_EFFECTS.get(nature);
  if (!effect) return '';
  if (effect.up === effect.down) return 'neutra';
  return `+${STAT_LABELS.get(effect.up)} −${STAT_LABELS.get(effect.down)}`;
}
function natureWithEffect(nature) {
  const effect = natureEffect(nature);
  return effect ? `${nature} (${effect})` : nature;
}
const ROLES = {
  physical: 'Físico', special: 'Especial', mixed: 'Misto', support: 'Suporte',
};
const RANK_PAGE_SIZE = 10;
const PRIORITY_IV = 28;
const TIERS = ['S', 'A', 'B', 'C', 'D'];
// Legendary and mythical Pokémon from generations 1–3.
const LEGENDARY_DEX = new Set([
  144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251,
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
]);
const CATEGORIES = { normal: 'Espécies normais', special: 'Lendários e Megas', all: 'Todas' };
function profileCategory(profile) {
  return profile.isMega || LEGENDARY_DEX.has(Number(profile.id)) ? 'special' : 'normal';
}
// Two tier lists: hunting damage (PvE) and a longer competitive duel.
const MODES = {
  pve: { label: 'PvE (caça)', short: 'PvE', title: 'PvE' },
  pvp: { label: 'Competitivo', short: 'Comp', title: 'Competitivo' },
};
const MODE_KEY = 'pokeafk-market-filtros:mode';
function readMode() {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    return saved in MODES ? saved : 'pve';
  } catch {
    return 'pve';
  }
}
function saveMode(mode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // The choice only lasts for this page when storage is blocked.
  }
}
function rated(profile, mode) {
  return Boolean(profile?.[mode]?.tier) && Number.isFinite(profile[mode].score);
}
const rankedProfiles = Object.values(MARKET_GUIDE?.profiles ?? {})
  .filter(profile => rated(profile, 'pve') && rated(profile, 'pvp'))
  .map(profile => ({ ...profile, category: profileCategory(profile) }));
const scoreFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const TIER_BADGE = 'pafk-tier-badge';

// Best final evolution (megas excluded) that represents a dex number in the market lists.
function speciesRating(dex, mode) {
  const mapped = MARKET_GUIDE?.species?.[Number(dex)];
  return (mapped?.finals ?? []).map(id => MARKET_GUIDE.profiles[id])
    .filter(profile => rated(profile, mode))
    .sort((left, right) => right[mode].score - left[mode].score)[0] ?? null;
}

function tierSegment(mode, tier, showMode = true) {
  const segment = document.createElement('span');
  segment.className = 'pafk-tier-seg';
  segment.dataset.tier = tier;
  segment.innerHTML = `${showMode ? `<small>${MODES[mode].short}</small>` : ''}<b>${tier}</b>`;
  return segment;
}

function createTierBadge(dex) {
  const ratings = Object.keys(MODES).map(mode => [mode, speciesRating(dex, mode)]).filter(([, profile]) => profile);
  if (!ratings.length) return null;
  const badge = document.createElement('span');
  badge.className = TIER_BADGE;
  badge.dataset.dex = String(dex);
  badge.title = ratings.map(([mode, profile]) => {
    const reference = String(profile.id) === String(dex) ? '' : ` (${profile.name})`;
    return `${MODES[mode].title}: tier ${profile[mode].tier}, nota ${scoreFormat.format(profile[mode].score)}${reference}`;
  }).join(' · ');
  badge.setAttribute('aria-label', badge.title);
  badge.append(...ratings.map(([mode, profile]) => tierSegment(mode, profile[mode].tier)));
  return badge;
}

function placeTierBadge(host, dex) {
  if (!host || !dex) return;
  const current = host.querySelector(`:scope > .${TIER_BADGE}`);
  if (current?.dataset.dex === String(dex)) return;
  current?.remove();
  const badge = createTierBadge(dex);
  if (!badge) return;
  badge.dataset.pafk = '';
  host.append(badge);
}

function dexFromAsset(url) {
  return String(url ?? '').match(/\/assets\/mon\/(?:icon|front)\/(\d+)\.png/)?.[1];
}

// MAPA window: hunt list rows and the card of the selected hunt (the map itself is a canvas).
