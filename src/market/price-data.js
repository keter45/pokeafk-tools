// Comparação de preço a partir dos IVs e dos preços pedidos no mercado.
const PRICE_HISTORY_KEY = 'pokeafk-market-filtros:price-history';
const PRICE_HISTORY_AGE = 7 * 24 * 60 * 60 * 1000;
const IV_MAX_TOTAL = 186;
const PRICE_SAMPLE_SIZE = 5;
const priceNumber = new Intl.NumberFormat('pt-BR');
const priceDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function priceIVTotal(ivs) {
  const values = STATS.map(([stat]) => ivs?.[stat]);
  return values.every(validIV) ? values.reduce((sum, value) => sum + value, 0) : null;
}

function priceVariant(sprite) {
  return sprite?.getAttribute('src')?.match(/\/assets\/mon\/front\/((\d+)[\w-]*)\.png(?:[?#].*)?$/);
}

function readPriceTarget(main) {
  if (!main?.parentElement.matches('.mk[data-page="create"]')) return null;
  const preview = main.querySelector('.mk-ivs-pv')?.parentElement;
  const variant = priceVariant(preview?.querySelector('.mk-pv-mon img'));
  const name = preview?.querySelector('.mk-pv-name')?.textContent.trim();
  const ivs = readIVs(preview?.querySelector('.mk-ivs-pv'));
  const total = priceIVTotal(ivs);
  if (!variant || !name || total === null) return null;
  const level = readPriceLevel([...preview.querySelectorAll('.mk-fact b')].find(el =>
    /^Nv\./.test(el.textContent.trim())));
  const own = main.querySelector('[data-own-mon][aria-pressed="true"], [data-own-mon].on');
  const key = own?.dataset.ownMon ?? JSON.stringify([variant[1], name, ivs, level]);
  return { key, dex: Number(variant[2]), variant: variant[1], name, ivs, total, level };
}

function defaultPriceCriteria({ ivs, total }) {
  const perfect = STATS.filter(([stat]) => ivs[stat] === 31);
  const best = STATS.reduce((a, b) => ivs[b[0]] > ivs[a[0]] ? b : a);
  const priority = perfect.length ? perfect : [best];
  return {
    total: Math.max(0, total - 5),
    minimums: new Map(priority.map(([stat]) => [stat, Math.max(0, ivs[stat] - (perfect.length ? 0 : 2))])),
  };
}

function readPriceAmount(raw = '') {
  const amount = raw.trim().replace(/^₽\s*/, '');
  if (!/^(?:\d+|\d{1,3}(?:[.\s]\d{3})+)$/.test(amount)) return null;
  const value = Number(amount.replace(/\D/g, ''));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function readPriceLevel(node) {
  return Number(node?.textContent.trim().match(/^Nv\.\s*([\d.]+)$/)?.[1].replaceAll('.', '')) || 0;
}

function readPriceOffers(main) {
  const variants = new Map();
  const rows = main.querySelectorAll(OFFER_ROW);
  for (const row of rows) {
    const id = row.querySelector('[data-buy]')?.dataset.buy;
    const variant = priceVariant(row.querySelector('img.mk-front'))?.[1];
    if (!id || !variant) continue;
    const { ivs, nature } = readOffer(row);
    const total = priceIVTotal(ivs);
    const money = row.querySelector('.mk-coin-n');
    const gems = row.querySelector('.mk-gem-n');
    const price = readPriceAmount(money?.title || money?.textContent);
    if (total === null || price === null) continue;
    if (!variants.has(variant)) variants.set(variant, new Map());
    variants.get(variant).set(id, {
      ivs, total, nature, price,
      gems: readPriceAmount(gems?.title || gems?.textContent),
      level: readPriceLevel(row.querySelector('.mk-lv')),
    });
  }
  return {
    variants: new Map([...variants].map(([variant, offers]) => [variant, [...offers.values()]])),
    rowCount: rows.length,
  };
}

function nearestPriceOffers(offers, target, { total, minimums }) {
  const stats = [...minimums];
  const matches = offers.flatMap(offer => {
    if (offer.total < total || stats.some(([stat, min]) => offer.ivs[stat] < min)) return [];
    const statDistance = stats.reduce((sum, [stat]) => sum + Math.abs(offer.ivs[stat] - target.ivs[stat]), 0);
    return [{ offer, distance: Math.abs(offer.total - target.total) + 4 * statDistance }];
  });
  matches.sort((a, b) => a.distance - b.distance ||
    Math.abs(a.offer.level - target.level) - Math.abs(b.offer.level - target.level));
  return { count: matches.length, sample: matches.slice(0, PRICE_SAMPLE_SIZE).map(({ offer }) => offer) };
}

function summarizePrice(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return {
    estimate: sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2),
    min: sorted[0],
    max: sorted.at(-1),
  };
}

function readPriceHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(PRICE_HISTORY_KEY) ?? '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter(entry => typeof entry?.variant === 'string'
      && Date.now() - entry.at < PRICE_HISTORY_AGE && Array.isArray(entry.offers) && entry.offers.length);
  } catch {
    return [];
  }
}

function savePriceHistoryFallback(variant, snapshot) {
  if (!snapshot.offers.length) return;
  const previous = readPriceHistory().filter(entry => entry.variant !== variant);
  try {
    localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify([
      { variant, ...snapshot }, ...previous.slice(0, 11),
    ]));
  } catch {
    // O resultado da consulta continua disponível no formulário.
  }
}
