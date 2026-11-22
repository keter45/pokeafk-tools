// ---- Fazer daily ---------------------------------------------------------------------------
// Fights the trainers of the day whose level sits between the main Pokémon's level and 10 below.
// The route comes from the MAPA's NPC list (sorted by XP, which also marks the locked ones),
// grouped by place. Each fight: open MAPA → NPCs → pick the trainer → "Teleportar até lá" →
// talk key → LUTAR → wait for the result → CONTINUAR. Any input from the player, a timeout or
// something unexpected stops the loop.
(() => {
  // Levels below the main Pokémon; the player can change it in the card.
  const DEFAULT_RANGE = 10;
  const MAX_RANGE = 99;
  const RANGE_STORAGE = 'pokeafk-market-filtros:daily-range';
  const FIGHT_TIMEOUT = 10 * 60 * 1000;
  const KEYS_STORAGE = 'pokeafk.ui.keys';
  const HEAL_BELOW = 0.5;
  // Trainers in a row where the game did not react before the daily gives up.
  const MAX_UNREACHABLE_STREAK = 4;

  class Stop extends Error {}
  let run = null;

  const box = document.createElement('section');
  box.id = 'pafk-daily';
  box.dataset.pafk = '';
  box.setAttribute('aria-label', 'Daily de treinadores');
  box.innerHTML = `
    <button type="button" class="pafk-daily-toggle" aria-expanded="false" data-daily-toggle>
      <span aria-hidden="true">⚔</span> Daily
    </button>
    <div class="pafk-daily-body" hidden data-daily-body>
      <header>
        <strong title="Arraste para mover; clique duas vezes para voltar ao lugar">Treinadores do dia</strong>
        <button type="button" class="pafk-daily-x" aria-label="Fechar" data-daily-toggle>✕</button>
      </header>
      <label class="pafk-daily-levels">
        Lutar até
        <input type="number" min="0" max="${MAX_RANGE}" step="1" value="${DEFAULT_RANGE}" inputmode="numeric" data-daily-levels>
        níveis abaixo do principal
        <small>Sugerido: ${DEFAULT_RANGE}.</small>
      </label>
      <p class="pafk-daily-range" data-daily-range>Faixa: nível do Pokémon principal até ${DEFAULT_RANGE} abaixo.</p>
      <label class="pafk-daily-avoid">
        <input type="checkbox" data-daily-avoid checked>
        Evitar times com vantagem de tipo
        <small>O time de cada treinador é aprendido na primeira luta.</small>
      </label>
      <div class="pafk-daily-progress" hidden data-daily-progress>
        <div class="pafk-daily-count"><strong data-daily-left></strong><span data-daily-total></span></div>
        <div class="pafk-daily-bar" role="progressbar" aria-valuemin="0" data-daily-bar><i></i></div>
      </div>
      <p class="pafk-daily-status" role="status" aria-live="polite" data-daily-status></p>
      <ol class="pafk-daily-route" hidden data-daily-route></ol>
      <div class="pafk-daily-actions">
        <button type="button" class="pafk-daily-go" data-daily-go>Fazer daily</button>
        <button type="button" class="pafk-daily-stop" hidden data-daily-stop>Parar</button>
      </div>
    </div>`;
  const body = box.querySelector('[data-daily-body]');
  const goButton = box.querySelector('[data-daily-go]');
  const stopButton = box.querySelector('[data-daily-stop]');
  const statusEl = box.querySelector('[data-daily-status]');
  const rangeEl = box.querySelector('[data-daily-range]');
  const progressEl = box.querySelector('[data-daily-progress]');
  const routeEl = box.querySelector('[data-daily-route]');
  const avoidBox = box.querySelector('[data-daily-avoid]');
  const levelsInput = box.querySelector('[data-daily-levels]');

  const style = document.createElement('style');
  style.dataset.pafk = '';
  style.textContent = `
    #pafk-daily {
      position: fixed; right: 8px; top: 96px; z-index: 40;
      display: flex; flex-direction: column; align-items: flex-end;
      font: 13px/1.35 system-ui, sans-serif; color: #152964;
    }
    #pafk-daily [hidden] { display: none !important; }
    #pafk-daily button { font: inherit; cursor: pointer; }
    #pafk-daily .pafk-daily-toggle {
      border: 1px solid #bed0ec; border-radius: 999px; background: #fff; color: #152964;
      padding: 6px 12px; font-weight: 800; box-shadow: 0 2px 8px rgb(0 0 0 / .18);
    }
    #pafk-daily[data-running] .pafk-daily-toggle { background: #2459aa; border-color: #2459aa; color: #fff; }
    #pafk-daily .pafk-daily-body {
      box-sizing: border-box; width: min(290px, calc(100vw - 24px)); margin-top: 6px;
      border: 1px solid #bed0ec; border-radius: 10px; background: #fff; padding: 10px 12px 12px;
      box-shadow: 0 6px 20px rgb(0 0 0 / .22); display: grid; gap: 8px;
    }
    #pafk-daily header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    #pafk-daily :is(.pafk-daily-toggle, .pafk-daily-body > header) { cursor: grab; touch-action: none; user-select: none; }
    #pafk-daily[data-dragging] :is(.pafk-daily-toggle, .pafk-daily-body > header) { cursor: grabbing; }
    #pafk-daily .pafk-daily-x { cursor: pointer; }
    #pafk-daily .pafk-daily-x { border: 0; background: none; color: #4a5f8f; padding: 2px 4px; }
    #pafk-daily p { margin: 0; }
    #pafk-daily .pafk-daily-range { color: #4a5f8f; font-size: 12px; }
    #pafk-daily .pafk-daily-levels { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; }
    #pafk-daily .pafk-daily-levels input {
      width: 4.5em; box-sizing: border-box; padding: 3px 6px; font: inherit; font-weight: 700;
      color: #152964; border: 1px solid #bed0ec; border-radius: 6px; background: #fff;
      font-variant-numeric: tabular-nums;
    }
    #pafk-daily .pafk-daily-levels input:focus-visible { outline: 2px solid #2459aa; outline-offset: 1px; }
    #pafk-daily .pafk-daily-levels input:disabled { background: #eef2f9; color: #4a5f8f; }
    #pafk-daily .pafk-daily-levels small { flex-basis: 100%; color: #4a5f8f; font-size: 11px; }
    #pafk-daily .pafk-daily-avoid { display: grid; grid-template-columns: auto 1fr; gap: 0 6px; align-items: center; cursor: pointer; }
    #pafk-daily .pafk-daily-avoid input { margin: 0; }
    #pafk-daily .pafk-daily-avoid small { grid-column: 2; color: #4a5f8f; font-size: 11px; }
    #pafk-daily .pafk-daily-route li:is([data-state="avoided"], [data-state="unreachable"], [data-state="closed"]) { opacity: .6; }
    #pafk-daily .pafk-daily-route li[data-state="avoided"] b { color: #b35c00; }
    #pafk-daily .pafk-daily-count { display: flex; justify-content: space-between; gap: 8px; font-variant-numeric: tabular-nums; }
    #pafk-daily .pafk-daily-count span { color: #4a5f8f; }
    #pafk-daily .pafk-daily-bar { height: 8px; border-radius: 4px; background: #e3ebf7; overflow: hidden; margin-top: 4px; }
    #pafk-daily .pafk-daily-bar i { display: block; height: 100%; width: 0; background: #2f9e44; transition: width .3s; }
    #pafk-daily .pafk-daily-status { min-height: 1.35em; }
    #pafk-daily .pafk-daily-route {
      margin: 0; padding: 0; list-style: none; max-height: 180px; overflow: auto;
      border-top: 1px solid #e3ebf7; font-size: 12px;
    }
    #pafk-daily .pafk-daily-route li {
      display: grid; grid-template-columns: 1fr auto; gap: 0 8px; padding: 4px 0;
      border-bottom: 1px solid #eef2f9;
    }
    #pafk-daily .pafk-daily-route li small { grid-column: 1; color: #4a5f8f; }
    #pafk-daily .pafk-daily-route li b { grid-row: 1 / span 2; grid-column: 2; align-self: center; font-weight: 700; }
    #pafk-daily .pafk-daily-route li[data-state="current"] { background: #eef4ff; }
    #pafk-daily .pafk-daily-route li[data-state="won"] b { color: #2f9e44; }
    #pafk-daily .pafk-daily-route li[data-state="lost"] b,
    #pafk-daily .pafk-daily-route li[data-state="skipped"] b { color: #c92a2a; }
    #pafk-daily .pafk-daily-actions { display: flex; gap: 8px; }
    #pafk-daily .pafk-daily-actions button {
      flex: 1; border-radius: 8px; padding: 7px 10px; font-weight: 800; border: 1px solid #2459aa;
    }
    #pafk-daily .pafk-daily-go { background: #2459aa; color: #fff; }
    #pafk-daily .pafk-daily-go:disabled { opacity: .55; cursor: default; }
    #pafk-daily .pafk-daily-stop { background: #fff; color: #c92a2a; border-color: #c92a2a !important; }
  `;
  document.head.append(style);
  document.body.append(box);

  // Until the player drags it, it sits under the game's quick actions column (CAÇAR, Poke
  // Center, Poke Market). A dragged position is kept, anchored by the top right corner.
  const POSITION_STORAGE = 'pokeafk-market-filtros:daily-pos';
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(POSITION_STORAGE) ?? 'null');
  } catch {
    saved = null;
  }
  function clampPosition({ right, top }) {
    const width = box.querySelector('.pafk-daily-toggle').offsetWidth || 80;
    return {
      right: Math.min(Math.max(0, right), Math.max(0, innerWidth - width)),
      top: Math.min(Math.max(0, top), Math.max(0, innerHeight - 40)),
    };
  }
  function placeBox() {
    let position;
    if (saved) {
      position = clampPosition(saved);
    } else {
      const rect = document.querySelector('.hud.world-hud .hud-quick')?.getBoundingClientRect();
      const visible = rect && rect.width > 0;
      position = {
        top: visible ? Math.round(rect.bottom + 6) : 96,
        right: visible ? Math.max(8, Math.round(innerWidth - rect.right)) : 8,
      };
    }
    box.style.top = `${position.top}px`;
    box.style.right = `${position.right}px`;
  }
  placeBox();
  setInterval(placeBox, 1000);
  addEventListener('resize', placeBox);

  // Drag by the "Daily" button or the panel header. A short move still counts as a click.
  let dragged = false;
  for (const handle of box.querySelectorAll('.pafk-daily-toggle, .pafk-daily-body > header')) {
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('.pafk-daily-x')) return;
      const start = { x: event.clientX, y: event.clientY };
      const origin = { right: parseFloat(box.style.right) || 0, top: parseFloat(box.style.top) || 0 };
      let moving = false;
      dragged = false;
      handle.setPointerCapture(event.pointerId);
      const move = moveEvent => {
        const dx = moveEvent.clientX - start.x;
        const dy = moveEvent.clientY - start.y;
        if (!moving && Math.hypot(dx, dy) < 5) return;
        moving = true;
        box.dataset.dragging = '';
        saved = clampPosition({ right: origin.right - dx, top: origin.top + dy });
        placeBox();
      };
      const end = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', end);
        handle.removeEventListener('pointercancel', end);
        delete box.dataset.dragging;
        if (!moving) return;
        dragged = true;
        try {
          localStorage.setItem(POSITION_STORAGE, JSON.stringify(saved));
        } catch {
          // The position lasts only for this page.
        }
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', end);
      handle.addEventListener('pointercancel', end);
    });
  }
  // Double-clicking the header puts the card back under the game's buttons.
  box.querySelector('.pafk-daily-body > header').addEventListener('dblclick', () => {
    saved = null;
    try {
      localStorage.removeItem(POSITION_STORAGE);
    } catch {
      // Nothing to forget.
    }
    placeBox();
  });

  for (const toggle of box.querySelectorAll('[data-daily-toggle]')) {
    toggle.addEventListener('click', () => {
      if (dragged) {
        dragged = false;
        return;
      }
      body.hidden = !body.hidden;
      box.querySelector('.pafk-daily-toggle').setAttribute('aria-expanded', String(!body.hidden));
      if (!body.hidden && !run) showRange();
    });
  }

  // ---- Reading the game ----
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const text = element => element?.textContent.replace(/\s+/g, ' ').trim() ?? '';
  const fold = value => value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  // The list shows "PESCADOR DALE"; the challenge shows the class and the name apart.
  const sameTrainer = (full, foe) => fold(full) === fold(foe) || fold(full).endsWith(` ${fold(foe)}`);

  function mainPokemon() {
    const button = $('button.hud-active-button');
    const label = button?.getAttribute('aria-label') ?? '';
    const match = label.match(/Resumo de (.+), nível (\d+)/i);
    const dex = Number(button?.querySelector('img.front')?.getAttribute('src')?.match(/\/(\d+)[^/]*\.png/)?.[1] ?? 0);
    return match ? { name: match[1], level: Number(match[2]), dex } : null;
  }

  // ---- Trainer teams and type edge ----
  // The client only learns a trainer's team in battle, so each fight saves the opposing
  // Pokémon (the arena's red card shows the one in play). Trainers repeat daily.
  const TEAMS_STORAGE = 'pokeafk-market-filtros:npc-teams';
  const AVOID_STORAGE = 'pokeafk-market-filtros:daily-avoid';
  const SPECIES_TYPES = MARKET_GUIDE.types ?? {};
  const TYPE_CHART = {
    normal: { half: ['rock', 'steel'], zero: ['ghost'] },
    fire: { double: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'] },
    water: { double: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'] },
    electric: { double: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], zero: ['ground'] },
    grass: { double: ['water', 'ground', 'rock'], half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'] },
    ice: { double: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'] },
    fighting: { double: ['normal', 'ice', 'rock', 'dark', 'steel'], half: ['poison', 'flying', 'psychic', 'bug'], zero: ['ghost'] },
    poison: { double: ['grass'], half: ['poison', 'ground', 'rock', 'ghost'], zero: ['steel'] },
    ground: { double: ['fire', 'electric', 'poison', 'rock', 'steel'], half: ['grass', 'bug'], zero: ['flying'] },
    flying: { double: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'] },
    psychic: { double: ['fighting', 'poison'], half: ['psychic', 'steel'], zero: ['dark'] },
    bug: { double: ['grass', 'psychic', 'dark'], half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel'] },
    rock: { double: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'] },
    ghost: { double: ['psychic', 'ghost'], half: ['dark', 'steel'], zero: ['normal'] },
    dragon: { double: ['dragon'], half: ['steel'] },
    dark: { double: ['psychic', 'ghost'], half: ['fighting', 'dark', 'steel'] },
    steel: { double: ['ice', 'rock'], half: ['fire', 'water', 'electric', 'steel'] },
  };
  const typesOf = dex => (SPECIES_TYPES[dex] ?? '').split('/').filter(Boolean);
  const TYPE_NAMES = {
    normal: 'Normal', fire: 'Fogo', water: 'Água', electric: 'Elétrico', grass: 'Planta', ice: 'Gelo',
    fighting: 'Lutador', poison: 'Veneno', ground: 'Terra', flying: 'Voador', psychic: 'Psíquico',
    bug: 'Inseto', rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão', dark: 'Sombrio', steel: 'Aço',
  };
  function multiplier(attack, defenders) {
    const row = TYPE_CHART[attack] ?? {};
    return defenders.reduce((total, type) => total * (row.double?.includes(type) ? 2
      : row.half?.includes(type) ? 0.5 : row.zero?.includes(type) ? 0 : 1), 1);
  }

  function readTeams() {
    try {
      return JSON.parse(localStorage.getItem(TEAMS_STORAGE) ?? '{}') ?? {};
    } catch {
      return {};
    }
  }
  function saveTeam(npc, dexes) {
    if (!dexes.length) return;
    const teams = readTeams();
    teams[npc.id] = { name: npc.name, dex: [...dexes], at: new Date().toISOString().slice(0, 10) };
    try {
      localStorage.setItem(TEAMS_STORAGE, JSON.stringify(teams));
    } catch {
      // Without storage the team is learned again next time.
    }
  }
  // The type of the known team that hits the main Pokémon super effectively, if any.
  function typeEdge(npc, mainDex) {
    const defenders = typesOf(mainDex);
    const team = readTeams()[npc.id]?.dex ?? [];
    if (!defenders.length) return null;
    for (const dex of team) {
      const strong = typesOf(dex).find(type => multiplier(type, defenders) >= 2);
      if (strong) return strong;
    }
    return null;
  }
  // Dex of the opposing Pokémon in play, from the arena's red card icon.
  try {
    avoidBox.checked = localStorage.getItem(AVOID_STORAGE) !== 'off';
  } catch {
    // Defaults to on.
  }
  avoidBox.addEventListener('change', () => {
    try {
      localStorage.setItem(AVOID_STORAGE, avoidBox.checked ? 'on' : 'off');
    } catch {
      // The choice lasts only for this page.
    }
  });

  // How many levels below the main Pokémon to fight (whole number, 0–MAX_RANGE).
  function cleanRange(value) {
    const number = Math.round(Number(value));
    return Number.isFinite(number) && String(value).trim() !== ''
      ? Math.min(MAX_RANGE, Math.max(0, number))
      : DEFAULT_RANGE;
  }
  const levelRange = () => cleanRange(levelsInput.value);
  try {
    const saved = localStorage.getItem(RANGE_STORAGE);
    if (saved !== null) levelsInput.value = String(cleanRange(saved));
  } catch {
    // Defaults to the suggested range.
  }
  levelsInput.addEventListener('input', () => showRange());
  // Typing a number must not reach the game's hotkeys.
  for (const type of ['keydown', 'keyup', 'keypress']) {
    levelsInput.addEventListener(type, event => event.stopPropagation());
  }
  levelsInput.addEventListener('change', () => {
    levelsInput.value = String(levelRange());
    showRange();
    try {
      localStorage.setItem(RANGE_STORAGE, levelsInput.value);
    } catch {
      // The choice lasts only for this page.
    }
  });

  function foeInPlay() {
    const card = $$('.ah-card').find(element => element.querySelector('.ah-name.red'));
    const icon = card?.querySelector('.ah-mon-ic')?.getAttribute('style') ?? '';
    return Number(icon.match(/\/(\d+)[^/)"']*\.png/)?.[1] ?? 0);
  }
  const mapWindow = () => $('.modal.mapa-open');
  const inArena = () => Boolean($('.in-arena'));
  const resultWindow = () => $('.ah-result[data-result]');
  const challenge = () => $('.b5-challenge');

  function isHunting() {
    const button = $('.hud-act.hunt[data-act="hunt"]');
    if (!button) return false;
    return button.classList.contains('on') || button.getAttribute('aria-pressed') === 'true'
      || /parar/i.test(text(button.querySelector('.hud-act-l')));
  }

  function talkKey() {
    try {
      const keys = JSON.parse(localStorage.getItem(KEYS_STORAGE) ?? 'null');
      if (keys && typeof keys.talk === 'string' && keys.talk) return keys.talk;
    } catch {
      // The game's default binding is used below.
    }
    return 'Z';
  }

  // ---- Run control ----
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  function alive() {
    if (!run || run.stopped) throw new Stop(run?.reason ?? 'Parado.');
  }
  async function pause(min = 300, max = 800) {
    await sleep(min + Math.random() * (max - min));
    alive();
  }
  async function until(test, timeout, what) {
    const started = performance.now();
    for (;;) {
      alive();
      let value;
      try {
        value = test();
      } catch {
        value = null;
      }
      if (value) return value;
      if (performance.now() - started > timeout) throw new Error(`O jogo não respondeu: ${what}.`);
      await sleep(150);
    }
  }
  function stop(reason) {
    if (!run || run.stopped) return;
    run.stopped = true;
    run.reason = reason;
  }
  function setStatus(message) {
    statusEl.textContent = message;
  }

  // The player taking over stops the loop. Clicks and keys sent by the script are not trusted.
  const onPlayerInput = event => {
    // The account monitor (pokeafk-monitor.user.js) is not the game either.
    if (!run || !event.isTrusted || box.contains(event.target)
      || (event.target instanceof Element && event.target.closest('#pafk-monitor'))) return;
    stop('Parado porque você usou o jogo.');
  };
  addEventListener('pointerdown', onPlayerInput, true);
  addEventListener('keydown', onPlayerInput, true);

  // ---- MAPA ----
  async function openNpcList() {
    if (!mapWindow()) {
      const button = $('.hud.world-hud > nav.hud-topbar > [data-act="map"]') ?? $('[aria-label="MAPA"]');
      if (!button) throw new Error('Botão MAPA não encontrado.');
      button.click();
      await until(() => mapWindow()?.querySelector('[data-list="npcs"]'), 10000, 'abrir o MAPA');
      await pause(150, 350);
    }
    const map = mapWindow();
    const tab = map.querySelector('[data-list="npcs"]');
    if (tab && tab.getAttribute('aria-selected') !== 'true') tab.click();
    await until(() => {
      const list = mapWindow()?.querySelector('.mx-list');
      return list && (list.querySelector('.mx-row.npc') || list.querySelector('.mx-empty'));
    }, 10000, 'carregar a lista de NPCs');
    return mapWindow();
  }

  async function closeMap() {
    const map = mapWindow();
    if (!map) return;
    const close = map.querySelector('[aria-label="Fechar"], .close, [data-close]');
    if (close) close.click();
    else dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await until(() => !mapWindow(), 5000, 'fechar o MAPA');
  }

  async function chooseRegion(id) {
    const map = mapWindow();
    const tab = map.querySelector(`.mx-tab[data-region="${CSS.escape(id)}"]`);
    if (!tab || tab.classList.contains('on')) return;
    tab.click();
    await until(() => mapWindow()?.querySelector(`.mx-tab.on[data-region="${CSS.escape(id)}"]`), 5000, 'trocar de região');
    await until(() => mapWindow()?.querySelector('.mx-list .mx-row.npc, .mx-list .mx-empty'), 8000, 'carregar os NPCs da região');
    await sleep(150);
  }

  async function sortNpcs(order) {
    const button = mapWindow()?.querySelector(`[data-npcsort="${order}"]`);
    if (!button || button.classList.contains('on')) return;
    button.click();
    await until(() => mapWindow()?.querySelector(`[data-npcsort="${order}"].on`), 4000, 'ordenar os NPCs');
    await sleep(120);
  }

  // Rows of the region's NPC list in "more XP first" order, with the chapter each one sits in.
  function readNpcRows(region) {
    const list = mapWindow()?.querySelector('.mx-list');
    const rows = [];
    let chapter = '';
    for (const element of list?.children ?? []) {
      if (element.matches('.mx-chapter')) chapter = text(element).toUpperCase();
      if (!element.matches('.mx-row.npc[data-npc]')) continue;
      rows.push({
        id: element.dataset.npc,
        region,
        name: text(element.querySelector('.mx-row-main strong')),
        place: text(element.querySelector('.mx-row-place')),
        level: Number(text(element.querySelector('.mx-row-lv')).match(/\d+/)?.[0] ?? 0),
        // Overworld sprite sheet (/assets/npcs/{gfx}.png), used to find a wandering trainer.
        gfx: element.querySelector('.mx-npc-face i')?.style.backgroundImage
          .match(/\/assets\/npcs\/([^/"')]+)\.png/)?.[1] ?? '',
        beaten: element.classList.contains('beaten') || chapter.startsWith('VENCIDOS'),
        locked: chapter.startsWith('BLOQUEADOS'),
      });
    }
    return rows;
  }

  async function buildRoute(level) {
    const map = await openNpcList();
    const regions = $$('.mx-tab[data-region]', map)
      .filter(tab => !tab.classList.contains('locked') && !tab.classList.contains('soon'));
    const startRegion = map.querySelector('.mx-tab.on[data-region]')?.dataset.region;
    const startSort = map.querySelector('[data-npcsort].on')?.dataset.npcsort;
    const all = [];
    for (const tab of regions) {
      const id = tab.dataset.region;
      setStatus(`Lendo os NPCs de ${text(tab.querySelector('.mx-tab-name')) || id}...`);
      await chooseRegion(id);
      await sortNpcs('xp');
      all.push(...readNpcRows(id));
    }
    if (startSort) await sortNpcs(startSort);
    if (startRegion) await chooseRegion(startRegion);

    const inRange = all.filter(npc => npc.level <= level && npc.level >= level - levelRange());
    const todo = inRange.filter(npc => !npc.beaten && !npc.locked);
    // Lowest level first; within a level, trainers of the same place stay together (the list
    // is by XP, so the first trainer of each place sets that place's turn).
    const placeOrder = new Map();
    for (const npc of todo) {
      const key = `${npc.region}|${npc.place}`;
      if (!placeOrder.has(key)) placeOrder.set(key, placeOrder.size);
    }
    const route = todo
      .map((npc, index) => ({ npc, index, place: placeOrder.get(`${npc.region}|${npc.place}`) }))
      .sort((a, b) => a.npc.level - b.npc.level || a.place - b.place || a.index - b.index)
      .map(({ npc }) => npc);
    return {
      route,
      beatenInRange: inRange.filter(npc => npc.beaten).length,
      lockedInRange: inRange.filter(npc => npc.locked).length,
    };
  }

  // ---- One fight ----
  async function teleportTo(npc) {
    await openNpcList();
    await chooseRegion(npc.region);
    const row = await until(
      () => mapWindow()?.querySelector(`.mx-list .mx-row.npc[data-npc="${CSS.escape(npc.id)}"]`),
      5000, 'achar o treinador na lista');
    if (row.classList.contains('beaten')) return 'won';
    row.click();
    const card = await until(() => {
      const found = mapWindow()?.querySelector('.mx-card-in.npc');
      return found && text(found).includes(npc.name) ? found : null;
    }, 5000, 'abrir o cartão do treinador');
    const cardText = text(card);
    if (/Vencido hoje/i.test(cardText)) return 'won';
    if (/Bloquead/i.test(cardText)) return 'locked';
    // The card warns when the place is closed to the player (e.g. a Gym that needs badges).
    if (/abre quando|ins[ií]gnia/i.test(text(card.closest('.mx-card') ?? card))) return 'closed';
    const tp = await until(() => {
      const button = mapWindow()?.querySelector('.mx-card:has(> .mx-card-in.npc) [data-act="tp"]');
      return button && !button.disabled ? button : null;
    }, 15000, 'liberar o teleporte');
    await pause(150, 400);
    tp.click();
    await until(() => !mapWindow(), 10000, 'teleportar');
    return 'there';
  }

  // After a step that went nowhere: decline an open challenge and close the MAPA.
  async function recoverScreen() {
    challenge()?.querySelector('[data-nofight]')?.click();
    await closeMap().catch(() => {});
    await pause(200, 400);
  }

  // ---- Finding a trainer on screen ----
  // Trainers that wander may have left the spot the teleport faces. The world canvas draws
  // sprites 1:1 from /assets/npcs/{gfx}.png (frame size in npcs.json), so the trainer's frames
  // are searched in the canvas pixels, nearest to the centre (the player) first. A click on
  // the trainer makes the game walk up to it and talk.
  let npcMetaCache;
  async function npcMeta() {
    npcMetaCache ??= fetch('/assets/npcs/npcs.json').then(response => response.json()).catch(() => ({}));
    return npcMetaCache;
  }
  const templateCache = new Map();
  async function npcTemplates(gfx) {
    if (templateCache.has(gfx)) return templateCache.get(gfx);
    const meta = (await npcMeta())[gfx];
    let templates = [];
    // HD sprites are drawn on another layer and are not searched.
    if (meta && !meta.hd && meta.w && meta.h) {
      const image = new Image();
      image.src = `/assets/npcs/${gfx}.png`;
      await image.decode().catch(() => {});
      if (image.naturalWidth) {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        const frames = Math.min(meta.frames || 1, Math.floor(image.naturalWidth / meta.w));
        for (let frame = 0; frame < frames; frame += 1) {
          const data = ctx.getImageData(frame * meta.w, 0, meta.w, Math.min(meta.h, image.naturalHeight)).data;
          for (const flip of [false, true]) {
            const pixels = [];
            for (let y = 0; y < meta.h; y += 1) {
              for (let x = 0; x < meta.w; x += 1) {
                const at = (y * meta.w + x) * 4;
                if (data[at + 3] < 200) continue;
                pixels.push([flip ? meta.w - 1 - x : x, y, data[at], data[at + 1], data[at + 2]]);
              }
            }
            // Too few opaque pixels would match anything.
            if (pixels.length < 24) continue;
            const step = Math.max(1, Math.floor(pixels.length / 10));
            templates.push({ w: meta.w, h: meta.h, pixels, keys: pixels.filter((_, i) => i % step === 0).slice(0, 10) });
          }
        }
      }
    }
    templateCache.set(gfx, templates);
    return templates;
  }

  function worldCanvas() {
    return $$('canvas')
      .filter(canvas => canvas.width && canvas.getBoundingClientRect().width / canvas.width > 1.2
        && !canvas.closest('[hidden]') && !canvas.classList.contains('title-scene'))
      .sort((a, b) => b.width * b.height - a.width * a.height)[0];
  }

  // Where the trainer's sprite is drawn, as the client point of its feet tile, or null.
  async function locateTrainer(npc) {
    const templates = await npcTemplates(npc.gfx);
    const canvas = worldCanvas();
    if (!templates.length || !canvas) return null;
    const { width, height } = canvas;
    let data;
    try {
      data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    } catch {
      return null;
    }
    // Day/night tints and effects change the colours, so each channel is fitted as
    // screen = gain × sprite + offset before comparing; a flat area (gain near 0) never fits.
    const fits = (pixels, left, top, tolerance, share) => {
      for (let channel = 0; channel < 3; channel += 1) {
        let sx = 0, sy = 0, sxx = 0, sxy = 0;
        const n = pixels.length;
        for (const pixel of pixels) {
          const a = pixel[2 + channel];
          const b = data[((top + pixel[1]) * width + left + pixel[0]) * 4 + channel];
          sx += a; sy += b; sxx += a * a; sxy += a * b;
        }
        const spread = n * sxx - sx * sx;
        const gain = spread > 0 ? (n * sxy - sx * sy) / spread : 1;
        if (spread > n * n * 100 && (gain < 0.5 || gain > 1.4)) return false;
        const offset = (sy - gain * sx) / n;
        let good = 0;
        for (const pixel of pixels) {
          const b = data[((top + pixel[1]) * width + left + pixel[0]) * 4 + channel];
          if (Math.abs(gain * pixel[2 + channel] + offset - b) <= tolerance) good += 1;
        }
        if (good < share * n) return false;
      }
      return true;
    };
    const matches = [];
    for (const template of templates) {
      for (let top = 0; top + template.h <= height; top += 1) {
        for (let left = 0; left + template.w <= width; left += 1) {
          if (!fits(template.keys, left, top, 24, 1)) continue;
          if (fits(template.pixels, left, top, 20, 0.85)) {
            // The sprite stands on its tile: centred horizontally, feet at the bottom.
            matches.push({ x: left + template.w / 2, y: top + template.h - 8 });
          }
        }
      }
    }
    if (!matches.length) return null;
    const centre = [width / 2, height / 2];
    const best = matches.sort((a, b) => Math.hypot(a.x - centre[0], a.y - centre[1]) - Math.hypot(b.x - centre[0], b.y - centre[1]))[0];
    const rect = canvas.getBoundingClientRect();
    return { canvas, x: rect.left + best.x * rect.width / width, y: rect.top + best.y * rect.height / height };
  }

  async function walkToTrainer(npc) {
    for (let attempt = 0; attempt < 3 && !challenge(); attempt += 1) {
      const spot = await locateTrainer(npc);
      if (!spot) {
        await sleep(600);
        continue;
      }
      setStatus(`Procurando ${npc.name} por perto...`);
      const init = { bubbles: true, cancelable: true, clientX: spot.x, clientY: spot.y, button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse', isPrimary: true };
      spot.canvas.dispatchEvent(new PointerEvent('pointerdown', init));
      spot.canvas.dispatchEvent(new PointerEvent('pointerup', { ...init, buttons: 0 }));
      try {
        await until(challenge, 6000, 'andar até o treinador');
      } catch (error) {
        if (error instanceof Stop) throw error;
      }
    }
    return challenge();
  }

  async function talkAndFight(npc) {
    const key = talkKey();
    for (let attempt = 0; attempt < 2 && !challenge(); attempt += 1) {
      await pause(350, 700);
      dispatchEvent(new KeyboardEvent('keydown', { key: key.length === 1 ? key.toLowerCase() : key, bubbles: true }));
      await sleep(80);
      dispatchEvent(new KeyboardEvent('keyup', { key: key.length === 1 ? key.toLowerCase() : key, bubbles: true }));
      try {
        await until(challenge, 3500, 'abrir o desafio');
      } catch (error) {
        if (error instanceof Stop) throw error;
      }
    }
    // Nothing happened after talking: the trainer may have wandered off, so look for it.
    const dialog = challenge() ?? (npc.gfx ? await walkToTrainer(npc) : null);
    if (!dialog) return 'unreachable';
    const foe = text(dialog.querySelector('.b5-ch-name'));
    if (foe && !sameTrainer(npc.name, foe)) {
      dialog.querySelector('[data-nofight]')?.click();
      await pause();
      return 'skipped';
    }
    await pause(200, 500);
    dialog.querySelector('[data-fight]')?.click();
    await until(() => inArena() || resultWindow(), 15000, 'começar a batalha');
    setStatus(`Lutando contra ${npc.name}...`);
    const seen = new Set();
    const result = await until(() => {
      const dex = foeInPlay();
      if (dex) seen.add(dex);
      return resultWindow();
    }, FIGHT_TIMEOUT, 'terminar a batalha');
    saveTeam(npc, [...seen]);
    const outcome = result.dataset.result;
    const sentToCenter = /Centro Pokémon/i.test(text(result));
    await pause();
    result.querySelector('[data-ah="ok"]')?.click();
    await until(() => !resultWindow(), 8000, 'fechar o resultado');
    return outcome === 'win' ? 'won' : (sentToCenter ? 'lost-healed' : 'lost');
  }

  // HP of the main Pokémon from the HUD ("33/ 50").
  function hpRatio() {
    const match = text($('.hud-hp-numbers')).match(/(\d+)\s*\/\s*(\d+)/);
    return match && Number(match[2]) ? Number(match[1]) / Number(match[2]) : null;
  }

  async function heal() {
    const button = $('.hud-act.center[data-act="center"]');
    if (!button) return;
    setStatus('Indo ao Centro Pokémon para curar a equipe...');
    await pause(150, 400);
    button.click();
    // The trainer walks there; healing ends when the HUD shows full HP again.
    await until(() => (hpRatio() ?? 1) >= 0.99, 120000, 'curar no Centro Pokémon');
    await pause(600, 1200);
  }

  // ---- Panel ----
  const LABELS = {
    won: 'Vencido', lost: 'Derrota', skipped: 'Pulado', locked: 'Bloqueado',
    unreachable: 'Inacessível', closed: 'Inacessível', avoided: 'Evitado', current: 'Agora', todo: '',
  };
  function renderProgress() {
    const { route, done, total } = run;
    const left = total - done;
    progressEl.hidden = false;
    box.querySelector('[data-daily-left]').textContent = left ? (left === 1 ? 'Falta 1' : `Faltam ${left}`) : 'Tudo feito!';
    box.querySelector('[data-daily-total]').textContent = `${done} de ${total}`;
    const bar = box.querySelector('[data-daily-bar]');
    bar.setAttribute('aria-valuemax', String(total));
    bar.setAttribute('aria-valuenow', String(done));
    bar.querySelector('i').style.width = `${total ? Math.round(done / total * 100) : 100}%`;
    routeEl.hidden = !route.length;
    routeEl.replaceChildren(...route.map(npc => {
      const item = document.createElement('li');
      item.dataset.state = npc.state;
      item.innerHTML = '<span></span><small></small><b></b>';
      item.children[0].textContent = `${npc.name} · Nv. ${npc.level}`;
      item.children[1].textContent = npc.edge ? `${npc.place} · time com ${TYPE_NAMES[npc.edge] ?? npc.edge}` : npc.place;
      item.children[2].textContent = LABELS[npc.state] ?? '';
      return item;
    }));
    routeEl.querySelector('[data-state="current"]')?.scrollIntoView({ block: 'nearest' });
  }

  function showRange() {
    const main = mainPokemon();
    const below = levelRange();
    const lowest = Math.max(1, main ? main.level - below : 1);
    rangeEl.textContent = main
      ? (lowest === main.level
        ? `${main.name}, Nv. ${main.level}: só treinadores do Nv. ${main.level}.`
        : `${main.name}, Nv. ${main.level}: treinadores do Nv. ${lowest} ao ${main.level}.`)
      : 'Entre no jogo para ver o Pokémon principal.';
  }

  function setRunning(on) {
    goButton.hidden = on;
    stopButton.hidden = !on;
    levelsInput.disabled = on;
    box.toggleAttribute('data-running', on);
  }

  stopButton.addEventListener('click', () => stop('Parado.'));

  goButton.addEventListener('click', async () => {
    if (run) return;
    const main = mainPokemon();
    showRange();
    if (!main) {
      setStatus('Não achei o Pokémon principal no HUD.');
      return;
    }
    run = { stopped: false, reason: '', route: [], done: 0, total: 0 };
    setRunning(true);
    routeEl.hidden = true;
    progressEl.hidden = true;
    try {
      if (inArena() || resultWindow() || challenge()) throw new Error('Termine a batalha ou o diálogo aberto antes.');
      if (isHunting()) {
        setStatus('Parando a caça...');
        $('.hud-act.hunt[data-act="hunt"]').click();
        await until(() => !isHunting(), 8000, 'parar a caça');
        await pause();
      }
      setStatus('Calculando a rota...');
      const { route, beatenInRange, lockedInRange } = await buildRoute(main.level);
      run.route = route.map(npc => {
        const edge = avoidBox.checked ? typeEdge(npc, main.dex) : null;
        return { ...npc, edge, state: edge ? 'avoided' : 'todo' };
      });
      const avoided = run.route.filter(npc => npc.state === 'avoided').length;
      run.total = route.length - avoided + beatenInRange;
      run.done = beatenInRange;
      renderProgress();
      if (!run.route.some(npc => npc.state === 'todo')) {
        if (avoided) {
          await closeMap();
          setStatus(`Nada a fazer: ${avoided} treinador(es) evitado(s) por vantagem de tipo.`);
          return;
        }
        await closeMap();
        setStatus(lockedInRange
          ? `Nada a fazer: ${lockedInRange} treinador(es) da faixa ainda bloqueado(s).`
          : 'Nada a fazer: todos os treinadores da faixa já foram vencidos hoje.');
        return;
      }
      let unreachableStreak = 0;
      for (const npc of run.route) {
        if (npc.state !== 'todo') continue;
        npc.state = 'current';
        renderProgress();
        if ((hpRatio() ?? 1) < HEAL_BELOW) await heal();
        setStatus(`Indo até ${npc.name} (${npc.place})...`);
        let outcome;
        try {
          const arrival = await teleportTo(npc);
          outcome = arrival === 'there' ? await talkAndFight(npc) : arrival;
        } catch (error) {
          // The game did not react (teleport or talk went nowhere): skip this trainer, unless
          // a battle is on screen, where moving on would be unsafe.
          if (error instanceof Stop || inArena() || resultWindow()) throw error;
          await recoverScreen();
          outcome = 'unreachable';
        }
        unreachableStreak = outcome === 'unreachable' ? unreachableStreak + 1 : 0;
        if (unreachableStreak >= MAX_UNREACHABLE_STREAK) {
          npc.state = outcome;
          renderProgress();
          throw new Error(`${MAX_UNREACHABLE_STREAK} treinadores seguidos sem resposta do jogo`);
        }
        if (outcome === 'lost') await heal();
        if (outcome === 'lost-healed') outcome = 'lost';
        npc.state = outcome;
        if (outcome === 'won') run.done += 1;
        renderProgress();
        await pause();
      }
      await closeMap().catch(() => {});
      const lost = run.route.filter(npc => npc.state === 'lost').length;
      const skipped = run.route.filter(npc => npc.state === 'skipped' || npc.state === 'locked').length;
      const unreachable = run.route.filter(npc => npc.state === 'unreachable' || npc.state === 'closed').length;
      setStatus(['Daily concluído.', lost && `${lost} derrota(s).`, skipped && `${skipped} pulado(s).`,
        unreachable && `${unreachable} inacessível(is).`,
        avoided && `${avoided} evitado(s) por vantagem de tipo.`]
        .filter(Boolean).join(' '));
    } catch (error) {
      const current = run.route.find(npc => npc.state === 'current');
      if (current) current.state = 'todo';
      if (run.route.length) renderProgress();
      setStatus(error instanceof Stop ? error.message : `Parado: ${error.message}`);
    } finally {
      run = null;
      setRunning(false);
    }
  });
})();
