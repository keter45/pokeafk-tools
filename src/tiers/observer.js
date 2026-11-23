// Sincronização com a tela do jogo: um único MutationObserver para mercado, MAPA e ficha.
function syncAll() {
  if (document.querySelector('.mk, .modal .mx-row, .modal .mx-card, .lab[data-lab-dex]')) ensureStyles();
  decorateMap();
  decorateSheet();
  decorateNatures();
  decoratePc();
  syncMarket();
}

function syncMarket() {
  if (document.querySelector('.mk')) {
    ensureStyles();
    decorateTierBadges();
  }
  const main = document.querySelector('.mk > .mk-main');
  syncPriceComparison(main);
  syncPriceBook(main);
  const speciesTools = main?.querySelector(':scope > .mk-offer-tools');
  const species = main?.querySelector(':scope > .mk-spec');
  const market = main?.parentElement;
  const isPokemonBrowse = market?.matches('[data-page="mons"]')
    && market.querySelector('[data-tkind="mons"][aria-pressed="true"]');
  const browseTools = isPokemonBrowse && main.querySelector(':scope > .mk-tools-bar');
  const dex = species?.querySelector('.mk-dexno')?.textContent.trim().match(/^#(\d+)$/)?.[1];
  const isSpecies = Boolean(speciesTools && dex);
  if (!isSpecies && !browseTools) {
    scope = null;
    tierDialog?.close();
    panel.remove();
    return;
  }

  const grouped = browseTools && market.querySelector('[data-grouped][aria-pressed="true"]');
  const nextScope = isSpecies ? `species:${Number(dex)}` : (grouped ? null : 'all');

  if (isSpecies) {
    if (species.previousElementSibling !== panel) species.before(panel);
  } else if (browseTools.nextElementSibling !== panel) {
    browseTools.after(panel);
  }
  if (scope !== nextScope) {
    scope = nextScope;
    filters = nextScope ? readFilters(nextScope) : emptyFilters();
    loadForm(form, filters);
  }
  const nextDex = isSpecies ? Number(dex) : null;
  if (recommendationDex !== nextDex) {
    recommendationDex = nextDex;
    updateRecommendation(nextDex);
  }

  const speciesName = species?.querySelector('h2')?.textContent.trim();
  const heading = speciesName ? `Filtros de ${speciesName}` : 'Filtros de Pokémon';
  if (title.textContent !== heading) title.textContent = heading;
  form.hidden = !scope;
  groupedHint.hidden = Boolean(scope);
  const nativeNature = speciesTools?.querySelector('[aria-label="Natureza"]')?.textContent.trim();
  showResults(main.querySelector(OFFER_LIST), nativeNature);
  syncTierSort(main, Boolean(browseTools && grouped));
}

// Market, MAPA and FICHA DO POKÉMON all live in game windows (.mk inside .modal).
const WATCHED = '.mk, .modal';
const observer = new MutationObserver(records => {
  const relevant = records.some(({ target, addedNodes, removedNodes }) => {
    const element = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
    if (panel.contains(element) || tierDialog?.contains(element)) return false;
    if (element?.closest(`[data-pafk], .${TIER_BADGE}`)) return false;
    const changed = [...addedNodes, ...removedNodes];
    if (changed.length && changed.every(node => node.nodeType === Node.ELEMENT_NODE
      && (node.hasAttribute('data-pafk') || node.classList.contains(TIER_BADGE)))) return false;
    if (element?.closest(WATCHED)) return true;
    return changed.some(node => node.nodeType === Node.ELEMENT_NODE
      && (node.matches(WATCHED) || node.querySelector(WATCHED)));
  });
  if (pending || !relevant) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    syncAll();
  });
});
observer.observe(document.body, {
  subtree: true, childList: true, characterData: true, attributes: true,
  attributeFilter: ['aria-pressed', 'data-page'],
});
syncAll();
