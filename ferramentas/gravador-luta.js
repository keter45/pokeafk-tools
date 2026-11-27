// Gravador de lutas na arena (ferramenta de pesquisa, não faz parte do userscript).
// Roda na página do jogo pelo navegador embutido com (0, eval)(código). Lê só os pixels do canvas
// do mundo e o DOM da arena, como o desvio: nada de ganchos internos do jogo.
//
// Grava, enquanto a raiz tem .in-arena:
// - cada aviso de golpe (borda #f86048 do oponente, borda branca nossa): caixa na tela, máscara
//   de quadrados, primeiro e último quadro em que a borda aparece opaca e a curva de
//   preenchimento (vermelho somado dentro da caixa), que mostra quando o golpe cai;
// - as barras de HP sobre os Pokémon (posição e preenchimento) a cada quadro gravado;
// - os cartões da arena (nome, nível, HP exato do `title`, ícone), o modo AUTO/MANUAL, o relógio,
//   o resultado e as teclas (com isTrusted).
//
// Uso: __pafkRec.status(), __pafkRec.stop(), __pafkRec.chunks(30000) e __pafkRec.chunk(i).
(() => {
  if (window.__pafkRec) window.__pafkRec.stop();
  const TILE = 16;
  const FRAME_EVERY = 33;
  const RED = [248, 96, 72];
  const rec = { v: 1, startedAt: new Date().toISOString(), canvas: null, frames: [], marks: [], events: [] };
  const t0 = performance.now();
  const now = () => Math.round(performance.now() - t0);
  let raf = 0;
  let lastFrame = 0;
  let nextId = 1;
  let open = [];
  let lastDom = '';
  let inArena = false;

  const event = (type, data) => rec.events.push({ t: now(), type, ...data });

  function worldCanvas() {
    return [...document.querySelectorAll('canvas')]
      .filter(c => c.width && !c.dataset.pafk && c.getBoundingClientRect().width / c.width > 1.2
        && !c.closest('[hidden]') && !c.classList.contains('title-scene'))
      .sort((a, b) => b.width * b.height - a.width * a.height)[0];
  }

  const isRed = (d, k) => Math.abs(d[k] - RED[0]) <= 6 && Math.abs(d[k + 1] - RED[1]) <= 6 && Math.abs(d[k + 2] - RED[2]) <= 6;
  // Our own warnings: rgba(248,248,248,0.9) over the ground.
  const isWhite = (d, k) => d[k] >= 222 && d[k + 1] >= 222 && d[k + 2] >= 222
    && Math.abs(d[k] - d[k + 1]) <= 10 && Math.abs(d[k + 1] - d[k + 2]) <= 10;

  function boxesOf(f, test) {
    const { w, h, d } = f;
    const mask = new Uint8Array(w * h);
    for (let i = 0, k = 0; i < w * h; i++, k += 4) if (test(d, k)) mask[i] = 1;
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
    return { boxes: boxes.filter(b => b[2] - b[0] >= 14 && b[3] - b[1] >= 14), mask };
  }

  // Tiles inside the shape: walking each row, a left edge opens the shape and a right edge closes it.
  function tileMask(f, mask, box) {
    const cols = Math.round((box[2] - box[0] + 1) / TILE);
    const rows = Math.round((box[3] - box[1] + 1) / TILE);
    const at = (x, y) => x >= 0 && y >= 0 && x < f.w && y < f.h && mask[y * f.w + x];
    const vert = (x, y0) => { for (let i = 3; i <= 12; i++) if (at(x, y0 + i)) return true; return false; };
    const lines = [];
    for (let r = 0; r < rows; r++) {
      let inside = false;
      let line = '';
      const y0 = box[1] + r * TILE;
      for (let c = 0; c < cols; c++) {
        const x0 = box[0] + c * TILE;
        if (vert(x0, y0)) inside = true;
        line += inside ? '#' : '.';
        if (vert(x0 + TILE - 1, y0)) inside = false;
      }
      lines.push(line);
    }
    return { cols, rows, tiles: lines };
  }

  function redness(f, box) {
    let sum = 0;
    for (let y = box[1] + 1; y < box[3]; y++) {
      for (let x = box[0] + 1; x < box[2]; x++) {
        const k = (y * f.w + x) * 4;
        const v = f.d[k] - (f.d[k + 1] + f.d[k + 2]) / 2;
        if (v > 0) sum += v;
      }
    }
    return Math.round(sum / ((box[2] - box[0]) * (box[3] - box[1])));
  }

  const BAR = [40, 56, 64];
  const BAR_BG = [80, 104, 96];
  const near = (f, x, y, c, tol) => {
    if (x < 0 || y < 0 || x >= f.w || y >= f.h) return false;
    const k = (y * f.w + x) * 4;
    return Math.abs(f.d[k] - c[0]) <= tol && Math.abs(f.d[k + 1] - c[1]) <= tol && Math.abs(f.d[k + 2] - c[2]) <= tol;
  };
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
          bars.push([x0 + 1, y + 1, fill]);
        }
        run = 0;
      }
    }
    return bars;
  }

  function readDom() {
    const side = card => {
      if (!card) return null;
      const hp = card.querySelector('.ah-hp')?.getAttribute('title')?.match(/(\d+)\s*\/\s*(\d+)/);
      const icon = card.querySelector('.ah-mon-ic')?.style.backgroundImage.match(/icon\/([\w-]+)\.png/)?.[1];
      return {
        trainer: card.querySelector('.ah-name')?.textContent.trim(),
        mon: card.querySelector('.ah-mon-n')?.textContent.trim(),
        lv: card.querySelector('.ah-mon-lv')?.textContent.trim(),
        dex: icon,
        hp: hp ? +hp[1] : null,
        max: hp ? +hp[2] : null,
      };
    };
    const cards = [...document.querySelectorAll('.ah-card')];
    return {
      mine: side(cards.find(c => c.querySelector('.ah-name.blue'))),
      foe: side(cards.find(c => c.querySelector('.ah-name.red'))),
      mode: document.querySelector('.mb-modes .mb-mode.on')?.dataset.mode ?? null,
      result: document.querySelector('.ah-result')?.dataset.result ?? null,
    };
  }

  function track(f, kind, found) {
    const t = now();
    const seen = [];
    for (const { box, mask } of found) {
      let m = open.find(o => o.kind === kind && !seen.includes(o)
        && Math.abs(o.box[0] - box[0]) + Math.abs(o.box[1] - box[1]) + Math.abs(o.box[2] - box[2]) + Math.abs(o.box[3] - box[3]) <= 8);
      if (!m) {
        m = { id: nextId++, kind, first: t, last: t, box, ...tileMask(f, mask, box), fill: [] };
        rec.marks.push(m);
        open.push(m);
      }
      m.last = t;
      m.box = box;
      if (kind === 'foe') m.fill.push([t, redness(f, box)]);
      seen.push(m);
    }
    open = open.filter(o => o.kind !== kind || seen.includes(o) || t - o.last < 300);
    return seen.map(m => m.id);
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    const arena = !!document.querySelector('.in-arena');
    if (arena !== inArena) {
      inArena = arena;
      event(arena ? 'arenaStart' : 'arenaEnd', {});
    }
    if (!arena) return;
    if (performance.now() - lastFrame < FRAME_EVERY) return;
    lastFrame = performance.now();
    const canvas = worldCanvas();
    if (!canvas) return;
    let f;
    try {
      f = { d: canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data, w: canvas.width, h: canvas.height };
    } catch {
      return;
    }
    const scale = +(canvas.getBoundingClientRect().width / canvas.width).toFixed(3);
    const cv = `${f.w}x${f.h}@${scale}`;
    if (rec.canvas !== cv) { rec.canvas = cv; event('canvas', { size: cv }); }
    const red = boxesOf(f, isRed);
    const white = boxesOf(f, isWhite);
    const foeIds = track(f, 'foe', red.boxes.map(box => ({ box, mask: red.mask })));
    const mineIds = track(f, 'mine', white.boxes.map(box => ({ box, mask: white.mask })));
    rec.frames.push([now(), findBars(f), foeIds, mineIds]);
    const dom = readDom();
    const key = JSON.stringify(dom);
    if (key !== lastDom) { lastDom = key; event('dom', dom); }
  }

  const onKey = e => {
    if (!/^(Arrow|[1-4wasdWASDzZ]$| $)/.test(e.key)) return;
    event('key', { key: e.key, trusted: e.isTrusted });
  };
  const onPointer = e => { if (e.isTrusted) event('pointer', { x: Math.round(e.clientX), y: Math.round(e.clientY), on: e.target?.className?.toString().slice(0, 40) }); };
  addEventListener('keydown', onKey, true);
  addEventListener('pointerdown', onPointer, true);
  raf = requestAnimationFrame(tick);

  let json = '';
  window.__pafkRec = {
    rec,
    status: () => ({ arena: inArena, t: now(), frames: rec.frames.length, marks: rec.marks.length,
      foe: rec.marks.filter(m => m.kind === 'foe').length, events: rec.events.length, last: rec.events.at(-1) }),
    stop() { cancelAnimationFrame(raf); removeEventListener('keydown', onKey, true); removeEventListener('pointerdown', onPointer, true); },
    chunks(size = 30000) { json = JSON.stringify(rec); this.size = size; return Math.ceil(json.length / size); },
    chunk(i) { return json.slice(i * this.size, (i + 1) * this.size); },
  };
  return 'gravador ligado';
})();
