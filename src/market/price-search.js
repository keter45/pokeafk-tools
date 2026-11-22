// Abre a própria página de ofertas do jogo, lê os anúncios e volta ao mesmo rascunho.
const priceWait = document.createElement('section');
priceWait.className = 'pafk-price-wait';
priceWait.dataset.pafk = '';
priceWait.innerHTML = `
  <span role="status">Consultando anúncios no mercado…</span>
  <button type="button" class="mk-btn mk-ghost">Voltar ao anúncio</button>`;

let priceState = null;
let priceLookup = null;
let priceStylesInstalled = false;
let priceBrowseFilters = false;
let priceBrowseQuery = '';

function syncPriceComparison(main) {
  if (!main) {
    pricePanel.remove();
    priceWait.remove();
    priceLookup = null;
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
  if (priceLookup && priceSpeciesDex(main) === priceLookup.state.target.dex) {
    if (main.firstElementChild !== priceWait) main.prepend(priceWait);
  } else {
    priceWait.remove();
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

// Os botões nativos de navegação usam delegação na raiz .mk.
function navigatePriceMarket(main, key, value) {
  const action = document.createElement('button');
  action.type = 'button';
  action.dataset[key] = value;
  action.dataset.pafk = '';
  action.hidden = true;
  main.append(action);
  action.click();
  action.remove();
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

async function returnToPriceDraft(job) {
  const main = marketMain();
  if (priceLookup !== job || priceSpeciesDex(main) !== job.state.target.dex) return;
  navigatePriceMarket(main, 'go', 'create');
  await waitFor(() => priceLookup !== job ||
    readPriceTarget(marketMain())?.key === job.state.target.key, 2000);
  if (priceLookup !== job) return;
  priceLookup = null;
  const draft = marketMain();
  if (readPriceTarget(draft)?.key !== job.state.target.key) return;
  syncPriceComparison(draft);
  showPriceComparison(job.state);
  draft.scrollTop = job.scroll;
  const list = draft.querySelector('.mk-owns');
  if (list) list.scrollTop = job.listScroll;
  priceSearchButton.focus({ preventScroll: true });
}

async function searchPriceOffers() {
  const main = marketMain();
  if (priceLookup || !priceState || !pricePanel.isConnected || !main) return;
  const job = {
    state: priceState, scroll: main.scrollTop, listScroll: main.querySelector('.mk-owns')?.scrollTop ?? 0,
  };
  const { state } = job;
  const { target } = state;
  priceLookup = job;
  state.error = '';
  state.applied = false;
  navigatePriceMarket(main, 'species', String(target.dex));
  await waitFor(() => {
    const current = marketMain();
    const dex = priceSpeciesDex(current);
    return priceLookup !== job || !current ||
      !['create', 'species'].includes(current.parentElement.dataset.page) ||
      (dex !== null && dex !== target.dex) ||
      speciesPriceTotal(current, target.dex) !== null;
  });
  if (priceLookup !== job) return;
  const current = marketMain();
  const total = speciesPriceTotal(current, target.dex);
  if (total === null) {
    state.error = 'O mercado não carregou os anúncios. Tente consultar novamente.';
  } else {
    const { at, variants, scoped } = readSpeciesPriceSnapshot(current, total);
    if (state.snapshot && !state.snapshot.scoped) {
      state.previous = state.snapshot.historical ? state.snapshot : { ...state.snapshot, historical: true };
    }
    state.snapshot = { at, offers: variants.get(target.variant) ?? [], scoped };
    if (!scoped) {
      const snapshot = state.snapshot;
      recordPriceBookAsks(variants, at).then(ok => {
        if (!ok) savePriceHistoryFallback(target.variant, snapshot);
      });
    }
  }
  if (priceSpeciesDex(current) === target.dex) {
    await returnToPriceDraft(job);
  } else if (priceState === state && pricePanel.isConnected) {
    showPriceComparison(state);
  }
  if (priceLookup === job) priceLookup = null;
}

function applyPriceEstimate(gems) {
  const main = marketMain();
  if (readPriceTarget(main)?.key !== priceState?.target.key || !priceState) return;
  const amount = gems ? priceState.gems : priceState.money;
  const input = main.querySelector(gems ? '.mk-conf [data-gems]' : '.mk-conf [data-price]');
  if (!amount || !input) return;
  input.value = String(amount);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  priceState.applied = true;
  showPriceComparison(priceState);
  input.focus();
}

priceSearchButton.onclick = searchPriceOffers;
priceWait.querySelector('button').onclick = event => {
  event.stopPropagation();
  const job = priceLookup;
  if (!job) return;
  // Troca a identidade para invalidar a consulta ainda em espera.
  priceLookup = { ...job };
  returnToPriceDraft(priceLookup);
};
priceUse.onclick = () => applyPriceEstimate(false);
priceUseGems.onclick = () => applyPriceEstimate(true);
priceOld.onclick = () => {
  priceState.snapshot = priceState.previous;
  priceState.applied = false;
  showPriceComparison(priceState);
};
pricePanel.querySelector('[data-price-reset]').onclick = () => {
  setPriceCriteria(priceState.target);
  priceState.applied = false;
  showPriceComparison(priceState);
};
pricePanel.addEventListener('click', event => event.stopPropagation());
pricePanel.addEventListener('input', () => {
  priceState.applied = false;
  showPriceComparison(priceState);
});
pricePanel.addEventListener('change', ({ target }) => {
  if (target.matches('input[type="number"]') && target.value !== '') target.value = priceInputNumber(target);
});
