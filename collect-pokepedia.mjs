import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const WIKI = 'https://pokeafk.io/pokepedia/';
const ASSET_PREFIX = new URL('/assets/', WIKI);
const OUTPUT = new URL('./pokepedia-data.json', import.meta.url);
const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const CATEGORIES = ['physical', 'special', 'status'];
const SELF_EFFECTS = new Set([
  'EFFECT_RESTORE_HP', 'EFFECT_SOFTBOILED', 'EFFECT_MORNING_SUN', 'EFFECT_SYNTHESIS',
  'EFFECT_MOONLIGHT', 'EFFECT_HEAL_BELL', 'EFFECT_REFRESH', 'EFFECT_REST',
  'EFFECT_WISH', 'EFFECT_BELLY_DRUM', 'EFFECT_DESTINY_BOND',
]);
const EXACT_HITS = new Map([
  ['EFFECT_DOUBLE_HIT', 2],
  ['EFFECT_TWINEEDLE', 2],
  ['EFFECT_TRIPLE_KICK', 3],
]);

// Os módulos publicados contêm objetos JS com chaves sem aspas e booleanos
// minificados. Leia somente literais para extrair os dados sem executar o módulo.
function readLiteral(source, start) {
  const tokens = /\s*(?:"(?:[^"\\]|\\.)*"|-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[A-Za-z_$][\w$]*|![01]|[{}\[\]:,])/yi;
  tokens.lastIndex = start;
  let token;

  function next() {
    const match = tokens.exec(source);
    if (!match) throw new Error('Valor inesperado no catálogo da Poképédia.');
    token = match[0].trimStart();
    return token;
  }

  function expect(expected) {
    if (token !== expected) throw new Error('Esperava ' + expected + ', encontrei ' + token + '.');
  }

  function value(isRoot = false) {
    const current = token;
    if (current === '{' || current === '[') {
      const object = current === '{';
      const end = object ? '}' : ']';
      const result = object ? Object.create(null) : [];
      next();
      while (token !== end) {
        if (object) {
          const key = token.startsWith('"') ? JSON.parse(token) : token;
          if (!/^(?:[A-Za-z_$][\w$]*|\d+)$/.test(token) && !token.startsWith('"')) {
            throw new Error('Chave inesperada no catálogo da Poképédia.');
          }
          next();
          expect(':');
          next();
          result[key] = value();
        } else {
          result.push(value());
        }
        if (token === end) break;
        expect(',');
        next();
      }
      // A raiz termina aqui. Não tokenize o código que vem depois do literal.
      if (!isRoot) next();
      return result;
    }
    let result;
    if (current.startsWith('"')) result = JSON.parse(current);
    else if (current === '!0' || current === 'true') result = true;
    else if (current === '!1' || current === 'false') result = false;
    else if (current === 'null') result = null;
    else if (Number.isFinite(Number(current))) result = Number(current);
    else throw new Error('Valor não literal no catálogo da Poképédia: ' + current);
    next();
    return result;
  }

  next();
  const root = value(true);
  return { root, end: tokens.lastIndex };
}

function readTable(source, pattern, label) {
  const match = pattern.exec(source);
  if (!match) throw new Error('Tabela da Poképédia não encontrada: ' + label + '.');
  return readLiteral(source, match.index + match[0].length);
}

function readPowerRules(source) {
  const pattern = /\b(?<name>[\w$]+)\s*=\s*(?=\{\s*RETURN\s*:\s*\{\s*line\s*:)/;
  const name = pattern.exec(source)?.groups.name;
  const { root: rules, end } = readTable(source, pattern, 'poder especial');
  const prefix = name + '.';
  const assignments = source.slice(end).match(/^(?:\s*;\s*[\w$.]+(?:\s*=\s*[\w$.]+)+)+/)?.[0] ?? '';
  for (const line of assignments.split(';').filter(Boolean)) {
    const names = line.split('=').map(part => part.trim());
    if (names.some(part => !part.startsWith(prefix))) break;
    const last = names.pop().slice(prefix.length);
    if (!rules[last]) throw new Error('Regra de poder desconhecida: ' + last + '.');
    for (const alias of names) rules[alias.slice(prefix.length)] = rules[last];
  }
  return rules;
}

function normalizeStats(base, name) {
  if (!base || STAT_KEYS.some(stat => !Number.isInteger(base[stat]) || base[stat] < 1)) {
    throw new Error('Stats base incompletos para ' + name + '.');
  }
  return Object.fromEntries(STAT_KEYS.map(stat => [stat, base[stat]]));
}

function normalizeMove(move, runtime, powerRule) {
  if (!move || !CATEGORIES.includes(move.category)) {
    throw new Error('Golpe de nível sem definição válida: ' + String(move?.id));
  }

  const target = runtime?.shape ?? null;
  const effects = runtime?.effect ?? [];
  // Segue a indicação da Poképédia de golpes que ainda não fazem nada.
  const hasRequiredEffect = target === 'self' || target === 'field'
    ? SELF_EFFECTS.has(move.effect) || effects.some(effect => effect.on === 'self')
    : move.category !== 'status' || effects.length > 0;
  const implemented = Boolean(runtime && target !== 'borrow' && target !== 'trap' && hasRequiredEffect);
  let powerMode = 'standard';
  if (!implemented) powerMode = 'unimplemented';
  else if (move.category === 'status') powerMode = 'status';
  else if (powerRule?.power === 'VARIA') powerMode = 'variable';
  else if (powerRule?.power === 'FIXO') powerMode = 'fixed';

  const effectivePower = move.power > 1 ? move.power : runtime?.power;
  const hits = runtime?.hits ?? EXACT_HITS.get(move.effect);
  return {
    id: move.id,
    key: move.key,
    name: move.name,
    type: move.type,
    category: move.category,
    power: powerMode === 'standard' && effectivePower > 1 ? effectivePower : null,
    powerMode,
    accuracy: move.accuracy === 0 ? 100 : move.accuracy ?? null,
    ...(move.accuracy === 0 ? { alwaysHits: true } : {}),
    cooldown: runtime?.cd ?? null,
    target,
    range: runtime?.range ?? null,
    ...(runtime?.radius !== undefined ? { radius: runtime.radius } : {}),
    ...(runtime?.cast ? { cast: runtime.cast } : {}),
    ...(runtime?.offGcd ? { offGcd: true } : {}),
    ...(hits ? { hits } : {}),
    ...(runtime?.span && hits ? { hitSpan: runtime.span } : {}),
    // A Poképédia documenta 2 a 5, e a própria estimativa do jogo usa 3.
    ...(move.effect === 'EFFECT_MULTI_HIT' ? { minHits: 2, maxHits: 5, estimatedHits: 3 } : {}),
    ...(move.key === 'DESTINY_BOND' ? { manualOnly: true } : {}),
    effect: move.effect ?? null,
    ...(move.effectChance ? { effectChance: move.effectChance } : {}),
    ...(effects.length ? { effects } : {}),
    implemented,
  };
}

// Capture rules and hunts live in the game config module (imported by the catalog).
// Capture price = level price (curve, at the level the Pokémon arrives) × capture tier factor.
// "1/2e3" → 0.0005: the config writes some numbers as a division.
const readNumber = text => {
  if (!text) return undefined;
  const [top, bottom] = text.split('/').map(Number);
  const value = bottom === undefined ? top : top / bottom;
  return Number.isFinite(value) ? value : undefined;
};

function collectConfig(config) {
  if (!config) return {};
  const { root: capture } = readTable(config, /\bcapture\s*:\s*(?=\{\s*curve\s*:)/, 'captura');
  const { root: caughtLevel } = readTable(config, /\bcaughtLevel\s*:\s*(?=\[)/, 'nível capturado');
  const caughtMaxLevel = Number(config.match(/\bcaughtMaxLevel\s*:\s*(\d+)/)?.[1]);
  // Johto/Hoenn: level by evolution stage ({3: [15, 30, 65], 2: [30, 65]}); other regions: one level.
  const { root: caughtRegionLevel } = readTable(config, /\bcaughtRegionLevel\s*:\s*(?=\{)/, 'nível capturado por região');
  const { root: caughtStageLevel } = readTable(config, /\bcaughtStageLevel\s*:\s*(?=\{)/, 'nível capturado por estágio');
  const maxLevel = Number(config.match(/\bmaxLevel\s*:\s*(\d+)/)?.[1]);
  const huntsSource = config.match(/JSON\.parse\(`(\[\{"id":"[a-z]+-[^`]*)`\)/)?.[1];
  if (!huntsSource || !caughtMaxLevel) throw new Error('Hunts ou nível de captura não encontrados na configuração do jogo.');
  const hunts = JSON.parse(huntsSource).map(hunt => ({
    id: hunt.id, region: hunt.region, name: hunt.name, main: hunt.main, recLv: hunt.recLv,
    levels: hunt.levels, badge: hunt.badge ?? 0, ...(hunt.rod ? { rod: hunt.rod } : {}),
    // Outland and Nightmare hunts carry their own shiny chance (1 = every wild one is shiny).
    ...(hunt.shinyOdds !== undefined ? { shinyOdds: hunt.shinyOdds } : {}),
    ...(hunt.anyShiny !== undefined ? { anyShiny: hunt.anyShiny } : {}),
    slots: hunt.slots.map(slot => ({ dex: slot.dex, lv: slot.lv, w: slot.w, on: slot.on, ...(slot.fm ? { fm: slot.fm } : {}) })),
  }));
  // Shiny chance of each wild one (guide "Shiny": 1 in 2.000), Outland's multiplier and the hunt
  // pace the MAPA assumes (killsPerHour), used to estimate the hours per shiny of a species.
  const shinyOdds = readNumber(config.match(/\bshinyOdds\s*:\s*([\d.e+\-/]+)/)?.[1]);
  const shinyMult = readNumber(config.match(/\boutland\s*:\s*\{\s*shinyMult\s*:\s*([\d.e+\-/]+)/)?.[1]);
  const killsPerHour = readNumber(config.match(/\bkillsPerHour\s*:\s*([\d.e+\-/]+)/)?.[1]);
  if (!shinyOdds || !shinyMult || !killsPerHour) throw new Error('Chance de shiny ou ritmo da caça não encontrados na configuração do jogo.');
  return {
    shiny: { odds: shinyOdds, outlandMult: shinyMult, killsPerHour },
    // The ball chance also needs the regional floors (regionFloor), fixed prices (speciesCatch), the
    // guaranteed multiple (certainAt) and the margin schedule (profitSchedule); see the "Captura" guide.
    capture: {
      curve: capture.curve, first: capture.first, groups: capture.groups, caughtLevel, caughtMaxLevel,
      caughtRegionLevel, caughtStageLevel, maxLevel,
      regionFloor: capture.regionFloor, speciesCatch: capture.speciesCatch, certainAt: capture.certainAt,
      profitSchedule: capture.profitSchedule, shiny: capture.shiny, shinyCatch: capture.shinyCatch, ivCatch: capture.ivCatch,
    },
    hunts,
  };
}

export function collectCatalog(catalog, assetUrl, config) {
  const { root: catchTiers } = readTable(catalog, /\b[\w$]+\s*=\s*(?=\{\s*0\s*:\s*\[\s*144\s*,\s*145\s*,)/, 'tiers de captura');
  const catchTierOf = new Map(Object.entries(catchTiers).flatMap(([tier, dexes]) => dexes.map(dex => [dex, Number(tier)])));
  const { root: speciesTable } = readTable(catalog, /\b[\w$]+\s*=\s*(?=\{\s*1\s*:\s*\{\s*id\s*:\s*1\s*,\s*key\s*:\s*"bulbasaur")/, 'espécies');
  const { root: moves } = readTable(catalog, /\b[\w$]+\s*=\s*(?=\{\s*1\s*:\s*\{\s*id\s*:\s*1\s*,\s*key\s*:\s*"POUND")/, 'golpes');
  const { root: runtime } = readTable(catalog, /\b[\w$]+\s*=\s*(?=\{\s*1\s*:\s*\{\s*key\s*:\s*"POUND"\s*,\s*shape\s*:)/, 'combate');
  const { root: megaTable } = readTable(catalog, /\b[\w$]+\s*=\s*(?=\{\s*"3-mega"\s*:\s*\{\s*dex\s*:\s*3)/, 'formas Mega');
  const powerRules = readPowerRules(catalog);

  const species = Object.values(speciesTable).map(entry => {
    const levels = new Map();
    for (const [level, moveId] of entry.learnset) {
      const previous = levels.get(moveId);
      if (previous === undefined || level < previous) levels.set(moveId, level);
    }
    return {
      id: entry.id,
      key: entry.key,
      name: entry.name,
      types: entry.types,
      stats: normalizeStats(entry.base, entry.name),
      evolutions: [...new Set(entry.evolutions.map(evolution => evolution.into))],
      ...(catchTierOf.has(entry.id) ? { catchTier: catchTierOf.get(entry.id) } : {}),
      moves: [...levels].map(([moveId, level]) => {
        const move = moves[moveId];
        if (!move) throw new Error('Golpe #' + moveId + ' ausente em ' + entry.name + '.');
        return { ...normalizeMove(move, runtime[moveId], powerRules[move.key]), level };
      }).sort((left, right) => left.level - right.level || left.id - right.id),
    };
  });

  const ids = new Set(species.map(entry => entry.id));
  if (species.length < 386 || ids.size !== species.length || species.some(entry => (
    !Number.isInteger(entry.id) || !entry.moves.length || entry.evolutions.some(id => !ids.has(id))
  ))) {
    throw new Error('Catálogo incompleto ou com IDs e evoluções inválidos.');
  }

  const megaForms = Object.entries(megaTable).map(([id, form]) => ({
    id,
    baseId: form.dex,
    form: form.form,
    name: form.name,
    types: form.types,
    stats: normalizeStats(form.base, form.name),
    stone: form.stone,
    stoneName: form.stoneName,
    movesFromBase: true,
  }));

  if (megaForms.some(form => !ids.has(form.baseId))) {
    throw new Error('Forma Mega sem espécie base.');
  }

  // HMs are sold at the Celadon Store; TMs only come from the random TM Box (and quest 34).
  const prices = Object.fromEntries([...catalog.matchAll(/"(hm-[a-z-]+)":(\d+(?:\.\d+)?(?:e\d+)?)(?=[,}])/g)]
    .map(([, item, price]) => [item, Number(price)]));
  const machines = kind => [...catalog.matchAll(new RegExp(`"(${kind}-[a-z0-9-]+)":\\{move:(\\d+),dex:\\[([\\d,]*)\\]\\}`, 'g'))]
    .map(([, item, moveId, dex]) => {
      const move = moves[moveId];
      if (!move) throw new Error('Golpe #' + moveId + ' ausente em ' + item + '.');
      return {
        item, ...(prices[item] ? { price: prices[item] } : {}),
        move: normalizeMove(move, runtime[moveId], powerRules[move.key]),
        dex: dex.split(',').filter(Boolean).map(Number),
      };
    });
  const hms = machines('hm');
  const tms = machines('tm');
  if (!hms.length || !tms.length) throw new Error('Tabelas de TM e HM não encontradas no catálogo.');

  const { capture, hunts, shiny } = collectConfig(config);
  return {
    sourceUrl: WIKI,
    assets: [assetUrl],
    sha256: createHash('sha256').update(catalog).digest('hex'),
    ...(capture ? { capture } : {}),
    ...(shiny ? { shiny } : {}),
    species,
    megaForms,
    hms,
    tms,
    ...(hunts ? { hunts } : {}),
  };
}

async function fetchText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000), redirect: 'error' });
  if (!response.ok) throw new Error('Falha HTTP ' + response.status + ' em ' + url + '.');
  return response.text();
}

async function fetchCatalog() {
  const html = await fetchText(WIKI);
  const entry = html.match(/src="\/assets\/(pokepedia-[\w-]+\.js)"/)?.[1];
  if (!entry) throw new Error('Script de entrada da Poképédia não encontrado.');
  const scripts = await fetchText(new URL(entry, ASSET_PREFIX));
  const shell = scripts.match(/from"\.\/(shell-[\w-]+\.js)"/)?.[1];
  if (!shell) throw new Error('Módulo de páginas da Poképédia não encontrado.');
  const pages = await fetchText(new URL(shell, ASSET_PREFIX));
  const catalog = pages.match(/from"\.\/(selectStyle-[\w-]+\.js)"/)?.[1];
  if (!catalog) throw new Error('Módulo do catálogo da Poképédia não encontrado.');
  const assetUrl = new URL(catalog, ASSET_PREFIX).href;
  const source = await fetchText(assetUrl);
  const configModule = source.match(/from"\.\/(socialLinks-[\w-]+\.js)"/)?.[1];
  if (!configModule) throw new Error('Módulo de configuração do jogo não encontrado.');
  return { catalog: source, assetUrl, config: await fetchText(new URL(configModule, ASSET_PREFIX)) };
}

function serializeDataset({ species, megaForms, hms, tms, hunts, ...metadata }) {
  const rows = entries => entries.map(entry => '    ' + JSON.stringify(entry)).join(',\n');
  return JSON.stringify(metadata, null, 2).slice(0, -2)
    + ',\n  "species": [\n' + rows(species)
    + '\n  ],\n  "megaForms": [\n' + rows(megaForms)
    + '\n  ],\n  "hms": [\n' + rows(hms)
    + '\n  ],\n  "tms": [\n' + rows(tms)
    + (hunts ? '\n  ],\n  "hunts": [\n' + rows(hunts) : '') + '\n  ]\n}\n';
}

const [, , mode, localFile, localUrl] = process.argv;
try {
  if (mode && (mode !== '--asset' || !localFile || !localUrl?.startsWith(ASSET_PREFIX.href))) {
    throw new Error('Uso: node collect-pokepedia.mjs [--asset arquivo URL-do-catálogo]');
  }
  const { catalog, assetUrl, config } = mode
    ? { catalog: await readFile(localFile, 'utf8'), assetUrl: localUrl }
    : await fetchCatalog();
  const result = collectCatalog(catalog, assetUrl, config);
  await writeFile(OUTPUT, serializeDataset(result));
  console.log(result.species.length + ' espécies, ' + result.megaForms.length + ' formas Mega e '
    + (result.hunts?.length ?? 0) + ' hunts.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
