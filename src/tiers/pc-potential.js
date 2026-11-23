// Pedido do usuário (2026-11-23): o PC do jogo só filtra por IV total, e achar Pokémon com
// potencial na caixa é difícil. Cada cartão do PC (`.t5-mon.pcx[data-pc]`) é lido do DOM e
// comparado com a build da espécie no guia (forma final de referência, lista escolhida):
//   - IV do ataque principal (o primeiro entre Atq e Atq. Esp. nos IVs prioritários) ≥ 28;
//   - HP e Velocidade ≥ 25 (secundários, valem para todos);
//   - classe de IV do jogo Tier 1 ou 2.
// A natureza que aumenta o ataque principal não é exigida: só aparece como ponto positivo (em verde no cartão).
// O botão "Potencial" na barra da caixa esconde os outros cartões da página aberta (o jogo
// pagina de 40 em 40) e "Próxima com potencial" passa as páginas até achar um.
const POT_MAIN_IV = PRIORITY_IV;
const POT_SECONDARY_IV = 25;
const POT_MAX_IV_TIER = 2;
const POT_KEY = 'pokeafk-market-filtros:pc-potential';
const POT_ATTR = 'data-pafk-pot';
const POT_CARD = '.t5-pc [data-pc-zone] .t5-mon.pcx[data-pc]';
const POT_BOX_CARD = '.t5-pc [data-pc-zone="box"] .t5-mon.pcx[data-pc]';
const POT_IV_LABELS = { hp: 'HP', atk: 'ATQ', spa: 'AT.E', spe: 'VEL' };

let potStylesInstalled = false;
let potScan = null; // { status: 'running' | 'found' | 'end', text }

class PotPageTimeout extends Error {}

function readPotEnabled() {
  try {
    return localStorage.getItem(POT_KEY) === '1';
  } catch {
    return false;
  }
}

function savePotEnabled(on) {
  try {
    localStorage.setItem(POT_KEY, on ? '1' : '0');
  } catch {
    // Without storage the choice lasts until the page reloads.
  }
}

let potEnabled = readPotEnabled();

// Reference build: the profile of the sprite's form (Megas) or the species' best final evolution.
function potProfile(card, mode) {
  const src = card.querySelector('.pcx-spr')?.getAttribute('src') ?? '';
  const match = src.match(/\/assets\/mon\/front\/(\d+)(-[a-z-]+?)?s?\.png/);
  if (!match) return null;
  const form = match[2] ? MARKET_GUIDE?.profiles?.[`${match[1]}${match[2]}`] : null;
  if (form && rated(form, mode)) return form;
  return speciesRating(match[1], mode);
}

function mainAttackStat(profile, mode) {
  const first = profile[mode]?.priority?.find(stat => stat === 'atk' || stat === 'spa');
  if (first) return first;
  return profile.stats.atk >= profile.stats.spa ? 'atk' : 'spa';
}

function readPcCard(card) {
  const ivs = {};
  for (const cell of card.querySelectorAll('.pcx-ivc')) {
    const stat = STAT_KEYS.get(cell.querySelector('small')?.textContent.trim());
    const value = Number(cell.querySelector('b')?.textContent.trim());
    if (stat && Number.isFinite(value)) ivs[stat] = value;
  }
  const tier = Number(card.querySelector('.pcx-tier')?.textContent.match(/(\d)/)?.[1]);
  // In sale mode the card shows the price instead of the nature.
  const nature = card.querySelector('.pcx-nat')?.textContent.trim() || null;
  return { ivs, tier, nature };
}

function evaluatePotential(card, mode) {
  const profile = potProfile(card, mode);
  const { ivs, tier, nature } = readPcCard(card);
  if (!profile || !Number.isFinite(tier) || ['hp', 'atk', 'spa', 'spe'].some(stat => !(stat in ivs))) return null;
  const main = mainAttackStat(profile, mode);
  const checks = [
    { stat: main, need: POT_MAIN_IV },
    { stat: 'hp', need: POT_SECONDARY_IV },
    { stat: 'spe', need: POT_SECONDARY_IV },
  ].map(check => ({ ...check, value: ivs[check.stat], ok: ivs[check.stat] >= check.need }));
  const effect = nature ? NATURE_EFFECTS.get(nature) : null;
  let natureFit = null;
  if (effect && effect.up !== effect.down) {
    if (effect.up === main) natureFit = 'up';
    else if (effect.down === main) natureFit = 'down';
  }
  const ok = tier <= POT_MAX_IV_TIER && checks.every(check => check.ok);
  return { ok, profile, main, checks, tier, nature, natureFit };
}

function potTitle(result, mode) {
  const reference = result.profile.name;
  const parts = result.checks.map(({ stat, value, need, ok }) =>
    `${STAT_LABELS.get(stat)} ${value}/31 (mín. ${need}) ${ok ? '✓' : '✗'}`);
  parts.push(`classe de IV Tier ${result.tier} (até Tier ${POT_MAX_IV_TIER}) ${result.tier <= POT_MAX_IV_TIER ? '✓' : '✗'}`);
  let natureText = '';
  if (result.natureFit === 'up') natureText = `Natureza ${result.nature} aumenta ${STAT_LABELS.get(result.main)} (ponto positivo).`;
  else if (result.natureFit === 'down') natureText = `Natureza ${result.nature} reduz ${STAT_LABELS.get(result.main)}.`;
  const head = result.ok ? 'Potencial' : 'Sem potencial';
  return `${head} (${MODES[mode].title}, ${reference}: ataque principal ${STAT_LABELS.get(result.main)}). `
    + `${parts.join(' · ')}.${natureText ? ` ${natureText}` : ''}`;
}

function decoratePcCard(card, mode) {
  const stamp = `${mode}:`;
  if (card.getAttribute(POT_ATTR)?.startsWith(stamp)) return;
  card.querySelectorAll('.pafk-pot-iv').forEach(cell => cell.classList.remove('pafk-pot-iv'));
  card.querySelector('.pafk-pot-nat')?.classList.remove('pafk-pot-nat');
  // The game's own title is kept aside so a mode change does not stack two explanations.
  if (!card.hasAttribute('data-pafk-title')) card.setAttribute('data-pafk-title', card.title);
  card.title = card.getAttribute('data-pafk-title');
  const result = evaluatePotential(card, mode);
  if (!result) {
    card.setAttribute(POT_ATTR, `${stamp}unknown`);
    return;
  }
  card.setAttribute(POT_ATTR, `${stamp}${result.ok ? 'yes' : 'no'}`);
  if (!result.ok) return;
  const wanted = new Map(result.checks.map(check => [POT_IV_LABELS[check.stat], check]));
  for (const cell of card.querySelectorAll('.pcx-ivc')) {
    if (wanted.has(cell.querySelector('small')?.textContent.trim())) cell.classList.add('pafk-pot-iv');
  }
  // Pedido do usuário: nada em cima da foto. O motivo vai no title do cartão e a natureza que
  // aumenta o ataque principal fica em verde.
  card.title = `${card.getAttribute('data-pafk-title')} · ${potTitle(result, mode)}`;
  if (result.natureFit === 'up') card.querySelector('.pcx-nat')?.classList.add('pafk-pot-nat');
}

function boxPageCounts() {
  const cards = [...document.querySelectorAll(POT_BOX_CARD)];
  return { total: cards.length, found: cards.filter(card => card.getAttribute(POT_ATTR)?.endsWith(':yes')).length };
}

function potToolbar(tools, mode) {
  let bar = tools.querySelector(':scope > .pafk-pot');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'pafk-pot';
    bar.dataset.pafk = '';
    bar.innerHTML = `
      <button type="button" class="pafk-pot-toggle" data-pot-toggle aria-pressed="false"
        title="Mostra só os Pokémon da caixa com IV ≥ ${POT_MAIN_IV} no ataque principal da build, HP e Velocidade ≥ ${POT_SECONDARY_IV} e classe de IV até Tier ${POT_MAX_IV_TIER}. Natureza que aumenta o ataque principal fica em verde.">★ Potencial</button>
      <span class="pafk-pot-modes" role="group" aria-label="Build de referência">
        ${Object.entries(MODES).map(([key, info]) => `<button type="button" data-pot-mode="${key}" aria-pressed="false">${info.short}</button>`).join('')}
      </span>
      <span class="pafk-pot-status" data-pot-status aria-live="polite"></span>
      <button type="button" class="pafk-pot-next" data-pot-next>Próxima com potencial ›</button>`;
    bar.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      event.stopPropagation();
      if (button.matches('[data-pot-toggle]')) {
        potEnabled = !potEnabled;
        savePotEnabled(potEnabled);
        potScan = null;
      } else if (button.dataset.potMode) {
        saveMode(button.dataset.potMode);
        potScan = null;
      } else if (button.matches('[data-pot-next]')) {
        findNextPotentialPage();
      }
      decoratePc();
    });
    tools.append(bar);
  }
  const toggle = bar.querySelector('[data-pot-toggle]');
  toggle.setAttribute('aria-pressed', String(potEnabled));
  for (const button of bar.querySelectorAll('[data-pot-mode]')) {
    button.setAttribute('aria-pressed', String(button.dataset.potMode === mode));
  }
  const { total, found } = boxPageCounts();
  const next = nextPageButton();
  const running = potScan?.status === 'running';
  let text = potScan?.text ?? '';
  if (!text && potEnabled) {
    text = found ? `${found} de ${total} nesta página` : `Nenhum dos ${total} desta página`;
  } else if (!text) {
    text = found ? `${found} com potencial nesta página` : '';
  }
  const status = bar.querySelector('[data-pot-status]');
  if (status.textContent !== text) status.textContent = text;
  const nextButton = bar.querySelector('[data-pot-next]');
  nextButton.hidden = !potEnabled || (!next && !running);
  nextButton.disabled = running || !next || next.disabled;
  nextButton.textContent = running ? 'Procurando…' : 'Próxima com potencial ›';
}

function nextPageButton() {
  return document.querySelector('.t5-pc [data-pc-zone="box"] .t5-pc-bar:not(.is-bottom) [data-pc-page="1"]');
}

function pageLabel() {
  return document.querySelector('.t5-pc [data-pc-zone="box"] .t5-pc-bar:not(.is-bottom) .t5-pc-pages b')?.textContent.trim() ?? '';
}

async function waitPageChange(before) {
  const started = Date.now();
  while (Date.now() - started < 4000) {
    await new Promise(resolve => setTimeout(resolve, 120));
    if (pageLabel() && pageLabel() !== before) return;
  }
  throw new PotPageTimeout('A caixa não mudou de página.');
}

async function findNextPotentialPage() {
  if (potScan?.status === 'running') return;
  potScan = { status: 'running', text: 'Procurando nas próximas páginas…' };
  decoratePc();
  try {
    let checked = 0;
    for (;;) {
      const next = nextPageButton();
      if (!next || next.disabled) {
        potScan = { status: 'end', text: checked ? `Fim da caixa: nenhum nas ${checked} páginas seguintes` : 'Esta é a última página' };
        break;
      }
      const before = pageLabel();
      next.click();
      await waitPageChange(before);
      checked++;
      decoratePc();
      const { found } = boxPageCounts();
      if (found) {
        potScan = null;
        document.querySelector(`${POT_BOX_CARD}[${POT_ATTR}$=":yes"]`)?.scrollIntoView({ block: 'center' });
        break;
      }
      potScan = { status: 'running', text: `Procurando… página ${pageLabel()}` };
      decoratePc();
    }
  } catch (error) {
    if (!(error instanceof PotPageTimeout)) {
      potScan = { status: 'end', text: `Erro: ${error.message}` };
      decoratePc();
      throw error;
    }
    potScan = { status: 'end', text: 'A caixa não respondeu; tente de novo' };
  }
  decoratePc();
}

function ensurePotStyles() {
  if (potStylesInstalled) return;
  potStylesInstalled = true;
  const style = document.createElement('style');
  style.dataset.pafk = '';
  style.textContent = `
    html.pafk-pot-on ${POT_BOX_CARD}:not([${POT_ATTR}$=":yes"]) { display: none !important; }
    .t5-pc .pcx-nat.pafk-pot-nat { color: #1d6b34; font-weight: 900; }
    .t5-pc .pcx-nat.pafk-pot-nat::before { content: "▲ "; }
    .t5-pc .pcx-ivc.pafk-pot-iv { outline: 2px solid #1f9d55; outline-offset: 0; border-radius: 4px; }
    .t5-pc-tools .pafk-pot {
      display: flex; flex-wrap: wrap; align-items: center; gap: 6px; flex-basis: 100%;
      font-size: 12px; color: #152964;
    }
    .pafk-pot button {
      min-height: 34px; padding: 4px 12px; border: 2px solid #14206b; border-radius: 8px;
      background: #fff; color: #14206b; font: inherit; font-weight: 800; cursor: pointer;
      box-shadow: 0 2px 0 #14206b;
    }
    .pafk-pot button:disabled { opacity: .55; cursor: default; }
    .pafk-pot button[hidden] { display: none; }
    .pafk-pot .pafk-pot-toggle[aria-pressed="true"] { background: #ffd34d; color: #5a3b00; }
    .pafk-pot-modes { display: inline-flex; }
    .pafk-pot-modes button { border-radius: 0; min-width: 48px; }
    .pafk-pot-modes button:first-child { border-radius: 8px 0 0 8px; }
    .pafk-pot-modes button + button { border-left-width: 0; border-radius: 0 8px 8px 0; }
    .pafk-pot-modes button[aria-pressed="true"] { background: #14206b; color: #fff; }
    .pafk-pot-status { font-variant-numeric: tabular-nums; font-weight: 700; color: #465982; }
  `;
  document.head.append(style);
}

function decoratePc() {
  const pc = document.querySelector('.t5-pc');
  document.documentElement.classList.toggle('pafk-pot-on', Boolean(pc && potEnabled));
  if (!pc) return;
  ensurePotStyles();
  const mode = readMode();
  for (const card of document.querySelectorAll(POT_CARD)) decoratePcCard(card, mode);
  const tools = pc.querySelector('[data-pc-zone="box"] .t5-pc-tools');
  if (tools) potToolbar(tools, mode);
}
