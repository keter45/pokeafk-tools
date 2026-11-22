// ---- Desvio de golpes em área ----------------------------------------------------------------
// Adds a DESVIO button to the combat bar. While it is on, the hunt keeps its mode (AUTO or
// MANUAL) and, when the red warning of an enemy area attack covers the main Pokémon, the script
// steps out of it with the arrow keys. Only the canvas pixels are read (no game internals: the
// client detects hooks). The warning reaches the client already late by the network delay, so
// 0.3 s attacks cannot be dodged; slow ones (0.6 s and more) can.
//
// From AUTO the first step makes the game ask the server for MANUAL (one round trip) and the
// script clicks AUTO again once the attack has passed. In MANUAL steps go out at once and the
// server's "AUTO POR INATIVIDADE" keeps attacking between dodges. The game only takes movement
// in the focused tab, so nothing happens in background tabs.
(() => {
  const STORAGE = 'pokeafk-market-filtros:dodge';
  const TILE = 16;
  // More steps never fit in the warning time (a step takes 267 ms).
  const MAX_STEPS = 2;
  const SCAN_EVERY = 30;
  // The first step from AUTO waits for the server to switch to MANUAL.
  const FIRST_STEP_TIMEOUT = 900;
  const STEP_TIMEOUT = 350;
  // Keeps still a little after the steps so the hit lands before AUTO walks back.
  const SETTLE_MS = 350;
  // Real input from the player pauses the dodging for this long.
  const USER_QUIET = 3000;
  const BLOCKED_FOR = 2500;
  const KEYS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  const DELTA = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  let enabled = readEnabled();
  let raf = 0;
  let lastScan = 0;
  let frame = null;
  let pet = null;
  let petMisses = 0;
  let sprite = null;
  let dodging = false;
  let restUntil = 0;
  let lastUserInput = 0;
  const blocked = new Map();
  const tries = new Map();
  const stats = { tried: 0, out: 0, late: 0, blocked: 0 };

  function readEnabled() {
    try {
      return localStorage.getItem(STORAGE) === '1';
    } catch {
      return false;
    }
  }

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  // ---- Page state ----

  const modeNow = () => document.querySelector('.mb-modes .mb-mode.on')?.dataset.mode ?? null;
  const hunting = () => !!document.querySelector('.hud-act.hunt.on, .hud.world-hud.hunting');

  function canAct() {
    if (!enabled || document.hidden || !document.hasFocus()) return false;
    if (!hunting() || document.querySelector('#pafk-daily[data-running]')) return false;
    const bar = document.querySelector('.mb-modes');
    if (!bar || bar.closest('[hidden]')) return false;
    const active = document.activeElement;
    return !active?.matches?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
  }

  function worldCanvas() {
    return [...document.querySelectorAll('canvas')]
      .filter(canvas => canvas.width && !canvas.dataset.pafk
        && canvas.getBoundingClientRect().width / canvas.width > 1.2
        && !canvas.closest('[hidden]') && !canvas.classList.contains('title-scene'))
      .sort((a, b) => b.width * b.height - a.width * a.height)[0];
  }

  function readFrame() {
    const canvas = worldCanvas();
    if (!canvas) return null;
    try {
      const { width: w, height: h } = canvas;
      return { d: canvas.getContext('2d').getImageData(0, 0, w, h).data, w, h };
    } catch {
      return null;
    }
  }

  const near = (f, x, y, [r, g, b], tol) => {
    if (x < 0 || y < 0 || x >= f.w || y >= f.h) return false;
    const k = (y * f.w + x) * 4;
    return Math.abs(f.d[k] - r) <= tol && Math.abs(f.d[k + 1] - g) <= tol && Math.abs(f.d[k + 2] - b) <= tol;
  };

  // ---- Where the main Pokémon is ----
  // The game draws a 16 px HP bar (18×4 box in #283840) 4 px above the head of each Pokémon. The
  // player's one is the bar whose fill matches the HP in the HUD; its left edge is the tile's
  // left edge, and the tile's top comes from the visible height of the overworld sprite.

  const BAR = [40, 56, 64];
  const BAR_BG = [80, 104, 96];

  function hudHp() {
    const m = (document.querySelector('.hud-hp-numbers')?.textContent || '').replace(/\./g, '')
      .match(/(\d+)\s*\/\s*(\d+)/);
    return m && +m[2] ? { hp: +m[1], max: +m[2] } : null;
  }

  function petSprite() {
    const src = document.querySelector('.hud-active-button img.front')?.getAttribute('src') || '';
    const id = src.match(/\/front\/([\w-]+)\.png/)?.[1];
    if (!id) return null;
    if (sprite?.id === id) return sprite.visH ? sprite : null;
    sprite = { id, visH: 0 };
    const current = sprite;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let top = 0;
      outer: for (; top < canvas.height; top++)
        for (let x = 0; x < canvas.width; x++) if (data[(top * canvas.width + x) * 4 + 3]) break outer;
      current.visH = canvas.height - top;
    };
    img.src = `/assets/mon/ow/${id}.png`;
    return null;
  }

  function findBars(f) {
    const bars = [];
    for (let y = 1; y < f.h - 3; y++) {
      let run = 0;
      for (let x = 0; x <= f.w; x++) {
        if (x < f.w && near(f, x, y, BAR, 10)) { run++; continue; }
        const x0 = x - 18;
        if (run === 18 && near(f, x0, y + 3, BAR, 10) && near(f, x0 + 17, y + 3, BAR, 10)
          && near(f, x0, y + 1, BAR, 10) && near(f, x0 + 17, y + 1, BAR, 10) && !near(f, x0 + 1, y + 1, BAR, 10)) {
          let fill = 0;
          while (fill < 16 && !near(f, x0 + 1 + fill, y + 1, BAR_BG, 14)) fill++;
          bars.push({ x: x0 + 1, y: y + 1, fill });
        }
        run = 0;
      }
    }
    return bars;
  }

  function locatePet(f) {
    const look = petSprite();
    const hp = hudHp();
    const bars = look && hp ? findBars(f) : [];
    const want = hp ? Math.ceil(16 * Math.max(0, hp.hp / hp.max)) : 0;
    const prev = pet;
    let best = null;
    let bestScore = Infinity;
    for (const bar of bars) {
      const off = prev ? Math.abs(bar.x - prev.x) + Math.abs(bar.y + 4 - TILE + look.visH - prev.top) : 0;
      const miss = Math.abs(bar.fill - want);
      // The HUD may lag a hit behind the bar; a bar right where the pet was still counts.
      if (miss > 1 && !(prev && off <= 20 && miss <= 3)) continue;
      const score = miss * 1000 + off;
      if (score < bestScore) { best = bar; bestScore = score; }
    }
    if (best) {
      pet = { x: best.x, top: best.y + 4 - TILE + look.visH };
      petMisses = 0;
    } else if (++petMisses > 10) pet = null;
  }

  // ---- Warnings ----
  // Enemy warnings have opaque #f86048 edges around the tiles they will hit (the fill is
  // translucent). Edge runs are grouped into boxes; the tiles inside are told apart by the
  // edges on the Pokémon's row and column.

  const EDGE = [248, 96, 72];
  const isEdge = (f, x, y) => near(f, x, y, EDGE, 6);

  function findBoxes(f) {
    const { w, h } = f;
    const mask = new Uint8Array(w * h);
    for (let i = 0, k = 0; i < w * h; i++, k += 4) {
      if (Math.abs(f.d[k] - 248) <= 6 && Math.abs(f.d[k + 1] - 96) <= 6 && Math.abs(f.d[k + 2] - 72) <= 6) mask[i] = 1;
    }
    const segs = [];
    for (let y = 0; y < h; y++) {
      let run = 0;
      for (let x = 0; x <= w; x++) {
        if (x < w && mask[y * w + x]) { run++; continue; }
        if (run >= 12) segs.push([x - run, y, x - 1, y]);
        run = 0;
      }
    }
    for (let x = 0; x < w; x++) {
      let run = 0;
      for (let y = 0; y <= h; y++) {
        if (y < h && mask[y * w + x]) { run++; continue; }
        if (run >= 12) segs.push([x, y - run, x, y - 1]);
        run = 0;
      }
    }
    const boxes = [];
    for (const seg of segs) {
      let box = seg.slice();
      for (let i = boxes.length - 1; i >= 0; i--) {
        const b = boxes[i];
        if (b[0] <= box[2] + 1 && box[0] <= b[2] + 1 && b[1] <= box[3] + 1 && box[1] <= b[3] + 1) {
          box = [Math.min(b[0], box[0]), Math.min(b[1], box[1]), Math.max(b[2], box[2]), Math.max(b[3], box[3])];
          boxes.splice(i, 1);
        }
      }
      boxes.push(box);
    }
    return boxes.filter(b => b[2] - b[0] >= 14 && b[3] - b[1] >= 14);
  }

  const boxSize = box => [Math.round((box[2] - box[0] + 1) / TILE), Math.round((box[3] - box[1] + 1) / TILE)];
  const cellIn = (box, p) => [Math.round((p.x - box[0]) / TILE), Math.round((p.top - box[1]) / TILE)];

  function tileEdge(f, box, col, row, side) {
    const tx = box[0] + col * TILE;
    const ty = box[1] + row * TILE;
    for (let i = 2; i <= 13; i++) {
      if (side === 'left' && isEdge(f, tx, ty + i)) return true;
      if (side === 'right' && isEdge(f, tx + TILE - 1, ty + i)) return true;
      if (side === 'top' && isEdge(f, tx + i, ty)) return true;
      if (side === 'bottom' && isEdge(f, tx + i, ty + TILE - 1)) return true;
    }
    return false;
  }

  // Steps to leave the warning in each direction, or null when the Pokémon is not inside it.
  function exitsFrom(f, box, p) {
    const [cols, rows] = boxSize(box);
    const [col, row] = cellIn(box, p);
    if (col < 0 || row < 0 || col >= cols || row >= rows) return null;
    // Walking away from the Pokémon, the first edge met tells which side of the shape it is on.
    const scan = (from, to, step, exitSide, entrySide, at) => {
      for (let k = from; k !== to; k += step) {
        if (at(k, exitSide)) return { exit: Math.abs(k - from) + 1 };
        if (k !== from && at(k, entrySide)) return { outside: true };
      }
      return { exit: null };
    };
    const onRow = (k, side) => tileEdge(f, box, k, row, side);
    const onCol = (k, side) => tileEdge(f, box, col, k, side);
    const right = scan(col, cols, 1, 'right', 'left', onRow);
    const left = scan(col, -1, -1, 'left', 'right', onRow);
    const down = scan(row, rows, 1, 'bottom', 'top', onCol);
    const up = scan(row, -1, -1, 'top', 'bottom', onCol);
    if (right.outside || left.outside || down.outside || up.outside) return null;
    return {
      right: right.exit ?? cols - col,
      left: left.exit ?? col + 1,
      down: down.exit ?? rows - row,
      up: up.exit ?? row + 1,
    };
  }

  function planDodge(f, boxes) {
    const now = performance.now();
    for (const box of boxes) {
      const exits = exitsFrom(f, box, pet);
      if (!exits) continue;
      const key = box.join(',');
      if ((tries.get(key) ?? 0) >= 2) continue;
      const options = Object.entries(exits)
        .filter(([dir, steps]) => steps <= MAX_STEPS && (blocked.get(dir) ?? 0) < now)
        .filter(([dir, steps]) => {
          const [dx, dy] = DELTA[dir];
          const to = { x: pet.x + dx * steps * TILE, top: pet.top + dy * steps * TILE };
          return to.x >= 0 && to.top >= 0 && to.x + TILE <= f.w && to.top + TILE <= f.h
            && !boxes.some(other => other !== box && exitsFrom(f, other, to));
        })
        .sort((a, b) => a[1] - b[1]);
      if (!options.length) continue;
      tries.set(key, (tries.get(key) ?? 0) + 1);
      if (tries.size > 50) tries.delete(tries.keys().next().value);
      return { box, options: options.map(([dir, steps]) => ({ dir, steps })) };
    }
    return null;
  }

  // ---- Dodging ----

  function press(dir) {
    const init = { key: KEYS[dir], code: KEYS[dir], bubbles: true, cancelable: true };
    // Tampermonkey's sandbox has no bare dispatchEvent; send to the page's window.
    const target = document.defaultView ?? window;
    target.dispatchEvent(new KeyboardEvent('keydown', init));
    target.dispatchEvent(new KeyboardEvent('keyup', init));
  }

  async function waitFor(test, timeout) {
    const end = performance.now() + timeout;
    while (performance.now() < end) {
      if (test()) return true;
      await sleep(20);
    }
    return test();
  }

  // The warning being dodged, followed from frame to frame: it stays put in the world while the
  // camera may pan with the Pokémon, so moves are measured against it, not against the screen.
  let target = null;
  let frameBoxes = [];

  function followTarget() {
    if (!target) return null;
    let best = null;
    let bestDist = TILE * 1.5;
    for (const box of frameBoxes) {
      const dist = Math.abs(box[0] + box[2] - target[0] - target[2]) / 2
        + Math.abs(box[1] + box[3] - target[1] - target[3]) / 2;
      if (dist < bestDist) { best = box; bestDist = dist; }
    }
    target = best;
    return best;
  }

  const petCell = () => {
    const box = followTarget();
    return box && pet ? cellIn(box, pet) : null;
  };

  // One step: 'moved', 'blocked' (a wall, another Pokémon, the hunt's edge) or 'gone' (the
  // warning ended, so the attack landed before the step showed).
  async function step(dir, timeout) {
    const [dx, dy] = DELTA[dir];
    const cell = petCell();
    const screen = pet;
    press(dir);
    let moved = false;
    await waitFor(() => {
      const now = petCell();
      if (cell && now) moved = (now[0] - cell[0]) * dx + (now[1] - cell[1]) * dy >= 1;
      else if (!cell && screen && pet) moved = (pet.x - screen.x) * dx + (pet.top - screen.top) * dy >= TILE / 2;
      return moved || (cell && !target);
    }, timeout);
    if (moved) return 'moved';
    return cell && !target ? 'gone' : 'blocked';
  }

  async function runDodge(plan) {
    dodging = true;
    target = plan.box;
    stats.tried++;
    const fromAuto = modeNow() === 'auto';
    const started = performance.now();
    try {
      let result = 'blocked';
      let firstStep = true;
      // A blocked way is dropped for a while and the next best one is tried.
      ways: for (const { dir, steps } of plan.options) {
        for (let i = 0; i < steps; i++) {
          const moved = await step(dir, firstStep && fromAuto ? FIRST_STEP_TIMEOUT : STEP_TIMEOUT);
          firstStep = false;
          if (moved === 'gone') { result = 'late'; break ways; }
          if (moved === 'blocked') {
            blocked.set(dir, performance.now() + BLOCKED_FOR);
            break;
          }
          if (i === steps - 1) {
            // Out in time only if the warning is still there once the Pokémon has left it.
            const box = followTarget();
            result = box && pet && !exitsFrom(frame, box, pet) ? 'out' : 'late';
            break ways;
          }
        }
      }
      stats[result]++;
      await sleep(SETTLE_MS);
    } finally {
      target = null;
      if (fromAuto) restoreAuto(started);
      restUntil = performance.now() + 250;
      dodging = false;
      updateButton();
    }
  }

  // Back to AUTO after a dodge that started there. The server may still be answering the switch
  // to MANUAL, so it checks again a few times; the player's own input always wins.
  async function restoreAuto(since) {
    for (let i = 0; i < 4 && enabled; i++) {
      if (lastUserInput > since || modeNow() !== 'manual') return;
      document.querySelector('.mb-modes .mb-mode[data-mode="auto"]')?.click();
      await sleep(700);
    }
  }

  function tick(now) {
    raf = enabled ? requestAnimationFrame(tick) : 0;
    if (now - lastScan < SCAN_EVERY) return;
    lastScan = now;
    if (!canAct()) {
      pet = null;
      return;
    }
    frame = readFrame();
    if (!frame) return;
    locatePet(frame);
    frameBoxes = findBoxes(frame);
    if (dodging || !pet || now < restUntil || now - lastUserInput < USER_QUIET) return;
    const plan = planDodge(frame, frameBoxes);
    if (plan) runDodge(plan);
  }

  // Real input from the player wins: dodging pauses for a while.
  const onPlayerInput = event => {
    if (!event.isTrusted || button.contains(event.target)) return;
    if (event.type === 'keydown' && !/^(Arrow|[wasdWASD1-4]$)/.test(event.key)) return;
    if (event.type === 'pointerdown' && !event.target.closest?.('canvas, .mb-modes, .mb-slots')) return;
    lastUserInput = performance.now();
  };
  addEventListener('keydown', onPlayerInput, true);
  addEventListener('pointerdown', onPlayerInput, true);

  // ---- Button ----
  // A one-button group next to AUTO/MANUAL with the same look, copied from the game's own
  // buttons at runtime: filled when on, plain text when off.

  const group = document.createElement('span');
  group.className = 'pafk-dodge-group';
  group.dataset.pafk = '';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pafk-dodge';
  button.textContent = 'DESVIO';
  group.append(button);

  const style = document.createElement('style');
  style.dataset.pafk = '';
  style.textContent = `
    .pafk-dodge-group {
      display: inline-flex; align-items: center; margin-left: 6px;
      background: var(--pafk-g-bg, #fff); border: var(--pafk-g-border, 1px solid #b9cde6);
      border-radius: var(--pafk-g-radius, 6px); padding: var(--pafk-g-pad, 1px);
    }
    .pafk-dodge {
      appearance: none; border: 0; margin: 0; cursor: pointer;
      font: var(--pafk-b-font, inherit); padding: var(--pafk-b-pad, 0 7px);
      height: var(--pafk-b-h, auto); border-radius: var(--pafk-b-radius, 4px);
      background: var(--pafk-off-bg, transparent); color: var(--pafk-off-fg, #3f5585);
    }
    .pafk-dodge[aria-pressed="true"] {
      background: var(--pafk-on-bg, #14c2f0); color: var(--pafk-on-fg, #062a63);
      box-shadow: var(--pafk-on-shadow, none);
    }
    .pafk-dodge:focus-visible { outline: 2px solid var(--pafk-on-fg, #062a63); outline-offset: 1px; }`;
  document.head.append(style);

  function copyTheme() {
    const modes = document.querySelector('.mb-modes');
    const on = modes?.querySelector('.mb-mode.on');
    const off = modes?.querySelector('.mb-mode:not(.on)');
    if (!modes || !on || !off) return;
    const g = getComputedStyle(modes);
    const a = getComputedStyle(on);
    const b = getComputedStyle(off);
    const vars = {
      '--pafk-g-bg': g.background, '--pafk-g-border': `${g.borderTopWidth} ${g.borderTopStyle} ${g.borderTopColor}`,
      '--pafk-g-radius': g.borderRadius, '--pafk-g-pad': g.padding,
      '--pafk-b-font': b.font, '--pafk-b-pad': b.padding, '--pafk-b-h': b.height, '--pafk-b-radius': b.borderRadius,
      '--pafk-off-bg': b.background, '--pafk-off-fg': b.color,
      '--pafk-on-bg': a.background, '--pafk-on-fg': a.color, '--pafk-on-shadow': a.boxShadow,
    };
    for (const [name, value] of Object.entries(vars)) group.style.setProperty(name, value);
  }

  function updateButton() {
    button.setAttribute('aria-pressed', String(enabled));
    const result = stats.tried
      ? ` Nesta sessão: ${stats.tried} tentados, ${stats.out} saíram antes do golpe, ${stats.late} tarde demais, ${stats.blocked} sem caminho livre.`
      : '';
    button.title = enabled
      ? `Desvio LIGADO: sai dos golpes em área lentos andando 1 ou 2 quadrados. Só funciona com a aba em foco. Clique para desligar.${result}`
      : 'Desvio DESLIGADO. Clique para ligar: sai dos golpes em área lentos durante a caça (só com a aba em foco).';
  }

  button.addEventListener('click', event => {
    event.stopPropagation();
    enabled = !enabled;
    try {
      localStorage.setItem(STORAGE, enabled ? '1' : '0');
    } catch {}
    updateButton();
    if (enabled && !raf) raf = requestAnimationFrame(tick);
  });

  function mount() {
    const modes = document.querySelector('.mb-modes');
    if (!modes) return;
    if (group.previousElementSibling !== modes) modes.after(group);
    copyTheme();
    updateButton();
  }
  mount();
  setInterval(mount, 1000);
  if (enabled) raf = requestAnimationFrame(tick);
})();
