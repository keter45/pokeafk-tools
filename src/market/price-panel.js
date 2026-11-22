// Painel do comparador. O mesmo nó é recolocado quando o jogo redesenha o anúncio.
const pricePanel = document.createElement('section');
pricePanel.className = 'pafk-price';
pricePanel.dataset.pafk = '';
pricePanel.setAttribute('aria-labelledby', 'pafk-price-title');
pricePanel.innerHTML = `
  <h4 id="pafk-price-title">Comparar preços</h4>
  <p data-price-target></p>
  <details data-price-filters>
    <summary>Filtros de IV</summary>
    <label class="pafk-price-total">IV total mínimo <input type="number" min="0" max="186" step="1" data-price-total></label>
    <fieldset>
      <legend>IV mínimo por atributo</legend>
      <div class="pafk-price-stats">
        ${STATS.map(([stat, label, short]) => `
          <div>
            <label title="${label}"><input type="checkbox" data-price-stat="${stat}"> ${short}</label>
            <input type="number" min="0" max="31" step="1" aria-label="IV mínimo de ${label}" data-price-min="${stat}">
          </div>`).join('')}
      </div>
    </fieldset>
    <button type="button" class="pafk-price-link" data-price-reset>Restaurar filtros sugeridos</button>
  </details>
  <p class="pafk-price-muted" data-price-criteria></p>
  <button type="button" class="mk-btn mk-pri pafk-price-action" data-price-search>Buscar comparáveis</button>
  <p class="pafk-price-muted" data-price-status role="status"></p>
  <button type="button" class="pafk-price-link" data-price-old hidden>Ver consulta anterior</button>
  <div class="pafk-price-result" data-price-result hidden>
    <div class="pafk-price-estimate">
      <span>Preço aproximado</span>
      <strong data-price-estimate></strong>
      <small data-price-range></small>
      <small data-price-gap hidden></small>
    </div>
    <button type="button" class="mk-btn mk-ghost pafk-price-action" data-price-use>Preencher preço em ₽</button>
    <button type="button" class="pafk-price-link" data-price-use-gems hidden></button>
    <details data-price-comparables>
      <summary></summary>
      <ul></ul>
    </details>
  </div>
  <div class="pafk-price-estimate" data-price-sales hidden>
    <span>Vendas na base por IV total</span>
    <b></b><small></small>
  </div>`;

const priceSearchButton = pricePanel.querySelector('[data-price-search]');
const priceTotalInput = pricePanel.querySelector('[data-price-total]');
const priceStatFields = new Map(STATS.map(([stat, , label]) => [stat, {
  label,
  check: pricePanel.querySelector(`[data-price-stat="${stat}"]`),
  input: pricePanel.querySelector(`[data-price-min="${stat}"]`),
}]));
const priceResult = pricePanel.querySelector('[data-price-result]');
const priceComparables = pricePanel.querySelector('[data-price-comparables]');
const priceUse = pricePanel.querySelector('[data-price-use]');
const priceUseGems = pricePanel.querySelector('[data-price-use-gems]');
const priceOld = pricePanel.querySelector('[data-price-old]');
const priceStatus = pricePanel.querySelector('[data-price-status]');
const priceSales = pricePanel.querySelector('[data-price-sales]');

function setPriceCriteria(target) {
  const { total, minimums } = defaultPriceCriteria(target);
  priceTotalInput.value = total;
  for (const [stat, { check, input }] of priceStatFields) {
    check.checked = minimums.has(stat);
    input.value = minimums.get(stat) ?? target.ivs[stat];
  }
}

function priceInputNumber(input) {
  return Math.min(Number(input.max), Math.max(0, Math.round(input.valueAsNumber || 0)));
}

function getPriceCriteria() {
  return {
    total: priceInputNumber(priceTotalInput),
    minimums: new Map([...priceStatFields].flatMap(([stat, { check, input }]) =>
      check.checked && input.value !== '' ? [[stat, priceInputNumber(input)]] : [])),
  };
}

const formatPriceMoney = amount => `₽${priceNumber.format(amount)}`;

function formatPriceComparable(offer, criteria) {
  const row = document.createElement('li');
  const strong = document.createElement('b');
  strong.textContent = formatPriceMoney(offer.price);
  const iv = document.createElement('span');
  iv.textContent = [
    `IV ${offer.total}/${IV_MAX_TOTAL}`,
    ...[...criteria.minimums].map(([stat]) => `${priceStatFields.get(stat).label} ${offer.ivs[stat]}`),
  ].join(' · ');
  const detail = document.createElement('small');
  detail.textContent = [
    offer.level && `Nv. ${offer.level}`,
    offer.nature,
    offer.gems && `${priceNumber.format(offer.gems)} diam.`,
  ].filter(Boolean).join(' · ');
  row.append(strong, iv, detail);
  return row;
}

function showPriceComparison(state) {
  const { target, snapshot, previous, error, applied } = state;
  const criteria = getPriceCriteria();
  for (const { check, input } of priceStatFields.values()) input.disabled = !check.checked;
  const { count, sample } = nearestPriceOffers(snapshot?.offers ?? [], target, criteria);
  const money = summarizePrice(sample.map(offer => offer.price));
  const gems = summarizePrice(sample.map(offer => offer.gems).filter(Boolean));
  state.money = money?.estimate;
  state.gems = gems?.estimate;
  const filters = [`IV total ≥ ${criteria.total}`, ...[...criteria.minimums].map(([stat, min]) =>
    `${priceStatFields.get(stat).label} ≥ ${min}`)];
  pricePanel.querySelector('[data-price-criteria]').textContent = filters.join(' · ');
  priceSearchButton.textContent = snapshot ? 'Consultar novamente' : 'Buscar comparáveis';
  priceOld.hidden = !previous || previous === snapshot || count > 0 ||
    !nearestPriceOffers(previous.offers, target, criteria).count;
  priceResult.hidden = !money;
  const messages = [error];
  if (snapshot) {
    messages.push(snapshot.historical
      ? `Histórico local de ${priceDate.format(snapshot.at)}.`
      : `Consulta de ${priceDate.format(snapshot.at)}.`);
    if (snapshot.scoped) messages.push('Limpe os filtros do mercado para ampliar a busca.');
    if (!snapshot.offers.length) messages.push('Nenhum anúncio disponível para esta forma.');
    else if (!count) messages.push('Nenhum anúncio comparável. Você pode reduzir os mínimos de IV.');
    else messages.push(`${count} ${count === 1 ? 'anúncio atende' : 'anúncios atendem'} aos filtros.`);
  }
  if (applied) messages.push('Preço preenchido. Você pode editá-lo no anúncio.');
  priceStatus.textContent = messages.filter(Boolean).join(' ');
  showPriceSales(state, criteria.total);
  if (!money) return;

  pricePanel.querySelector('[data-price-estimate]').textContent = `≈ ${formatPriceMoney(money.estimate)}`;
  pricePanel.querySelector('[data-price-range]').textContent = sample.length > 1
    ? `Preços pedidos de ${formatPriceMoney(money.min)} a ${formatPriceMoney(money.max)}${sample.length < 3 ? ' · amostra pequena' : ''}`
    : 'Preço pedido em um único anúncio';
  const gap = sample[0].total - target.total;
  const gapNote = pricePanel.querySelector('[data-price-gap]');
  gapNote.hidden = Math.abs(gap) <= 5;
  if (!gapNote.hidden) {
    gapNote.textContent = `O mais próximo tem IV ${sample[0].total}/186 (${gap > 0 ? '+' : '−'}${Math.abs(gap)}).`;
  }
  priceUseGems.hidden = !gems;
  if (gems) priceUseGems.textContent = `Preencher ≈ ${priceNumber.format(gems.estimate)} diam.`;
  priceComparables.querySelector('summary').textContent = sample.length === 1
    ? '1 anúncio comparável' : `${sample.length} anúncios mais próximos`;
  priceComparables.querySelector('ul').replaceChildren(...sample.map(offer => formatPriceComparable(offer, criteria)));
}

function showPriceSales({ target, sales }, minimum) {
  const min = Math.max(0, minimum, target.total - 10);
  const max = Math.min(IV_MAX_TOTAL, target.total + 10);
  const close = (sales ?? []).filter(sale => sale.total >= min && sale.total <= max);
  priceSales.hidden = !close.length;
  if (priceSales.hidden) return;
  const money = summarizePrice(close.filter(sale => sale.currency === 'money').map(sale => sale.amount));
  const gems = summarizePrice(close.filter(sale => sale.currency === 'gems').map(sale => sale.amount));
  priceSales.querySelector('b').textContent = [
    money && `≈ ${formatPriceMoney(money.estimate)}`,
    gems && `≈ ${priceNumber.format(gems.estimate)} diam.`,
  ].filter(Boolean).join(' · ');
  priceSales.querySelector('small').textContent =
    `${close.length} ${close.length === 1 ? 'venda' : 'vendas'} · IV ${min}–${max}/186 · últimos 30 dias`;
}

function showPriceTarget(target) {
  const percent = Math.round(target.total / IV_MAX_TOTAL * 100);
  pricePanel.querySelector('[data-price-target]').textContent =
    `${target.name} · IV ${target.total}/${IV_MAX_TOTAL} (${percent}%)`;
  pricePanel.querySelector('[data-price-filters]').open = false;
  priceComparables.open = false;
  setPriceCriteria(target);
}

function installPriceStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .mk .pafk-price, .mk .pafk-price-wait {
      display:grid; gap:8px; padding:11px; border:1px solid #bfd7fa; border-radius:12px;
      background:#f5f9ff; color:#152a61; font-size:12px; line-height:1.4;
      font-variant-numeric:tabular-nums;
    }
    .mk .pafk-price { margin:0 0 12px; min-width:0; }
    .mk .pafk-price-wait { margin:0 0 10px; grid-template-columns:1fr auto; align-items:center; }
    .mk .pafk-price [hidden] { display:none !important; }
    .mk .pafk-price h4, .mk .pafk-price p { margin:0; }
    .mk .pafk-price h4 { font-size:14px; text-wrap:balance; }
    .mk .pafk-price [data-price-target] { font-weight:700; }
    .mk .pafk-price-muted, .mk .pafk-price small { color:#425b85; }
    .mk .pafk-price [data-price-status]:empty { display:none; }
    .mk .pafk-price details { border-top:1px solid #d5e3f7; }
    .mk .pafk-price summary { cursor:pointer; padding:8px 0 2px; color:#1556b4; font-weight:750; }
    .mk .pafk-price fieldset { margin:8px 0 4px; padding:0; border:0; min-width:0; }
    .mk .pafk-price legend { margin-bottom:4px; padding:0; }
    .mk .pafk-price-total { display:flex; align-items:center; justify-content:space-between; gap:6px; margin-top:7px; }
    .mk .pafk-price-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:5px; }
    .mk .pafk-price-stats label { display:flex; align-items:center; gap:3px; white-space:nowrap; cursor:pointer; }
    .mk .pafk-price input[type="checkbox"] { flex:none; margin:0; accent-color:#1556b4; }
    .mk[data-page="create"] .pafk-price input[type="number"] {
      box-sizing:border-box; width:100%; min-width:0; min-height:29px; padding:2px 4px;
      border:1px solid #a9c6ee; border-radius:6px; background:#fff; color:#152a61; font:inherit;
    }
    .mk .pafk-price-total input { width:64px !important; }
    .mk[data-page="create"] .pafk-price input[type="number"]:disabled {
      color:#4b6082; background:#eaf0fa; opacity:1;
    }
    .mk[data-page="create"] .pafk-price button.pafk-price-action {
      width:100%; min-height:40px; font-size:12px; white-space:normal;
    }
    .mk .pafk-price-link {
      justify-self:start; color:#1556b4; font:inherit; font-weight:750; background:none;
      border:0; padding:4px 0; cursor:pointer; text-decoration:underline;
    }
    .mk .pafk-price :is(button, input, summary):focus-visible, .mk .pafk-price-wait button:focus-visible {
      outline:2px solid #1556b4; outline-offset:2px;
    }
    .mk .pafk-price-result { display:grid; gap:7px; }
    .mk .pafk-price-estimate {
      display:grid; gap:1px; padding:8px; border:1px solid #c9ddf7; border-radius:8px; background:#eaf3ff;
    }
    .mk .pafk-price-estimate strong { font-size:19px; line-height:1.2; overflow-wrap:anywhere; }
    .mk .pafk-price ul { margin:5px 0 0; padding:0; list-style:none; }
    .mk .pafk-price li { display:grid; gap:1px; padding:5px 0; border-bottom:1px solid #d5e3f7; }
    .mk .pafk-price li:last-child { border-bottom:0; }
  `;
  document.head.append(style);
}
