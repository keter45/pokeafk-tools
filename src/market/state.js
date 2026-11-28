// Estado do painel do mercado e resultado dos filtros.
function filterMarketRows(root, view, mode) {
  const grouped = view === 'grouped';
  const browsing = view !== 'species';
  const bySpecies = browsing && hasSpeciesFilters();
  const byOffer = !grouped && (offerFilterCount() || marketSearch.potential);
  const active = Boolean(bySpecies || byOffer);
  const rows = [...root.querySelectorAll(grouped ? SPECIES_ROWS : OFFER_ROW)];
  let matched = 0;
  let unknown = 0;
  for (const row of rows) {
    const result = matchMarketRow(row, mode, bySpecies, byOffer);
    row.toggleAttribute(FILTERED_ATTR, result === false || (marketSearch.potential && result === null));
    if (result === true) matched++;
    if (result === null) unknown++;
  }
  return { active, total: rows.length, matched, unknown };
}

function matchMarketRow(row, mode, bySpecies, byOffer) {
  if (!bySpecies && !byOffer) return true;
  const sprite = potentialSprite(row.querySelector('img.mk-front'));
  const dex = row.querySelector('[data-species]')?.dataset.species ?? sprite?.[1];
  if (bySpecies && !matchesMarketSpecies(dex, mode)) return false;
  if (!byOffer) return true;
  const offer = readOffer(row);
  const ivMatch = matchOffer(offer, filters);
  if (!marketSearch.potential || ivMatch === false) return ivMatch;
  const profile = potentialProfile(dex, sprite, mode);
  const tier = Number(row.querySelector('.mk-tier')?.textContent.trim().match(/^Tier\s+([1-5])$/i)?.[1]);
  const potential = assessPotential({ profile, ...offer, tier }, mode);
  if (potential && !potential.ok) return false;
  return potential ? ivMatch : null;
}

function offerFilterCount() {
  return filters.natures.size + filters.minimums.size;
}

function showMarketResults(main, view, nativeNature) {
  const grouped = view === 'grouped';
  const mode = readMode();
  const { active, total, matched, unknown } = filterMarketRows(main, view, mode);
  let message = '';
  if (active && (total || main.querySelector('.mk-empty p'))) {
    const place = view === 'species' ? 'nesta espécie' : 'nesta página';
    const kind = grouped ? 'espécies' : 'anúncios';
    message = matched ? `${matched} de ${total} ${kind} passam pelos filtros ${place}.`
      : `Nenhum resultado confirmado ${place}.`;
    if (unknown) message += ` Sem dados suficientes: ${unknown}.`;
  }
  if (filters.natures.size && NATURES.includes(nativeNature)) {
    message += ` O filtro do jogo está em ${nativeNature}. Use “Todas as naturezas” nele para combinar várias.`;
  }
  showMarketMessage(message);
}

let scope = null;
let recommendationDex = null;
let tierDialog = null;
let filters = emptyFilters();
let pending = false;
let stylesInstalled = false;
const panel = createPanel(next => {
  if (!scope || !panel.isConnected) return;
  filters = next;
  saveFilters(scope, filters);
  syncMarket();
});
const form = panel.querySelector('form');
const title = panel.querySelector('h3');
const offerFilterDetails = form.querySelector('details');
const offerFilterSummary = form.querySelector('[data-offer-filter-count]');

function ensureStyles() {
  if (stylesInstalled) return;
  installStyles();
  stylesInstalled = true;
}
