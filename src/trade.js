// ---- Troca automática entre as suas contas ----
// Pedido do usuário: no menu de um Pokémon do PC (`.t5-pick`, aberto ao clicar nele), o bloco
// "Trocar com" tem um botão por conta aberta em outra aba. Ao clicar, as duas abas fazem a troca
// sozinhas, só com cliques na tela, como o jogador faria:
//   quem envia: convite (menu → Amigos → Buscar jogador → TROCAR) → espera a janela TROCA →
//               acha o Pokémon (busca pelo nome e páginas) → oferece → espera a oferta da outra
//               conta → CONFIRMAR → CONTINUAR TROCANDO.
//   quem recebe: aceita o convite dessa conta → espera a oferta → oferece um Pokémon qualquer da
//               caixa (não favorito, não brilhante) → CONFIRMAR → CONTINUAR TROCANDO.
// As abas conversam pelo armazenamento do Tampermonkey (o mesmo `store` do monitor, que vale para
// todas as abas e contêineres): `trade:ask:<quem recebe>` (pedido, gravado por quem envia) e
// `trade:ans:<quem envia>` (erro do outro lado). Sem esse pedido, nenhum convite é aceito sozinho.
// Depois de CONTINUAR TROCANDO a sessão fica aberta: quem recebe continua respondendo sozinho às
// próximas ofertas da mesma conta até a janela fechar (ENCERRAR ou CANCELAR).

const ASK_PREFIX = 'trade:ask:';
const ANSWER_PREFIX = 'trade:ans:';
const ASK_FRESH = 60 * 1000;            // a request older than this is ignored
const PARTNER_STATES = new Set(['hunting', 'fishing', 'idle']);
const TRADE_ICON = '/assets/ui/win/trade.png';

// Expected stops: the game did not react, a window closed, the player stopped it, preconditions.
class TradeStop extends Error {}

let job = null;      // this tab sending: { partner, stopped }
let follow = null;   // this tab answering: { partner, id, at, opened, gone, offeredAt, okAt, againAt }
let handledAsk = '';
const autoTradeBusy = () => Boolean(job || follow);

const sameName = (a, b) => Boolean(a && b) && nameKey(a) === nameKey(b);
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const tradeWindow = () => $$('.modal.open .t5-trade').find(visible) ?? null;
// "KETER oferece" while choosing; the done screen only says "Você recebeu".
const partnerOf = win => text($('.t5-offer:not(.is-mine) .t5-offer-h > span', win)).replace(/\s*oferece$/i, '');
const offerButton = (win, uid) => $$('[data-offer]', win).find(button => button.dataset.offer === uid) ?? null;

function typeInto(input, value) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setValue.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

// ---- Status bar (both tabs) ----
const bar = document.createElement('div');
bar.id = 'pafk-trade';
bar.dataset.pafk = '';
bar.hidden = true;
bar.setAttribute('role', 'status');
bar.setAttribute('aria-live', 'polite');
bar.innerHTML = `
  <i class="pafk-trade-dot" aria-hidden="true"></i>
  <span class="pafk-trade-txt"><b>TROCA AUTOMÁTICA</b><span data-trade-msg></span></span>
  <button type="button" data-trade-stop>Parar</button>
  <button type="button" data-trade-close aria-label="Fechar aviso">✕</button>`;
const barMsg = $('[data-trade-msg]', bar);
let barTimer = 0;

function status(message, tone = 'run') {
  clearTimeout(barTimer);
  bar.hidden = false;
  bar.dataset.tone = tone;
  barMsg.textContent = message;
  $('[data-trade-stop]', bar).hidden = tone !== 'run';
  $('[data-trade-close]', bar).hidden = tone === 'run';
  if (tone === 'ok') barTimer = setTimeout(() => { bar.hidden = true; }, 10000);
}
$('[data-trade-stop]', bar).addEventListener('click', () => {
  if (job) job.stopped = 'parada por você';
  if (follow) {
    follow = null;
    status('Parada nesta aba. A janela de troca continua aberta.', 'bad');
  }
});
$('[data-trade-close]', bar).addEventListener('click', () => { bar.hidden = true; });

const tradeStyle = document.createElement('style');
tradeStyle.dataset.pafk = '';
tradeStyle.textContent = `
  #pafk-trade {
    position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 43;
    display: flex; align-items: center; gap: 10px; box-sizing: border-box;
    max-width: min(560px, calc(100vw - 32px)); padding: 7px 8px 7px 12px;
    border: 4px solid transparent; border-image: url("${IMG.frame}") 10 fill / 4px;
    box-shadow: 2px 3px 0 rgb(7 26 63 / .33); font: 13px/1.35 system-ui, sans-serif; color: ${NAVY};
  }
  #pafk-trade[hidden], #pafk-trade [hidden] { display: none !important; }
  #pafk-trade .pafk-trade-dot { flex: none; width: 10px; height: 10px; border-radius: 2px; background: #2459aa; }
  #pafk-trade[data-tone="run"] .pafk-trade-dot { animation: pafk-trade-blink 1s steps(2) infinite; }
  #pafk-trade[data-tone="ok"] .pafk-trade-dot { background: #2f9e44; }
  #pafk-trade[data-tone="bad"] .pafk-trade-dot { background: #c92a2a; }
  #pafk-trade .pafk-trade-txt { display: flex; flex-direction: column; min-width: 0; }
  #pafk-trade .pafk-trade-txt b { font: 12px "HUD Pixel", system-ui, sans-serif; letter-spacing: .03em; color: ${MUTED}; }
  #pafk-trade button {
    flex: none; font: 600 12px system-ui, sans-serif; color: ${NAVY}; cursor: pointer;
    border: 1px solid #b7c6db; border-radius: 5px; background: #fff; padding: 4px 10px;
  }
  #pafk-trade button:hover { background: ${NAVY}; color: #fff; }
  @keyframes pafk-trade-blink { 50% { opacity: .35; } }
  @media (prefers-reduced-motion: reduce) { #pafk-trade .pafk-trade-dot { animation: none !important; } }

  /* "Trocar com" inside the game's Pokémon menu: the game's own action row, with one chip per account */
  .t5-pick-act.pafk-trade-act { cursor: default; }
  .pafk-trade-act .pafk-trade-ic { width: 24px; height: 24px; image-rendering: pixelated; }
  .pafk-trade-act .pafk-trade-chips { display: flex; flex-wrap: wrap; gap: 5px; margin: 4px 0 2px; }
  .pafk-trade-act .pafk-trade-chip {
    font: 600 12px/1 system-ui, sans-serif; color: ${NAVY}; cursor: pointer; padding: 6px 10px;
    border: 2px solid #9fb4d8; border-radius: 6px; background: #fff; box-shadow: 0 2px 0 rgb(7 26 63 / .18);
  }
  .pafk-trade-act .pafk-trade-chip:not(:disabled):hover { background: ${NAVY}; border-color: ${NAVY}; color: #fff; }
  .pafk-trade-act .pafk-trade-chip:disabled { cursor: default; color: ${MUTED}; background: #eef2f8; border-color: #d3dceb; box-shadow: none; }
  .pafk-trade-act[data-off] .pafk-trade-ic { opacity: .5; }
`;
document.head.append(tradeStyle);
document.body.append(bar);

// ---- Why a trade cannot start now ----
function myWhy() {
  if (!myName) return 'entre no jogo primeiro';
  if ($('#pafk-daily[data-running]')) return 'espere o Daily desta aba terminar';
  if ($('.in-arena') || $('.ah-result[data-result]')) return 'termine a batalha antes';
  if (job || follow || trading) return 'já há uma troca em andamento';
  return '';
}

function partnerWhy(record, now) {
  const state = viewState(record, now);
  if (state === 'daily') return 'está fazendo o Daily';
  if (state === 'battle') return 'está em batalha';
  if (!PARTNER_STATES.has(state)) return `${(STATES[state] ?? STATES.stale).label.toLowerCase()}: a conta precisa estar no jogo`;
  if (record.canal && me?.canal && record.canal !== me.canal) return `está no ${record.canal} e você no ${me.canal}`;
  return '';
}

function pickInfo(pick) {
  return {
    uid: pick.dataset.pick,
    name: text($('.t5-pick-who strong', pick)),
    inBox: /na caixa/i.test(text($('.t5-pick-who', pick))),
    fav: Boolean($('[data-pick-fav="off"]', pick)),
  };
}

// ---- "Trocar com" in the Pokémon menu ----
function makeBlock() {
  const block = document.createElement('div');
  block.className = 't5-pick-act pafk-trade-act';
  block.dataset.pafk = '';
  block.innerHTML = `<span class="t5-pick-ic" aria-hidden="true"><img class="pafk-trade-ic" src="${TRADE_ICON}" alt="" draggable="false"></span>
    <span class="t5-pick-t"><b>Trocar com</b><span class="pafk-trade-chips" role="group" aria-label="Trocar com outra conta"></span><small></small></span>`;
  block.addEventListener('click', event => {
    const chip = event.target.closest('[data-pafk-trade]');
    const pick = block.closest('.t5-pick[data-pick]');
    if (!chip || chip.disabled || !pick) return;
    event.stopPropagation();
    sendTrade(chip.dataset.pafkTrade, pickInfo(pick));
  });
  return block;
}

function syncBlock(block, info) {
  const now = Date.now();
  const others = records().filter(record => record.name !== myName).sort(byName);
  const blockWhy = !info.inBox ? 'Está na equipe: guarde no PC antes de trocar.'
    : info.fav ? 'É favorito: tire a estrela antes de trocar.'
      : !others.length ? 'Abra o jogo com as outras contas em outras abas.'
        : myWhy();
  const chips = others.map(record => {
    const why = blockWhy || partnerWhy(record, now);
    const label = displayName(record.name);
    return { name: record.name, label, why, title: why ? `${label}: ${why}` : `Trocar ${info.name} com ${label}` };
  });
  const hint = blockWhy || (chips.some(chip => !chip.why)
    ? 'A outra conta aceita e oferece um Pokémon qualquer da caixa.'
    : 'Nenhuma outra conta pode trocar agora (passe o mouse para ver o motivo).');
  const signature = JSON.stringify([blockWhy, hint, chips]);
  if (block.dataset.sig === signature) return;
  block.dataset.sig = signature;
  block.toggleAttribute('data-off', Boolean(blockWhy) || chips.every(chip => chip.why));
  $('.pafk-trade-chips', block).innerHTML = chips.map(chip => `<button type="button" class="pafk-trade-chip" data-pafk-trade="${esc(chip.name)}" title="${esc(chip.title)}"${chip.why ? ' disabled' : ''}>${esc(chip.label)}</button>`).join('');
  $('small', block).textContent = hint;
}

function syncPicks() {
  for (const pick of $$('.t5-pick[data-pick]')) {
    const acts = $('.t5-pick-acts', pick);
    if (!acts) continue;
    let block = $('.pafk-trade-act', acts);
    if (!block) {
      block = makeBlock();
      const fav = $('[data-pick-fav]', acts);
      acts.insertBefore(block, fav ?? null);
    }
    syncBlock(block, pickInfo(pick));
  }
}

// ---- Sending ----
// Waits for `test` to return something; the test may throw TradeStop. Stops when the player does.
async function until(test, timeout, why) {
  const end = performance.now() + timeout;
  for (;;) {
    if (job?.stopped) throw new TradeStop(job.stopped);
    const value = test();
    if (value) return value;
    if (performance.now() > end) throw new TradeStop(why);
    await pause(150);
  }
}

// The trade window, or a stop if it closed (someone cancelled). A re-render may hide it for an instant.
function liveWindow(state) {
  const win = tradeWindow();
  if (win) {
    state.goneAt = 0;
    return win;
  }
  state.goneAt ||= performance.now();
  if (performance.now() - state.goneAt > 1500) throw new TradeStop('a janela de troca fechou (alguém cancelou?)');
  return null;
}

function checkAnswer(id, partner) {
  const answer = store.get(ANSWER_PREFIX + myName, null);
  if (answer?.id === id && answer.error) throw new TradeStop(`${displayName(partner)}: ${answer.error}`);
}

// Finds the Pokémon in the "Escolha seu Pokémon" grid: first narrowed by its name, then page by page.
async function findOffer(uid, label, state) {
  for (const query of label ? [label, ''] : ['']) {
    const input = $('[data-pc-q]', liveWindow(state) ?? document);
    if (input && input.value !== query) {
      typeInto(input, query);
      await pause(250);
    }
    for (let page = 0; page < 80; page++) {
      const win = await until(() => liveWindow(state), 3000, 'a janela de troca fechou');
      const found = offerButton(win, uid);
      if (found) return found;
      const pages = text($('.t5-pc-pages b', win));
      const next = $('[data-pc-page="1"]:not([disabled])', win);
      if (!next) break;
      next.click();
      await until(() => {
        const current = liveWindow(state);
        return current && text($('.t5-pc-pages b', current)) !== pages;
      }, 4000, 'a página da lista não mudou');
    }
  }
  throw new TradeStop(`não achei ${label || 'o Pokémon'} na lista da troca`);
}

async function sendTrade(partner, info) {
  const why = myWhy();
  if (why) {
    status(why, 'bad');
    return;
  }
  const record = store.get(PREFIX + partner, null);
  const partnerProblem = record ? partnerWhy(record, Date.now()) : 'conta não encontrada';
  if (partnerProblem) {
    status(`${displayName(partner)} ${partnerProblem}.`, 'bad');
    return;
  }
  const dn = displayName(partner);
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const state = { goneAt: 0 };
  job = { partner, stopped: '' };
  try {
    let win = tradeWindow();
    const reuse = win && !win.matches('.is-done') && sameName(partnerOf(win), partner);
    if (win && !reuse) throw new TradeStop('já há uma janela de troca aberta: termine-a antes');
    if (!reuse) {
      // The other tab accepts only an invite it was told about.
      store.del(ANSWER_PREFIX + myName);
      store.set(ASK_PREFIX + partner, { id, from: myName, to: partner, at: Date.now() });
      status(`Enviando o convite para ${dn}…`);
      try {
        await sendInvite(partner);
      } catch (error) {
        if (INVITE_EXPECTED.test(error.message)) throw new TradeStop(error.message);
        throw error;
      }
      status(`Esperando ${dn} aceitar…`);
      win = await until(() => {
        checkAnswer(id, partner);
        const open = tradeWindow();
        return open && !open.matches('.is-done') ? open : null;
      }, 30000, `${dn} não aceitou o convite (a aba dela está aberta no jogo?)`);
      if (!sameName(partnerOf(win), partner)) throw new TradeStop(`abriu uma troca com ${partnerOf(win) || 'outro treinador'}`);
    }

    status(`Procurando ${info.name} na lista…`);
    (await findOffer(info.uid, info.name, state)).click();
    await until(() => {
      const open = liveWindow(state);
      return open && offerButton(open, info.uid)?.classList.contains('sel');
    }, 8000, `${info.name} não entrou na oferta`);

    status(`Esperando a oferta de ${dn}…`);
    const ok = await until(() => {
      checkAnswer(id, partner);
      const open = liveWindow(state);
      if (!open) return null;
      if (!offerButton(open, info.uid)?.classList.contains('sel')) throw new TradeStop(`a oferta mudou: ${info.name} saiu`);
      return $('[data-ok]:not(.disabled)', open);
    }, 60000, `${dn} não ofereceu um Pokémon`);
    ok.click();

    status('Confirmando a troca…');
    const done = await until(() => {
      checkAnswer(id, partner);
      const open = liveWindow(state);
      return open?.matches('.is-done') ? open : null;
    }, 45000, 'a troca não foi concluída');
    const got = text($('.t5-done-h', done)).replace(/^✓\s*/, '');
    $('[data-again]:not(.disabled)', done)?.click();
    status(`${got || 'Troca feita!'} ${info.name} foi para ${dn}. A janela fica aberta para continuar trocando.`, 'ok');
  } catch (error) {
    if (!(error instanceof TradeStop)) console.error(error);
    status(`Não terminou: ${error.message}.`, 'bad');
  } finally {
    job = null;
    store.del(ASK_PREFIX + partner);
  }
}

// Stops on the player's own click or key in this tab (the script's clicks are not trusted).
for (const type of ['pointerdown', 'keydown']) {
  addEventListener(type, event => {
    if (!event.isTrusted || event.target?.closest?.('#pafk-trade')) return;
    if (job) job.stopped = 'parada porque você mexeu no jogo';
    if (follow) {
      follow = null;
      status('Parada nesta aba porque você mexeu no jogo.', 'bad');
    }
  }, true);
}

// ---- Answering (the other tab) ----
function answer(to, id, error) {
  store.set(ANSWER_PREFIX + to, { id, error, at: Date.now() });
}

function pickRandom(win) {
  const choices = $$('[data-offer]', win).filter(button => !button.matches('.shiny, .locked, .fainted'));
  if (choices.length) return choices[Math.floor(Math.random() * choices.length)];
  return null;
}

let lastAnswerTick = 0;
function answerTick() {
  const now = Date.now();
  if (now - lastAnswerTick < 150) return;
  lastAnswerTick = now;
  if (!myName || job) return;

  // A request for this account: accept the invite from that account only.
  const ask = store.get(ASK_PREFIX + myName, null);
  if (ask && ask.id !== handledAsk && now - ask.at < ASK_FRESH && !follow) {
    const busy = $('#pafk-daily[data-running]') ? 'esta conta está fazendo o Daily'
      : trading ? 'esta conta está abrindo outra troca' : '';
    if (busy) {
      handledAsk = ask.id;
      answer(ask.from, ask.id, busy);
    } else {
      const card = $$('.inv-card').find(element => !element.hidden && /troca/i.test(text($('small', element)))
        && sameName(text($('.inv-name b', element)), ask.from));
      if (card) {
        handledAsk = ask.id;
        follow = { partner: ask.from, id: ask.id, at: now, opened: false, gone: 0, offeredAt: 0, okAt: 0, againAt: 0 };
        status(`Aceitando o convite de ${displayName(ask.from)}…`);
        $('[data-inv="yes"]', card)?.click();
      } else if (now - ask.at > 20000) {
        handledAsk = ask.id;
        answer(ask.from, ask.id, 'o convite não apareceu (em batalha, ou com convites desligados?)');
      }
    }
  }
  if (follow) followTrade(now);
}

function followTrade(now) {
  const partner = displayName(follow.partner);
  const win = tradeWindow();
  if (!win) {
    if (follow.opened) {
      follow.gone ||= now;
      if (now - follow.gone > 1500) {
        follow = null;
        status(`A troca com ${partner} terminou.`, 'ok');
      }
    } else if (now - follow.at > 15000) {
      answer(follow.partner, follow.id, 'a janela de troca não abriu (a conta estava ocupada?)');
      follow = null;
      status(`A troca com ${partner} não abriu.`, 'bad');
    }
    return;
  }
  follow.gone = 0;
  if (win.matches('.is-done')) {
    follow.opened = true;
    const again = $('[data-again]:not(.disabled)', win);
    if (again && now - follow.againAt > 3000) {
      follow.againAt = now;
      status(`${text($('.t5-done-h', win)).replace(/^✓\s*/, '')} Continuando a sessão com ${partner}.`, 'run');
      again.click();
    }
    return;
  }
  // Another trainer's trade: not ours to answer.
  if (!sameName(partnerOf(win), follow.partner)) return;
  follow.opened = true;
  follow.at = now;
  const theirs = $('.t5-offer:not(.is-mine):not(.is-empty)', win);
  const mine = $('.t5-offer.is-mine:not(.is-empty)', win);
  if (!theirs) {
    status(`Esperando ${partner} escolher o Pokémon…`);
    return;
  }
  if (!mine) {
    if (now - follow.offeredAt < 3000) return;
    const choice = pickRandom(win);
    if (choice) {
      follow.offeredAt = now;
      status(`Oferecendo um Pokémon da caixa para ${partner}…`);
      choice.click();
      return;
    }
    const clear = $('[data-pc-clear]', win);
    const next = $('[data-pc-page="1"]:not([disabled])', win);
    if (clear || next) {
      follow.offeredAt = now;
      (clear ?? next).click();
      return;
    }
    answer(follow.partner, follow.id, 'não tem Pokémon disponível na caixa para oferecer');
    follow = null;
    status(`Sem Pokémon na caixa para oferecer a ${partner}.`, 'bad');
    return;
  }
  const ok = $('[data-ok]:not(.disabled)', win);
  if (ok && now - follow.okAt > 3000) {
    follow.okAt = now;
    status(`Confirmando a troca com ${partner}…`);
    ok.click();
  }
}

// The game redraws its windows when the server answers, so DOM changes drive both sides; the
// interval covers the rest (a background tab still runs it about once a second).
new MutationObserver(() => {
  // A freshly drawn menu gets the block right away (no flash); the interval keeps it current.
  const pick = $('.t5-pick[data-pick]');
  if (pick && !$('.pafk-trade-act', pick)) syncPicks();
  if (myName && (follow || store.get(ASK_PREFIX + myName, null))) answerTick();
}).observe(document.body, { childList: true, subtree: true });
setInterval(() => {
  syncPicks();
  answerTick();
}, 700);
if (typeof GM_addValueChangeListener === 'function') {
  // Requests for this account, as soon as another tab writes them.
  let listeningFor = '';
  setInterval(() => {
    if (!myName || listeningFor === myName) return;
    listeningFor = myName;
    const key = ASK_PREFIX + myName;
    GM_addValueChangeListener(key, (_key, _old, value, remote) => {
      if (remote && value && key === ASK_PREFIX + myName) answerTick();
    });
  }, 1000);
}
