// Filtros de natureza e IV do Mercado da Comunidade e o painel de recomendação.
const OFFER_LIST = '.mk-offers, .mk-lrs';
const OFFER_ROW = 'article.mk-offer, article.mk-lr';
const FILTERED_ATTR = 'data-pafk-filtered';
const memoryFilters = new Map();

function validIV(value) {
  return Number.isInteger(value) && value >= 0 && value <= 31;
}

function emptyFilters() {
  return { natures: new Set(), minimums: new Map() };
}

function storageKey(scope) {
  return scope === 'all' ? STORAGE_KEY : `${STORAGE_KEY}:${scope}`;
}

function readFilters(scope) {
  if (memoryFilters.has(scope)) return memoryFilters.get(scope);
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(scope)) || '{}');
    const savedNatures = Array.isArray(saved?.natures) ? saved.natures : [];
    return {
      natures: new Set(NATURES.filter(nature => savedNatures.includes(nature))),
      minimums: new Map(STATS.flatMap(([stat]) => validIV(saved?.minimums?.[stat])
        ? [[stat, saved.minimums[stat]]]
        : [])),
    };
  } catch {
    return emptyFilters();
  }
}

function saveFilters(scope, filters) {
  const { natures, minimums } = filters;
  try {
    if (!natures.size && !minimums.size) {
      localStorage.removeItem(storageKey(scope));
    } else {
      localStorage.setItem(storageKey(scope), JSON.stringify({
        natures: [...natures],
        minimums: Object.fromEntries(minimums),
      }));
    }
    memoryFilters.delete(scope);
  } catch {
    memoryFilters.set(scope, filters);
  }
}

function matchOffer(offer, { natures, minimums }) {
  let unknown = false;
  if (natures.size) {
    if (offer.nature && !natures.has(offer.nature)) return false;
    unknown = !offer.nature;
  }
  for (const [stat, minimum] of minimums) {
    const value = offer.ivs[stat];
    if (!validIV(value)) unknown = true;
    else if (value < minimum) return false;
  }
  return unknown ? null : true;
}

function readOffer(row) {
  const rawNature = row.querySelector('.mk-lr-nature, :scope > .mk-offer-who > small')?.textContent.trim();
  return { nature: NATURES.includes(rawNature) ? rawNature : null, ivs: readIVs(row.querySelector('.mk-ivs')) };
}

function readIVs(grid) {
  const ivs = {};
  for (const stat of grid?.children ?? []) {
    const label = stat.querySelector('small')?.textContent.trim().toUpperCase();
    const value = stat.querySelector('b')?.textContent.trim();
    const key = STAT_KEYS.get(label);
    if (key && /^\d{1,2}$/.test(value)) ivs[key] = Number(value);
  }
  return ivs;
}

function setNatureCheckboxes(form, natures) {
  for (const checkbox of form.querySelectorAll('[name="nature"]')) {
    checkbox.checked = natures.has(checkbox.value);
  }
  updateNatureCount(form);
}

function updateNatureCount(form) {
  const selected = form.querySelectorAll('[name="nature"]:checked').length;
  const summary = form.querySelector('[data-count]');
  summary.textContent = selected
    ? `· ${selected} ${selected === 1 ? 'selecionada' : 'selecionadas'}` : '';
  for (const head of form.querySelectorAll('[data-nat-row], [data-nat-col]')) {
    const boxes = natureGroup(form, head);
    head.setAttribute('aria-pressed', String(boxes.every(box => box.checked)));
  }
}

// Checkboxes of one chart row (raised stat) or column (lowered stat).
function natureGroup(form, head) {
  const selector = head.dataset.natRow
    ? `.pafk-nat[data-up="${head.dataset.natRow}"] input`
    : `.pafk-nat[data-down="${head.dataset.natCol}"] input`;
  return [...form.querySelectorAll(selector)];
}

// Empty or 0 means "any IV"; anything else is clamped to 0–31.
function cleanIV(raw) {
  if (String(raw).trim() === '') return '';
  const value = Math.round(Number(raw));
  if (!Number.isFinite(value)) return '';
  const clamped = Math.min(31, Math.max(0, value));
  return clamped ? String(clamped) : '';
}

function syncIVRow(form, stat) {
  const input = form.elements.namedItem(stat);
  const range = form.querySelector(`[data-iv-range="${stat}"]`);
  const value = Number(cleanIV(input.value) || 0);
  range.value = String(value);
  input.closest('.pafk-iv').classList.toggle('is-set', value > 0);
}

function syncForm(form) {
  updateNatureCount(form);
  for (const [stat] of STATS) syncIVRow(form, stat);
}

function readForm(form) {
  const data = new FormData(form);
  return {
    natures: new Set(data.getAll('nature')),
    minimums: new Map(STATS.flatMap(([stat]) => {
      const value = cleanIV(data.get(stat) ?? '');
      return value ? [[stat, Number(value)]] : [];
    })),
  };
}

// Stars the recommended natures and priority IVs in the form (build = null clears them).
function markRecommended(form, build) {
  const natures = new Set(build?.natures ?? []);
  const priority = new Set(build?.priority ?? []);
  for (const cell of form.querySelectorAll('.pafk-nat')) {
    const nature = cell.querySelector('input').value;
    cell.toggleAttribute('data-rec', natures.has(nature));
    cell.title = natures.has(nature) ? `${natureWithEffect(nature)} · recomendada` : natureWithEffect(nature);
  }
  for (const row of form.querySelectorAll('.pafk-iv')) {
    const rec = priority.has(row.dataset.iv);
    row.toggleAttribute('data-rec', rec);
    row.title = rec ? 'Prioritário na recomendação' : '';
  }
}

function priorityText(profile) {
  return profile.priority.map(stat => STAT_LABELS.get(stat) ?? stat).join(' → ');
}

function updateRecommendation(dex) {
  const section = panel.querySelector('[data-recommendation]');
  section.hidden = !MARKET_GUIDE || !dex;
  markRecommended(form, null);
  if (section.hidden) return;

  const mapped = MARKET_GUIDE.species[Number(dex)];
  const finals = (mapped?.finals ?? []).map(id => MARKET_GUIDE.profiles[id]).filter(Boolean);
  const variants = (mapped?.variants ?? []).map(id => MARKET_GUIDE.profiles[id]).filter(Boolean);
  const candidates = finals.length ? [...new Set([...finals, ...variants])] : [];
  const branch = section.querySelector('[data-branch]');
  const select = branch.querySelector('select');
  const details = section.querySelector('[data-build]');
  const empty = section.querySelector('[data-no-build]');
  const fill = section.querySelector('[data-fill-natures]');
  let profile = candidates[0];
  details.hidden = !profile;
  empty.hidden = Boolean(profile);
  branch.hidden = candidates.length < 2;
  select.replaceChildren(...candidates.map(candidate => new Option(candidate.name, candidate.id)));
  details.querySelector('details').open = false;
  if (!profile) {
    section.querySelector('[data-build-reference]').textContent = '';
    return;
  }

  const modeSelect = section.querySelector('[data-mode]');
  modeSelect.value = readMode();

  function renderProfile() {
    const build = profile[modeSelect.value] ?? profile.pve;
    const [recommended, ...alternatives] = build.natures ?? [];
    const labels = [ROLES[build.role] ?? build.role];
    if (String(profile.id) !== String(dex)) labels.push(`Referência ${profile.name}`);
    if (build.tier) labels.push(`Tier ${build.tier} · nota ${scoreFormat.format(build.score)}`);
    section.querySelector('[data-build-reference]').textContent = labels.join(' · ');
    section.querySelector('[data-best-nature]').textContent = recommended ? natureWithEffect(recommended) : '—';
    section.querySelector('[data-alt-natures]').textContent = alternatives.length
      ? ` · Alternativas ${alternatives.map(natureWithEffect).join(', ')}` : '';
    section.querySelector('[data-build-priority]').textContent = priorityText(build) || '—';
    section.querySelector('[data-best-moves]').textContent = build.moves?.join(', ') || '—';
    section.querySelector('[data-base-stats]').textContent = STATS.map(([stat, label]) =>
      `${label} ${profile.stats[stat] ?? '—'}`).join(' · ');
    section.querySelector('[data-build-note]').textContent = build.note ?? '';
    fill.disabled = !recommended;
    markRecommended(form, build);
  }

  select.onchange = () => {
    profile = candidates.find(candidate => String(candidate.id) === select.value) ?? candidates[0];
    renderProfile();
  };
  modeSelect.onchange = () => {
    saveMode(modeSelect.value);
    renderProfile();
    stopMarketScan();
    syncAll();
  };
  fill.onclick = () => {
    const build = profile[modeSelect.value] ?? profile.pve;
    setNatureCheckboxes(form, new Set(build.natures));
    const priority = new Set(build.priority);
    for (const [stat] of STATS) {
      form.elements.namedItem(stat).value = priority.has(stat) ? PRIORITY_IV : '';
    }
    syncForm(form);
    form.requestSubmit();
  };
  renderProfile();
}
