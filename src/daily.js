// ---- Fazer daily ---------------------------------------------------------------------------
// Fights the trainers of the day whose level sits between the main Pokémon's level and 10 below.
// The route comes from the MAPA's NPC list (sorted by XP, which also marks the locked ones),
// grouped by place. Each fight: open MAPA → NPCs → pick the trainer → "Teleportar até lá" →
// talk to the trainer → LUTAR → wait for the result → CONTINUAR. Input from the player stops
// the loop, as do failures where it would be unsafe to continue.
(() => {
  // Levels below the main Pokémon; the player can change it in the card.
  const DEFAULT_RANGE = 10;
  const MAX_RANGE = 99;
  const RANGE_STORAGE = 'pokeafk-market-filtros:daily-range';
  const FIGHT_TIMEOUT = 10 * 60 * 1000;
  const KEYS_STORAGE = 'pokeafk.ui.keys';
  const HEAL_BELOW = 0.5;
  const NEARBY_DIRECTIONS = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
  // Trainers in a row where the game did not react before the daily gives up.
  const MAX_UNREACHABLE_STREAK = 4;

  class Stop extends Error {}
  // The game did not react in time. Only this kind of failure skips a trainer; any other error
  // is a bug and stops the daily, instead of passing for an unreachable trainer.
  class NoResponse extends Error {}
  // Tampermonkey's sandbox has no bare window globals such as dispatchEvent (Firefox reports
  // "(intermediate value).dispatchEvent is not a function"), so events go to the page's window.
  const pageWindow = document.defaultView ?? window;
  let run = null;

  const box = document.createElement('section');
  box.id = 'pafk-daily';
  box.dataset.pafk = '';
  box.setAttribute('aria-label', 'Daily de treinadores');
  box.innerHTML = `
    <button type="button" class="pafk-daily-toggle" aria-expanded="false" aria-controls="pafk-daily-panel" data-daily-toggle>
      <span aria-hidden="true">⚔</span> Daily
    </button>
    <div class="pafk-daily-body" id="pafk-daily-panel" hidden data-daily-body>
      <header>
        <h2 title="Arraste para mover. Clique duas vezes para voltar ao lugar.">Treinadores do dia</h2>
        <button type="button" class="pafk-daily-x" aria-label="Fechar painel do Daily" data-daily-toggle>×</button>
      </header>
      <div class="pafk-daily-content">
        <div class="pafk-daily-main">
          <img alt="" hidden data-daily-sprite>
          <div>
            <strong data-daily-main>Pokémon principal</strong>
            <p class="pafk-daily-range" data-daily-range></p>
          </div>
        </div>
        <div class="pafk-daily-progress" hidden data-daily-progress>
          <div class="pafk-daily-count"><strong data-daily-left></strong><span>Vitórias <span data-daily-total></span></span></div>
          <div class="pafk-daily-bar" role="progressbar" aria-label="Vitórias" aria-valuemin="0" data-daily-bar><i></i></div>
        </div>
        <p class="pafk-daily-status" role="status" aria-live="polite" data-daily-status></p>
        <ol class="pafk-daily-route" aria-label="Rota de treinadores" hidden data-daily-route></ol>
        <div class="pafk-daily-options">
          <label class="pafk-daily-levels">
            <span><strong>Níveis abaixo do principal</strong><small>Sugerido: ${DEFAULT_RANGE}</small></span>
            <input type="number" min="0" max="${MAX_RANGE}" step="1" value="${DEFAULT_RANGE}" inputmode="numeric" data-daily-levels>
          </label>
          <label class="pafk-daily-avoid">
            <input type="checkbox" aria-describedby="pafk-daily-avoid-help" data-daily-avoid checked>
            <span><strong>Evitar vantagem de tipo</strong><small id="pafk-daily-avoid-help">O Daily aprende o time de cada treinador na primeira luta.</small></span>
          </label>
        </div>
      </div>
      <div class="pafk-daily-actions">
        <button type="button" class="pafk-daily-go" data-daily-go>Fazer daily</button>
        <button type="button" class="pafk-daily-stop" hidden data-daily-stop>Parar</button>
      </div>
    </div>`;
  const toggleButton = box.querySelector('.pafk-daily-toggle');
  const body = box.querySelector('[data-daily-body]');
  const goButton = box.querySelector('[data-daily-go]');
  const stopButton = box.querySelector('[data-daily-stop]');
  const statusEl = box.querySelector('[data-daily-status]');
  const rangeEl = box.querySelector('[data-daily-range]');
  const mainEl = box.querySelector('[data-daily-main]');
  const spriteEl = box.querySelector('[data-daily-sprite]');
  const progressEl = box.querySelector('[data-daily-progress]');
  const routeEl = box.querySelector('[data-daily-route]');
  const avoidBox = box.querySelector('[data-daily-avoid]');
  const levelsInput = box.querySelector('[data-daily-levels]');

  const style = document.createElement('style');
  style.dataset.pafk = '';
  style.textContent = `
    #pafk-daily {
      --daily-ink: #15264f; --daily-muted: #485d7e; --daily-line: #d9e4f3;
      --daily-blue: #2459aa; --daily-navy: #14265a;
      position: fixed; right: 8px; top: 96px; z-index: 40;
      display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
      font: 13px/1.4 system-ui, sans-serif; color: var(--daily-ink);
      font-variant-numeric: tabular-nums; -webkit-font-smoothing: antialiased;
    }
    #pafk-daily [hidden] { display: none !important; }
    #pafk-daily :is(h2, p, ol) { margin: 0; }
    #pafk-daily :focus-visible { outline: 2px solid #3279cf; outline-offset: 2px; }
    #pafk-daily button { font: inherit; cursor: pointer; }
    #pafk-daily .pafk-daily-toggle {
      display: inline-flex; gap: 7px; align-items: center; min-height: 40px;
      border: 1px solid #5875ac; border-radius: 9px; background: var(--daily-navy); color: #fff;
      padding: 0 12px; font-weight: 800; box-shadow: 0 2px 0 #0e1b3e, 0 4px 12px rgb(13 29 64 / .22);
    }
    #pafk-daily .pafk-daily-toggle:is(:hover, [aria-expanded="true"]),
    #pafk-daily[data-running] .pafk-daily-toggle { background: var(--daily-blue); }
    #pafk-daily .pafk-daily-body {
      box-sizing: border-box; width: min(334px, calc(100vw - 16px));
      max-height: calc(var(--daily-room, 80vh) - 46px); overflow: hidden;
      display: flex; flex-direction: column;
      border: 1px solid #a7bce1; border-radius: 14px; background: #fff;
      box-shadow: 0 2px 6px rgb(12 29 64 / .17), 0 12px 30px rgb(12 29 64 / .28);
    }
    #pafk-daily .pafk-daily-body > header {
      display: flex; align-items: center; justify-content: space-between; flex: none;
      gap: 8px; padding: 4px 6px 4px 14px; background: var(--daily-navy); color: #fff;
    }
    #pafk-daily h2 { font: 800 15px/1.2 system-ui, sans-serif; text-wrap: balance; }
    #pafk-daily :is(.pafk-daily-toggle, .pafk-daily-body > header) { cursor: grab; touch-action: none; user-select: none; }
    #pafk-daily[data-dragging] :is(.pafk-daily-toggle, .pafk-daily-body > header) { cursor: grabbing; }
    #pafk-daily .pafk-daily-x {
      display: grid; place-items: center; flex: 0 0 40px; height: 40px;
      border: 0; border-radius: 8px; background: transparent; color: #fff; padding: 0;
      font-size: 23px; line-height: 1;
    }
    #pafk-daily .pafk-daily-x:hover { background: #294275; }
    #pafk-daily .pafk-daily-content {
      display: grid; align-content: start; gap: 10px; padding: 12px; overflow: auto; overscroll-behavior: contain;
    }
    #pafk-daily .pafk-daily-main {
      display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 8px 10px;
      border-radius: 9px; background: #eaf2ff; overflow-wrap: anywhere;
    }
    #pafk-daily .pafk-daily-main img {
      width: 48px; height: 48px; flex: none; object-fit: contain; image-rendering: pixelated;
    }
    #pafk-daily .pafk-daily-main strong { font-size: 14px; }
    #pafk-daily :is(.pafk-daily-range, .pafk-daily-options small) {
      color: var(--daily-muted); font-size: 12px; text-wrap: pretty;
    }
    #pafk-daily .pafk-daily-options { border: 1px solid var(--daily-line); border-radius: 9px; }
    #pafk-daily[data-running] .pafk-daily-options { display: none; }
    #pafk-daily .pafk-daily-options label { display: flex; align-items: center; gap: 10px; padding: 8px 10px; }
    #pafk-daily .pafk-daily-options small { display: block; margin-top: 2px; }
    #pafk-daily .pafk-daily-levels { justify-content: space-between; }
    #pafk-daily .pafk-daily-levels input {
      box-sizing: border-box; flex: 0 0 58px; width: 58px; min-height: 40px; padding: 4px 6px;
      font: inherit; font-weight: 800; color: var(--daily-ink);
      border: 1px solid #aabfdf; border-radius: 6px; background: #f6f9ff;
    }
    #pafk-daily .pafk-daily-levels input:disabled { color: var(--daily-muted); }
    #pafk-daily .pafk-daily-avoid { border-top: 1px solid var(--daily-line); cursor: pointer; }
    #pafk-daily .pafk-daily-avoid:has(input:disabled) { cursor: default; }
    #pafk-daily .pafk-daily-avoid input { width: 17px; height: 17px; flex: none; margin: 0; accent-color: var(--daily-blue); }
    #pafk-daily .pafk-daily-count { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 2px 8px; }
    #pafk-daily .pafk-daily-count strong { font-size: 15px; }
    #pafk-daily .pafk-daily-count span { color: var(--daily-muted); }
    #pafk-daily .pafk-daily-bar { height: 7px; border-radius: 4px; background: #e1e9f6; overflow: hidden; margin-top: 5px; }
    #pafk-daily .pafk-daily-bar i { display: block; height: 100%; width: 0; border-radius: inherit; background: #23744c; }
    #pafk-daily .pafk-daily-status {
      padding: 7px 9px; border-radius: 6px; border-left: 3px solid #507cb9; background: #eff5ff; text-wrap: pretty;
    }
    #pafk-daily .pafk-daily-status:empty { display: none; }
    #pafk-daily .pafk-daily-status[data-tone="stop"] { border-color: #ad6216; background: #fff1de; color: #713a05; }
    #pafk-daily .pafk-daily-status[data-tone="done"] { border-color: #23744c; background: #e7f6ed; color: #17603d; }
    #pafk-daily .pafk-daily-route {
      list-style: none; padding: 0; max-height: 168px; overflow: auto;
      border: 1px solid var(--daily-line); border-radius: 9px; scrollbar-width: thin;
    }
    #pafk-daily .pafk-daily-route li {
      display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center;
      gap: 8px; padding: 7px 9px; font-size: 12px;
    }
    #pafk-daily .pafk-daily-route li + li { border-top: 1px solid var(--daily-line); }
    #pafk-daily .pafk-daily-route li div { overflow-wrap: anywhere; }
    #pafk-daily .pafk-daily-route li :is(strong, small) { display: block; }
    #pafk-daily .pafk-daily-route li small { color: var(--daily-muted); font-size: 11px; }
    #pafk-daily .pafk-daily-route li b {
      border-radius: 5px; padding: 3px 6px; background: #edf0f6; color: #455473; font-size: 11px;
    }
    #pafk-daily .pafk-daily-route li b:empty { display: none; }
    #pafk-daily .pafk-daily-route li[data-state="current"] { background: #edf4ff; box-shadow: inset 3px 0 var(--daily-blue); }
    #pafk-daily .pafk-daily-route li[data-state="current"] b { color: #174683; background: #dceaff; }
    #pafk-daily .pafk-daily-route li[data-state="won"] b { color: #17603d; background: #e0f3e8; }
    #pafk-daily .pafk-daily-route li[data-state="lost"] b { color: #a02735; background: #fbe7ea; }
    #pafk-daily .pafk-daily-route li:is([data-state="avoided"], [data-state="unreachable"]) b { color: #713a05; background: #fff0da; }
    #pafk-daily .pafk-daily-actions {
      display: flex; flex: none; padding: 10px 12px 12px; border-top: 1px solid var(--daily-line); background: #f6f9ff;
    }
    #pafk-daily .pafk-daily-actions button {
      flex: 1; border-radius: 8px; min-height: 42px; padding: 6px 10px; font-weight: 800; border: 1px solid transparent;
    }
    #pafk-daily .pafk-daily-go { background: var(--daily-blue); color: #fff; }
    #pafk-daily .pafk-daily-go:hover { background: #194985; }
    #pafk-daily .pafk-daily-stop { background: #fff0f0; color: #a02735; border-color: #f0bac1; }
    #pafk-daily .pafk-daily-stop:hover { background: #fce0e4; }
    /* Phones on their side (the game asks for landscape): the button sits under the Contas chip,
       the open card takes the full height on the right, and both stay under the game's windows. */
    @media (max-height: 500px) {
      #pafk-daily .pafk-daily-toggle { min-height: 34px; }
      #pafk-daily .pafk-daily-body { position: fixed; top: 8px; right: 8px; max-height: calc(100vh - 16px); }
      #pafk-daily:has(.pafk-daily-body:not([hidden])) { z-index: 42; }
      #pafk-daily .pafk-daily-content { gap: 8px; padding: 8px 10px; }
      #pafk-daily .pafk-daily-actions { padding: 8px 10px; }
      body:has(.hud .modal.open) #pafk-daily:not([data-running]) { display: none; }
    }
    @media (prefers-reduced-motion: no-preference) {
      #pafk-daily .pafk-daily-actions button { transition: scale .12s ease-out; }
      #pafk-daily .pafk-daily-actions button:active { scale: .96; }
      #pafk-daily .pafk-daily-bar i { transition: width .2s ease-out; }
    }
  `;
  document.head.append(style);
  document.body.append(box);

  // Until the player drags it, it sits under the game's quick actions column (CAÇAR, Poke
  // Center, Poke Market). On a phone on its side that column is full (XP boost, Mecânicas,
  // Analisador, CAPTURA), so it goes under the Contas chip instead.
  // A dragged position is kept, anchored by the top right corner.
  const POSITION_STORAGE = 'pokeafk-market-filtros:daily-pos';
  const SHORT_SCREEN = matchMedia('(max-height: 500px)');
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(POSITION_STORAGE) ?? 'null');
  } catch {
    saved = null;
  }
  // On short screens the open card is pinned to the viewport, so only the button needs room.
  const onlyButton = () => body.hidden || getComputedStyle(body).position === 'fixed';
  function clampPosition({ right, top }) {
    const width = (onlyButton() ? toggleButton.offsetWidth : body.offsetWidth) || 80;
    return {
      right: Math.min(Math.max(0, right), Math.max(0, innerWidth - width)),
      top: Math.min(Math.max(0, top), Math.max(0, innerHeight - (onlyButton() ? 40 : 230))),
    };
  }
  function defaultPosition() {
    const rect = selector => {
      const found = document.querySelector(selector)?.getBoundingClientRect();
      return found && found.width > 0 ? found : null;
    };
    if (SHORT_SCREEN.matches) {
      // Under the Contas chip, left edges lined up (the wild Pokémon's box is to its left and
      // the quick actions below AUTO); without the monitor, left of AUTO.
      const chip = rect('#pafk-monitor .pafk-mon-chip');
      const auto = rect('.hud.world-hud .hud-auto-toggle');
      const width = toggleButton.offsetWidth || 80;
      if (chip) return { top: Math.round(chip.bottom + 6), right: Math.round(innerWidth - chip.left - width) };
      if (auto) return { top: Math.round(auto.top), right: Math.round(innerWidth - auto.left + 8) };
    }
    const quick = rect('.hud.world-hud .hud-quick');
    return quick
      ? { top: Math.round(quick.bottom + 6), right: Math.max(8, Math.round(innerWidth - quick.right)) }
      : { top: 96, right: 8 };
  }
  function placeBox() {
    const position = saved ?? defaultPosition();
    const { right, top } = clampPosition(position);
    box.style.top = `${top}px`;
    box.style.right = `${right}px`;
    box.style.setProperty('--daily-room', `${innerHeight - top - 6}px`);
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
      toggleButton.setAttribute('aria-expanded', String(!body.hidden));
      if (body.hidden && toggle !== toggleButton) toggleButton.focus();
      if (!body.hidden && !run) showRange();
      placeBox();
    });
  }

  // ---- Reading the game ----
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const text = element => element?.textContent.replace(/\s+/g, ' ').trim() ?? '';
  const fold = value => value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  function mainPokemon() {
    const button = $('button.hud-active-button');
    const label = button?.getAttribute('aria-label') ?? '';
    const match = label.match(/Resumo de (.+), nível (\d+)/i);
    const sprite = button?.querySelector('img.front')?.getAttribute('src') ?? '';
    const dex = Number(sprite.match(/\/(\d+)[^/]*\.png/)?.[1] ?? 0);
    return match ? { name: match[1], level: Number(match[2]), dex, sprite } : null;
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
      const talk = Array.isArray(keys?.talk) ? keys.talk.find(key => typeof key === 'string' && key) : keys?.talk;
      if (typeof talk === 'string' && talk) return talk;
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
      if (performance.now() - started > timeout) throw new NoResponse(`O jogo não respondeu: ${what}.`);
      await sleep(150);
    }
  }
  function stop(reason) {
    if (!run || run.stopped) return;
    run.stopped = true;
    run.reason = reason;
  }
  function setStatus(message, tone = 'info') {
    statusEl.dataset.tone = tone;
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
    else pageWindow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
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
  const mapTeleportError = () => mapWindow()?.querySelector('.mx-card > .mx-msg.bad[role="alert"]');
  const teleportPending = () => $('.zone-fade.on, .zone-loading:not([hidden])');
  const cancelFailedTeleport = () => $('.zone-loading:not([hidden]) .zl-fail [data-zone="back"]');

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
    // The selected card may report an access requirement outside the shared error alert.
    const restriction = card.parentElement.querySelector(':scope > .mx-msg:not(.bad)');
    if (/abre quando|ins[ií]gnia/i.test(text(restriction))) {
      npc.failure = text(restriction);
      return 'closed';
    }

    await pause(150, 400);
    const tp = await until(() => {
      const button = mapWindow()?.querySelector('.mx-card:has(> .mx-card-in.npc) [data-act="tp"]');
      return button && !button.disabled ? button : null;
    }, 15000, 'liberar o teleporte');
    const previousError = mapTeleportError();
    const previousMessage = text(previousError);
    const newError = () => {
      const error = mapTeleportError();
      const message = text(error);
      return error !== previousError || message !== previousMessage ? message : '';
    };
    tp.click();

    // The MAPA closes when the transition starts. A refusal finishes the transition and
    // reopens the MAPA, where the old alert can persist across NPC selections.
    let started = false;
    const arrival = await until(() => {
      if (cancelFailedTeleport()) return 'unreachable';
      if (teleportPending()) {
        started = true;
        return null;
      }
      if (!mapWindow()) return 'there';
      if (newError()) return 'closed';
      return started ? 'reopened' : null;
    }, 15000, 'teleportar');
    if (arrival === 'closed' || arrival === 'reopened') {
      if (arrival === 'reopened') await pause(250, 450);
      const rejection = newError();
      if (rejection) {
        npc.failure = rejection;
        return 'closed';
      }
      // An open MAPA without a new error does not prove the move failed.
      await closeMap();
      return 'there';
    }
    if (arrival === 'unreachable') {
      cancelFailedTeleport()?.click();
      npc.failure = 'O teleporte não terminou.';
    }
    return arrival;
  }

  // After a step that went nowhere: decline an open challenge and close the MAPA.
  async function recoverScreen() {
    if (teleportPending()) throw new Stop('Parado. O teleporte ainda está em andamento.');
    challenge()?.querySelector('[data-nofight]')?.click();
    await closeMap();
    await pause(200, 400);
  }

  // ---- Finding a trainer on screen ----
  // Trainers that wander may have left the spot the teleport faces. The world canvas draws
  // sprites 1:1 from /assets/npcs/{gfx}.png (frame size in npcs.json), so the trainer's frames
  // are searched in the canvas pixels, nearest to the centre (the player) first. A click on
  // the trainer makes the game walk up to it and talk.
  let npcMetaCache;
  async function npcMeta() {
    npcMetaCache ??= fetch(new URL('/assets/npcs/npcs.json', location.href)).then(response => response.json()).catch(() => ({}));
    return npcMetaCache;
  }
  const appearanceCache = new Map();
  async function npcAppearance(gfx) {
    if (appearanceCache.has(gfx)) return appearanceCache.get(gfx);
    const meta = (await npcMeta())[gfx];
    const templates = [];
    let markerToTile = meta?.hd?.tall ? meta.hd.tall + 6 : null;
    // The blue badge is on the main canvas even when the sprite is drawn on the HD layer.
    if (meta && !meta.hd && meta.w && meta.h) {
      let headRow = Infinity;
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
                if (data[at + 3]) headRow = Math.min(headRow, y);
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
      // The game draws the badge 13 px above the visible top of the sprite.
      markerToTile = meta.h + 5 - (Number.isFinite(headRow) ? headRow : 10);
    }
    const appearance = { templates, markerToTile };
    appearanceCache.set(gfx, appearance);
    return appearance;
  }

  function worldCanvas() {
    const scene = $('canvas:has(+ canvas.scene-names)');
    if (scene?.width && scene.getBoundingClientRect().width) return scene;
    return $$('canvas')
      .filter(canvas => canvas.width && canvas.getBoundingClientRect().width / canvas.width > 1.2
        && !canvas.closest('[hidden]') && !canvas.classList.contains('title-scene'))
      .sort((a, b) => b.width * b.height - a.width * a.height)[0];
  }

  function nearbyBattleMarker(data, width, height, markerToTile) {
    if (markerToTile === null) return null;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 16 * 3;
    const isColor = (x, y, red, green, blue) => {
      const index = (y * width + x) * 4;
      return data[index] === red && data[index + 1] === green && data[index + 2] === blue;
    };
    const dark = (x, y) => isColor(x, y, 19, 43, 99);
    let best = null;
    let nearest = radius;
    for (let top = Math.max(0, Math.floor(cy - markerToTile - radius));
      top + 11 < height && top <= cy - markerToTile + radius; top += 1) {
      for (let left = Math.max(0, Math.floor(cx - 5 - radius));
        left + 9 < width && left <= cx - 5 + radius; left += 1) {
        // The main layer contains the blue fill, navy outline and two-pixel tail.
        if (!isColor(left + 1, top + 1, 40, 124, 224) || !isColor(left + 8, top + 8, 40, 124, 224)
          || !dark(left + 1, top) || !dark(left + 8, top) || !dark(left, top + 4)
          || !dark(left + 9, top + 4) || !dark(left + 4, top + 11) || !dark(left + 5, top + 11)) continue;
        const x = left + 5;
        const y = top + markerToTile;
        const distance = Math.hypot(x - cx, y - cy);
        if (y < 0 || y >= height || distance >= nearest) continue;
        best = { x, y };
        nearest = distance;
      }
    }
    return best;
  }

  // Read the target sprite first, or the closest blue marker if the sprite is covered.
  async function locateTrainer(npc) {
    const { templates, markerToTile } = await npcAppearance(npc.gfx);
    const canvas = worldCanvas();
    if (!canvas || (!templates.length && markerToTile === null)) return null;
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
    const centre = [width / 2, height / 2];
    const best = matches.sort((a, b) => Math.hypot(a.x - centre[0], a.y - centre[1]) - Math.hypot(b.x - centre[0], b.y - centre[1]))[0]
      ?? nearbyBattleMarker(data, width, height, markerToTile);
    if (!best) return null;
    const rect = canvas.getBoundingClientRect();
    return { canvas, x: rect.left + best.x * rect.width / width, y: rect.top + best.y * rect.height / height };
  }

  function clickTrainer(spot) {
    const init = {
      bubbles: true, cancelable: true, clientX: spot.x, clientY: spot.y,
      button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse', isPrimary: true,
    };
    spot.canvas.dispatchEvent(new PointerEvent('pointerdown', init));
    spot.canvas.dispatchEvent(new PointerEvent('pointerup', { ...init, buttons: 0 }));
  }

  const interactionWindow = () => challenge() ?? $('.b5-again') ?? $('.npc-dialogue-backdrop, .quest-backdrop, .modal.open .win');
  function tapKey(key) {
    const init = { key: key.length === 1 ? key.toLowerCase() : key, bubbles: true, cancelable: true };
    pageWindow.dispatchEvent(new KeyboardEvent('keydown', init));
    pageWindow.dispatchEvent(new KeyboardEvent('keyup', init));
  }

  async function findTrainer(npc) {
    const expected = fold(npc.name);
    const key = talkKey();
    let replied = false;

    async function tryInteraction(action, timeout) {
      alive();
      if (inArena() || resultWindow()) throw new Stop('Parado porque uma batalha foi aberta.');
      if (!interactionWindow()) await action();

      let response;
      try {
        response = await until(interactionWindow, timeout, 'responder à interação');
      } catch (error) {
        if (error instanceof Stop) throw error;
        return null;
      }

      replied = true;
      const fight = response.querySelector('[data-fight]');
      const foe = text(response.querySelector('.b5-ch-name'));
      const trainer = foe
        ? [text(response.querySelector('.b5-ch-cls')), foe].filter(Boolean).join(' ')
        : text(response.querySelector('.b5-ch-msg')).match(/^(.+) quer batalhar\.$/i)?.[1];
      if (fight && trainer && fold(trainer) === expected) return { fight };

      // Talking can return the cooldown notice instead of a challenge, even if the MAPA
      // listed the trainer as available. Only credit a win for the named trainer.
      const ofToday = text(response.querySelector('.b5-again-head span')).replace(/\.$/, '')
        || text(response.querySelector('.b5-plain-text')).match(/^(.+?):\s*Já batalhamos hoje\b/i)?.[1];
      const beatToday = response.matches('.b5-again') && ofToday && fold(ofToday) === expected;
      const dismiss = response.querySelector('[data-nofight], [data-npc-close], [data-quest-close], button[aria-label="Fechar"]')
        ?? (response.matches('.b5-again') ? response.querySelector('[data-ok]') : null);
      if (!dismiss) throw new Stop('Parado. Feche a janela aberta no jogo.');
      dismiss.click();
      try {
        await until(() => interactionWindow() !== response, 2500, 'fechar a resposta do NPC');
      } catch (error) {
        if (error instanceof Stop) throw error;
        throw new Stop('Parado. A resposta do NPC ficou aberta.');
      }
      return beatToday ? { outcome: 'won' } : null;
    }

    await pause(350, 700);
    for (let attempt = 0; attempt < 2 && !replied; attempt += 1) {
      const result = await tryInteraction(() => tapKey(key), 3500);
      if (result) return result;
    }

    async function tryVisibleTrainer() {
      const spot = npc.gfx ? await locateTrainer(npc) : null;
      if (!spot && !interactionWindow()) return null;
      setStatus(`Tentando alcançar ${npc.name} pelo mapa...`);
      return tryInteraction(() => { if (spot) clickTrainer(spot); }, 6000);
    }

    // Walk to the intended sprite before a direction tap can move the player away.
    const visible = await tryVisibleTrainer();
    if (visible) return visible;

    // A quick direction tap faces a new side. If already facing that way, the first tap
    // may take one step. Talk after the server has had time to receive the new facing.
    setStatus(`Procurando ${npc.name} entre os NPCs próximos...`);
    for (const direction of NEARBY_DIRECTIONS) {
      const result = await tryInteraction(async () => {
        tapKey(direction);
        await pause(280, 380);
        // In the game, Z/E also accept an open challenge. Never use talk over a response.
        if (!interactionWindow()) tapKey(key);
      }, 1600);
      if (result) return result;
    }

    const afterTurning = await tryVisibleTrainer();
    if (afterTurning) return afterTurning;
    npc.failure = replied ? 'Nenhuma resposta confirmou este desafio.' : 'O NPC não respondeu à interação.';
    return { outcome: replied ? 'skipped' : 'unreachable' };
  }

  async function talkAndFight(npc) {
    const { fight, outcome } = await findTrainer(npc);
    if (outcome) return outcome;
    await pause(200, 500);
    if (challenge()?.querySelector('[data-fight]') !== fight) return 'skipped';
    fight.click();
    await until(() => inArena() || resultWindow(), 15000, 'começar a batalha');
    setStatus(`Lutando contra ${npc.name}...`);
    const seen = new Set();
    const result = await until(() => {
      const dex = foeInPlay();
      if (dex) seen.add(dex);
      return resultWindow();
    }, FIGHT_TIMEOUT, 'terminar a batalha');
    saveTeam(npc, [...seen]);
    const battleResult = result.dataset.result;
    const sentToCenter = /Centro Pokémon/i.test(text(result));
    await pause();
    result.querySelector('[data-ah="ok"]')?.click();
    await until(() => !resultWindow(), 8000, 'fechar o resultado');
    return battleResult === 'win' ? 'won' : (sentToCenter ? 'lost-healed' : 'lost');
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
    progressEl.hidden = !total;
    box.querySelector('[data-daily-left]').textContent = left ? (left === 1 ? 'Falta 1' : `Faltam ${left}`) : 'Tudo feito!';
    box.querySelector('[data-daily-total]').textContent = `${done} de ${total}`;
    const bar = box.querySelector('[data-daily-bar]');
    bar.setAttribute('aria-valuemax', String(total));
    bar.setAttribute('aria-valuenow', String(done));
    bar.querySelector('i').style.width = `${total ? Math.round(done / total * 100) : 100}%`;
    routeEl.hidden = !route.length;
    const scrollTop = routeEl.scrollTop;
    routeEl.replaceChildren(...route.map(npc => {
      const item = document.createElement('li');
      item.dataset.state = npc.state;
      if (npc.state === 'current') item.setAttribute('aria-current', 'step');
      item.innerHTML = '<div><strong></strong><small></small></div><b></b>';
      item.querySelector('strong').textContent = `${npc.name} · Nv. ${npc.level}`;
      const edge = npc.edge ? `time com ${TYPE_NAMES[npc.edge] ?? npc.edge}` : '';
      item.querySelector('small').textContent = [npc.place, edge, npc.failure].filter(Boolean).join(' · ');
      item.querySelector('b').textContent = LABELS[npc.state] ?? '';
      return item;
    }));
    routeEl.scrollTop = scrollTop;
    const current = routeEl.querySelector('[aria-current]');
    if (current && !body.hidden) {
      const list = routeEl.getBoundingClientRect();
      const row = current.getBoundingClientRect();
      routeEl.scrollTop += Math.min(0, row.top - list.top) + Math.max(0, row.bottom - list.bottom);
    }
  }

  function showRange() {
    const main = mainPokemon();
    const below = levelRange();
    const lowest = Math.max(1, (main?.level ?? 1) - below);
    mainEl.textContent = main ? `${main.name} · Nv. ${main.level}` : 'Pokémon principal';
    spriteEl.hidden = !main?.sprite;
    if (main?.sprite && spriteEl.getAttribute('src') !== main.sprite) spriteEl.src = main.sprite;
    rangeEl.textContent = main
      ? (lowest === main.level
        ? `Treinadores de nível ${main.level}`
        : `Treinadores do nível ${lowest} ao ${main.level}`)
      : 'Entre no jogo para ver a faixa de níveis.';
  }

  function setRunning(on) {
    const restoreFocus = document.activeElement === (on ? goButton : stopButton);
    goButton.hidden = on;
    stopButton.hidden = !on;
    levelsInput.disabled = on;
    avoidBox.disabled = on;
    box.toggleAttribute('data-running', on);
    if (restoreFocus) (on ? stopButton : goButton).focus({ preventScroll: true });
  }

  stopButton.addEventListener('click', () => stop('Parado.'));

  goButton.addEventListener('click', async () => {
    if (run) return;
    const main = mainPokemon();
    showRange();
    if (!main) {
      setStatus('Não achei o Pokémon principal no HUD.', 'stop');
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
          if (arrival !== 'there') await closeMap();
          outcome = arrival === 'there' ? await talkAndFight(npc) : arrival;
        } catch (error) {
          // The game did not react (teleport or talk went nowhere): skip this trainer, unless
          // a battle is on screen, where moving on would be unsafe.
          if (!(error instanceof NoResponse) || inArena() || resultWindow()) throw error;
          await recoverScreen();
          npc.failure = error.message;
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
        // A closed place (gym without the badges) or a locked trainer cannot be done today,
        // so it does not count in "Faltam N".
        if (outcome === 'closed' || outcome === 'locked') run.total -= 1;
        renderProgress();
        await pause();
      }
      await closeMap().catch(() => {});
      const lost = run.route.filter(npc => npc.state === 'lost').length;
      const skipped = run.route.filter(npc => npc.state === 'skipped' || npc.state === 'locked').length;
      const unreachable = run.route.filter(npc => npc.state === 'unreachable').length;
      const closed = run.route.filter(npc => npc.state === 'closed').length;
      setStatus(['Daily concluído.', lost && `${lost} derrota(s).`, skipped && `${skipped} pulado(s).`,
        unreachable && `${unreachable} sem resposta do jogo.`,
        closed && `${closed} em lugar fechado (falta insígnia).`,
        avoided && `${avoided} evitado(s) por vantagem de tipo.`]
        .filter(Boolean).join(' '), 'done');
    } catch (error) {
      const current = run.route.find(npc => npc.state === 'current');
      if (current) current.state = 'todo';
      if (run.route.length) renderProgress();
      setStatus(error instanceof Stop ? error.message
        : error instanceof NoResponse || !(error instanceof TypeError || error instanceof ReferenceError)
          ? `Parado: ${error.message}`
          : `Parado por um erro do script: ${error.message}`, 'stop');
    } finally {
      run = null;
      setRunning(false);
    }
  });
})();
