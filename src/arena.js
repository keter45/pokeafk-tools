// ---- Arena: modo FULL do desvio --------------------------------------------------------------
// In trainer battles the attacks are aimed at the ground and every Pokémon waits a global cooldown
// between moves. Recorded fights (referencia/mecanicas.md, "Arena") showed that most enemy
// warnings are on screen for less than 200 ms, too short to walk out after seeing them, but the
// enemy attacks on a steady rhythm (2.0 s ± 30 ms for most trainers). So in FULL mode the script
// takes the battle over in MANUAL:
// - walks out of any enemy warning that covers our Pokémon (the slow ones can be dodged);
// - learns the enemy's rhythm from its warnings and our HP drops, and takes a step just before the
//   next expected hit, so it is not standing on the tile the enemy aimed at;
// - attacks in the window right after the enemy's hit, choosing like the game's AUTO (power × same
//   type × accuracy, from src/data/moves.js) and walking closer when the move does not reach.
// Only pixels of the world canvas and the arena DOM are read (no game internals). A real key or
// click from the player pauses it for a few seconds.
(() => {
  const TILE = 16;
  const SCAN_EVERY = 30;
  const STEP_TIMEOUT = 420;
  const USER_QUIET = 4000;
  // Step this long before the expected enemy hit (a step takes 267 ms; the enemy aims ~0.2–0.3 s
  // before the hit lands).
  const JUKE_FROM = 480;
  const JUKE_UNTIL = 140;
  // Our own attack keeps the Pokémon still while it casts: it must end this long before the expected
  // hit, so the step before it is free.
  const ATTACK_GUARD = 600;
  // Stat stages last 10 s; renewed a little before.
  const BUFF_MS = 9500;
  const RHYTHM_MIN = 600;
  const RHYTHM_MAX = 4500;
  const MERGE_HITS = 450;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const ARROWS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };

  let mode = readDodgeMode();
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const pageWindow = document.defaultView ?? window;

  // ---- Page state ----

  const inArena = () => !!document.querySelector('.in-arena');
  const fighting = () => inArena() && !document.querySelector('.ah-intro, .ah-pick, .ah-result[data-result]');
  const modeNow = () => document.querySelector('.mb-modes .mb-mode.on')?.dataset.mode ?? null;

  function card(color) {
    const el = [...document.querySelectorAll('.ah-card')].find(c => c.querySelector(`.ah-name.${color}`));
    if (!el) return null;
    const hp = el.querySelector('.ah-hp')?.getAttribute('title')?.match(/(\d+)\s*\/\s*(\d+)/);
    const id = el.querySelector('.ah-mon-ic')?.style.backgroundImage.match(/\/([\w-]+)\.png/)?.[1];
    const name = el.querySelector('.ah-mon-n')?.textContent.trim() ?? '';
    return hp && id ? { id, name, hp: +hp[1], max: +hp[2] } : null;
  }

  function moveKeys() {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem('pokeafk.ui.keys') || '{}') || {};
    } catch {}
    return [1, 2, 3, 4].map(n => (typeof saved[`move${n}`] === 'string' && saved[`move${n}`]) || String(n));
  }

  function press(key, code = key) {
    const init = { key, code, bubbles: true, cancelable: true };
    // Tampermonkey's sandbox has no bare dispatchEvent; send to the page's window.
    pageWindow.dispatchEvent(new KeyboardEvent('keydown', init));
    pageWindow.dispatchEvent(new KeyboardEvent('keyup', init));
  }

  // ---- Canvas ----

  function worldCanvas() {
    return [...document.querySelectorAll('canvas')]
      .filter(c => c.width && !c.dataset.pafk && c.getBoundingClientRect().width / c.width > 1.2
        && !c.closest('[hidden]') && !c.classList.contains('title-scene'))
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

  // HP bars: an 18×4 box in #283840 4 px above each Pokémon's head, 16 px of fill.
  const BAR = [40, 56, 64];
  const BAR_BG = [80, 104, 96];
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

  // Visible height of the overworld sprite: the bar sits 4 px above it.
  const spriteHeights = new Map();
  function spriteHeight(id) {
    if (spriteHeights.has(id)) return spriteHeights.get(id);
    spriteHeights.set(id, 0);
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
      spriteHeights.set(id, canvas.height - top);
    };
    img.onerror = () => spriteHeights.set(id, 24);
    img.src = `/assets/mon/ow/${id}.png`;
    return 0;
  }

  // Enemy warnings: opaque #f86048 edges around the tiles they will hit.
  function warningBoxes(f) {
    const { w, h, d } = f;
    const mask = new Uint8Array(w * h);
    for (let i = 0, k = 0; i < w * h; i++, k += 4) {
      if (Math.abs(d[k] - 248) <= 6 && Math.abs(d[k + 1] - 96) <= 6 && Math.abs(d[k + 2] - 72) <= 6) mask[i] = 1;
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
    const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x];
    const vertical = (x, y0) => { for (let i = 3; i <= 12; i++) if (at(x, y0 + i)) return true; return false; };
    // Tiles inside: walking each row, a left edge opens the shape and a right edge closes it.
    return boxes.filter(b => b[2] - b[0] >= 14 && b[3] - b[1] >= 14).map(box => {
      const cols = Math.round((box[2] - box[0] + 1) / TILE);
      const rows = Math.round((box[3] - box[1] + 1) / TILE);
      const cells = [];
      for (let r = 0; r < rows; r++) {
        let inside = false;
        for (let c = 0; c < cols; c++) {
          const x0 = box[0] + c * TILE;
          const y0 = box[1] + r * TILE;
          if (vertical(x0, y0)) inside = true;
          if (inside) cells.push([x0, y0]);
          if (vertical(x0 + TILE - 1, y0)) inside = false;
        }
      }
      return { box, cells };
    });
  }

  // ---- Battle state ----
  // Tiles are counted on a grid fixed when the fight starts (the arena camera does not follow the
  // Pokémon), so positions read from bars and warnings share coordinates.

  let fight = null;
  // jukeHit / jukeSafe: whether the enemy's hit expected right after a step still took HP.
  const stats = { fights: 0, hits: 0, warned: 0, dodged: 0, late: 0, jukes: 0, jukeHit: 0, jukeSafe: 0, attacks: 0 };

  // For tests only: 'pokeafk-market-filtros:arena-hold' (ms) keeps the script from attacking at the
  // start of each fight, so a weak enemy attacks long enough for the rhythm and the steps to show.
  const holdMs = () => {
    try {
      return Math.max(0, +localStorage.getItem('pokeafk-market-filtros:arena-hold') || 0);
    } catch {
      return 0;
    }
  };

  function newFight() {
    stats.fights++;
    return {
      holdUntil: performance.now() + holdMs(),
      grid: null, votes: new Map(), me: null, foe: null, meBar: null, foeBar: null, meMiss: 0, foeMiss: 0,
      warnings: [], lands: [], foeName: '', myHp: null,
      blocked: new Set(), statusAt: new Map(), lastAttack: null,
      jukedFor: 0, jukes: [], landing: [], drops: [], seenHits: 0, blindHits: 0, approach: false, lastManualClick: 0, switchedToManual: false,
    };
  }

  const key = ([x, y]) => `${x},${y}`;
  const toTile = (px, py) => [Math.round((px - fight.grid[0]) / TILE), Math.round((py - fight.grid[1]) / TILE)];

  function vote(phase, weight) {
    fight.votes.set(phase, (fight.votes.get(phase) ?? 0) + weight);
    let best = null;
    for (const [key, count] of fight.votes) if (!best || count > best[1]) best = [key, count];
    if (best[1] >= 3) fight.grid = best[0].split(',').map(Number);
  }

  function readPositions(f, mine, foe) {
    const bars = findBars(f);
    const pick = (who, previous) => {
      if (!who) return null;
      const want = Math.ceil(16 * Math.max(0, who.hp / Math.max(1, who.max)));
      let best = null;
      let bestScore = Infinity;
      for (const bar of bars) {
        const miss = Math.abs(bar.fill - want);
        if (miss > 3) continue;
        const off = previous ? Math.abs(bar.x - previous.x) + Math.abs(bar.y - previous.y) : 0;
        const score = miss * 40 + off;
        if (score < bestScore) { best = bar; bestScore = score; }
      }
      return best;
    };
    const meBar = pick(mine, fight.meBar);
    if (meBar) bars.splice(bars.indexOf(meBar), 1);
    const foeBar = pick(foe, fight.foeBar) ?? (bars.length === 1 ? bars[0] : null);
    const place = (bar, who) => {
      const visH = who && spriteHeight(who.id);
      return bar && visH ? { x: bar.x, y: bar.y + 4 - TILE + visH } : null;
    };
    const me = place(meBar, mine);
    const them = place(foeBar, foe);
    // The grid's phase is voted by frames where our Pokémon stands still (mid-step and during the
    // camera's shake on hits it is off by a few pixels).
    if (me && fight.meBar && meBar.x === fight.meBar.x && meBar.y === fight.meBar.y) {
      vote(`${((me.x % TILE) + TILE) % TILE},${((me.y % TILE) + TILE) % TILE}`, 1);
    }
    fight.meBar = meBar ?? fight.meBar;
    fight.foeBar = foeBar ?? fight.foeBar;
    if (!fight.grid) return;
    // A position not seen for a few frames is dropped rather than acted on.
    if (me) { fight.me = toTile(me.x, me.y); fight.meMiss = 0; } else if (++fight.meMiss > 4) fight.me = null;
    if (them) { fight.foe = toTile(them.x, them.y); fight.foeMiss = 0; } else if (++fight.foeMiss > 8) fight.foe = null;
  }

  function trackWarnings(boxes, now) {
    const seen = [];
    for (const { box, cells } of boxes) {
      let w = fight.warnings.find(o => !seen.includes(o)
        && Math.abs(o.box[0] - box[0]) + Math.abs(o.box[1] - box[1]) + Math.abs(o.box[2] - box[2]) + Math.abs(o.box[3] - box[3]) <= 8);
      if (!w) {
        w = { box, first: now, tiles: new Set(cells.map(([x, y]) => key(toTile(x, y)))), onMe: false };
        fight.warnings.push(w);
      }
      w.box = box;
      w.last = now;
      if (fight.me && w.tiles.has(key(fight.me))) w.onMe = true;
      seen.push(w);
    }
    for (const w of fight.warnings.filter(o => !seen.includes(o))) {
      // The edge stays opaque until 100 ms after the hit, then fades out.
      landed(w.last - 100);
      // Whether it hit is told by our HP, not by the tiles: settled in tick().
      if (w.onMe) fight.landing.push({ at: w.last - 100 });
    }
    fight.warnings = seen;
  }

  // ---- Enemy rhythm ----

  function landed(t) {
    const lands = fight.lands;
    if (lands.length && Math.abs(t - lands.at(-1)) < MERGE_HITS) return;
    lands.push(t);
    if (lands.length > 12) lands.shift();
  }

  function rhythm() {
    const gaps = [];
    for (let i = 1; i < fight.lands.length; i++) {
      const gap = fight.lands[i] - fight.lands[i - 1];
      if (gap >= RHYTHM_MIN && gap <= RHYTHM_MAX) gaps.push(gap);
    }
    if (gaps.length < 2) return null;
    const recent = gaps.slice(-5).sort((a, b) => a - b);
    return recent[recent.length >> 1];
  }

  function nextHit(now) {
    const every = rhythm();
    if (!every) return null;
    let next = fight.lands.at(-1) + every;
    while (next < now - 150) next += every;
    return { at: next, every };
  }

  // ---- Movement ----

  const blockedTile = tile => fight.blocked.has(key(tile));
  const dangerTiles = () => {
    const set = new Set();
    for (const w of fight.warnings) for (const t of w.tiles) set.add(t);
    return set;
  };
  const neighbours = tile => Object.entries(DIRS).map(([dir, [dx, dy]]) => ({ dir, tile: [tile[0] + dx, tile[1] + dy] }));
  const sameTile = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];

  async function step(dir) {
    const from = fight.me;
    press(ARROWS[dir]);
    const to = [from[0] + DIRS[dir][0], from[1] + DIRS[dir][1]];
    const end = performance.now() + STEP_TIMEOUT;
    while (performance.now() < end) {
      await sleep(25);
      if (!fight) return false;
      if (fight.me && !sameTile(fight.me, from)) return true;
    }
    // A fence, the arena's edge, an obstacle or the enemy.
    fight.blocked.add(key(to));
    return false;
  }

  // Shortest way out of the danger, at most 2 steps, preferring tiles off the enemy's row and
  // column (lines and beams follow them).
  function escapePath(danger) {
    const start = fight.me;
    const offLine = tile => (fight.foe && tile[0] !== fight.foe[0] && tile[1] !== fight.foe[1] ? 0 : 1);
    const paths = [];
    for (const a of neighbours(start)) {
      if (blockedTile(a.tile) || sameTile(a.tile, fight.foe)) continue;
      if (!danger.has(key(a.tile))) paths.push({ dirs: [a.dir], end: a.tile });
      for (const b of neighbours(a.tile)) {
        if (sameTile(b.tile, start) || blockedTile(b.tile) || sameTile(b.tile, fight.foe) || danger.has(key(b.tile))) continue;
        paths.push({ dirs: [a.dir, b.dir], end: b.tile });
      }
    }
    paths.sort((p, q) => p.dirs.length - q.dirs.length || offLine(p.end) - offLine(q.end));
    return paths[0] ?? null;
  }

  // One step before the expected hit: off the enemy's lines, not into a warning, keeping some
  // distance so melee enemies have to walk.
  function jukeDir(danger) {
    const options = neighbours(fight.me)
      .filter(o => !blockedTile(o.tile) && !sameTile(o.tile, fight.foe) && !danger.has(key(o.tile)))
      .map(o => {
        const dist = fight.foe ? Math.abs(o.tile[0] - fight.foe[0]) + Math.abs(o.tile[1] - fight.foe[1]) : 3;
        const line = fight.foe && (o.tile[0] === fight.foe[0] || o.tile[1] === fight.foe[1]) ? 2 : 0;
        return { dir: o.dir, score: line + Math.abs(dist - 3) + Math.random() * 0.5 };
      })
      .sort((a, b) => a.score - b.score);
    return options[0]?.dir ?? null;
  }

  // A step that opens the distance to the enemy (melee reaches 2 tiles in MANUAL), toward the side
  // with more free tiles known.
  function awayFromFoe(danger) {
    const dist = tile => Math.abs(tile[0] - fight.foe[0]) + Math.abs(tile[1] - fight.foe[1]);
    const room = tile => neighbours(tile).filter(o => !blockedTile(o.tile)).length;
    return neighbours(fight.me)
      .filter(o => !blockedTile(o.tile) && !danger.has(key(o.tile)) && dist(o.tile) > dist(fight.me))
      .sort((a, b) => room(b.tile) - room(a.tile))[0]?.dir ?? null;
  }

  function towardFoe() {
    if (!fight.foe || !fight.me) return null;
    const dx = fight.foe[0] - fight.me[0];
    const dy = fight.foe[1] - fight.me[1];
    const options = [];
    if (dx) options.push({ dir: dx > 0 ? 'right' : 'left', d: Math.abs(dx) });
    if (dy) options.push({ dir: dy > 0 ? 'down' : 'up', d: Math.abs(dy) });
    options.sort((a, b) => b.d - a.d);
    return options.find(o => {
      const t = [fight.me[0] + DIRS[o.dir][0], fight.me[1] + DIRS[o.dir][1]];
      return !blockedTile(t) && !sameTile(t, fight.foe);
    })?.dir ?? null;
  }

  // ---- Attacks ----

  // The slots in the combat bar with the move data generated by build-data.mjs (src/data/moves.js):
  // [type, power (0 for status), accuracy, cast ms, shape, reach].
  function slots() {
    return [...document.querySelectorAll('.movebar .mb-slot[data-slot]')].map(el => {
      const name = (el.querySelector('.mb-name .full')?.textContent || el.title.replace(/\s*\(.*$/, '')).trim().toUpperCase();
      const [type, power, accuracy, cast, shape, reach] = MOVES[name] ?? ['', 0, 100, 0, 'melee', 1];
      return { slot: +el.dataset.slot, name, ready: el.dataset.state === 'ready', type, power, accuracy, cast, shape, reach };
    });
  }

  // How far a move reaches, as the game counts it for MANUAL (melee 2 tiles, cones their radius,
  // moves around the user 0: they hit whatever is close).
  function reachOf(move) {
    if (move.shape === 'melee' || move.shape === 'rampage') return 2;
    if (move.shape === 'circle' || move.shape === 'field' || move.shape === 'self' || move.shape === 'borrow') return move.power ? move.reach : 99;
    return move.reach;
  }

  // Like the game's own AUTO: the ready move with the most power × same type × accuracy. Status
  // moves (buffs, debuffs) only when no damaging move is ready, at most once every 12 s each.
  function chooseMove(list, myTypes, distance, now) {
    const ready = list.filter(m => m.ready);
    // Self buffs first (Calm Mind, Swords Dance…), again once their 10 s stage is over, as the
    // game's AUTO does: without Calm Mind Alakazam's Psychic did ~40 to Lorelei's Slowbro instead of
    // taking it down in one hit.
    const buff = ready.find(m => !m.power && m.shape === 'self'
      && now - (fight.statusAt.get(m.slot) ?? -Infinity) > BUFF_MS);
    if (buff) return buff;
    const damaging = ready.filter(m => m.power > 0)
      .map(m => ({ ...m, score: m.power * (myTypes.includes(m.type) ? 1.5 : 1) * m.accuracy / 100, inReach: distance <= reachOf(m) }))
      .sort((a, b) => b.inReach - a.inReach || b.score - a.score);
    if (damaging.length) return damaging[0];
    return ready.find(m => !m.power && now - (fight.statusAt.get(m.slot) ?? -Infinity) > 12000) ?? null;
  }

  async function attack(move) {
    const keys = moveKeys();
    const k = keys[move.slot];
    press(k, /^\d$/.test(k) ? `Digit${k}` : k);
    stats.attacks++;
    if (!move.power) fight.statusAt.set(move.slot, performance.now());
    fight.lastAttack = { name: move.name, at: performance.now() };
    // The Pokémon stays still while it casts; wait it out before the next decision.
    await sleep(Math.max(160, move.cast + 80));
    if (!fight) return;
    const el = document.querySelector(`.movebar .mb-slot[data-slot="${move.slot}"]`);
    // Out of reach ("LONGE"): the next turns walk toward the enemy.
    fight.approach = !!el?.classList.contains('refused');
  }

  // ---- Loop ----

  let busy = false;
  let lastScan = 0;
  let lastUserInput = 0;
  let raf = 0;

  async function act(fn) {
    busy = true;
    try {
      await fn();
    } finally {
      busy = false;
    }
  }

  function keepManual(now) {
    if (modeNow() !== 'auto' || now - fight.lastManualClick < 1000) return;
    fight.lastManualClick = now;
    fight.switchedToManual = true;
    document.querySelector('.mb-modes .mb-mode[data-mode="manual"]')?.click();
  }

  function endFight() {
    if (!fight) return;
    // Back to AUTO for the hunt, as the player had it.
    if (fight.switchedToManual && modeNow() === 'manual') document.querySelector('.mb-modes .mb-mode[data-mode="auto"]')?.click();
    fight = null;
  }

  function tick(now) {
    raf = mode === 'full' ? requestAnimationFrame(tick) : 0;
    if (!raf) { endFight(); return; }
    if (now - lastScan < SCAN_EVERY) return;
    lastScan = now;
    if (!inArena()) { endFight(); return; }
    if (!fight) fight = newFight();
    // Why the script is not acting right now, for the tests (data-wait on the status strip).
    const wait = think(now) || '';
    if (hud.dataset.wait !== wait) hud.dataset.wait = wait;
  }

  function think(now) {
    if (!fighting()) return 'tela da arena';
    if (document.hidden || !document.hasFocus()) return 'sem foco';
    const mine = card('blue');
    const foe = card('red');
    if (!mine || !foe) return 'cartões';
    if (foe.name !== fight.foeName) {
      // A new enemy Pokémon: new rhythm.
      fight.foeName = foe.name;
      fight.lands = [];
      fight.foeBar = null;
      fight.seenHits = 0;
      fight.blindHits = 0;
    }
    if (mine.name !== fight.myName) {
      // Our next Pokémon: other moves in the slots, no stages yet.
      fight.myName = mine.name;
      fight.statusAt.clear();
      fight.myHp = null;
      fight.meBar = null;
    }
    if (fight.myHp != null && mine.hp < fight.myHp) {
      stats.hits++;
      // A hit with no warning on us (melee, homing, too quick to draw) cannot be stepped out of.
      const warned = fight.warnings.some(w => w.onMe) || fight.landing.some(w => Math.abs(now - w.at) < 450);
      if (warned) fight.seenHits++;
      else fight.blindHits++;
      landed(now);
      const juke = fight.jukes.find(j => Math.abs(now - j.at) < 450);
      if (juke) { stats.jukeHit++; fight.jukes.splice(fight.jukes.indexOf(juke), 1); }
      fight.drops.push(now);
      if (fight.drops.length > 20) fight.drops.shift();
    }
    for (const juke of fight.jukes.filter(j => now > j.at + 450)) {
      stats.jukeSafe++;
      fight.jukes.splice(fight.jukes.indexOf(juke), 1);
    }
    // The HP drops as the hit lands, before the warning's edge fades: look back at recent drops.
    for (const warned of fight.landing.filter(w => now > w.at + 450)) {
      stats.warned++;
      if (fight.drops.some(t => t > warned.at - 150 && t < warned.at + 450)) stats.late++;
      else stats.dodged++;
      fight.landing.splice(fight.landing.indexOf(warned), 1);
    }
    fight.myHp = mine.hp;
    const f = readFrame();
    if (!f) return 'canvas';
    // Warning edges sit exactly on the tile borders: they vote for the grid too (the camera's
    // offset differs between arenas).
    const boxes = warningBoxes(f);
    for (const { box } of boxes) vote(`${box[0] % TILE},${box[1] % TILE}`, 5);
    readPositions(f, mine, foe);
    if (!fight.grid) return 'grade';
    trackWarnings(boxes, now);
    showHud(now);
    if (busy) return 'ocupado';
    if (!fight.me) return 'posição';
    if (now - lastUserInput < USER_QUIET) return 'jogador';
    keepManual(now);
    if (modeNow() !== 'manual') return 'modo';

    const danger = dangerTiles();
    if (danger.has(key(fight.me))) {
      const path = escapePath(danger);
      if (path) act(async () => { for (const dir of path.dirs) if (!(await step(dir))) break; });
      return;
    }
    // Against an enemy whose hits come without warnings (Lorelei's Jynx: 7 hits, none drawn) the
    // step before its hit does not help and holding our attacks only gives it time: attack
    // whenever a move is ready and use our cooldown to back away instead.
    const blind = fight.blindHits >= 2 && fight.blindHits > fight.seenHits;
    const next = blind ? null : nextHit(now);
    if (next && now >= next.at - JUKE_FROM && now <= next.at - JUKE_UNTIL && fight.jukedFor !== Math.round(next.at)) {
      fight.jukedFor = Math.round(next.at);
      const dir = jukeDir(danger);
      if (dir) {
        stats.jukes++;
        fight.jukes.push({ at: next.at });
        act(() => step(dir));
        return;
      }
    }
    const distance = fight.foe ? Math.abs(fight.foe[0] - fight.me[0]) + Math.abs(fight.foe[1] - fight.me[1]) : 0;
    const myTypes = (typeof MARKET_GUIDE === 'object' ? MARKET_GUIDE.types[parseInt(mine.id, 10)] ?? '' : '').split('/');
    const move = chooseMove(slots(), myTypes, distance, now);
    if (fight.approach || (move?.power && distance > reachOf(move))) {
      const dir = towardFoe();
      if (dir) { act(async () => { await step(dir); if (fight) fight.approach = false; }); return; }
    }
    if (!move && distance <= 2 && fight.foe) {
      const dir = awayFromFoe(danger);
      if (dir) { act(() => step(dir)); return; }
    }
    if (!move) return 'sem golpe pronto';
    if (now < fight.holdUntil) return 'pausa de teste';
    // Our cast keeps the Pokémon still: no attack that would still be casting when the step before
    // the enemy's hit is due.
    if (next && now + move.cast + ATTACK_GUARD > next.at && now <= next.at + 100) return 'espera o golpe do oponente';
    act(() => attack(move));
  }

  // ---- On-screen status ----

  const hud = document.createElement('div');
  hud.className = 'pafk-arena-hud';
  hud.dataset.pafk = '';
  hud.hidden = true;
  hud.setAttribute('role', 'status');
  const style = document.createElement('style');
  style.dataset.pafk = '';
  style.textContent = `
    .pafk-arena-hud {
      position: fixed; left: 50%; top: 124px; transform: translateX(-50%); z-index: 42;
      padding: 4px 10px; border-radius: 6px; background: rgba(20, 32, 107, .92); color: #fff;
      font: 12px/1.3 system-ui, sans-serif; pointer-events: none; white-space: nowrap;
      box-shadow: 2px 3px 0 rgba(0, 0, 0, .35);
    }
    .pafk-arena-hud b { color: #ffd84a; font-weight: 700; }`;
  document.head.append(style);
  document.body.append(hud);

  let hudAt = 0;
  function showHud(now) {
    if (now - hudAt < 250) return;
    hudAt = now;
    const next = nextHit(now);
    const paused = now - lastUserInput < USER_QUIET;
    const text = paused
      ? 'FULL pausado: você está no controle'
      : fight.blindHits >= 2 && fight.blindHits > fight.seenHits
        ? `FULL · golpes do oponente sem aviso: ataca direto e se afasta na espera · golpes recebidos ${stats.hits}`
        : `FULL · ritmo do oponente ${next ?`${(next.every / 1000).toFixed(1).replace('.', ',')} s, próximo em ${Math.max(0, (next.at - now) / 1000).toFixed(1).replace('.', ',')} s` : 'aprendendo'}`
        + ` · avisos sem dano ${stats.dodged}/${stats.warned}`
        + (stats.jukeHit + stats.jukeSafe ? ` · passos antes do golpe ${stats.jukeSafe}/${stats.jukeHit + stats.jukeSafe} sem dano` : '')
        + ` · golpes recebidos ${stats.hits}`;
    if (hud.textContent !== text) hud.textContent = text;
    hud.dataset.state = JSON.stringify({ me: fight.me, foe: fight.foe, grid: fight.grid, lands: fight.lands.length, blocked: fight.blocked.size, last: fight.lastAttack?.name, meBar: fight.meBar, stats });
  }

  setInterval(() => {
    const show = mode === 'full' && inArena();
    if (hud.hidden === show) hud.hidden = !show;
  }, 500);

  // Real input from the player wins: the script pauses for a while.
  const onPlayerInput = event => {
    if (!event.isTrusted || !inArena() || event.target?.closest?.('.pafk-dodge-group')) return;
    if (event.type === 'keydown' && !/^(Arrow|[wasdWASD1-9]$)/.test(event.key)) return;
    if (event.type === 'pointerdown' && !event.target.closest?.('canvas, .movebar')) return;
    lastUserInput = performance.now();
  };
  addEventListener('keydown', onPlayerInput, true);
  addEventListener('pointerdown', onPlayerInput, true);

  document.addEventListener('pafk-dodge-mode', () => {
    mode = readDodgeMode();
    if (mode === 'full' && !raf) raf = requestAnimationFrame(tick);
  });
  if (mode === 'full') raf = requestAnimationFrame(tick);
})();
