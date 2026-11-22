// Estado do painel do mercado e resultado dos filtros.
function showResults(list, nativeNature) {
  const active = filters.natures.size + filters.minimums.size;
  const rows = list ? [...list.querySelectorAll(OFFER_ROW)] : [];
  let matched = 0;
  let unknown = 0;
  for (const row of rows) {
    const result = active ? matchOffer(readOffer(row), filters) : true;
    row.toggleAttribute(FILTERED_ATTR, result === false);
    if (result === true) matched++;
    if (result === null) unknown++;
  }
  let message = '';
  if (active && rows.length) {
    message = matched
      ? `${matched} de ${rows.length} anúncios carregados passam pelos filtros.`
      : 'Nenhum anúncio carregado atende aos filtros.';
    if (unknown) message += ` Anúncios sem dados suficientes: ${unknown}.`;
  }
  if (filters.natures.size && NATURES.includes(nativeNature)) {
    message += ` O filtro do jogo está em ${nativeNature}. Selecione “Todas as naturezas” nele para combinar várias.`;
  }
  const status = panel.querySelector('[data-status]');
  status.hidden = !message;
  if (status.textContent !== message) status.textContent = message;
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
const groupedHint = panel.querySelector('[data-grouped-hint]');

function ensureStyles() {
  if (stylesInstalled) return;
  installStyles();
  stylesInstalled = true;
}
