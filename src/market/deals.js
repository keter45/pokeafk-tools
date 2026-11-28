// Achados do mercado (pedido do usuário, 2026-11-28): anúncios de Pokémon com potencial vendidos
// abaixo do preço dos parecidos. O script percorre as páginas das espécies escolhidas (por padrão
// as S e A da lista escolhida, editável), lê cada anúncio, aplica a regra de potencial do PC
// (editável) e compara o preço com a mediana dos anúncios com potencial da mesma espécie, mesma
// forma, shiny ou não, e com ou sem Doce Dourado. Sem 3 parecidos, usa a mediana das vendas da base
// de preços. Os anúncios trazem ₽ "OU" diamantes; a taxa ₽ por diamante é a mediana desses pares
// (ou a que o jogador digitar), e cada anúncio vale o menor dos dois em ₽.
const DEALS_KEY = 'pokeafk-market-filtros:achados';
const DEALS_LAST_KEY = 'pokeafk-market-filtros:achados-ultimo';
const DEALS_MIN_REF = 3;
const DEALS_SALES_DAYS = 30;

function readDealsSettings() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(DEALS_KEY) ?? '{}') ?? {};
  } catch {
    // Default settings.
  }
  const list = value => (Array.isArray(value) ? value.map(String).filter(dex => MARKET_SPECIES_NAMES.has(dex)) : []);
  return {
    tiers: Array.isArray(saved.tiers) && saved.tiers.every(tier => TIERS.includes(tier)) ? saved.tiers : ['S', 'A'],
    add: new Set(list(saved.add)),
    remove: new Set(list(saved.remove)),
    rate: Number.isFinite(saved.rate) && saved.rate > 0 ? saved.rate : null,
  };
}

let dealsSettings = readDealsSettings();
function saveDealsSettings() {
  const { tiers, add, remove, rate } = dealsSettings;
  try {
    localStorage.setItem(DEALS_KEY, JSON.stringify({ tiers, add: [...add], remove: [...remove], rate }));
  } catch {
    // Kept for this page only.
  }
}

// Species to scan: those whose best final evolution is in the chosen tiers of the chosen list,
// plus the ones the player added, minus the ones removed.
function dealsSpecies(mode) {
  const picked = MARKET_SPECIES.filter(([dex]) => dealsSettings.tiers.includes(speciesRating(dex, mode)?.[mode].tier))
    .map(([dex]) => dex);
  return [...new Set([...picked, ...dealsSettings.add])].filter(dex => !dealsSettings.remove.has(dex))
    .sort((a, b) => Number(a) - Number(b));
}

// Value at a share of the sorted list (0.25 = lower quartile).
const quantile = (values, share) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const at = (sorted.length - 1) * share;
  const low = Math.floor(at);
  return sorted[low] + (sorted[Math.min(low + 1, sorted.length - 1)] - sorted[low]) * (at - low);
};
// Listings that stay up are the expensive ones (cheap ones sell), so the reference is the lower
// quartile of the comparable listings, not their median.
const DEALS_REF_SHARE = 0.25;
// Comparable: the same form, Golden Candy or not, and an IV total within this many points.
const DEALS_IV_BAND = 15;
const median = values => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = sorted.length >> 1;
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

function readDealRow(row, dex, mode) {
  const id = row.querySelector('[data-buy]')?.dataset.buy;
  const image = row.querySelector('img.mk-front');
  const variant = priceVariant(image)?.[1];
  if (!id || !variant) return null;
  const { ivs, nature } = readOffer(row);
  const tier = Number(row.querySelector('.mk-tier')?.textContent.match(/Tier\s+([1-5])/i)?.[1]);
  const money = row.querySelector('.mk-coin-n');
  const gem = row.querySelector('.mk-gem-n');
  const price = readPriceAmount(money?.title || money?.textContent);
  const gems = readPriceAmount(gem?.title || gem?.textContent);
  if (!price && !gems) return null;
  return assessDeal({
    id, dex, variant, ivs, nature, tier, price, gems,
    level: readPriceLevel(row.querySelector('.mk-lv')),
    gold: Boolean(row.querySelector('.gold-mark, .gold-tag')),
    seller: row.querySelector('.mk-seller')?.textContent.trim() ?? '',
    total: priceIVTotal(ivs),
  }, mode);
}

// Potential from the saved fields, so a new rule or list re-ranks the last scan without a new one.
function assessDeal(row, mode) {
  const sprite = `/assets/mon/front/${row.variant}.png`.match(/\/assets\/mon\/front\/(\d+)(-[\w-]+?)?s?\.png$/);
  const potential = assessPotential({ profile: potentialProfile(row.dex, sprite, mode), ivs: row.ivs ?? {}, nature: row.nature, tier: row.tier }, mode);
  return { ...row, ok: potential?.ok === true, main: potential?.main ?? null, natureFit: potential?.natureFit ?? null };
}

// ---- Window ----
const dealsTrigger = document.createElement('button');
dealsTrigger.type = 'button';
dealsTrigger.className = 'mk-nav';
dealsTrigger.dataset.pafk = '';
dealsTrigger.textContent = 'Achados';
dealsTrigger.title = 'Pokémon com potencial vendidos abaixo do preço dos parecidos';

const dealsDialog = document.createElement('dialog');
dealsDialog.className = 'pafk-book pafk-deals';
dealsDialog.dataset.pafk = '';
dealsDialog.setAttribute('aria-labelledby', 'pafk-deals-title');
dealsDialog.innerHTML = `
  <header class="pafk-book-head">
    <h2 id="pafk-deals-title">Achados do mercado</h2>
    <button type="button" data-deals-close aria-label="Fechar achados">✕</button>
  </header>
  <div class="pafk-book-body">
    <p class="pafk-book-muted" data-deals-summary></p>
    <details class="pafk-deals-setup">
      <summary>Espécies, potencial e taxa do diamante</summary>
      <div class="pafk-deals-grid">
        <fieldset>
          <legend>Espécies da lista <span data-deals-mode></span></legend>
          <div class="pafk-deals-tiers">${TIERS.map(tier => `<button type="button" data-deals-tier="${tier}" aria-pressed="false">${tier}</button>`).join('')}</div>
          <label>Adicionar ou tirar <input type="search" data-deals-query placeholder="Nome ou nº na Pokédex" autocomplete="off" spellcheck="false"></label>
          <ul class="pafk-deals-options" data-deals-options></ul>
          <div class="pafk-deals-chips" data-deals-chips></div>
        </fieldset>
        <fieldset>
          <legend>Regra de potencial (a mesma do PC)</legend>
          <div class="pafk-deals-rules">
            ${POT_RULE_FIELDS.map(([key, label, tip]) => `<label title="${tip}">${label} ≥ <select data-deals-rule="${key}">
              ${Array.from({ length: 32 }, (_, iv) => `<option>${iv}</option>`).join('')}</select></label>`).join('')}
            <label>Classe até <select data-deals-rule="tier">${[1, 2, 3, 4, 5].map(tier => `<option value="${tier}">Tier ${tier}</option>`).join('')}</select></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>₽ por diamante</legend>
          <label>Taxa usada <input type="number" min="1" step="1" data-deals-rate placeholder="automática"></label>
          <p class="pafk-book-muted" data-deals-rate-note></p>
        </fieldset>
      </div>
    </details>
    <div class="pafk-deals-actions">
      <button type="button" data-deals-scan>Varrer o mercado</button>
      <label><input type="checkbox" data-deals-all> Mostrar todos com potencial</label>
    </div>
    <p class="pafk-book-muted" data-deals-status role="status"></p>
    <div class="pafk-book-scroll" tabindex="0" aria-label="Achados">
      <table>
        <thead><tr><th scope="col">Pokémon</th><th scope="col">Preço</th><th scope="col">Vale (₽)</th>
          <th scope="col">Referência</th><th scope="col">Desconto</th><th scope="col">IVs da build</th><th scope="col">Vendedor</th></tr></thead>
        <tbody data-deals-body></tbody>
      </table>
    </div>
  </div>`;

const dealsStyle = document.createElement('style');
dealsStyle.dataset.pafk = '';
dealsStyle.textContent = `
  .pafk-deals { position:fixed; inset:0; margin:auto; z-index:70; }
  .pafk-deals fieldset { margin:0; padding:8px 10px; border:1px solid #c9ddf7; border-radius:9px; background:#fff; min-width:0; }
  .pafk-deals legend { padding:0 4px; color:#294378; font-weight:750; }
  .pafk-deals-setup summary { cursor:pointer; color:#1554ad; font-weight:750; min-height:32px; }
  .pafk-deals-grid { display:grid; grid-template-columns:minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, .8fr); gap:10px; margin-top:8px; }
  .pafk-deals-grid label { display:grid; gap:4px; color:#294378; font-size:12px; font-weight:700; }
  .pafk-deals-grid :is(input, select) { min-height:36px; padding:4px 7px; border:1px solid #aac6ee; border-radius:7px; font:inherit; color:#152a61; background:#fff; }
  .pafk-deals-tiers, .pafk-deals-rules, .pafk-deals-chips, .pafk-deals-actions { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .pafk-deals-tiers { margin-bottom:6px; }
  .pafk-deals-options { list-style:none; margin:4px 0; padding:0; }
  .pafk-deals-options li { display:flex; gap:6px; align-items:center; padding:2px 0; }
  .pafk-deals-options li span { flex:1; }
  .pafk-deals .pafk-deals-chips button, .pafk-deals .pafk-deals-options button { min-height:30px; padding:2px 8px; font-size:12px; }
  .pafk-deals-chips:empty { display:none; }
  .pafk-deals [data-deals-scan] { color:#fff; background:#195cb5; border-color:#195cb5; }
  .pafk-deals [data-deals-scan]:hover { background:#134a93; }
  .pafk-deals .pafk-deals-good { color:#17603d; font-weight:800; }
  .pafk-deals .pafk-deals-up { color:#17603d; }
  .pafk-deals .pafk-deals-down { color:#a02735; }
  .pafk-deals td .pafk-book-name { min-height:0; }
  @media (max-width:840px) { .pafk-deals-grid { grid-template-columns:minmax(0, 1fr); } }
`;

const dealsEl = selector => dealsDialog.querySelector(selector);
const dealsBody = dealsEl('[data-deals-body]');
const dealsStatus = dealsEl('[data-deals-status]');
const dealsScanButton = dealsEl('[data-deals-scan]');
let dealsResult = null;
let dealsSaved = null;
try {
  dealsSaved = JSON.parse(localStorage.getItem(DEALS_LAST_KEY) ?? 'null');
} catch {
  // No earlier scan.
}
let dealsJob = null;

const formatP = value => `₽${Math.round(value).toLocaleString('pt-BR')}`;
const shortP = value => (value >= 1e6 ? `₽${(value / 1e6).toFixed(value >= 1e7 ? 0 : 1).replace('.', ',')}M`
  : value >= 1e3 ? `₽${Math.round(value / 1e3)}k` : formatP(value));

// The rate in use: the player's, or the median of the listings priced in both currencies.
function dealsRate(listings) {
  const pairs = listings.filter(row => row.price && row.gems).map(row => row.price / row.gems);
  return { used: dealsSettings.rate ?? median(pairs), measured: median(pairs), pairs: pairs.length };
}

// Groups comparable listings: same form, shiny or not, with or without Golden Candy.
const dealGroup = row => `${row.variant}|${row.gold ? 'gold' : ''}`;

async function salesReference(variants) {
  const since = Date.now() - DEALS_SALES_DAYS * 24 * 60 * 60 * 1000;
  const result = new Map();
  for (const variant of variants) {
    try {
      result.set(variant, await readPriceBook('sales', since, variant));
    } catch {
      result.set(variant, []);
    }
  }
  return result;
}

async function rankDeals(all, mode) {
  const listings = all.map(row => assessDeal(row, mode));
  const rate = dealsRate(listings).used;
  const value = row => Math.min(row.price ?? Infinity, row.gems && rate ? row.gems * rate : Infinity);
  for (const row of listings) row.value = Number.isFinite(value(row)) ? value(row) : null;
  const groups = new Map();
  for (const row of listings.filter(row => row.ok && row.value)) {
    const key = dealGroup(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const sales = await salesReference([...new Set([...groups.values()].flat().map(row => row.variant))]);
  for (const rows of groups.values()) {
    for (const row of rows) {
      const near = rows.filter(other => Math.abs((other.total ?? 0) - (row.total ?? 0)) <= DEALS_IV_BAND);
      if (near.length >= DEALS_MIN_REF) {
        row.ref = quantile(near.map(other => other.value), DEALS_REF_SHARE);
        row.refFrom = `quartil inferior de ${near.length} parecidos (IV total ±${DEALS_IV_BAND})`;
      } else if (rows.length >= DEALS_MIN_REF) {
        row.ref = quantile(rows.map(other => other.value), DEALS_REF_SHARE);
        row.refFrom = `quartil inferior de ${rows.length} com potencial`;
      } else {
        const sold = (sales.get(row.variant) ?? []).map(sale => (sale.currency === 'gems' ? (rate ? sale.amount * rate : null) : sale.amount));
        const ref = sold.length >= DEALS_MIN_REF ? median(sold) : null;
        row.ref = ref;
        row.refFrom = ref ? `${sold.length} vendas em ${DEALS_SALES_DAYS} dias` : '';
      }
      row.discount = row.ref ? 1 - row.value / row.ref : null;
    }
  }
  return listings.filter(row => row.ok && row.value)
    .sort((a, b) => (b.discount ?? -Infinity) - (a.discount ?? -Infinity) || a.value - b.value);
}

function renderDeals() {
  const mode = readMode();
  dealsEl('[data-deals-mode]').textContent = MODES[mode].label;
  for (const button of dealsDialog.querySelectorAll('[data-deals-tier]')) {
    button.setAttribute('aria-pressed', String(dealsSettings.tiers.includes(button.dataset.dealsTier)));
  }
  for (const select of dealsDialog.querySelectorAll('[data-deals-rule]')) select.value = potRules[select.dataset.dealsRule];
  dealsEl('[data-deals-rate]').value = dealsSettings.rate ?? '';
  const chips = [...dealsSettings.add].map(dex => ['add', dex]).concat([...dealsSettings.remove].map(dex => ['remove', dex]));
  dealsEl('[data-deals-chips]').replaceChildren(...chips.map(([kind, dex]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.dealsChip = kind;
    button.dataset.dex = dex;
    button.textContent = `${kind === 'add' ? '+' : '−'} ${MARKET_SPECIES_NAMES.get(dex)} ×`;
    return button;
  }));
  const species = dealsSpecies(mode);
  const result = dealsResult;
  const rows = result?.rows ?? [];
  const all = dealsEl('[data-deals-all]').checked;
  const shown = rows.filter(row => all || (row.discount ?? 0) > 0);
  dealsEl('[data-deals-summary]').textContent = `${species.length} espécies na varredura (lista ${MODES[mode].short}, tiers ${dealsSettings.tiers.join(', ') || 'nenhum'}`
    + `${dealsSettings.add.size ? `, +${dealsSettings.add.size}` : ''}${dealsSettings.remove.size ? `, −${dealsSettings.remove.size}` : ''}). `
    + `Potencial: ataque principal ≥ ${potRules.main}, HP ≥ ${potRules.hp}, Vel ≥ ${potRules.spe}, até Tier ${potRules.tier}.`;
  const rate = result?.rate;
  dealsEl('[data-deals-rate-note]').textContent = rate
    ? `${dealsSettings.rate ? 'Digitada' : 'Medida'}: 1 diamante ≈ ${formatP(rate.used)}${rate.measured ? ` (mediana de ${rate.pairs} anúncios com as duas moedas: ${formatP(rate.measured)})` : ''}.`
    : 'Vazia = mediana dos anúncios com preço em ₽ e em diamantes.';
  if (!dealsJob) {
    dealsStatus.textContent = result
      ? `Última varredura: ${new Date(result.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}, `
        + `${result.listings} anúncios lidos, ${rows.length} com potencial, ${rows.filter(row => (row.discount ?? 0) > 0).length} abaixo da referência.`
      : 'Nenhuma varredura ainda. Os anúncios são lidos página por página, como você faria.';
  }
  dealsBody.replaceChildren(...shown.map(row => {
    const tr = document.createElement('tr');
    const name = MARKET_SPECIES_NAMES.get(row.dex) ?? `#${row.dex}`;
    const ivs = row.ivs ?? {};
    const mainLabel = row.main === 'spa' ? 'AT.E' : 'ATQ';
    const fit = row.natureFit === 'up' ? ' ▲' : row.natureFit === 'down' ? ' ▼' : '';
    tr.innerHTML = `
      <td><button type="button" class="pafk-book-name" data-deals-open="${row.dex}"><img alt="" src="/assets/mon/front/${row.variant}.png"><span><b></b><small></small></span></button></td>
      <td></td><td></td><td></td><td></td><td></td><td></td>`;
    tr.querySelector('b').textContent = `${name}${row.variant.endsWith('s') ? ' ★' : ''}${row.gold ? ' · Doce Dourado' : ''}`;
    tr.querySelector('small').textContent = `Nv. ${row.level || '?'} · Tier ${row.tier} · ${row.nature ?? '?'}${fit}`;
    const cells = tr.querySelectorAll('td');
    cells[1].textContent = [row.price && shortP(row.price), row.gems && `${row.gems.toLocaleString('pt-BR')} 💎`].filter(Boolean).join(' ou ');
    cells[2].textContent = shortP(row.value);
    cells[3].innerHTML = row.ref ? `${shortP(row.ref)}<small></small>` : '—';
    if (row.ref) cells[3].querySelector('small').textContent = row.refFrom;
    cells[4].textContent = row.discount === null ? '—' : `${Math.round(row.discount * 100)}%`;
    if ((row.discount ?? 0) >= 0.2) cells[4].className = 'pafk-deals-good';
    cells[5].textContent = `${mainLabel} ${ivs[row.main] ?? '?'} · HP ${ivs.hp ?? '?'} · VEL ${ivs.spe ?? '?'} · total ${row.total ?? '?'}`;
    cells[6].textContent = row.seller;
    if (row.natureFit) tr.querySelector('small').classList.add(row.natureFit === 'up' ? 'pafk-deals-up' : 'pafk-deals-down');
    return tr;
  }));
}

function renderDealsOptions() {
  const query = marketSearchText(dealsEl('[data-deals-query]').value);
  const number = /^\d+$/.test(query) ? String(Number(query)) : null;
  const matches = query ? marketSpeciesOptions.filter(option => (number ? option.dex === number : option.query.includes(query))).slice(0, 6) : [];
  dealsEl('[data-deals-options]').replaceChildren(...matches.map(({ dex, name }) => {
    const li = document.createElement('li');
    li.innerHTML = '<span></span><button type="button" data-deals-pick="add">Incluir</button><button type="button" data-deals-pick="remove">Tirar</button>';
    li.firstElementChild.textContent = name;
    for (const button of li.querySelectorAll('button')) button.dataset.dex = dex;
    return li;
  }));
}

// ---- Scan ----
// Native market filters (currency, rarity, price range) would hide listings from the scan.
function nativeMarketFilters(main) {
  const side = main.parentElement.querySelector('.mk-side');
  return Boolean(side?.querySelector('[data-rar][aria-pressed="true"], '
    + '[data-favs-only][aria-pressed="true"], [data-cur]:not([data-cur="all"])[aria-pressed="true"]'))
    || [...(side?.querySelectorAll('[data-range]') ?? [])].some(input => readPriceAmount(input.value));
}

// The market's own IV class buttons (T1–T5) leave only the classes the rule accepts, which cuts
// most pages (Abra had 1.641 listings in 137 pages). Returns the previous state to restore.
async function setTierFilter(wanted) {
  const side = () => marketMain()?.parentElement.querySelector('.mk-side');
  const before = [...(side()?.querySelectorAll('[data-tier]') ?? [])]
    .filter(button => button.getAttribute('aria-pressed') === 'true').map(button => Number(button.dataset.tier));
  for (const tier of [1, 2, 3, 4, 5]) {
    const button = side()?.querySelector(`[data-tier="${tier}"]`);
    if (!button || (button.getAttribute('aria-pressed') === 'true') === wanted.includes(tier)) continue;
    button.click();
    await waitFor(() => (side()?.querySelector(`[data-tier="${tier}"]`)?.getAttribute('aria-pressed') === 'true') === wanted.includes(tier), 4000);
    await dealsPause();
  }
  return before;
}

// Opening the public history once stores its latest sales in the price base (syncPriceBook).
async function refreshSales() {
  const main = marketMain();
  if (!main) return;
  navigatePriceMarket(main, 'go', 'history');
  await waitFor(() => marketMain()?.parentElement.dataset.page === 'history', 6000);
  marketMain()?.querySelector('[data-hist-scope="general"][aria-pressed="false"]')?.click();
  await waitFor(() => marketMain()?.querySelector('.mk-history-table [data-hist-detail]'), 6000);
  await dealsPause();
}

const pagesOf = main => {
  const total = Number(main.querySelector('.mk-pager')?.textContent.match(/de\s+([\d.]+)\s+ofertas/)?.[1].replace(/\./g, ''));
  // The market shows 12 listings a page; only the last page has fewer.
  const shown = Math.max(12, main.querySelectorAll(OFFER_ROW).length);
  return total ? Math.ceil(total / shown) : 1;
};

const dealsPause = () => new Promise(resolve => setTimeout(resolve, 450 + Math.random() * 450));

async function openDealsSpecies(dex) {
  const main = marketMain();
  if (!main) return false;
  navigatePriceMarket(main, 'species', dex);
  return waitFor(() => {
    const now = marketMain();
    return priceSpeciesDex(now) === Number(dex)
      && (now.querySelector(OFFER_ROW) || now.querySelector('.mk-empty p'));
  }, 10000);
}

async function scanDeals() {
  if (dealsJob) {
    dealsJob.stopped = true;
    return;
  }
  const start = marketMain();
  if (!start) return;
  if (nativeMarketFilters(start)) {
    dealsStatus.textContent = 'Desligue os filtros do próprio mercado (moeda, raridade, faixa de preço) antes de varrer.';
    return;
  }
  const mode = readMode();
  const species = dealsSpecies(mode);
  const job = { stopped: false };
  dealsJob = job;
  dealsScanButton.textContent = 'Parar';
  const listings = [];
  const finished = new Set();
  let tiersBefore = null;
  try {
    dealsStatus.textContent = 'Guardando as vendas recentes do histórico…';
    await refreshSales();
    for (const [index, dex] of species.entries()) {
      if (job.stopped) break;
      const status = page => {
        dealsStatus.textContent = `Lendo ${MARKET_SPECIES_NAMES.get(dex)} (${index + 1} de ${species.length})${page ? `, ${page}` : ''}… ${listings.filter(row => row.ok).length} com potencial até agora.`;
      };
      status('');
      if (!(await openDealsSpecies(dex))) throw new Error(`o mercado não abriu ${MARKET_SPECIES_NAMES.get(dex)}`);
      if (!tiersBefore) {
        tiersBefore = await setTierFilter(Array.from({ length: potRules.tier }, (_, i) => i + 1));
        if (!(await openDealsSpecies(dex))) throw new Error(`o mercado não abriu ${MARKET_SPECIES_NAMES.get(dex)}`);
      }
      for (;;) {
        const main = marketMain();
        status(`página ${currentPage(main) + 1} de ${pagesOf(main)}`);
        for (const row of main.querySelectorAll(OFFER_ROW)) {
          const listing = readDealRow(row, dex, mode);
          if (listing && !listings.some(seen => seen.id === listing.id)) listings.push(listing);
        }
        const next = main.querySelector('.mk-pager [aria-label="Próxima página"]:not(:disabled)');
        if (!next) finished.add(dex);
        if (!next || job.stopped) break;
        const page = Number(next.dataset.pg);
        await dealsPause();
        next.click();
        if (!(await waitFor(() => currentPage(marketMain()) === page && marketMain().querySelector(OFFER_ROW), 10000))) {
          throw new Error(`a página ${page + 1} de ${MARKET_SPECIES_NAMES.get(dex)} não carregou`);
        }
      }
      await dealsPause();
    }
    dealsJob = null;
    if (tiersBefore) await setTierFilter(tiersBefore);
    tiersBefore = null;
    // A stopped scan keeps the previous listings of the species it did not read to the end.
    const fresh = listings.map(({ ok, main, natureFit, ...row }) => row);
    const ids = new Set(fresh.map(row => row.id));
    const kept = (dealsResult?.all ?? []).filter(row => !finished.has(row.dex) && !ids.has(row.id));
    await rerankDeals({ at: Date.now(), all: [...fresh, ...kept] });
    if (job.stopped) dealsStatus.textContent = `Varredura parada. ${dealsStatus.textContent}`;
  } catch (error) {
    dealsJob = null;
    dealsStatus.textContent = `Varredura parada: ${error.message}.`;
    throw error;
  } finally {
    dealsJob = null;
    dealsScanButton.textContent = 'Varrer o mercado';
    if (tiersBefore) await setTierFilter(tiersBefore);
  }
}

// Ranks the saved listings with the current rule, list and rate, then saves and shows them.
async function rerankDeals(base = dealsResult) {
  if (!base?.all) return;
  const rows = await rankDeals(base.all, readMode());
  dealsResult = { at: base.at, all: base.all, listings: base.all.length, rate: dealsRate(base.all), rows };
  try {
    localStorage.setItem(DEALS_LAST_KEY, JSON.stringify({ at: base.at, all: base.all }));
  } catch {
    // Shown until the page reloads.
  }
  renderDeals();
}

// A real click or key in the market (not in this window) stops the scan.
function stopDealsOnInput(event) {
  if (!dealsJob || !event.isTrusted || dealsDialog.contains(event.target)) return;
  dealsJob.stopped = true;
}
document.addEventListener('pointerdown', stopDealsOnInput, true);
document.addEventListener('keydown', stopDealsOnInput, true);

// ---- Wiring ----
function showDealsError(error) {
  dealsStatus.textContent = `Erro nos achados: ${error.message}`;
  console.error(error);
}

function syncDeals(main) {
  if (!main) {
    if (dealsDialog.open && !dealsJob) dealsDialog.close();
    return;
  }
  const nav = main.parentElement.querySelector('.mk-side .mk-navs');
  if (nav && dealsTrigger.parentElement !== nav) nav.append(dealsTrigger);
}

dealsTrigger.onclick = event => {
  event.stopPropagation();
  if (!dealsDialog.isConnected) {
    installPriceBookStyles();
    document.head.append(dealsStyle);
    document.body.append(dealsDialog);
  }
  // Not modal: the scan drives the market behind it.
  if (!dealsDialog.open) dealsDialog.show();
  renderDeals();
  if (dealsSaved?.all && !dealsResult) rerankDeals(dealsSaved).catch(showDealsError);
};
dealsDialog.addEventListener('click', event => {
  event.stopPropagation();
  const button = event.target.closest('button');
  if (!button) return;
  const { dealsTier, dealsPick, dealsChip, dex, dealsOpen } = button.dataset;
  if (button.matches('[data-deals-close]')) {
    if (dealsJob) dealsJob.stopped = true;
    dealsDialog.close();
    return;
  }
  if (button === dealsScanButton) {
    scanDeals().catch(showDealsError);
    return;
  }
  if (dealsOpen) {
    const main = marketMain();
    if (main) navigatePriceMarket(main, 'species', dealsOpen);
    return;
  }
  if (dealsTier) {
    const tiers = new Set(dealsSettings.tiers);
    if (!tiers.delete(dealsTier)) tiers.add(dealsTier);
    dealsSettings.tiers = TIERS.filter(tier => tiers.has(tier));
  } else if (dealsPick) {
    const other = dealsPick === 'add' ? 'remove' : 'add';
    dealsSettings[other].delete(dex);
    if (!dealsSettings[dealsPick].delete(dex)) dealsSettings[dealsPick].add(dex);
  } else if (dealsChip) {
    dealsSettings[dealsChip].delete(dex);
  } else return;
  saveDealsSettings();
  renderDeals();
});
dealsDialog.addEventListener('change', ({ target }) => {
  if (target.dataset.dealsRule) setMarketPotentialRules({ ...potRules, [target.dataset.dealsRule]: Number(target.value) });
  else if (target.matches('[data-deals-rate]')) {
    const rate = Number(target.value);
    dealsSettings.rate = rate > 0 ? rate : null;
    saveDealsSettings();
  }
  if (dealsResult) rerankDeals().catch(showDealsError);
  else renderDeals();
});
dealsDialog.addEventListener('input', ({ target }) => {
  if (target.matches('[data-deals-query]')) renderDealsOptions();
});
dealsDialog.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.key === 'Escape') {
    event.preventDefault();
    if (dealsJob) dealsJob.stopped = true;
    dealsDialog.close();
  }
});
