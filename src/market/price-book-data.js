// Vendas públicas individuais e uma observação de preços pedidos por forma e dia.
const PRICE_BOOK_DB = 'pokeafk-tools-prices';
const PRICE_BOOK_DAY = 24 * 60 * 60 * 1000;
const priceBookDay = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short' });
let priceBookConnection;
let priceBookImport;
let priceBookRevision = 0;

const priceBookText = value => value.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase();

function openPriceBook() {
  if (priceBookConnection) return priceBookConnection;
  priceBookConnection = new Promise((resolve, reject) => {
    const request = indexedDB.open(PRICE_BOOK_DB, 1);
    request.onupgradeneeded = () => {
      for (const kind of ['sales', 'asks']) {
        const store = request.result.createObjectStore(kind, { keyPath: 'id' });
        store.createIndex('at', 'at');
        store.createIndex('variant', 'variant');
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        priceBookConnection = null;
      };
      resolve(db);
    };
  }).catch(error => {
    priceBookConnection = null;
    throw error;
  });
  return priceBookConnection;
}

async function writePriceBook(kind, records) {
  if (!records.length) return false;
  const db = await openPriceBook();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(kind, 'readwrite');
    const store = transaction.objectStore(kind);
    let changed = false;
    for (const record of records) {
      const request = store.get(record.id);
      request.onsuccess = () => {
        const previous = request.result;
        // Uma linha resumida do histórico não pode apagar os IVs de um detalhe já aberto.
        const newer = kind === 'asks' ? record.at > previous?.at : record.ivs && !previous?.ivs;
        if (previous && !newer) return;
        store.put(record);
        changed = true;
      };
    }
    transaction.oncomplete = () => {
      if (changed) priceBookRevision++;
      resolve(changed);
    };
    transaction.onabort = () => reject(transaction.error);
  });
}

function priceBookAsks(variant, at, offers) {
  return { id: [variant, priceBookDay.format(at)], variant, at, offers };
}

async function readPriceBook(kind, since, variant) {
  priceBookImport ??= writePriceBook('asks', readPriceHistory().filter(entry => !entry.scoped)
    .map(entry => priceBookAsks(entry.variant, entry.at, entry.offers)));
  await priceBookImport.catch(() => { priceBookImport = null; });
  const db = await openPriceBook();
  return new Promise((resolve, reject) => {
    const store = db.transaction(kind).objectStore(kind);
    const request = variant
      ? store.index('variant').getAll(variant)
      : store.index('at').getAll(IDBKeyRange.lowerBound(since));
    request.onsuccess = () => resolve(request.result.filter(row => row.at >= since));
    request.onerror = () => reject(request.error);
  });
}

function readPriceSale(row) {
  const target = row.querySelector('.mk-history-target');
  const variant = priceVariant(target?.querySelector('img'))?.[1];
  const iv = [...(target?.querySelectorAll('small span') ?? [])]
    .map(el => el.textContent.trim().match(/^IV\s+(\d+)\/186$/)).find(Boolean);
  const total = Number(iv?.[1]);
  const id = row.dataset.histDetail;
  const at = Date.parse(row.querySelector('time')?.dateTime);
  const value = row.querySelector('.mk-history-value .mk-coin-n, .mk-history-value .mk-gem-n');
  const amount = readPriceAmount(value?.title || value?.textContent);
  if (!id || !variant || !Number.isFinite(at) || !amount || !Number.isInteger(total) || total > IV_MAX_TOTAL) return null;
  const level = [...target.querySelectorAll('small span')].map(readPriceLevel).find(Boolean) ?? 0;
  const detail = row.nextElementSibling;
  const ivs = detail?.matches('.mk-history-detail') ? readIVs(detail.querySelector('.mk-ivs')) : null;
  const currency = value.matches('.mk-coin-n') ? 'money' : 'gems';
  return { id, variant, at, amount, currency, total, level, ...(priceIVTotal(ivs) === total ? { ivs } : {}) };
}

function priceBookIdentity(variant) {
  const dex = Number(variant.match(/^\d+/)?.[0]);
  const shiny = variant.endsWith('s');
  const form = shiny ? variant.slice(0, -1) : variant;
  const species = MARKET_GUIDE.species[dex]?.name ?? `Pokémon #${dex}`;
  const name = MARKET_GUIDE.profiles[form]?.name ?? (form.includes('-')
    ? `${species} (${form.split('-').slice(1).join(' ')})` : species);
  return { dex, name, form: shiny ? 'Shiny' : form.includes('-') ? 'Forma especial' : 'Normal' };
}

function priceBookSnapshotSample(snapshot, { min, max, currency }) {
  return snapshot.offers.flatMap(offer => {
    const amount = currency === 'gems' ? offer.gems : offer.price;
    return amount && offer.total >= min && offer.total <= max ? [amount] : [];
  });
}

function priceBookGroups(records, kind, filters) {
  const groups = new Map();
  for (const record of records) {
    if (!groups.has(record.variant)) groups.set(record.variant, []);
    groups.get(record.variant).push(record);
  }
  return [...groups].flatMap(([variant, group]) => {
    group.sort((a, b) => b.at - a.at);
    const sales = kind === 'sales';
    const observations = sales
      ? group.filter(({ total, currency }) => total >= filters.min && total <= filters.max && currency === filters.currency)
      : group;
    let latest = observations[0];
    let sample = [];
    if (sales) sample = observations.map(sale => sale.amount);
    else {
      for (const observation of observations) {
        sample = priceBookSnapshotSample(observation, filters);
        if (!sample.length) continue;
        latest = observation;
        break;
      }
    }
    if (!sample.length) return [];
    return [{
      variant, ...priceBookIdentity(variant), at: latest.at, count: sample.length,
      summary: summarizePrice(sample), observations,
    }];
  });
}
