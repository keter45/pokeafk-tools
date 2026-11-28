// Comparador de preços do anúncio novo. Usa só os anúncios que a base de preços guardou quando o
// jogador abriu a página da espécie (a consulta automática saiu na 2.0.0: o jogo bloqueia cliques
// enviados por scripts).
let priceState = null;
let priceStylesInstalled = false;
let priceBrowseFilters = false;
let priceBrowseQuery = '';

function syncPriceComparison(main) {
  if (!main) {
    pricePanel.remove();
    priceState = null;
    return;
  }
  const page = main.parentElement.dataset.page;
  if (page === 'mons') {
    const region = main.querySelector('[data-dd="region"] span');
    const type = main.querySelector('[data-dd="mon-type"] span');
    priceBrowseQuery = priceBookText(main.querySelector('[data-mon-q]')?.value ?? '');
    priceBrowseFilters = Boolean((region && region.textContent.trim() !== 'Todas as regiões') ||
      (type && type.textContent.trim() !== 'Todos'));
  }

  const field = main.querySelector('.mk-conf [data-price]')?.closest('.mk-field');
  const target = field && readPriceTarget(main);
  if (!target) {
    pricePanel.remove();
    return;
  }
  if (!priceStylesInstalled) {
    installPriceStyles();
    priceStylesInstalled = true;
  }
  if (priceState?.target.key !== target.key) {
    const cached = readPriceHistory().find(entry => entry.variant === target.variant);
    priceState = { target, snapshot: cached ? { ...cached, historical: true } : null };
    showPriceTarget(target);
    showPriceComparison(priceState);
  }
  if (field.previousElementSibling !== pricePanel) field.before(pricePanel);
  loadPriceBookComparison(priceState);
}

function priceSpeciesDex(main) {
  if (main?.parentElement.dataset.page !== 'species') return null;
  return Number(main.querySelector('.mk-dexno')?.textContent.trim().slice(1)) || null;
}

function speciesPriceTotal(main, dex) {
  if (priceSpeciesDex(main) !== dex) return null;
  const text = main.querySelector('.mk-stat-total b')?.textContent.trim();
  return text === '0' ? 0 : readPriceAmount(text);
}

function nativePriceFilters(main) {
  const side = main.parentElement.querySelector('.mk-side');
  const name = priceBookText(main.querySelector('.mk-spec-name h2')?.textContent ?? '');
  return priceBrowseFilters || (priceBrowseQuery && !name.includes(priceBrowseQuery)) || Boolean(side?.querySelector(
    '[data-rar][aria-pressed="true"], [data-tier][aria-pressed="true"], ' +
    '[data-favs-only][aria-pressed="true"], [data-cur]:not([data-cur="all"])[aria-pressed="true"]',
  )) || [...(side?.querySelectorAll('[data-range]') ?? [])].some(input => readPriceAmount(input.value));
}

function readSpeciesPriceSnapshot(main, total) {
  const { variants, rowCount } = readPriceOffers(main);
  return { at: Date.now(), variants, scoped: rowCount !== total || Boolean(nativePriceFilters(main)) };
}

function loadPriceBookComparison(state) {
  const revision = priceBookRevision;
  if (state.bookRevision === revision) return;
  state.bookRevision = revision;
  const now = Date.now();
  const { variant } = state.target;
  Promise.all([
    readPriceBook('sales', now - 30 * PRICE_BOOK_DAY, variant),
    readPriceBook('asks', now - PRICE_HISTORY_AGE, variant),
  ]).then(([sales, asks]) => {
    if (priceState !== state || state.bookRevision !== revision) return;
    state.sales = sales;
    const latest = asks.reduce((a, b) => !a || b.at > a.at ? b : a, null);
    if (latest && (!state.snapshot || (state.snapshot.historical && latest.at > state.snapshot.at))) {
      state.snapshot = { ...latest, historical: true };
    }
    if (pricePanel.isConnected) showPriceComparison(state);
  }).catch(() => {
    // O preço do anúncio pode ser consultado normalmente sem armazenamento local.
  });
}

priceOld.onclick = () => {
  priceState.snapshot = priceState.previous;
  showPriceComparison(priceState);
};
pricePanel.querySelector('[data-price-reset]').onclick = () => {
  setPriceCriteria(priceState.target);
  showPriceComparison(priceState);
};
pricePanel.addEventListener('click', event => event.stopPropagation());
pricePanel.addEventListener('input', () => {
  showPriceComparison(priceState);
});
pricePanel.addEventListener('change', ({ target }) => {
  if (target.matches('input[type="number"]') && target.value !== '') target.value = priceInputNumber(target);
});
