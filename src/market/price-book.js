// Consulta e coleta passiva das páginas de mercado que o jogador abriu.
const priceBookTrigger = document.createElement('button');
priceBookTrigger.type = 'button';
priceBookTrigger.className = 'mk-nav';
priceBookTrigger.dataset.pafk = '';
priceBookTrigger.textContent = 'Base de preços';
priceBookTrigger.setAttribute('aria-haspopup', 'dialog');

const priceBookDialog = document.createElement('dialog');
priceBookDialog.className = 'pafk-book';
priceBookDialog.dataset.pafk = '';
priceBookDialog.setAttribute('aria-labelledby', 'pafk-book-title');
priceBookDialog.innerHTML = `
  <header class="pafk-book-head">
    <h2 id="pafk-book-title">Base de preços</h2>
    <button type="button" data-book-close aria-label="Fechar base de preços">✕</button>
  </header>
  <div class="pafk-book-body">
    <div class="pafk-book-tabs" role="group" aria-label="Origem dos preços">
      <button type="button" data-book-source="sales" aria-pressed="true">Vendas concluídas</button>
      <button type="button" data-book-source="asks" aria-pressed="false">Preços anunciados</button>
    </div>
    <div class="pafk-book-controls">
      <label>Pokémon <input type="search" data-book-query placeholder="Buscar espécie ou nº da Pokédex"></label>
      <label>Moeda <select data-book-currency aria-label="Moeda"><option value="money">₽</option><option value="gems">Diamantes</option></select></label>
      <label>Período <select data-book-days aria-label="Período"><option value="7">7 dias</option><option value="30" selected>30 dias</option>
        <option value="90">90 dias</option><option value="0">Todo o período</option></select></label>
      <label>IV mínimo <input type="number" min="0" max="186" step="1" placeholder="0" data-book-min></label>
      <label>IV máximo <input type="number" min="0" max="186" step="1" placeholder="186" data-book-max></label>
    </div>
    <p class="pafk-book-muted" data-book-status role="status"></p>
    <div class="pafk-book-content" data-book-content hidden>
      <div class="pafk-book-scroll" tabindex="0" aria-label="Tabela de preços">
        <table>
          <thead><tr><th scope="col">Pokémon</th><th scope="col">Mediana</th><th scope="col">Faixa observada</th>
            <th scope="col">Amostra</th><th scope="col">Mais recente</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <section class="pafk-book-detail" aria-labelledby="pafk-book-detail-title" hidden>
        <h3 id="pafk-book-detail-title"></h3>
        <p class="pafk-book-muted"></p>
        <ul></ul>
        <button type="button" data-book-species>Ver anúncios da espécie</button>
      </section>
    </div>
  </div>
  <footer class="pafk-book-footer">
    <span>Registros salvos neste navegador.</span>
    <button type="button" data-book-open-history>Ver histórico do jogo</button>
    <button type="button" data-book-open-mons>Explorar Pokémon à venda</button>
  </footer>`;

const bookStatus = priceBookDialog.querySelector('[data-book-status]');
const bookQuery = priceBookDialog.querySelector('[data-book-query]');
const bookCurrency = priceBookDialog.querySelector('[data-book-currency]');
const bookDays = priceBookDialog.querySelector('[data-book-days]');
const bookMin = priceBookDialog.querySelector('[data-book-min]');
const bookMax = priceBookDialog.querySelector('[data-book-max]');
const bookContent = priceBookDialog.querySelector('[data-book-content]');
const bookBody = priceBookDialog.querySelector('tbody');
const bookDetail = priceBookDialog.querySelector('.pafk-book-detail');
const bookSources = [...priceBookDialog.querySelectorAll('[data-book-source]')];
let bookSource = 'sales';
let bookRecords = [];
let bookSelection = null;
let bookRequest = 0;
let bookLoading = false;
let bookError = false;
let bookWriteError = false;
const observedBookSpecies = new WeakSet();
const observedBookHistory = new WeakSet();
const observedBookSales = new Map();
const observedBookAsks = new Map();

function recordPriceBook(kind, records) {
  return writePriceBook(kind, records).then(changed => {
    bookWriteError = false;
    if (changed && pricePanel.isConnected && priceState) loadPriceBookComparison(priceState);
    if (changed && priceBookDialog.open && kind === bookSource) refreshPriceBook();
    return true;
  }).catch(() => {
    bookWriteError = true;
    if (priceBookDialog.open) renderPriceBook();
    return false;
  });
}

function recordPriceBookAsks(variants, at) {
  const records = [];
  for (const [variant, offers] of variants) {
    const snapshot = priceBookAsks(variant, at, offers);
    const signature = `${snapshot.id[1]}|${offers.map(offer => JSON.stringify(offer)).sort().join('|')}`;
    if (observedBookAsks.get(variant) === signature) continue;
    observedBookAsks.set(variant, signature);
    records.push(snapshot);
  }
  return recordPriceBook('asks', records).then(ok => {
    if (!ok) for (const { variant } of records) observedBookAsks.delete(variant);
    return ok;
  });
}

function capturePriceBookSales(main) {
  const table = main.querySelector('.mk-history-table');
  if (!table) return;
  const repeated = observedBookHistory.has(table);
  observedBookHistory.add(table);
  const selector = repeated ? '[data-hist-detail^="general:"][aria-expanded="true"]' : '[data-hist-detail^="general:"]';
  const records = [...table.querySelectorAll(selector)].flatMap(row => {
    const seen = observedBookSales.get(row.dataset.histDetail);
    if (seen === true || (seen === false && row.getAttribute('aria-expanded') !== 'true')) return [];
    const sale = readPriceSale(row);
    if (!sale || (seen === false && !sale.ivs)) return [];
    observedBookSales.set(sale.id, Boolean(sale.ivs));
    return [sale];
  });
  if (records.length) recordPriceBook('sales', records).then(ok => {
    if (!ok) for (const { id } of records) observedBookSales.delete(id);
  });
}

function syncPriceBook(main) {
  if (!main) {
    if (priceBookDialog.open) priceBookDialog.close();
    return;
  }
  const nav = main.parentElement.querySelector('.mk-side .mk-navs');
  if (nav && priceBookTrigger.parentElement !== nav) nav.append(priceBookTrigger);
  const page = main.parentElement.dataset.page;
  if (page === 'history') capturePriceBookSales(main);
  if (page !== 'species' || priceLookup) return;
  const list = main.querySelector(OFFER_LIST);
  const total = speciesPriceTotal(main, priceSpeciesDex(main));
  if (!list || !total || observedBookSpecies.has(list)) return;
  observedBookSpecies.add(list);
  const { variants, at, scoped } = readSpeciesPriceSnapshot(main, total);
  if (!scoped) recordPriceBookAsks(variants, at);
}

function bookAmount(amount, currency) {
  return currency === 'money' ? formatPriceMoney(amount) : `${priceNumber.format(amount)} diam.`;
}

function bookRange({ min, max }, currency) {
  return min === max ? bookAmount(min, currency) : `${bookAmount(min, currency)} a ${bookAmount(max, currency)}`;
}

function bookFilters() {
  return {
    currency: bookCurrency.value,
    min: bookMin.value === '' ? 0 : priceInputNumber(bookMin),
    max: bookMax.value === '' ? IV_MAX_TOTAL : priceInputNumber(bookMax),
  };
}

function bookDetailRows(group, filters) {
  const sales = bookSource === 'sales';
  return group.observations.flatMap(observation => {
    if (sales) {
      const stats = observation.ivs && STATS.map(([stat, , label]) => `${label} ${observation.ivs[stat]}`).join(' ');
      return [{
        at: observation.at,
        amount: bookAmount(observation.amount, filters.currency),
        detail: [`IV ${observation.total}/186`, observation.level && `Nv. ${observation.level}`, stats]
          .filter(Boolean).join(' · '),
      }];
    }
    const sample = priceBookSnapshotSample(observation, filters);
    const summary = summarizePrice(sample);
    return summary ? [{
      at: observation.at,
      amount: `≈ ${bookAmount(summary.estimate, filters.currency)}`,
      detail: `${sample.length} ${sample.length === 1 ? 'anúncio' : 'anúncios'} · ${bookRange(summary, filters.currency)}`,
    }] : [];
  });
}

function renderBookDetail(group, filters) {
  bookDetail.hidden = !group;
  bookContent.classList.toggle('pafk-book-has-detail', Boolean(group));
  if (!group) return;
  const rows = bookDetailRows(group, filters);
  const visible = rows.slice(0, 12);
  bookDetail.querySelector('h3').textContent = `${group.name} · ${group.form}`;
  bookDetail.querySelector('p').textContent = bookSource === 'sales'
    ? `${visible.length} de ${rows.length} vendas na faixa de IV.`
    : `${visible.length} de ${rows.length} dias com anúncios na faixa de IV.`;
  bookDetail.querySelector('ul').replaceChildren(...visible.map(row => {
    const item = document.createElement('li');
    const amount = document.createElement('b');
    amount.textContent = row.amount;
    const date = document.createElement('time');
    date.dateTime = new Date(row.at).toISOString();
    date.textContent = priceDate.format(row.at);
    const detail = document.createElement('small');
    detail.textContent = row.detail;
    item.append(amount, date, detail);
    return item;
  }));
  bookDetail.querySelector('[data-book-species]').dataset.dex = group.dex;
}

function renderPriceBook() {
  if (!priceBookDialog.open) return;
  const filters = bookFilters();
  const query = priceBookText(bookQuery.value);
  let message = '';
  let groups = [];
  if (bookLoading) message = 'Carregando a base de preços…';
  else if (bookError) message = 'A base local está indisponível. Feche e abra de novo para tentar novamente.';
  else if (filters.min > filters.max) message = 'O IV mínimo deve ser menor ou igual ao máximo.';
  else {
    groups = priceBookGroups(bookRecords, bookSource, filters)
      .filter(group => priceBookText(`${group.name} ${group.form} #${group.dex}`).includes(query))
      .sort((a, b) => b.at - a.at || a.name.localeCompare(b.name, 'pt-BR'));
    if (groups.length) {
      const scope = bookSource === 'sales'
        ? 'Valores pagos no histórico público.'
        : 'Preços pedidos na consulta mais recente que atende aos filtros.';
      message = `${groups.length} ${groups.length === 1 ? 'forma encontrada' : 'formas encontradas'}. ${scope}`;
    } else if (bookRecords.length) message = 'Nenhum preço encontrado com esses filtros.';
    else message = bookSource === 'sales'
      ? 'Abra o histórico do jogo para registrar as vendas exibidas.'
      : 'Abra a página de uma espécie para registrar os anúncios exibidos.';
  }
  bookStatus.textContent = bookWriteError ? `${message} Não foi possível salvar a última leitura.` : message;
  bookContent.hidden = !groups.length;
  renderBookDetail(groups.find(group => group.variant === bookSelection), filters);
  bookBody.replaceChildren(...groups.map(group => {
    const row = document.createElement('tr');
    row.classList.toggle('pafk-book-selected', group.variant === bookSelection);
    const species = document.createElement('button');
    species.type = 'button';
    species.className = 'pafk-book-name';
    species.dataset.bookVariant = group.variant;
    species.setAttribute('aria-expanded', String(group.variant === bookSelection));
    const sprite = document.createElement('img');
    sprite.src = `/assets/mon/front/${group.variant}.png`;
    sprite.alt = '';
    sprite.loading = 'lazy';
    const identity = document.createElement('span');
    const name = document.createElement('b');
    name.textContent = group.name;
    const form = document.createElement('small');
    form.textContent = group.form;
    identity.append(name, form);
    species.append(sprite, identity);
    row.insertCell().append(species);
    row.insertCell().textContent = `≈ ${bookAmount(group.summary.estimate, filters.currency)}`;
    row.insertCell().textContent = bookRange(group.summary, filters.currency);
    const sample = row.insertCell();
    sample.textContent = priceNumber.format(group.count);
    if (group.count < 3) {
      const small = document.createElement('small');
      small.textContent = 'Poucos dados';
      sample.append(small);
    }
    row.insertCell().textContent = priceDate.format(group.at);
    return row;
  }));
}

async function refreshPriceBook() {
  const request = ++bookRequest;
  const days = Number(bookDays.value);
  bookLoading = true;
  renderPriceBook();
  try {
    const records = await readPriceBook(bookSource, days ? Date.now() - days * PRICE_BOOK_DAY : 0);
    if (request !== bookRequest) return;
    bookRecords = records;
    bookError = false;
  } catch {
    if (request !== bookRequest) return;
    bookError = true;
  } finally {
    if (request === bookRequest) {
      bookLoading = false;
      renderPriceBook();
    }
  }
}

function openPriceBookPage(key, value) {
  const main = marketMain();
  if (!main) return;
  priceBookDialog.close();
  navigatePriceMarket(main, key, value);
}

priceBookTrigger.onclick = event => {
  event.stopPropagation();
  if (!priceBookDialog.isConnected) {
    installPriceBookStyles();
    document.body.append(priceBookDialog);
  }
  if (priceBookDialog.open) return;
  priceBookDialog.showModal();
  bookQuery.focus();
  refreshPriceBook();
};
priceBookDialog.querySelector('[data-book-close]').onclick = () => priceBookDialog.close();
priceBookDialog.querySelector('[data-book-open-history]').onclick = async () => {
  openPriceBookPage('go', 'history');
  await waitFor(() => marketMain()?.parentElement.dataset.page === 'history', 2000);
  const main = marketMain();
  if (main?.parentElement.dataset.page === 'history') {
    main.querySelector('[data-hist-scope="general"][aria-pressed="false"]')?.click();
  }
};
priceBookDialog.querySelector('[data-book-open-mons]').onclick = () => openPriceBookPage('go', 'mons');
priceBookDialog.querySelector('[data-book-species]').onclick = ({ currentTarget }) =>
  openPriceBookPage('species', currentTarget.dataset.dex);
priceBookDialog.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.key === 'Escape') {
    event.preventDefault();
    priceBookDialog.close();
  }
});
priceBookDialog.addEventListener('close', () => {
  if (priceBookTrigger.isConnected) priceBookTrigger.focus();
});
for (const button of bookSources) button.onclick = () => {
  if (bookSource === button.dataset.bookSource) return;
  bookSource = button.dataset.bookSource;
  for (const tab of bookSources) tab.setAttribute('aria-pressed', String(tab === button));
  refreshPriceBook();
};
bookDays.onchange = refreshPriceBook;
bookCurrency.onchange = renderPriceBook;
bookQuery.oninput = bookMin.oninput = bookMax.oninput = renderPriceBook;
for (const input of [bookMin, bookMax]) input.onchange = () => {
  if (input.value !== '') input.value = priceInputNumber(input);
  renderPriceBook();
};
bookBody.onclick = ({ target }) => {
  const button = target.closest('[data-book-variant]');
  if (!button) return;
  const { bookVariant } = button.dataset;
  bookSelection = bookVariant === bookSelection ? null : bookVariant;
  renderPriceBook();
  bookBody.querySelector(`[data-book-variant="${CSS.escape(bookVariant)}"]`)?.focus({ preventScroll: true });
  if (!bookDetail.hidden) bookDetail.scrollIntoView({ block: 'nearest' });
};
