// Selos de tier e de captura no MAPA, selo na ficha do Pokémon e a seção "Moveset recomendado" da ficha.

// ---- Capture cost (CAPTURE comes from build-data.mjs; rules in capture.mjs and the game's
// "Captura" guide). Each ball's chance grows with the ₽ already spent on the species since its
// last capture; the capture is certain at certainAt × price and costs price / (1 + margin) on
// average. The margin follows the game's schedule (10% on 2026-11-20, then 2.5 points less a day, down to 5%).
const captureMoney = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const captureFull = new Intl.NumberFormat('pt-BR');
const capturePercent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

function captureMargin(now = Date.now()) {
  const schedule = CAPTURE.profitSchedule;
  if (!schedule) return 0;
  const day = Math.floor((now - (Date.parse(`${schedule.start}T00:00:00Z`) + 3 * 3600e3)) / 864e5);
  const value = schedule.from + schedule.stepPerDay * Math.max(0, day);
  return Math.min(Math.max(schedule.from, schedule.to), Math.max(Math.min(schedule.from, schedule.to), value));
}

function captureInfo(huntId) {
  const entry = CAPTURE.hunts?.[huntId];
  if (!entry) return null;
  const [dex, level, price] = entry;
  const poke = CAPTURE.balls['poke-ball'];
  const ultra = CAPTURE.balls['ultra-ball'];
  const average = price / (1 + captureMargin());
  return {
    dex, level, price, average,
    guaranteed: CAPTURE.certainAt * price,
    ultraAverage: Math.max(1, Math.round(average / ultra)),
    ultraGuaranteed: Math.ceil(CAPTURE.certainAt * price / ultra),
    firstPoke: Math.min(1, poke / (2 * price)),
  };
}

function createCaptureSegment(huntId, name) {
  const info = captureInfo(huntId);
  if (!info) return null;
  const segment = document.createElement('span');
  segment.className = 'pafk-tier-seg pafk-catch-seg';
  segment.dataset.hunt = huntId;
  segment.innerHTML = '<img src="/assets/ui/hud-icons/24-poke-ball.png" alt=""><b></b>';
  segment.querySelector('b').textContent = `₽${captureMoney.format(info.average)}`;
  segment.title = `Captura${name ? ` de ${name}` : ''} nesta caça: chega no Nv. ${info.level}. `
    + `Gasto médio ₽${captureFull.format(Math.round(info.average))} (≈ ${info.ultraAverage} Ultra Ball${info.ultraAverage > 1 ? 's' : ''}); `
    + `garantida em ₽${captureFull.format(info.guaranteed)} (${info.ultraGuaranteed} Ultra Balls). `
    + `Preço de captura ₽${captureFull.format(info.price)}; 1ª Poké Ball ${capturePercent.format(info.firstPoke)}. `
    + 'Sem contar a sorte acumulada nem bônus de captura.';
  segment.setAttribute('aria-label', segment.title);
  return segment;
}

// Names are single lines with an ellipsis, so the badges get a line of their own below the place:
// the tier of the main Pokémon and what it costs to catch it in this hunt.
function placeMapBadges(host, dex, huntId) {
  if (!host || !dex) return;
  let line = host.querySelector(':scope > .pafk-map-line');
  if (!line) {
    line = document.createElement('span');
    line.className = 'pafk-map-line';
    line.dataset.pafk = '';
    host.append(line);
  }
  placeTierBadge(line, dex);
  const current = line.querySelector(':scope > .pafk-catch-seg');
  if (current?.dataset.hunt === String(huntId ?? '')) return;
  current?.remove();
  // The name is the first text of the row or card ("Fearow", or "Fearow · Rota 17").
  const name = host.querySelector('strong')?.firstChild?.textContent.trim() ?? '';
  const segment = huntId ? createCaptureSegment(huntId, name) : null;
  if (segment && String(captureInfo(huntId).dex) === String(dex)) line.append(segment);
}

function decorateMap() {
  for (const row of document.querySelectorAll('.modal .mx-row[data-hunt]')) {
    placeMapBadges(row.querySelector('.mx-row-main'), dexFromAsset(row.querySelector('.icon')?.style.backgroundImage), row.dataset.hunt);
  }
  // The card has no hunt id; it shows the hunt selected in the list.
  const selected = document.querySelector('.modal .mx-row.sel[data-hunt]')?.dataset.hunt;
  for (const card of document.querySelectorAll('.modal .mx-card')) {
    placeMapBadges(card.querySelector('.mx-card-txt'), dexFromAsset(card.querySelector('.mx-card-art img')?.getAttribute('src')), selected);
  }
}

function moveKey(name) {
  return String(name).toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
}

const sheetReference = new Map();

function sheetCandidates(dex) {
  const mapped = MARKET_GUIDE?.species?.[Number(dex)];
  return [...(mapped?.finals ?? []), ...(mapped?.variants ?? [])]
    .map(id => MARKET_GUIDE.profiles[id])
    .filter(profile => rated(profile, 'pve') && rated(profile, 'pvp'));
}

function sheetColumn(profile, mode, known) {
  const build = profile[mode];
  const column = document.createElement('div');
  column.className = 'pafk-sheet-col';
  const head = document.createElement('div');
  head.className = 'pafk-sheet-title';
  const title = document.createElement('strong');
  title.textContent = MODES[mode].label;
  const badge = document.createElement('span');
  badge.className = TIER_BADGE;
  badge.append(tierSegment(mode, build.tier, false));
  const score = document.createElement('span');
  score.textContent = `nota ${scoreFormat.format(build.score)}`;
  head.append(title, badge, score);

  const list = document.createElement('ul');
  list.className = 'pafk-sheet-moves';
  let learned = 0;
  for (const name of build.moves) {
    const item = document.createElement('li');
    const has = known.has(moveKey(name));
    if (has) learned++;
    item.className = has ? 'is-known' : '';
    item.textContent = name;
    if (has) item.title = 'Este Pokémon já conhece';
    list.append(item);
  }
  const summary = document.createElement('p');
  summary.className = 'pafk-sheet-sum';
  summary.textContent = `${learned} de ${build.moves.length} golpes já aprendidos`;
  const nature = document.createElement('p');
  const [best, ...others] = build.natures ?? [];
  nature.innerHTML = '<span>Natureza</span> <b></b>';
  nature.querySelector('b').textContent = best
    ? natureWithEffect(best) + (others.length ? ` · ou ${others.map(natureWithEffect).join(', ')}` : '')
    : '—';
  const ivs = document.createElement('p');
  ivs.innerHTML = '<span>IVs prioritários</span> <b></b>';
  ivs.querySelector('b').textContent = priorityText(build) || '—';
  const note = document.createElement('p');
  note.className = 'pafk-sheet-note';
  note.textContent = build.note ?? '';
  column.append(head, list, summary, nature, ivs, note);
  return column;
}

function createSheetPanel(dex, known) {
  const candidates = sheetCandidates(dex);
  if (!candidates.length) return null;
  const section = document.createElement('section');
  section.className = 'lab-panel pafk-sheet';
  section.dataset.pafk = '';
  section.dataset.pafkSheet = '';
  section.innerHTML = `
    <header class="lab-head pafk-sheet-head">
      <div><h3>Moveset recomendado</h3><p>Golpes por nível da linha evolutiva e HMs da Loja de Celadon (Cut, Rock Smash, Strength, Surf, Waterfall, Fly e Dive). TMs ficam de fora porque só saem da TM Box. ✓ marca os que este Pokémon já conhece.</p></div>
      <label class="pafk-sheet-ref" hidden>Forma de referência <select></select></label>
    </header>
    <p class="pafk-sheet-refnote" hidden></p>
    <div class="pafk-sheet-grid"></div>`;
  const label = section.querySelector('.pafk-sheet-ref');
  const select = label.querySelector('select');
  const grid = section.querySelector('.pafk-sheet-grid');
  const referenceNote = section.querySelector('.pafk-sheet-refnote');
  select.append(...candidates.map(profile => new Option(profile.name, profile.id)));
  label.hidden = candidates.length < 2;
  const own = candidates.find(profile => String(profile.id) === String(dex));
  // Megas need a stone, so the default is the strongest regular final form; Megas stay in the selector.
  const regular = candidates.filter(profile => !profile.isMega);
  const strongest = [...(regular.length ? regular : candidates)]
    .sort((a, b) => b.pve.score + b.pvp.score - a.pve.score - a.pvp.score)[0];
  const saved = candidates.find(profile => String(profile.id) === sheetReference.get(String(dex)));
  select.value = String((saved ?? own ?? strongest).id);

  function render() {
    const profile = candidates.find(candidate => String(candidate.id) === select.value) ?? candidates[0];
    grid.replaceChildren(...Object.keys(MODES).map(mode => sheetColumn(profile, mode, known)));
    referenceNote.hidden = String(profile.id) === String(dex);
    referenceNote.textContent = `Recomendação para ${profile.name}, a forma final usada como referência.`;
  }
  select.addEventListener('change', () => {
    sheetReference.set(String(dex), select.value);
    render();
  });
  render();
  return section;
}

// FICHA DO POKÉMON: tier next to level and type, recommended moves right after "Golpes conhecidos".
function decorateSheet() {
  for (const lab of document.querySelectorAll('.lab[data-lab-dex]')) {
    const dex = lab.dataset.labDex;
    placeTierBadge(lab.querySelector('.lab-hero .lab-tags'), dex);
    const movesPanel = lab.querySelector('section[data-lab-section="golpes"]');
    if (!movesPanel) continue;
    const known = new Set([...movesPanel.querySelectorAll('.mv-name')].map(element => moveKey(element.textContent)));
    const key = `${dex}#${[...known].join('|')}`;
    const current = movesPanel.nextElementSibling?.matches('[data-pafk-sheet]') ? movesPanel.nextElementSibling : null;
    if (current?.dataset.key === key) continue;
    current?.remove();
    lab.querySelectorAll('[data-pafk-sheet]').forEach(stale => stale.remove());
    const section = createSheetPanel(dex, known);
    if (!section) continue;
    section.dataset.key = key;
    movesPanel.after(section);
  }
}

function decorateTierBadges() {
  for (const button of document.querySelectorAll('.mk .mk-sp-go[data-species]')) {
    const row = button.parentElement;
    placeTierBadge(row?.querySelector('.mk-spr-x > b, .mk-sp-x > h4'), button.dataset.species);
  }
  const spec = document.querySelector('.mk .mk-spec');
  const dex = spec?.querySelector('.mk-dexno')?.textContent.trim().match(/^#(\d+)$/)?.[1];
  if (dex) placeTierBadge(spec.querySelector('.mk-spec-name'), dex);
}
