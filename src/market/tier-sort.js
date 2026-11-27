// ---- Sorting the grouped species list by tier ----------------------------------------------
// The game sorts and paginates on its server (12 species per page) and has no tier order, so
// the script walks the pages with the current filters, copies the rows and shows them in one list.
// Copies stay inside the market, where the game's own click handler opens the species.
const TIER_SORT_KEY = 'pokeafk-market-filtros:tier-sort';
const SPECIES_ROWS = '.mk-sptable .mk-itr.mk-spr, .mk-grid > article.mk-sp';
let tierSortMode = '';
try {
  const saved = localStorage.getItem(TIER_SORT_KEY);
  tierSortMode = saved in MODES ? saved : '';
} catch {
  // Without storage the choice lasts only for this page.
}
let tierSortCache = null;
let tierSortBusy = false;
let tierSortToken = 0;
const tierSortBox = panel.querySelector('[data-tier-sort-box]');
const tierSortSelect = panel.querySelector('[data-tier-sort]');
const tierSortStatus = panel.querySelector('[data-tier-sort-status]');
tierSortSelect.value = tierSortMode;
tierSortSelect.addEventListener('change', () => {
  tierSortMode = tierSortSelect.value;
  try {
    if (tierSortMode) localStorage.setItem(TIER_SORT_KEY, tierSortMode);
    else localStorage.removeItem(TIER_SORT_KEY);
  } catch {
    // Ignored: see above.
  }
  syncMarket();
});

const marketMain = () => document.querySelector('.mk > .mk-main');
const gameRows = main => [...main.querySelectorAll(SPECIES_ROWS)].filter(row => !row.closest('[data-pafk]'));
const currentPage = main => {
  const current = main.querySelector('.mk-pager .mk-pg[aria-current="page"]');
  return current ? Number(current.textContent) - 1 : 0;
};
const firstPageSignature = main => [
  main.querySelector('.mk-count')?.textContent.trim() ?? '',
  main.querySelector('.mk-sptable') ? 'list' : 'cards',
  gameRows(main).map(row => row.querySelector('.mk-sp-go')?.dataset.species).join(','),
].join('|');

function waitFor(test, timeout = 8000) {
  return new Promise(resolve => {
    const started = performance.now();
    const check = () => {
      if (test()) return resolve(true);
      if (performance.now() - started > timeout) return resolve(false);
      setTimeout(check, 120);
    };
    check();
  });
}

async function openPage(index) {
  const main = marketMain();
  const button = main?.querySelector(`.mk-pager .mk-pg[data-pg="${index}"]`);
  if (!button || button.disabled) return false;
  button.click();
  return waitFor(() => {
    const now = marketMain();
    return now && currentPage(now) === index && gameRows(now).length > 0;
  });
}

async function collectTierSort() {
  const token = ++tierSortToken;
  tierSortBusy = true;
  tierSortStatus.textContent = 'Lendo as páginas do mercado…';
  try {
    let main = marketMain();
    if (currentPage(main) !== 0 && !(await openPage(0))) throw new Error('first page');
    main = marketMain();
    const signature = firstPageSignature(main);
    const list = Boolean(main.querySelector('.mk-sptable'));
    const head = main.querySelector('.mk-sptable .mk-ithead')?.outerHTML ?? '';
    const rows = new Map();
    for (let page = 0; page < 300; page++) {
      if (token !== tierSortToken) return;
      main = marketMain();
      for (const row of gameRows(main)) {
        const dex = row.querySelector('.mk-sp-go')?.dataset.species;
        if (dex && !rows.has(dex)) rows.set(dex, row.cloneNode(true));
      }
      tierSortStatus.textContent = `Lendo as páginas do mercado: ${page + 1}…`;
      const next = main.querySelector('.mk-pager .mk-pg[aria-label="Próxima página"]');
      if (!next || next.disabled) break;
      if (!(await openPage(page + 1))) break;
    }
    if (currentPage(marketMain()) !== 0) await openPage(0);
    if (token !== tierSortToken) return;
    tierSortCache = { signature, list, head, rows: [...rows.entries()] };
    tierSortStatus.textContent = `${rows.size} espécies ordenadas`;
  } catch {
    tierSortCache = null;
    tierSortStatus.textContent = 'Não consegui ler as páginas. Tente de novo.';
  } finally {
    if (token === tierSortToken) tierSortBusy = false;
  }
  syncMarket();
}

function renderTierSort(main) {
  const { list, head, rows } = tierSortCache;
  const mode = tierSortMode;
  const groups = new Map([...TIERS, '—'].map(tier => [tier, []]));
  for (const [dex, row] of rows) {
    const profile = speciesRating(dex, mode);
    groups.get(profile ? profile[mode].tier : '—').push({ row, score: profile ? profile[mode].score : -1 });
  }
  const container = document.createElement('div');
  container.id = 'pafk-tier-sorted';
  container.dataset.pafk = '';
  container.dataset.mode = mode;
  const body = document.createElement('div');
  if (list) {
    container.className = 'mk-itable mk-sptable';
    container.setAttribute('role', 'table');
    container.setAttribute('aria-label', 'Pokémon à venda, pela tier list');
    container.insertAdjacentHTML('beforeend', head);
    body.className = 'mk-itbody';
    body.setAttribute('role', 'rowgroup');
  } else {
    body.className = 'mk-grid';
  }
  for (const [tier, members] of groups) {
    if (!members.length) continue;
    members.sort((a, b) => b.score - a.score);
    const heading = document.createElement('div');
    heading.className = 'pafk-sort-group';
    if (list) heading.setAttribute('role', 'row');
    const label = tier === '—' ? 'Sem tier' : `Tier ${tier}`;
    heading.innerHTML = `<span class="${TIER_BADGE}"></span><b></b><small></small>`;
    if (tier !== '—') heading.firstChild.append(tierSegment(mode, tier, false));
    else heading.firstChild.remove();
    heading.querySelector('b').textContent = `${label} · ${MODES[mode].label}`;
    heading.querySelector('small').textContent = `${members.length} ${members.length === 1 ? 'espécie' : 'espécies'}`;
    body.append(heading, ...members.map(member => member.row.cloneNode(true)));
  }
  container.append(body);
  return container;
}

function syncTierSort(main, grouped) {
  tierSortBox.hidden = !grouped;
  const active = Boolean(grouped && tierSortMode);
  const current = main?.querySelector('#pafk-tier-sorted');
  if (!active) {
    tierSortToken++;
    tierSortBusy = false;
    tierSortStatus.textContent = '';
    current?.remove();
    if (main) delete main.dataset.pafkSorted;
    return;
  }
  if (tierSortBusy) return;
  const onFirstPage = currentPage(main) === 0;
  const gameList = gameRows(main).length ? gameRows(main)[0].closest('.mk-sptable, .mk-grid') : null;
  if (!gameList) return;
  if (!tierSortCache || (onFirstPage && tierSortCache.signature !== firstPageSignature(main))) {
    current?.remove();
    delete main.dataset.pafkSorted;
    collectTierSort();
    return;
  }
  main.dataset.pafkSorted = '';
  if (current?.dataset.mode === tierSortMode && current.previousElementSibling === gameList) return;
  current?.remove();
  gameList.after(renderTierSort(main));
  decorateTierBadges();
}
