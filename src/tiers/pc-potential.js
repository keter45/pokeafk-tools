// Pedido do usuário (2026-11-23): o PC do jogo só filtra por IV total, e achar Pokémon com
// potencial na caixa é difícil. Cada cartão do PC (`.t5-mon.pcx[data-pc]`) é lido do DOM e
// comparado com a build da espécie no guia (forma final de referência, lista escolhida):
//   - IV do ataque principal (o primeiro entre Atq e Atq. Esp. nos IVs prioritários) ≥ 28;
//   - HP e Velocidade ≥ 25 (secundários, valem para todos);
//   - classe de IV do jogo Tier 1 ou 2.
// Esses são os valores padrão; o jogador escolhe outros na barra (pedido do usuário, 2026-11-23).
// A natureza que aumenta o ataque principal não é exigida: só aparece como ponto positivo (em verde no cartão).
// Quem tem potencial ganha uma tag pequena "POT" ao lado do nome; os outros continuam visíveis.
// A natureza que aumenta o ataque principal fica em verde (▲) e a que reduz, em vermelho (▼).
// O botão "Potencial" liga os filtros do próprio jogo "IV 70% ou mais" e ordem "Melhor IV" (pedido do
// usuário: esconder cartões deixava a paginação ruim); desligado, tira os dois.
// "Próxima com potencial" passa as páginas (o jogo pagina de 40 em 40) até achar um.
const POT_DEFAULT_RULES = { main: PRIORITY_IV, hp: 25, spe: 25, tier: 2 };
const POT_RULES_KEY = 'pokeafk-market-filtros:pc-potential-rules';
const POT_RULE_FIELDS = [
  ['main', 'Ataque', 'IV mínimo no ataque principal da build (Atq ou Atq. Esp.)'],
  ['hp', 'HP', 'IV mínimo de HP'],
  ['spe', 'Vel', 'IV mínimo de Velocidade'],
];
const POT_ATTR = 'data-pafk-pot';
const POT_CARD = '.t5-pc [data-pc-zone] .t5-mon.pcx[data-pc]';
const POT_BOX_CARD = '.t5-pc [data-pc-zone="box"] .t5-mon.pcx[data-pc]';
const POT_IV_LABELS = { hp: 'HP', atk: 'ATQ', spa: 'AT.E', spe: 'VEL' };

let potStylesInstalled = false;
let potScan = null; // { status: 'running' | 'found' | 'end', text }

class PotPageTimeout extends Error {}

// The toggle shows whether the game's own chips are on, since the game keeps (or resets) them.
function gameFiltersOn() {
  const chip = key => document.querySelector(`.modal.open .t5-pc [data-pc-rmf="${key}"]`)?.textContent ?? '';
  return /70%/.test(chip('iv')) && /Melhor IV/i.test(chip('order'));
}

function readPotRules() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(POT_RULES_KEY) ?? '{}') ?? {};
  } catch {
    saved = {};
  }
  const pick = (key, low, high) => {
    const value = Number(saved[key]);
    return Number.isInteger(value) && value >= low && value <= high ? value : POT_DEFAULT_RULES[key];
  };
  return { main: pick('main', 0, 31), hp: pick('hp', 0, 31), spe: pick('spe', 0, 31), tier: pick('tier', 1, 5) };
}

function savePotRules(rules) {
  try {
    localStorage.setItem(POT_RULES_KEY, JSON.stringify(rules));
  } catch {
    // Without storage the values last until the page reloads.
  }
}

let potRules = readPotRules();

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
    { stat: main, need: potRules.main },
    { stat: 'hp', need: potRules.hp },
    { stat: 'spe', need: potRules.spe },
  ].map(check => ({ ...check, value: ivs[check.stat], ok: ivs[check.stat] >= check.need }));
  const effect = nature ? NATURE_EFFECTS.get(nature) : null;
  let natureFit = null;
  if (effect && effect.up !== effect.down) {
    if (effect.up === main) natureFit = 'up';
    else if (effect.down === main) natureFit = 'down';
  }
  const ok = tier <= potRules.tier && checks.every(check => check.ok);
  return { ok, profile, main, checks, tier, nature, natureFit };
}

function potTitle(result, mode) {
  const reference = result.profile.name;
  const parts = result.checks.map(({ stat, value, need, ok }) =>
    `${STAT_LABELS.get(stat)} ${value}/31 (mín. ${need}) ${ok ? '✓' : '✗'}`);
  parts.push(`classe de IV Tier ${result.tier} (até Tier ${potRules.tier}) ${result.tier <= potRules.tier ? '✓' : '✗'}`);
  let natureText = '';
  if (result.natureFit === 'up') natureText = `Natureza ${result.nature} aumenta ${STAT_LABELS.get(result.main)} (ponto positivo).`;
  else if (result.natureFit === 'down') natureText = `Natureza ${result.nature} reduz ${STAT_LABELS.get(result.main)}.`;
  const head = result.ok ? 'Potencial' : 'Sem potencial';
  return `${head} (${MODES[mode].title}, ${reference}: ataque principal ${STAT_LABELS.get(result.main)}). `
    + `${parts.join(' · ')}.${natureText ? ` ${natureText}` : ''}`;
}

function decoratePcCard(card, mode) {
  const stamp = `${mode}:${potRules.main}-${potRules.hp}-${potRules.spe}-${potRules.tier}:`;
  if (card.getAttribute(POT_ATTR)?.startsWith(stamp)) return;
  card.querySelectorAll('.pafk-pot-iv').forEach(cell => cell.classList.remove('pafk-pot-iv', 'is-low'));
  card.querySelector(':scope .pafk-pot-tag')?.remove();
  card.querySelector('.pcx-nat')?.classList.remove('pafk-pot-nat', 'is-down');
  // The game's own title is kept aside so a mode change does not stack two explanations.
  if (!card.hasAttribute('data-pafk-title')) card.setAttribute('data-pafk-title', card.title);
  card.title = card.getAttribute('data-pafk-title');
  const result = evaluatePotential(card, mode);
  if (!result) {
    card.setAttribute(POT_ATTR, `${stamp}unknown`);
    return;
  }
  card.setAttribute(POT_ATTR, `${stamp}${result.ok ? 'yes' : 'no'}`);
  const natureCell = card.querySelector('.pcx-nat');
  if (natureCell && result.natureFit) {
    natureCell.classList.add('pafk-pot-nat');
    natureCell.classList.toggle('is-down', result.natureFit === 'down');
  }
  // Pedido do usuário: em todos os cartões, os 3 IVs que contam têm borda verde (atinge o mínimo)
  // ou vermelha (abaixo do mínimo), e o motivo vai no title.
  const wanted = new Map(result.checks.map(check => [POT_IV_LABELS[check.stat], check]));
  for (const cell of card.querySelectorAll('.pcx-ivc')) {
    const check = wanted.get(cell.querySelector('small')?.textContent.trim());
    if (check) cell.classList.add('pafk-pot-iv', ...(check.ok ? [] : ['is-low']));
  }
  card.title = `${card.getAttribute('data-pafk-title')} · ${potTitle(result, mode)}`;
  if (!result.ok) return;
  // Nada em cima da foto, só uma tag pequena ao lado do nome.
  const tag = document.createElement('span');
  tag.className = 'pafk-pot-tag';
  tag.dataset.pafk = '';
  tag.textContent = 'POT';
  tag.setAttribute('aria-label', 'Tem potencial');
  card.querySelector('.pcx-top')?.append(tag);
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
        title="Liga os filtros do jogo IV 70% ou mais e ordem Melhor IV. Os Pokémon que atingem os IVs mínimos escolhidos ao lado (ataque principal da build, HP e Velocidade) e a classe de IV ganham a tag POT.">★ Potencial</button>
      <span class="pafk-pot-modes" role="group" aria-label="Build de referência">
        ${Object.entries(MODES).map(([key, info]) => `<button type="button" data-pot-mode="${key}" aria-pressed="false">${info.short}</button>`).join('')}
      </span>
      <span class="pafk-pot-rules" role="group" aria-label="O que conta como potencial">
        ${POT_RULE_FIELDS.map(([key, label, hint]) => `<label title="${hint}"><span>${label} ≥</span><select data-pot-rule="${key}" aria-label="${hint}">${Array.from({ length: 32 }, (_, value) => `<option value="${value}">${value}</option>`).join('')}</select></label>`).join('')}
        <label title="Classe de IV do jogo (Tier 1 é a melhor)"><span>Classe até</span><select data-pot-rule="tier" aria-label="Classe de IV máxima">${[1, 2, 3, 4, 5].map(value => `<option value="${value}">Tier ${value}</option>`).join('')}</select></label>
        <button type="button" class="pafk-pot-reset" data-pot-reset title="Voltar a ataque ≥ ${POT_DEFAULT_RULES.main}, HP e Vel ≥ ${POT_DEFAULT_RULES.hp}, até Tier ${POT_DEFAULT_RULES.tier}">Padrão</button>
      </span>
      <span class="pafk-pot-status" data-pot-status aria-live="polite"></span>
      <button type="button" class="pafk-pot-next" data-pot-next>Próxima com potencial ›</button>`;
    bar.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      event.stopPropagation();
      if (button.matches('[data-pot-toggle]')) {
        potScan = null;
        applyGameFilters(!gameFiltersOn());
      } else if (button.dataset.potMode) {
        saveMode(button.dataset.potMode);
        potScan = null;
      } else if (button.matches('[data-pot-next]')) {
        findNextPotentialPage();
      } else if (button.matches('[data-pot-reset]')) {
        potRules = { ...POT_DEFAULT_RULES };
        savePotRules(potRules);
        potScan = null;
      }
      decoratePc();
    });
    bar.addEventListener('change', event => {
      const select = event.target.closest('[data-pot-rule]');
      if (!select) return;
      event.stopPropagation();
      potRules = { ...potRules, [select.dataset.potRule]: Number(select.value) };
      savePotRules(potRules);
      potScan = null;
      decoratePc();
    });
    // Keys typed in the selects must not reach the game's shortcuts.
    bar.addEventListener('keydown', event => event.stopPropagation());
    tools.append(bar);
  }
  const toggle = bar.querySelector('[data-pot-toggle]');
  const potEnabled = gameFiltersOn();
  toggle.setAttribute('aria-pressed', String(potEnabled));
  for (const button of bar.querySelectorAll('[data-pot-mode]')) {
    button.setAttribute('aria-pressed', String(button.dataset.potMode === mode));
  }
  for (const select of bar.querySelectorAll('[data-pot-rule]')) {
    const value = String(potRules[select.dataset.potRule]);
    if (select.value !== value) select.value = value;
  }
  const { total, found } = boxPageCounts();
  const next = nextPageButton();
  const running = potScan?.status === 'running';
  let text = potScan?.text ?? '';
  if (!text) text = found ? `${found} de ${total} com potencial nesta página` : `Nenhum dos ${total} desta página tem potencial`;
  const status = bar.querySelector('[data-pot-status]');
  if (status.textContent !== text) status.textContent = text;
  const nextButton = bar.querySelector('[data-pot-next]');
  nextButton.hidden = !next && !running;
  nextButton.disabled = running || !next || next.disabled;
  nextButton.textContent = running ? 'Procurando…' : 'Próxima com potencial ›';
}

// The game's filter panel only exists while open, and every change redraws the window, so each
// step looks the element up again.
const POT_GAME_FILTERS = [['[data-pc-iv]', '70', 'iv'], ['[data-pc-order]', 'ivDown', 'order']];

async function waitForPc(selector) {
  const started = Date.now();
  while (Date.now() - started < 3000) {
    const element = document.querySelector(`.modal.open .t5-pc ${selector}`);
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, 80));
  }
  throw new PotPageTimeout(`O PC não mostrou ${selector}.`);
}

async function applyGameFilters(on) {
  try {
    if (!on) {
      for (const [, , key] of POT_GAME_FILTERS) {
        document.querySelector(`.modal.open .t5-pc [data-pc-rmf="${key}"]`)?.click();
        await new Promise(resolve => setTimeout(resolve, 80));
      }
      return;
    }
    if (!document.querySelector('.modal.open .t5-pc .t5-pc-fpanel')) (await waitForPc('[data-pc-filters]')).click();
    for (const [selector, value] of POT_GAME_FILTERS) {
      const select = await waitForPc(selector);
      if (select.value === value) continue;
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 80));
    }
    (await waitForPc('[data-pc-filters-done]')).click();
  } catch (error) {
    if (!(error instanceof PotPageTimeout)) throw error;
    potScan = { status: 'end', text: 'Não consegui ligar os filtros do jogo; use Filtros' };
    decoratePc();
  }
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
    .t5-pc .pcx-nat.pafk-pot-nat { color: #1d6b34; font-weight: 900; }
    .t5-pc .pcx-nat.pafk-pot-nat::before { content: "▲ "; }
    .t5-pc .pcx-nat.pafk-pot-nat.is-down { color: #b3261e; }
    .t5-pc .pcx-nat.pafk-pot-nat.is-down::before { content: "▼ "; }
    .t5-pc .pcx-top .pafk-pot-tag {
      flex: none; margin-left: 4px; padding: 0 4px; border: 1px solid #c79400; border-radius: 4px;
      background: #ffd34d; color: #5a3b00; font-size: 9px; font-weight: 900; line-height: 14px; letter-spacing: .03em;
    }
    .t5-pc .pcx-ivc.pafk-pot-iv { outline: 2px solid #1f9d55; outline-offset: 0; border-radius: 4px; }
    .t5-pc .pcx-ivc.pafk-pot-iv.is-low { outline-color: #d93025; }
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
    .pafk-pot-rules { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .pafk-pot-rules label { display: inline-flex; align-items: center; gap: 4px; font-weight: 800; }
    .pafk-pot-rules select {
      min-height: 34px; padding: 2px 4px; border: 2px solid #14206b; border-radius: 8px;
      background: #fff; color: #14206b; font: inherit; font-weight: 800; font-variant-numeric: tabular-nums;
    }
    .pafk-pot-status { font-variant-numeric: tabular-nums; font-weight: 700; color: #465982; }
  `;
  document.head.append(style);
}

function decoratePc() {
  const pc = document.querySelector('.t5-pc');
  if (!pc) return;
  ensurePotStyles();
  const mode = readMode();
  for (const card of document.querySelectorAll(POT_CARD)) decoratePcCard(card, mode);
  const tools = pc.querySelector('[data-pc-zone="box"] .t5-pc-tools');
  if (tools) potToolbar(tools, mode);
}
