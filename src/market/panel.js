// Painel de filtros do mercado: HTML, eventos e carga dos filtros salvos.
function createPanel(update) {
  const panel = document.createElement('section');
  panel.id = 'pafk-market-filters';
  panel.setAttribute('aria-labelledby', 'pafk-filter-title');
  panel.innerHTML = `
    <div class="pafk-filter-header">
      <h3 id="pafk-filter-title"></h3>
      <button type="button" data-open-tier aria-haspopup="dialog" hidden>Tier list</button>
    </div>
    <form novalidate>
      <details class="pafk-offer-filters">
      <summary>Natureza e IV mínimo <span data-offer-filter-count></span></summary>
      <div class="pafk-form-grid">
        <fieldset class="pafk-iv-box">
          <legend>IV mínimo <span>(0–31)</span></legend>
          <div class="pafk-ivs">${STATS.map(([stat, label]) => `
            <div class="pafk-iv" data-iv="${stat}">
              <label for="pafk-iv-${stat}">${label}</label>
              <input id="pafk-iv-${stat}" type="number" name="${stat}" min="0" max="31" step="1"
                inputmode="numeric" placeholder="—" autocomplete="off" aria-label="IV mínimo de ${label}">
              <input type="range" data-iv-range="${stat}" min="0" max="31" step="1" value="0"
                aria-label="IV mínimo de ${label} (controle deslizante)">
            </div>`).join('')}
          </div>
        </fieldset>
        <fieldset class="pafk-nat-box">
          <legend>Naturezas <span data-count></span></legend>
          <div class="pafk-nat-chart">
            <span class="pafk-nat-corner" aria-hidden="true">sobe ↓<br>cai →</span>
            ${NATURE_STATS.map(stat => `<button type="button" class="pafk-nat-head" data-nat-col="${stat}"
              aria-pressed="false" aria-label="Marcar naturezas que reduzem ${STAT_LABELS.get(stat)}">−${STAT_LABELS.get(stat)}</button>`).join('')}
            ${NATURE_CHART.map((row, up) => `
              <button type="button" class="pafk-nat-head" data-nat-row="${NATURE_STATS[up]}" aria-pressed="false"
                aria-label="Marcar naturezas que aumentam ${STAT_LABELS.get(NATURE_STATS[up])}">+${STAT_LABELS.get(NATURE_STATS[up])}</button>
              ${row.map((nature, down) => `
                <label class="pafk-nat${up === down ? ' is-neutral' : ''}" data-up="${NATURE_STATS[up]}" data-down="${NATURE_STATS[down]}">
                  <input type="checkbox" name="nature" value="${nature}" aria-label="${nature}: ${natureEffect(nature)}">
                  <span>${nature}</span><small aria-hidden="true">${natureEffect(nature)}</small>
                </label>`).join('')}`).join('')}
          </div>
        </fieldset>
      </div>
      <div class="pafk-actions">
        <p class="pafk-form-hint">Os filtros valem na hora. Vazio ou 0 aceita qualquer IV.<span class="pafk-head-hint"> Clique em +Atq, −Vel… para marcar a linha ou coluna inteira.</span></p>
        <button type="button" data-clear>Limpar natureza e IVs</button>
      </div>
      </details>
    </form>
    <div class="pafk-search-results" data-market-results hidden>
      <p role="status" data-status></p>
    </div>
    <section class="pafk-recommendation" data-recommendation aria-labelledby="pafk-rec-title" hidden>
      <div class="pafk-recommendation-title">
        <h4 id="pafk-rec-title">Recomendação</h4>
        <span data-build-reference></span>
        <label class="pafk-mode-pick">Lista <select data-mode>
          ${Object.entries(MODES).map(([mode, { label }]) => `<option value="${mode}">${label}</option>`).join('')}
        </select></label>
      </div>
      <label data-branch hidden>Forma de referência <select></select></label>
      <div data-build hidden>
        <p>Natureza principal <strong data-best-nature></strong><span data-alt-natures></span></p>
        <p>IVs prioritários <strong data-build-priority></strong></p>
        <p>Golpes recomendados <strong data-best-moves></strong></p>
        <details>
          <summary>Stats base e detalhes da nota</summary>
          <p><strong>Stats base</strong> <span data-base-stats></span></p>
          <p data-build-note></p>
        </details>
        <button type="button" data-fill-natures>Preencher natureza e IVs</button>
        <p class="pafk-fill-hint">Marca as naturezas recomendadas e IV mínimo ${PRIORITY_IV} nos atributos prioritários.</p>
      </div>
      <p data-no-build hidden>Sem dados de stats e golpes naturais para esta espécie.</p>
    </section>`;

  const form = panel.querySelector('form');
  const apply = () => {
    update(readForm(form));
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    for (const [stat] of STATS) {
      const input = form.elements.namedItem(stat);
      input.value = cleanIV(input.value);
    }
    syncForm(form);
    apply();
  });
  form.addEventListener('input', event => {
    const target = event.target;
    if (target.dataset.ivRange) {
      const input = form.elements.namedItem(target.dataset.ivRange);
      input.value = target.value === '0' ? '' : target.value;
      syncIVRow(form, target.dataset.ivRange);
      apply();
    } else if (target.type === 'number') {
      syncIVRow(form, target.name);
      apply();
    }
  });
  form.addEventListener('change', event => {
    const target = event.target;
    if (target.name === 'nature') {
      updateNatureCount(form);
      apply();
    } else if (target.type === 'number') {
      target.value = cleanIV(target.value);
      syncIVRow(form, target.name);
      apply();
    }
  });
  form.addEventListener('click', event => {
    const head = event.target.closest('.pafk-nat-head');
    if (!head) return;
    const boxes = natureGroup(form, head);
    const check = !boxes.every(box => box.checked);
    for (const box of boxes) box.checked = check;
    updateNatureCount(form);
    apply();
  });
  panel.querySelector('[data-clear]').addEventListener('click', () => {
    form.reset();
    syncForm(form);
    update(emptyFilters());
  });
  const tierTrigger = panel.querySelector('[data-open-tier]');
  tierTrigger.hidden = !rankedProfiles.length;
  tierTrigger.addEventListener('click', () => {
    tierDialog ??= createTierDialog(tierTrigger);
    tierDialog.showModal();
  });
  return panel;
}

function loadForm(form, { natures, minimums }) {
  setNatureCheckboxes(form, natures);
  for (const [stat] of STATS) {
    form.elements.namedItem(stat).value = cleanIV(minimums.get(stat) ?? '');
  }
  syncForm(form);
}
