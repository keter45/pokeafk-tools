// Busca por espécie, tier da lista e potencial (os limites são os mesmos do PC).
const MARKET_SEARCH_KEY = 'pokeafk-market-filtros:busca';
const MARKET_SPECIES = DEX.flatMap((entry, dex) => entry ? [[String(dex), entry.split(':')[0]]] : []);
const MARKET_SPECIES_NAMES = new Map(MARKET_SPECIES);
const marketSpeciesOptions = MARKET_SPECIES.map(([dex, name]) => ({ dex, name, query: marketSearchText(name) }))
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

function marketSearchText(value) {
  return value.toLowerCase().normalize('NFD').replace(/[^\p{L}\p{N}♀♂]/gu, '');
}

function marketSearchSet(saved, valid) {
  return new Set(Array.isArray(saved) ? saved.filter(value => valid.includes(value)) : []);
}

function readMarketSearch() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(MARKET_SEARCH_KEY));
  } catch {
    // A busca ainda funciona durante esta sessão.
  }
  const dexes = [...MARKET_SPECIES_NAMES.keys()];
  const include = marketSearchSet(saved?.include, dexes);
  const exclude = marketSearchSet(saved?.exclude, dexes);
  for (const dex of exclude) include.delete(dex);
  return { include, exclude, tiers: marketSearchSet(saved?.tiers, TIERS), potential: saved?.potential === true };
}

let marketSearch = readMarketSearch();

function hasSpeciesFilters() {
  return marketSearch.include.size || marketSearch.exclude.size || marketSearch.tiers.size;
}

function matchesMarketSpecies(dex, mode) {
  const { include, exclude, tiers } = marketSearch;
  return !exclude.has(dex) && (!include.size || include.has(dex))
    && (!tiers.size || tiers.has(speciesRating(dex, mode)?.[mode].tier));
}

function saveMarketSearch() {
  const { include, exclude, tiers, potential } = marketSearch;
  try {
    localStorage.setItem(MARKET_SEARCH_KEY, JSON.stringify({ include: [...include], exclude: [...exclude], tiers: [...tiers], potential }));
  } catch {
    // A seleção continua ativa mesmo sem armazenamento.
  }
}

const marketSearchTools = document.createElement('section');
marketSearchTools.className = 'pafk-market-search';
marketSearchTools.innerHTML = `
  <div class="pafk-market-search-controls">
    <details data-market-picker>
      <summary>Incluir ou excluir espécies</summary>
      <label class="pafk-sr-only" for="pafk-market-species-query">Nome ou número na Pokédex</label>
      <input id="pafk-market-species-query" type="search" placeholder="Nome ou nº na Pokédex" autocomplete="off" spellcheck="false">
      <p role="status" data-market-picker-status></p>
      <ul data-market-species-options></ul>
    </details>
    <label data-market-mode-label>Lista <select data-market-mode>
      ${Object.entries(MODES).map(([mode, { label }]) => `<option value="${mode}">${label}</option>`).join('')}
    </select></label>
    <fieldset class="pafk-market-tiers" data-market-tiers>
      <legend class="pafk-sr-only">Ranking de espécies</legend>
      <span aria-hidden="true">Ranking</span>
      ${TIERS.map(tier => `<button type="button" class="pafk-tier-seg" data-tier="${tier}" data-market-tier="${tier}" aria-label="Tier ${tier}" aria-pressed="false">${tier}</button>`).join('')}
    </fieldset>
    <label data-market-potential-label><input type="checkbox" data-market-potential> Só com potencial</label>
    <button type="button" data-market-clear>Limpar busca</button>
  </div>
  <div class="pafk-market-chips" data-market-chips role="group" aria-label="Espécies selecionadas" hidden></div>
  <details data-market-pot-rules>
    <summary>Limites de potencial da Caixa <span data-market-rule-summary></span></summary>
    <div class="pafk-market-rule-controls">
      ${POT_RULE_FIELDS.map(([key, label, tip]) => `
        <label title="${tip}">${label} ≥ <select data-market-rule="${key}" aria-label="${tip}">
          ${Array.from({ length: 32 }, (_, iv) => `<option>${iv}</option>`).join('')}
        </select></label>`).join('')}
      <label>Classe de IV até <select data-market-rule="tier">
        ${[1, 2, 3, 4, 5].map(tier => `<option value="${tier}">Tier ${tier}</option>`).join('')}
      </select></label>
      <button type="button" data-market-pot-reset>Padrão</button>
    </div>
  </details>`;
panel.querySelector('.pafk-filter-header').after(marketSearchTools);
panel.dataset.pafk = '';
panel.addEventListener('click', event => event.stopPropagation());
panel.addEventListener('keydown', event => {
  if (event.target.matches('input, select')) event.stopPropagation();
});

const marketPicker = marketSearchTools.querySelector('[data-market-picker]');
const marketPickerInput = marketPicker.querySelector('input');
const marketPickerList = marketPicker.querySelector('[data-market-species-options]');
const marketChips = marketSearchTools.querySelector('[data-market-chips]');
const marketMode = marketSearchTools.querySelector('[data-market-mode]');
const marketPotential = marketSearchTools.querySelector('[data-market-potential]');
const marketClear = marketSearchTools.querySelector('[data-market-clear]');
const marketRuleDetails = marketSearchTools.querySelector('[data-market-pot-rules]');

function renderSpeciesOptions() {
  const query = marketSearchText(marketPickerInput.value);
  const number = /^\d+$/.test(query) ? String(Number(query)) : null;
  const matches = query ? marketSpeciesOptions.filter(option => number
    ? option.dex === number : option.query.includes(query)) : [];
  marketPicker.querySelector('[data-market-picker-status]').textContent = matches.length > 8
    ? 'Digite mais letras para refinar a busca.' : query && !matches.length ? 'Nenhuma espécie encontrada.' : '';
  marketPickerList.replaceChildren(...matches.slice(0, 8).map(({ dex, name }) => {
    const row = document.createElement('li');
    row.innerHTML = '<span></span><button type="button" data-pick-species="include">Incluir</button>'
      + '<button type="button" data-pick-species="exclude">Excluir</button>';
    row.firstElementChild.textContent = name;
    for (const button of row.querySelectorAll('button')) {
      button.dataset.dex = dex;
      button.setAttribute('aria-label', `${button.textContent} ${name}`);
    }
    return row;
  }));
  syncSpeciesOptions();
}

function syncSpeciesOptions() {
  for (const button of marketPickerList.querySelectorAll('[data-pick-species]')) {
    button.setAttribute('aria-pressed', String(marketSearch[button.dataset.pickSpecies].has(button.dataset.dex)));
  }
}

function renderMarketChips() {
  marketChips.replaceChildren(...['include', 'exclude'].flatMap(key => [...marketSearch[key]].map(dex => {
    const name = MARKET_SPECIES_NAMES.get(dex);
    const included = key === 'include';
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.removeSpecies = key;
    button.dataset.dex = dex;
    button.textContent = `${included ? '+' : '−'} ${name} ×`;
    button.setAttribute('aria-label', `Remover ${name} das espécies ${included ? 'incluídas' : 'excluídas'}`);
    return button;
  })));
}

function syncMarketSearch(view) {
  const browsing = view !== 'species';
  const grouped = view === 'grouped';
  marketPicker.hidden = !browsing;
  marketMode.closest('label').hidden = !browsing;
  marketMode.value = readMode();
  marketSearchTools.querySelector('[data-market-tiers]').hidden = !browsing;
  marketChips.hidden = !browsing || !marketChips.childElementCount;
  marketPotential.closest('label').hidden = grouped;
  marketPotential.checked = marketSearch.potential;
  marketClear.hidden = !browsing || !(hasSpeciesFilters() || marketSearch.potential);
  marketRuleDetails.hidden = grouped || !marketSearch.potential;
  const { main, hp, spe, tier } = potRules;
  const ruleSummary = `· Ataque principal ≥ ${main} · HP ≥ ${hp} · Vel ≥ ${spe} · até Tier ${tier}`;
  const summary = marketRuleDetails.querySelector('[data-market-rule-summary]');
  if (summary.textContent !== ruleSummary) summary.textContent = ruleSummary;
  for (const select of marketRuleDetails.querySelectorAll('[data-market-rule]')) {
    select.value = potRules[select.dataset.marketRule];
  }
  for (const button of marketSearchTools.querySelectorAll('[data-market-tier]')) {
    button.setAttribute('aria-pressed', String(marketSearch.tiers.has(button.dataset.marketTier)));
  }
}

function changeMarketSearch() {
  saveMarketSearch();
  renderMarketChips();
  syncSpeciesOptions();
  syncMarket();
}

function setMarketPotentialRules(rules) {
  potRules = rules;
  savePotRules(rules);
  syncAll();
}

marketPickerInput.addEventListener('input', renderSpeciesOptions);
marketSearchTools.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  const { pickSpecies, removeSpecies, dex, marketTier } = button.dataset;
  if (pickSpecies) {
    const selected = marketSearch[pickSpecies];
    if (selected.has(dex)) selected.delete(dex);
    else {
      marketSearch[pickSpecies === 'include' ? 'exclude' : 'include'].delete(dex);
      selected.add(dex);
    }
  } else if (removeSpecies) {
    marketSearch[removeSpecies].delete(dex);
    marketPicker.querySelector('summary').focus();
  } else if (marketTier) {
    if (!marketSearch.tiers.delete(marketTier)) marketSearch.tiers.add(marketTier);
  } else if (button === marketClear) {
    marketSearch = { include: new Set(), exclude: new Set(), tiers: new Set(), potential: false };
    marketPickerInput.value = '';
    renderSpeciesOptions();
    marketPicker.querySelector('summary').focus();
  } else if (button.hasAttribute('data-market-pot-reset')) {
    setMarketPotentialRules({ ...POT_DEFAULT_RULES });
    return;
  } else return;
  changeMarketSearch();
});

marketSearchTools.addEventListener('change', ({ target }) => {
  if (target === marketMode) {
    saveMode(marketMode.value);
    syncAll();
  } else if (target === marketPotential) {
    marketSearch.potential = marketPotential.checked;
    changeMarketSearch();
  } else if (target.dataset.marketRule) {
    setMarketPotentialRules({ ...potRules, [target.dataset.marketRule]: Number(target.value) });
  }
});

renderMarketChips();

// Result of the filters on the page the player is looking at. The script no longer turns pages
// itself (removed in 2.0.0: the game blocks and reports clicks sent by scripts).
const marketResults = panel.querySelector('[data-market-results]');
const marketStatus = panel.querySelector('[data-status]');

function showMarketMessage(message) {
  if (marketStatus.textContent !== message) marketStatus.textContent = message;
  marketResults.hidden = !message;
}
