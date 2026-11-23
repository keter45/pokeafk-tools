// Ranks every final evolution (and Mega) in two modes:
// - pve: hunting damage per second, following the game's own DPS estimate (AUTO uses the
//   strongest ready move) plus area hits on packs and self setup kept up during continuous hunts.
// - pvp: an event-driven 1v1 against reference opponents using the documented combat rules
//   (stages, statuses, battle cooldowns, heals), blended with Smogon's Gen 3 references.
// Moves: level-up moves of the evolution line plus the machines passed to buildGuide (HMs; the
// separate TM list also passes the TMs). Damage moves follow the main attack stat (mainStat).
// The rules and their sources are summarised in referencia/mecanicas.md.
import { normalizeName } from './collect-competitive.mjs';

export const sourceUrl = 'https://pokeafk.io/pokepedia/';

const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const NATURE_STATS = ['atk', 'def', 'spe', 'spa', 'spd'];
const NATURES = [
  ['Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty'],
  ['Bold', 'Docile', 'Relaxed', 'Impish', 'Lax'],
  ['Timid', 'Hasty', 'Serious', 'Jolly', 'Naive'],
  ['Modest', 'Mild', 'Quiet', 'Bashful', 'Rash'],
  ['Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'],
].flatMap((group, up) => group.map((name, down) => ({ name, up: NATURE_STATS[up], down: NATURE_STATS[down] })));

// Documented combat constants (pokeAFK combat config and Mecânicas guide).
const LEVEL = 100;
const GCD = { base: 1.2, min: 0.7, max: 2.0 };
const STAGE_SECONDS = 10;
const RECHARGE_SECONDS = 1.5;
// With 2 or more targets, each one takes 75% of the damage (combat.areaFactor); alone, 100%.
const AREA_FACTOR = 0.75;
// Hunts are fought in areas: packs of 2–3 wild Pokémon (combat.packSpawn) stand around the one being
// hit. An area move reaches more of them the more tiles it covers; a pack spreads over about
// PACK_SPREAD_TILES tiles, so a radius-2 circle or a 4-tile cone hits the whole pack.
const PACK_SIZE = 3;
const PACK_SPREAD_TILES = 12;
// PvP (decided with the user): wild Pokémon do not dodge, players do. Moves that mark the ground
// before landing can be dodged; melee and target-following moves always land. A cast under ~0.25 s
// arrives before anyone can react (measured with the dodge script, 2026-11-22); from there the
// chance grows with the cast time, up to DODGE_MAX.
const TELEGRAPH_SHAPES = new Set(['projectile', 'beam', 'dash', 'cone', 'circle', 'area', 'leap']);
const DODGE_MIN_CAST = 0.25;
const DODGE_PER_SECOND = 1.4;
const DODGE_MAX = 0.7;
// The reference opponents also throw dodgeable moves: this share of their hits is dodged, except
// while our Pokémon is casting (it cannot move) or asleep. Long casts are doubly bad in PvP.
const INCOMING_DODGE = 0.25;
// Movement (client code, player step): 267 ms per tile, 133 ms with a positive Speed stage
// (Agility, Dragon Dance…), 445 ms when paralysed. The Speed stat itself only shortens the time
// between moves. Dodging scales with how fast the Pokémon walks: ×2 boosted, ×0.6 paralysed.
const STEP_SECONDS = { normal: 0.267, boosted: 0.133, paralyzed: 0.445 };
// Area makes a move harder to dodge: leaving it takes extra steps (escapeTiles − 1) of 267 ms on top
// of the reaction time. A target-centred area (area, leap) needs about its radius in steps; a cone,
// circle or field around the user catches the target anywhere inside, about half the radius.
// Range (PvP): attacking from afar keeps the melee reference (physical) out of reach part of the time.
// Its extra miss chance is KITE_MAX × clamp((reach − 2) / 3): 2 tiles or less (melee, the game's
// manual.meleeReach) gives nothing, 5 tiles or more give the whole bonus. Estimated, not measured.
const KITE_MAX = 0.15;
// Main attack stat: damage moves follow the higher of Atk and Sp. Atk (base stats); within 15% the
// Pokémon is mixed and both count. Fixed-damage moves (Night Shade, Seismic Toss) always count.
const MAIN_STAT_RATIO = 1.15;
// PvP score: the 1v1 duel weighs 80% and the Gen 3 reference 20%. There is no switching in a fight
// here, so a Pokémon must win alone; Smogon tiers also reward walls and support that rely on a team.
const PVP_DUEL_WEIGHT = 0.8;
// Focus Punch "falha se o seu Pokémon levar um golpe enquanto se concentra" (1 s, game text). In a
// duel it fails when the opponent acts during the concentration; in a hunt the wild Pokémon attack
// back, and one of them at the base interval (combat.gcd.base, 1.2 s) lets it land 1 − cast/1.2 of
// the time. Only the TM list models this for now (buildGuide option focusPunchFails).
const WILD_ATTACK_SECONDS = 1.2;
const BATTLE_COOLDOWN = {
  RECOVER: 30, SOFT_BOILED: 30, MILK_DRINK: 30, SLACK_OFF: 30, MOONLIGHT: 30, MORNING_SUN: 30,
  SYNTHESIS: 30, REST: 45, HYPNOSIS: 20, SLEEP_POWDER: 20, SPORE: 20, SING: 20, LOVELY_KISS: 20, GRASS_WHISTLE: 20,
};
const BATTLE_HEALS = 4;
const STATUS = {
  par: { gcdMult: 1.5, fail: 0.25 }, brn: { tick: 1 / 16, physMult: 0.5 }, psn: { tick: 1 / 16 },
  tox: { tick: 1 / 32, rampMax: 5 }, conf: { selfHit: 0.33 }, attract: { fail: 0.25 }, immuneSeconds: 8,
};
const TICK_SECONDS = 2;
const DUEL_SECONDS = 180;
const PVE_SECONDS = 60;
// AUTO (hunting and Ranked duels) casts a boost or a foe debuff once and only casts it again after it
// wears off, so stages never stack past what a single use gives (Swords Dance +2, Howl +1).
const HEAL_EFFECTS = new Set(['EFFECT_RESTORE_HP', 'EFFECT_SOFTBOILED', 'EFFECT_MORNING_SUN', 'EFFECT_SYNTHESIS', 'EFFECT_MOONLIGHT', 'EFFECT_WISH']);
// Tiles of a disc of this radius (the game's circles, fields, areas and leaps).
function discTiles(radius) {
  let tiles = 0;
  for (let dx = -radius; dx <= radius; dx++) for (let dy = -radius; dy <= radius; dy++) if (dx * dx + dy * dy <= radius * radius) tiles++;
  return tiles;
}
// Expected wild Pokémon hit by one use during a hunt, from the move's shape and size.
export function huntTargets(move) {
  const radius = Math.max(1, Math.round(move.radius ?? 1));
  let extraTiles;
  switch (move.target) {
    case 'cone': extraTiles = Math.round(Math.PI * radius * radius / 4); break;   // a quarter disc in front
    case 'circle': case 'field': extraTiles = discTiles(radius) - 2; break;       // around the user, minus its tile and the target's
    case 'area': case 'leap': extraTiles = discTiles(radius) - 1; break;          // around the aimed tile
    case 'beam': extraTiles = (move.range ?? 6) - 1; break;                       // everyone in the line
    default: return 1;                                                            // melee, homing, projectile, dash, rampage
  }
  return 1 + (PACK_SIZE - 1) * clamp(0, 1, extraTiles / PACK_SPREAD_TILES);
}
// Damage multiplier for that many targets: up to 2 targets it grows from 100% (alone) to 2 × 75%.
export function areaMultiplier(targets) {
  return targets <= 2 ? 1 + (targets - 1) * (2 * AREA_FACTOR - 1) : targets * AREA_FACTOR;
}
export function escapeTiles(move) {
  const radius = Math.max(1, Math.round(move.radius ?? 1));
  if (move.target === 'area' || move.target === 'leap') return radius;
  if (move.target === 'cone' || move.target === 'circle' || move.target === 'field') return Math.max(1, Math.round(radius / 2));
  return 1;
}
export function dodgeChance(move) {
  if (!TELEGRAPH_SHAPES.has(move.target)) return 0;
  const cast = (move.cast ?? 0) + (move.hitSpan ?? 0);
  return clamp(0, DODGE_MAX, (cast - DODGE_MIN_CAST - (escapeTiles(move) - 1) * STEP_SECONDS.normal) * DODGE_PER_SECOND);
}
// How far the move reaches from the user, in tiles (melee and self moves: 1).
export function moveReach(move) {
  if (['melee', 'rampage', 'self', 'borrow', 'trap'].includes(move.target)) return 1;
  return Math.max(1, move.range ?? 1, move.radius ?? 0);
}
export function mainStat(stats) {
  if (stats.atk >= stats.spa * MAIN_STAT_RATIO) return 'physical';
  if (stats.spa >= stats.atk * MAIN_STAT_RATIO) return 'special';
  return 'mixed';
}
const MAJOR = new Set(['slp', 'par', 'frz', 'brn', 'psn', 'tox']);
const FIXED_DAMAGE = { EFFECT_LEVEL_DAMAGE: () => LEVEL, EFFECT_DRAGON_RAGE: () => 40, EFFECT_SONICBOOM: () => 20 };
const EXCLUDED_EFFECTS = new Set([
  'EFFECT_EXPLOSION', 'EFFECT_OHKO', 'EFFECT_COUNTER', 'EFFECT_MIRROR_COAT', 'EFFECT_BIDE', 'EFFECT_ENDEAVOR',
  'EFFECT_FLAIL', 'EFFECT_SPIT_UP', 'EFFECT_PSYWAVE', 'EFFECT_PRESENT', 'EFFECT_BEAT_UP', 'EFFECT_FUTURE_SIGHT',
  'EFFECT_SNORE', 'EFFECT_HIDDEN_POWER', 'EFFECT_FAKE_OUT', 'EFFECT_REVENGE', 'EFFECT_SMELLINGSALT',
  'EFFECT_MEMENTO', // The user faints.
]);
// Status effects the simulators understand. Moves whose effects are all outside this list
// (Hail, Sandstorm, Safeguard, Taunt, Encore, Ingrain…) cannot earn a slot.
function modeledEffect(effect) {
  if (effect.kind === 'weather') return effect.variant === 'sun' || effect.variant === 'rain';
  if (effect.kind === 'aura') return effect.variant === 'reflect' || effect.variant === 'lightScreen';
  return ['stage', 'slp', 'par', 'frz', 'brn', 'psn', 'tox', 'conf', 'attract', 'flinch', 'seed', 'shield'].includes(effect.kind);
}

// Reference opponents for the duel: a strong physical and a strong special attacker with neutral typing.
const OPPONENTS = [
  { name: 'físico', stats: { hp: 95, atk: 110, def: 90, spa: 60, spd: 90, spe: 90 }, category: 'physical' },
  { name: 'especial', stats: { hp: 95, atk: 60, def: 90, spa: 110, spd: 90, spe: 90 }, category: 'special' },
];
const OPPONENT_POWER = 70;
// Hunts average a few runs; duels are closer to a coin flip near the end, so they average more.
const SEEDS = [11, 23, 37];
const DUEL_SEEDS = [11, 23, 37, 41, 53, 67, 79, 97];

const TYPES = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying',
  'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel'];
const CHART = {
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
function effectiveness(attack, defenders) {
  const row = CHART[attack];
  if (!row) return 1;
  return defenders.reduce((total, type) => total * (row.double?.includes(type) ? 2
    : row.half?.includes(type) ? 0.5 : row.zero?.includes(type) ? 0 : 1), 1);
}

// Competitive tiers lean on abilities, which pokeAFK does not have.
const ABILITY_TIER_OVERRIDES = {
  289: { tier: 'OU', reason: 'sem Truant no jogo' },
  308: { tier: 'NU', reason: 'sem Pure Power no jogo' },
  184: { tier: 'NU', reason: 'sem Huge Power no jogo' },
  202: { tier: 'UU', reason: 'sem Shadow Tag no jogo' },
  51: { tier: 'UU', reason: 'sem Arena Trap no jogo' },
  292: { tier: 'ZU', reason: 'sem Wonder Guard no jogo' },
};
const TIER_POINTS = {
  Uber: 100, OU: 90, UUBL: 80, UU: 72, RUBL: 66, RU: 62, NUBL: 58, NU: 54, PUBL: 50, PU: 46, ZUBL: 43, ZU: 40,
};

export const tierShares = { S: 0.08, A: 0.25, B: 0.5, C: 0.8 };

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value));
}
function moveKey(move) {
  return (move.key ?? move.name).toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}
function typeKey(type) {
  return typeof type === 'string' ? type.toLowerCase() : '';
}
function stageMult(stage) {
  const value = clamp(-6, 6, Math.round(stage));
  return value >= 0 ? (2 + value) / 2 : 2 / (2 - value);
}
function accuracyMult(stage) {
  const value = clamp(-6, 6, Math.round(stage));
  return value >= 0 ? (3 + value) / 3 : 3 / (3 - value);
}
export function battleStats(base, nature) {
  const stats = {};
  for (const stat of STATS) {
    const raw = Math.floor((2 * base[stat] + 31) * LEVEL / 100);
    stats[stat] = stat === 'hp' ? raw + LEVEL + 10 : raw + 5;
  }
  if (nature && nature.up !== nature.down) {
    stats[nature.up] = Math.floor(stats[nature.up] * 1.1);
    stats[nature.down] = Math.floor(stats[nature.down] * 0.9);
  }
  return stats;
}
export function gcdFor(speed, paralyzed = false) {
  const value = clamp(GCD.min, GCD.max, GCD.base * Math.sqrt((1.75 * LEVEL + 5) / Math.max(1, speed)));
  return paralyzed ? value * STATUS.par.gcdMult : value;
}
function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Turns raw Poképédia move data into what the simulators need, or null when the move cannot be modelled.
function classify(move, types, rules = {}) {
  if (!move?.name || move.implemented === false || move.manualOnly || EXCLUDED_EFFECTS.has(move.effect)) return null;
  const key = moveKey(move);
  const accuracy = move.alwaysHits || !move.accuracy ? 1 : clamp(0, 1, move.accuracy / 100);
  const base = {
    key, name: move.name, type: typeKey(move.type), category: move.category, accuracy,
    cooldown: Math.max(0.1, move.cooldown ?? 0), battleCooldown: BATTLE_COOLDOWN[key] ?? Math.max(0.1, move.cooldown ?? 0),
    offGcd: Boolean(move.offGcd), machine: Boolean(move.machine), cast: (move.cast ?? 0) + (move.hitSpan ?? 0),
    effects: (move.effects ?? []).filter(effect => effect && effect.kind),
    dodge: dodgeChance(move), reach: moveReach(move),
  };
  if (move.category === 'physical' || move.category === 'special') {
    const fixed = FIXED_DAMAGE[move.effect];
    const superFang = move.effect === 'EFFECT_SUPER_FANG';
    const power = move.combatPower ?? move.power;
    if (!fixed && !superFang && !(Number.isFinite(power) && power > 0)) return null;
    if (!Number.isFinite(move.cooldown) || move.cooldown <= 0) return null;
    const hits = move.hits ?? move.estimatedHits ?? (move.effect === 'EFFECT_MULTI_HIT' ? 3
      : ['EFFECT_DOUBLE_HIT', 'EFFECT_TWINEEDLE'].includes(move.effect) ? 2 : 1);
    return {
      ...base, kind: 'damage', power: power ?? 0, hits,
      fixed: fixed ? fixed() : null, superFang,
      stab: types.has(base.type) ? 1.5 : 1,
      targets: huntTargets(move),
      pveMult: areaMultiplier(huntTargets(move)),
      lock: move.effect === 'EFFECT_RECHARGE' ? RECHARGE_SECONDS : 0,
      recoil: move.effect === 'EFFECT_DOUBLE_EDGE' ? 1 / 3 : move.effect === 'EFFECT_RECOIL' ? 1 / 4 : 0,
      drain: move.effect === 'EFFECT_ABSORB' ? 0.5 : move.effect === 'EFFECT_DREAM_EATER' ? 0.5 : 0,
      needsSleep: move.effect === 'EFFECT_DREAM_EATER',
      ...(rules.focusPunchFails && move.effect === 'EFFECT_FOCUS_PUNCH'
        ? { focus: true, land: clamp(0, 1, 1 - base.cast / WILD_ATTACK_SECONDS) } : {}),
    };
  }
  if (move.category !== 'status') return null;
  if (HEAL_EFFECTS.has(move.effect)) return { ...base, kind: 'heal', heal: 0.5 };
  if (move.effect === 'EFFECT_REST') return { ...base, kind: 'heal', heal: 1, restSleep: 3 };
  if (!base.effects.some(modeledEffect)) return null;
  // Belly Drum costs half of the maximum HP, as in Gen 3.
  return { ...base, kind: 'status', hpCost: move.effect === 'EFFECT_BELLY_DRUM' ? 0.5 : 0 };
}

// Groups status moves so the loadout search only tries the best move of each kind.
function statusGroup(move) {
  const groups = [];
  for (const effect of move.effects) {
    if (effect.kind === 'stage') {
      for (const [stat, amount] of Object.entries(effect.stages ?? {})) {
        if (effect.on === 'self' && amount > 0) groups.push('self-' + stat);
        if (effect.on === 'foe' && amount < 0) groups.push('foe-' + stat);
      }
    } else if (effect.kind === 'weather') groups.push('weather-' + effect.variant);
    else if (effect.kind === 'aura') groups.push('aura-' + effect.variant);
    else if (effect.on === 'foe' || effect.kind === 'seed') groups.push('foe-' + effect.kind);
    else groups.push('self-' + effect.kind);
  }
  return [...new Set(groups)];
}
function statusStrength(move) {
  let strength = 0;
  for (const effect of move.effects) {
    const duration = (effect.ms ?? 0) / 1000;
    if (effect.kind === 'stage') {
      strength += Object.values(effect.stages ?? {}).reduce((sum, amount) => sum + Math.abs(amount), 0)
        * Math.min(1, STAGE_SECONDS / move.battleCooldown);
    } else {
      strength += (effect.chance ?? 100) / 100 * Math.min(1, duration / move.battleCooldown);
    }
  }
  return strength * move.accuracy;
}

function makeFighter(stats, moves, types) {
  return {
    stats, maxHp: stats.hp, hp: stats.hp, types, moves,
    ready: moves.map(() => 0), stages: {}, major: null, conf: 0, attract: 0, flinch: 0, shield: 0,
    reflect: 0, lightScreen: 0, seeded: 0, sleepImmune: 0, freezeImmune: 0, heals: 0, lock: 0,
  };
}
function stage(fighter, stat, now) {
  const entry = fighter.stages[stat];
  return entry && entry.until > now ? entry.value : 0;
}
function addStage(fighter, stat, amount, now) {
  const current = stage(fighter, stat, now);
  fighter.stages[stat] = { value: clamp(-6, 6, current + amount), until: now + STAGE_SECONDS };
}
function majorActive(fighter, now) {
  return fighter.major && fighter.major.until > now ? fighter.major : null;
}

function applyEffect(effect, user, foe, now, random, mode) {
  if ((effect.chance ?? 100) < 100 && random() * 100 >= effect.chance) return;
  const target = effect.on === 'self' ? user : foe;
  const seconds = (effect.ms ?? 0) / 1000;
  switch (effect.kind) {
    case 'stage':
      for (const [stat, amount] of Object.entries(effect.stages ?? {})) addStage(target, stat, amount, now);
      break;
    case 'slp': case 'par': case 'frz': case 'brn': case 'psn': case 'tox': {
      if (mode === 'pve' || effect.on === 'self') return;
      if (majorActive(target, now)) return;
      if (effect.kind === 'slp' && target.sleepImmune > now) return;
      if (effect.kind === 'frz' && target.freezeImmune > now) return;
      if ((effect.kind === 'brn' && target.types.includes('fire'))
        || (effect.kind === 'frz' && target.types.includes('ice'))
        || (['psn', 'tox'].includes(effect.kind) && target.types.some(type => type === 'poison' || type === 'steel'))) return;
      if (effect.delayMs) {
        // Yawn: the target falls asleep only after the delay, if nothing else got there first.
        const at = now + effect.delayMs / 1000;
        target.pendingSleep = { at, until: at + seconds };
        return;
      }
      target.major = { kind: effect.kind, until: now + seconds, ticks: 0 };
      break;
    }
    case 'conf': target.conf = Math.max(target.conf, now + seconds); break;
    case 'attract': if (target === foe) foe.attract = Math.max(foe.attract, now + seconds); break;
    case 'flinch': target.flinch = Math.max(target.flinch, now + seconds); break;
    case 'seed': if (target === foe) foe.seeded = Math.max(foe.seeded, now + seconds); break;
    case 'shield': user.shield = Math.max(user.shield, now + seconds); break;
    case 'aura':
      if (effect.variant === 'reflect') user.reflect = Math.max(user.reflect, now + seconds);
      if (effect.variant === 'lightScreen') user.lightScreen = Math.max(user.lightScreen, now + seconds);
      break;
    case 'weather': user.weather = { variant: effect.variant, until: now + seconds }; break;
    default: break;
  }
}

function weatherMult(fighter, type, now) {
  const weather = fighter.weather && fighter.weather.until > now ? fighter.weather.variant : null;
  if (weather === 'rain') return type === 'water' ? 1.5 : type === 'fire' ? 0.5 : 1;
  if (weather === 'sun') return type === 'fire' ? 1.5 : type === 'water' ? 0.5 : 1;
  return 1;
}

// Expected damage of one use against a defender, using the Gen 3 formula the game applies.
function hitDamage(move, user, foe, now, coverage = 1, cap = 6) {
  if (move.fixed) return move.fixed * move.hits * 0.6;
  if (move.superFang) return Math.max(1, Math.floor(foe.hp / 2));
  const physical = move.category === 'physical';
  const attack = user.stats[physical ? 'atk' : 'spa'] * stageMult(Math.min(cap, stage(user, physical ? 'atk' : 'spa', now)));
  const defense = foe.stats[physical ? 'def' : 'spd'] * stageMult(stage(foe, physical ? 'def' : 'spd', now));
  let damage = (Math.floor((2 * LEVEL) / 5 + 2) * move.power * attack / defense) / 50 + 2;
  damage *= move.stab * weatherMult(user, move.type, now) * coverage * 0.6;
  if (physical && majorActive(user, now)?.kind === 'brn') damage *= STATUS.brn.physMult;
  if ((physical && foe.reflect > now) || (!physical && foe.lightScreen > now)) damage *= 0.5;
  return damage * move.hits;
}

// Hunting: continuous damage against packs. Follows the game's AUTO choice (strongest ready move by
// power × STAB × accuracy) and keeps self buffs and weather up when no damage move is ready.
// Chance effects (Metal Claw's 10% Attack boost, AncientPower) are rolled, so the result is averaged.
function simulatePve(stats, moves, types) {
  const runs = SEEDS.map(seed => huntRun(stats, moves, types, rng(seed)));
  const byCategory = { physical: 0, special: 0 };
  const uses = moves.map(() => 0);
  for (const run of runs) {
    byCategory.physical += run.byCategory.physical;
    byCategory.special += run.byCategory.special;
    run.uses.forEach((count, index) => { uses[index] += count; });
  }
  return { value: runs.reduce((sum, run) => sum + run.value, 0) / runs.length, byCategory, uses };
}

function huntRun(stats, moves, types, random) {
  const user = makeFighter(stats, moves, types);
  const dummy = makeFighter({ hp: Infinity, atk: 1, def: 100, spa: 1, spd: 100, spe: 1 }, [], []);
  const usedStats = new Set(moves.filter(move => move.kind === 'damage').map(move => move.category === 'physical' ? 'atk' : 'spa'));
  let now = 0;
  let total = 0;
  const byCategory = { physical: 0, special: 0 };
  const uses = moves.map(() => 0);
  while (now < PVE_SECONDS) {
    const gcd = gcdFor(user.stats.spe * stageMult(stage(user, 'spe', now)));
    let choice = -1;
    let best = -1;
    moves.forEach((move, index) => {
      if (move.kind !== 'damage' || user.ready[index] > now) return;
      const value = move.power * move.stab * move.accuracy * weatherMult(user, move.type, now);
      if (value > best) { best = value; choice = index; }
    });
    const buff = moves.findIndex((move, index) => move.kind === 'status' && user.ready[index] <= now
      && move.effects.some(effect => (effect.kind === 'stage' && effect.on === 'self'
        && Object.entries(effect.stages ?? {}).some(([stat, amount]) => amount > 0
          && (usedStats.has(stat) || stat === 'spe')
          && stage(user, stat, now) <= 0))
        || (effect.kind === 'weather' && !(user.weather?.until > now)
          && moves.some(other => other.kind === 'damage' && weatherMult({ weather: { variant: effect.variant, until: Infinity } }, other.type, 0) > 1))));
    // A boost that wore off is cast again before the next attack.
    const pick = buff >= 0 ? buff : choice;
    if (pick < 0) {
      const next = Math.min(...user.ready.filter((ready, index) => moves[index].kind !== 'heal'));
      now = Number.isFinite(next) && next > now ? next : now + 0.1;
      continue;
    }
    const move = moves[pick];
    uses[pick]++;
    user.ready[pick] = now + Math.max(gcd, move.cooldown);
    if (move.kind === 'damage') {
      const damage = hitDamage(move, user, dummy, now) * move.accuracy * move.pveMult * (move.land ?? 1);
      total += damage;
      byCategory[move.category] += damage;
      for (const effect of move.effects) if (effect.on === 'self') applyEffect(effect, user, dummy, now, random, 'pve');
      if (move.effects.some(effect => effect.kind === 'conf' && effect.on === 'self')) {
        // Rampage moves leave the user confused: a third of the next actions fail.
        total -= damage * 0.15;
      }
    } else {
      for (const effect of move.effects) if (effect.on === 'self') applyEffect(effect, user, dummy, now, random, 'pve');
    }
    now += (move.offGcd ? 0.2 : Math.max(gcd, move.cast)) + (move.lock ?? 0);
  }
  return { value: total / PVE_SECONDS, byCategory, uses };
}

function coverageFactor(moves) {
  const damaging = moves.filter(move => move.kind === 'damage' && !move.fixed && !move.superFang);
  if (!damaging.length) return 1;
  const strongest = Math.max(...damaging.map(move => move.power * move.stab));
  const average = TYPES.reduce((sum, defender) => sum + Math.max(...damaging.map(move =>
    effectiveness(move.type, [defender]) * move.power * move.stab / strongest)), 0) / TYPES.length;
  return clamp(0.7, 1.4, average);
}
function defenseFactor(types) {
  return clamp(0.6, 1.4, TYPES.reduce((sum, attack) => sum + effectiveness(attack, types), 0) / TYPES.length);
}

// One duel against a reference opponent. Returns 0–100: 50 + half the HP left on a win,
// half of the damage dealt on a loss, and the HP balance on a timeout.
function duel(stats, moves, types, opponent, seed) {
  const random = rng(seed);
  const user = makeFighter(stats, moves, types);
  const foe = makeFighter(battleStats(opponent.stats), [], []);
  const coverage = coverageFactor(moves);
  const incoming = defenseFactor(types);
  let userNext = 0;
  let castUntil = 0;
  let lastReach = 1;
  let foeNext = 0.5;
  let nextTick = TICK_SECONDS;
  let now = 0;
  const dealt = { physical: 0, special: 0, other: 0 };
  const uses = moves.map(() => 0);

  function sleeping(fighter, at) {
    const major = majorActive(fighter, at);
    return major && (major.kind === 'slp' || major.kind === 'frz');
  }
  function wake(fighter, at) {
    const pending = fighter.pendingSleep;
    if (pending && at >= pending.at) {
      fighter.pendingSleep = null;
      if (!majorActive(fighter, at) && fighter.sleepImmune <= at && pending.until > at) {
        fighter.major = { kind: 'slp', until: pending.until, ticks: 0 };
      }
    }
    if (fighter.major && fighter.major.until <= at) {
      if (fighter.major.kind === 'slp') fighter.sleepImmune = fighter.major.until + STATUS.immuneSeconds;
      if (fighter.major.kind === 'frz') fighter.freezeImmune = fighter.major.until + STATUS.immuneSeconds;
      if (['slp', 'frz'].includes(fighter.major.kind)) fighter.major = null;
    }
  }
  // Walking speed: a positive Speed stage doubles it, paralysis slows it (see STEP_SECONDS).
  function walk(fighter, at) {
    if (majorActive(fighter, at)?.kind === 'par') return STEP_SECONDS.normal / STEP_SECONDS.paralyzed;
    return stage(fighter, 'spe', at) > 0 ? STEP_SECONDS.normal / STEP_SECONDS.boosted : 1;
  }
  function damageFoe(amount, category) {
    foe.hp -= amount;
    dealt[category] = (dealt[category] ?? 0) + amount;
  }

  function userAct() {
    wake(user, now);
    const paralyzed = majorActive(user, now)?.kind === 'par';
    const gcd = gcdFor(user.stats.spe * stageMult(stage(user, 'spe', now)), paralyzed);
    if (sleeping(user, now) || user.flinch > now) { userNext = Math.max(now + 0.1, user.major?.until ?? 0, user.flinch); return; }
    const ready = moves.map((move, index) => user.ready[index] <= now ? index : -1).filter(index => index >= 0);
    const foeMajor = majorActive(foe, now);
    const attacking = new Set(moves.filter(move => move.kind === 'damage').map(move => move.category === 'physical' ? 'atk' : 'spa'));
    const relevantFoeStat = { atk: true, spa: true, def: attacking.has('atk'), spd: attacking.has('spa'), spe: true, acc: true };
    const want = index => {
      const move = moves[index];
      if (move.kind === 'heal') return user.hp < user.maxHp * 0.5 && user.heals < BATTLE_HEALS ? 100 : -1;
      if (move.kind === 'damage') {
        if (move.needsSleep && !sleeping(foe, now)) return -1;
        return 10 + hitDamage(move, user, foe, now, coverage) * move.accuracy * (1 - move.dodge) / foe.maxHp;
      }
      if (move.hpCost && user.hp <= user.maxHp * move.hpCost) return -1;
      let score = -1;
      for (const effect of move.effects) {
        if (MAJOR.has(effect.kind) && effect.on === 'foe' && !foeMajor && !foe.pendingSleep
          && !(effect.kind === 'slp' && foe.sleepImmune > now)) score = Math.max(score, 50);
        if (effect.kind === 'seed' && foe.seeded <= now) score = Math.max(score, 40);
        if (effect.kind === 'conf' && effect.on === 'foe' && foe.conf <= now) score = Math.max(score, 30);
        if (effect.kind === 'attract' && foe.attract <= now) score = Math.max(score, 30);
        if (effect.kind === 'shield') score = Math.max(score, 45);
        if (effect.kind === 'aura' && ((effect.variant === 'reflect' && user.reflect <= now && opponent.category === 'physical')
          || (effect.variant === 'lightScreen' && user.lightScreen <= now && opponent.category === 'special'))) score = Math.max(score, 35);
        if (effect.kind === 'weather' && !(user.weather?.until > now)
          && moves.some(other => other.kind === 'damage' && weatherMult({ weather: { variant: effect.variant, until: Infinity } }, other.type, 0) > 1)) score = Math.max(score, 25);
        if (effect.kind === 'stage') {
          for (const [stat, amount] of Object.entries(effect.stages ?? {})) {
            if (effect.on === 'self' && amount > 0) {
              const current = stage(user, stat, now);
              const useful = stat === 'spe' || stat === 'eva' || attacking.has(stat)
                || (stat === 'def' && opponent.category === 'physical') || (stat === 'spd' && opponent.category === 'special');
              if (useful && current <= 0) score = Math.max(score, 20);
            }
            if (effect.on === 'foe' && amount < 0 && relevantFoeStat[stat]
              && (stat !== 'atk' || opponent.category === 'physical') && (stat !== 'spa' || opponent.category === 'special')) {
              const current = stage(foe, stat, now);
              if (current >= 0) score = Math.max(score, 18);
            }
          }
        }
      }
      return score;
    };
    let pick = -1;
    let best = 0;
    for (const index of ready) {
      const value = want(index);
      if (value > best) { best = value; pick = index; }
    }
    if (pick < 0) {
      const pending = user.ready.filter((ready, index) => ready > now && want(index) !== -1);
      userNext = pending.length ? Math.min(...pending) : now + 0.5;
      return;
    }
    const move = moves[pick];
    uses[pick]++;
    user.ready[pick] = now + Math.max(gcd, move.battleCooldown);
    userNext = now + (move.offGcd ? 0 : Math.max(gcd, move.cast)) + (move.lock ?? 0);
    // While casting (and during a recharge) the Pokémon stands still and cannot dodge.
    castUntil = now + (move.offGcd ? 0 : move.cast) + (move.lock ?? 0);
    if (move.offGcd) userNext = now + 0.05;
    if (move.kind === 'heal') {
      user.heals++;
      user.hp = Math.min(user.maxHp, user.hp + user.maxHp * move.heal);
      if (move.restSleep) user.major = { kind: 'slp', until: now + move.restSleep, ticks: 0 };
      return;
    }
    const failed = (paralyzed && random() < STATUS.par.fail) || (user.attract > now && random() < STATUS.attract.fail);
    if (failed) return;
    // Focus Punch: an opponent action during the concentration breaks it.
    if (move.focus && foeNext < castUntil && !sleeping(foe, now)) return;
    if (move.hpCost) user.hp -= user.maxHp * move.hpCost;
    if (user.conf > now && random() < STATUS.conf.selfHit) {
      user.hp -= hitDamage({ ...move, category: 'physical', power: 40, stab: 1, hits: 1, fixed: null, superFang: false, type: '' }, user, user, now);
      return;
    }
    if (move.kind === 'damage') lastReach = move.reach;
    const dodged = clamp(0, 1, move.dodge * walk(foe, now));
    const hits = random() < move.accuracy * accuracyMult(stage(user, 'acc', now) - stage(foe, 'eva', now)) * (1 - dodged);
    if (!hits) return;
    if (move.kind === 'damage') {
      const damage = foe.shield > now ? 0 : hitDamage(move, user, foe, now, coverage);
      damageFoe(damage, move.category);
      if (move.recoil) user.hp -= damage * move.recoil;
      if (move.drain) user.hp = Math.min(user.maxHp, user.hp + damage * move.drain);
      if (foe.major?.kind === 'frz' && move.type === 'fire') foe.major = null;
    }
    const oneOf = move.effects.filter(effect => effect.oneOf);
    const effects = move.effects.filter(effect => !effect.oneOf);
    if (oneOf.length) effects.push({ ...oneOf[Math.floor(random() * oneOf.length)] });
    for (const effect of effects) {
      if (effect.on === 'foe' && foe.shield > now) continue;
      applyEffect(effect, user, foe, now, random, 'pvp');
    }
  }

  function foeAct() {
    wake(foe, now);
    const paralyzed = majorActive(foe, now)?.kind === 'par';
    const gcd = gcdFor(foe.stats.spe * stageMult(stage(foe, 'spe', now)), paralyzed);
    foeNext = now + gcd;
    if (sleeping(foe, now)) { foeNext = Math.max(foeNext, foe.major.until); return; }
    if (foe.flinch > now) return;
    if ((paralyzed && random() < STATUS.par.fail) || (foe.attract > now && random() < STATUS.attract.fail)) return;
    const move = { kind: 'damage', category: opponent.category, power: OPPONENT_POWER, stab: 1.5, hits: 1, type: '' };
    if (foe.conf > now && random() < STATUS.conf.selfHit) {
      damageFoe(hitDamage({ ...move, category: 'physical', power: 40, stab: 1 }, foe, foe, now), 'other');
      return;
    }
    if (random() >= accuracyMult(stage(foe, 'acc', now) - stage(user, 'eva', now))) return;
    if (now >= castUntil && !sleeping(user, now)) {
      if (random() < clamp(0, 1, INCOMING_DODGE * walk(user, now))) return;
      if (opponent.category === 'physical' && random() < KITE_MAX * clamp(0, 1, (lastReach - 2) / 3)) return;
    }
    if (user.shield > now) return;
    user.hp -= hitDamage(move, foe, user, now, incoming);
  }

  function tick() {
    for (const [fighter, other] of [[user, foe], [foe, user]]) {
      const major = majorActive(fighter, now);
      if (major?.kind === 'brn' || major?.kind === 'psn') fighter.hp -= fighter.maxHp * STATUS.brn.tick;
      if (major?.kind === 'tox') {
        major.ticks = Math.min(STATUS.tox.rampMax, major.ticks + 1);
        fighter.hp -= fighter.maxHp * STATUS.tox.tick * major.ticks;
      }
      if (fighter === foe && fighter.seeded > now) {
        const drained = fighter.maxHp / 16;
        damageFoe(drained, 'other');
        other.hp = Math.min(other.maxHp, other.hp + drained);
      }
      if (major && fighter === foe && ['brn', 'psn', 'tox'].includes(major.kind)) dealt.other += 0;
    }
  }

  const foeStart = foe.hp;
  while (now < DUEL_SECONDS && user.hp > 0 && foe.hp > 0) {
    now = Math.min(userNext, foeNext, nextTick);
    if (now === nextTick) { tick(); nextTick += TICK_SECONDS; }
    else if (now === userNext) userAct();
    else foeAct();
  }
  const userLeft = Math.max(0, user.hp) / user.maxHp;
  const foeLost = clamp(0, 1, (foeStart - Math.max(0, foe.hp)) / foeStart);
  const score = foe.hp <= 0 && user.hp > 0 ? 50 + 50 * userLeft
    : user.hp <= 0 ? 50 * foeLost
      : 50 + 25 * (foeLost - (1 - userLeft));
  return { score, dealt, uses };
}

function simulatePvp(stats, moves, types) {
  let total = 0;
  const dealt = { physical: 0, special: 0 };
  const uses = moves.map(() => 0);
  for (const opponent of OPPONENTS) {
    for (const seed of DUEL_SEEDS) {
      const result = duel(stats, moves, types, opponent, seed);
      total += result.score;
      dealt.physical += result.dealt.physical;
      dealt.special += result.dealt.special;
      result.uses.forEach((count, index) => { uses[index] += count; });
    }
  }
  return { value: total / (OPPONENTS.length * DUEL_SEEDS.length), byCategory: dealt, uses };
}

const SIMULATORS = { pve: simulatePve, pvp: simulatePvp };

// Picks up to four moves: best damage sets first, then swaps in status moves while they help.
function bestLoadout(mode, stats, pool, types) {
  const simulate = SIMULATORS[mode];
  const damage = pool.filter(move => move.kind === 'damage' && (mode === 'pvp' || (!move.fixed && !move.superFang && !move.needsSleep)));
  const gcd = gcdFor(stats.spe);
  const standalone = move => (move.fixed ?? move.power) * move.stab * move.accuracy * move.hits
    * (mode === 'pve' ? move.pveMult : 1 - move.dodge) * (move.land ?? 1)
    * (move.fixed ? 1 : stats[move.category === 'physical' ? 'atk' : 'spa'] / 100)
    / Math.max(gcd, move.cast, mode === 'pve' ? move.cooldown : move.battleCooldown);
  const ranked = [...damage].sort((a, b) => standalone(b) - standalone(a));
  const byPower = [...damage].sort((a, b) => b.power * b.stab - a.power * a.stab);
  const typeBest = new Map();
  for (const move of ranked) if (!typeBest.has(move.type)) typeBest.set(move.type, move);
  const damageCandidates = [...new Set([...ranked.slice(0, 6), ...byPower.slice(0, 2),
    ...(mode === 'pvp' ? [...typeBest.values()].slice(0, 3) : [])])];

  const others = pool.filter(move => move.kind !== 'damage');
  const groups = new Map();
  for (const move of others) {
    const keys = move.kind === 'heal' ? ['heal'] : statusGroup(move);
    for (const key of keys) {
      if (mode === 'pve' && !(key.startsWith('self-') && ['self-atk', 'self-spa', 'self-spe'].includes(key)) && !key.startsWith('weather-')) continue;
      if (mode === 'pve' && key.startsWith('weather-') && !['weather-sun', 'weather-rain'].includes(key)) continue;
      const current = groups.get(key);
      const strength = move.kind === 'heal' ? move.heal : statusStrength(move);
      if (!current || strength > current.strength) groups.set(key, { move, strength });
    }
  }
  const statusCandidates = [...new Set([...groups.values()].map(entry => entry.move))];

  const cache = new Map();
  const evaluate = moves => {
    const id = moves.map(move => move.key).sort().join('|');
    if (!cache.has(id)) cache.set(id, { moves, ...simulate(stats, moves, types) });
    return cache.get(id);
  };

  const size = Math.min(4, damageCandidates.length);
  const bases = [];
  const choose = (start, chosen) => {
    if (chosen.length === size) { bases.push(evaluate(chosen)); return; }
    for (let i = start; i <= damageCandidates.length - (size - chosen.length); i++) choose(i + 1, [...chosen, damageCandidates[i]]);
  };
  if (size) choose(0, []);
  else bases.push(evaluate([]));
  bases.sort((a, b) => b.value - a.value);

  // Hill climb from the best damage sets, swapping any slot for any candidate (attacks included),
  // so a better attack is not missed once a status move has taken a slot.
  const swapCandidates = [...new Set([...statusCandidates, ...damageCandidates])];
  let best = bases[0];
  for (const start of bases.slice(0, 3)) {
    let current = start;
    for (let round = 0; round < 4; round++) {
      let improved = null;
      for (const candidate of swapCandidates) {
        if (current.moves.includes(candidate)) continue;
        const slots = current.moves.length < 4 ? [current.moves.length] : current.moves.map((_, index) => index);
        for (const slot of slots) {
          const moves = [...current.moves];
          moves[slot] = candidate;
          if (!moves.some(move => move.kind === 'damage')) continue;
          const result = evaluate(moves);
          if (result.value > (improved?.value ?? current.value * 1.005)) improved = result;
        }
      }
      if (!improved) break;
      current = improved;
    }
    if (current.value > best.value) best = current;
  }

  // HMs cost ₽250k–2.5M each and are single use: keep one only when a free (level-up) move in its
  // slot, or an empty slot, would lose more than HM_MIN_GAIN of the result.
  for (let index = 0; index < best.moves.length; index++) {
    if (!best.moves[index].machine) continue;
    const options = [null, ...pool.filter(move => !move.machine && !best.moves.includes(move)
      && (mode === 'pvp' || (!move.fixed && !move.superFang && !move.needsSleep)))];
    let replacement = null;
    for (const option of options) {
      const moves = option ? best.moves.map((move, at) => (at === index ? option : move))
        : best.moves.filter((_, at) => at !== index);
      if (!moves.some(move => move.kind === 'damage')) continue;
      const result = evaluate(moves);
      if (result.value >= best.value * (1 - HM_MIN_GAIN) && (!replacement || result.value > replacement.value)) replacement = result;
    }
    if (replacement) {
      best = replacement;
      index = -1;
    }
  }
  return { best, alternatives: [...cache.values()].sort((a, b) => b.value - a.value).slice(0, 3) };
}
const HM_MIN_GAIN = 0.03;

// Moves the fight never used (AUTO keeps picking Thrash or Outrage, for example) give way to backups:
// first attacks of a type not covered yet, then the strongest remaining ones.
// Backups are ranked by the damage they would deal with this Pokémon's own attack stat (a physical
// move on a special attacker ranks low), and a type not covered yet only earns a 25% bonus.
const NEW_TYPE_BONUS = 1.25;
function fillSlots(mode, best, pool, stats) {
  const chosen = best.moves.filter((move, index) => (best.uses?.[index] ?? 1) > 0);
  const covered = new Set(chosen.filter(move => move.kind === 'damage').map(move => move.type));
  const worth = move => (move.fixed
    ? move.fixed * move.hits * 0.6 * 100 / LEVEL
    : move.power * move.stab * move.hits * stats[move.category === 'physical' ? 'atk' : 'spa'] / 100) * move.accuracy;
  // HMs cost money and are single use, so a backup slot never suggests one; an HM only shows up
  // when the simulation actually used it.
  const backups = pool.filter(move => move.kind === 'damage' && !chosen.includes(move) && !move.machine
    && (mode === 'pvp' || (!move.fixed && !move.superFang && !move.needsSleep)));
  while (chosen.length < 4) {
    const remaining = backups.filter(move => !chosen.includes(move));
    if (!remaining.length) break;
    const score = move => worth(move) * (covered.has(move.type) ? 1 : NEW_TYPE_BONUS);
    const next = remaining.reduce((top, move) => (score(move) > score(top) ? move : top));
    chosen.push(next);
    covered.add(next.type);
  }
  return chosen.map(move => move.name);
}

function recommend(mode, base, pool, types) {
  const neutral = battleStats(base);
  const { best, alternatives } = bestLoadout(mode, neutral, pool, types);
  const simulate = SIMULATORS[mode];
  const physical = best.byCategory.physical ?? 0;
  const special = best.byCategory.special ?? 0;
  // Attack stats carrying at least 23% of the damage are never lowered by a nature and lead the IVs.
  const offense = [['atk', physical], ['spa', special]]
    .filter(([, amount]) => physical + special > 0 && amount >= 0.23 * (physical + special))
    .sort((a, b) => b[1] - a[1]).map(([stat]) => stat);

  // Sensitivity: which stats move the result the most (+10% each, like a nature).
  const gains = STATS.map(stat => {
    const boosted = { ...neutral, [stat]: Math.floor(neutral[stat] * 1.1) };
    return [stat, simulate(boosted, best.moves, types).value - best.value];
  }).sort((a, b) => b[1] - a[1]);
  const topGain = gains[0][1];
  const sensitive = topGain > 0
    ? gains.filter(([, gain]) => gain > 0 && gain >= topGain * 0.3).map(([stat]) => stat)
    : [];
  const priority = [...new Set([...offense, ...sensitive])].slice(0, 4);

  const natureScores = NATURES.filter(nature => nature.up !== nature.down && !offense.includes(nature.down)).map(nature => {
    const stats = battleStats(base, nature);
    const value = Math.max(...alternatives.map(entry => simulate(stats, entry.moves, types).value));
    return { ...nature, value };
  }).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'en'));
  const natures = natureScores.slice(0, 3).map(nature => nature.name);

  const share = physical + special > 0 ? Math.max(physical, special) / (physical + special) : 0;
  const hasStatus = best.moves.some(move => move.kind !== 'damage');
  const role = physical + special === 0 ? 'support'
    : share >= 0.77 ? (physical >= special ? 'physical' : 'special') : 'mixed';
  return {
    value: best.value, role, priority, natures, moves: fillSlots(mode, best, pool, neutral),
    status: hasStatus, share, physicalShare: physical / Math.max(1, physical + special),
  };
}

function lineageMoves(id, byId, predecessors) {
  const moves = new Map();
  const visited = new Set();
  function visit(dex) {
    if (visited.has(dex)) return;
    visited.add(dex);
    for (const move of byId.get(dex)?.moves ?? []) {
      if (!move.name || move.natural === false || (move.method && !['level', 'level-up'].includes(move.method))) continue;
      const key = moveKey(move);
      if (!moves.has(key)) moves.set(key, move);
    }
    for (const parent of predecessors.get(dex) ?? []) visit(parent);
  }
  visit(id);
  return Array.from(moves.values());
}

// Compares Smogon's Gen 3 sets with the natural move pool: a set only helps as much as it can be built.
function competitiveReference(dex, pool, competitive) {
  const entry = competitive?.species?.[dex];
  if (!entry) return null;
  const override = ABILITY_TIER_OVERRIDES[dex];
  const tier = override?.tier ?? entry.tier;
  const available = new Set(pool.map(move => normalizeName(move.name)));
  let bestSet = null;
  for (const set of entry.sets ?? []) {
    const covered = set.slots.filter(options => options.some(option => available.has(option))).length;
    const coverage = covered / set.slots.length;
    const priority = set.generation === 3 ? 1 : 0.9;
    if (!bestSet || coverage * priority > bestSet.coverage * bestSet.priority) {
      bestSet = { ...set, covered, coverage, priority };
    }
  }
  let randomCoverage = null;
  if (entry.randomMoves?.length) {
    randomCoverage = entry.randomMoves.filter(move => available.has(move)).length / entry.randomMoves.length;
  }
  const coverage = bestSet ? bestSet.coverage : randomCoverage ?? 0.5;
  const tierPoints = TIER_POINTS[tier] ?? 35;
  const levelPoints = entry.randomLevel ? clamp(0, 100, (100 - entry.randomLevel) / 30 * 100) : null;
  const strength = levelPoints === null || override ? tierPoints : 0.6 * tierPoints + 0.4 * levelPoints;
  const missing = bestSet
    ? bestSet.slots.map((options, index) => options.some(option => available.has(option)) ? null : bestSet.labels[index]).filter(Boolean)
    : [];
  return {
    tier: tier ?? null, ...(override ? { tierNote: override.reason } : {}),
    points: Math.round(strength * (0.4 + 0.6 * coverage) * 10) / 10,
    coverage: Math.round(coverage * 100) / 100,
    ...(bestSet ? { set: bestSet.name, format: bestSet.format, generation: bestSet.generation,
      covered: bestSet.covered, slots: bestSet.slots.length, missing } : {}),
  };
}

function speciesProfile(species, pool, competitiveDex, competitive, rules = {}) {
  if (!STATS.every(stat => Number.isFinite(species.stats?.[stat]) && species.stats[stat] > 0)
      || !Array.isArray(species.types) || !species.types.length || !pool.length) return null;
  const types = species.types.map(typeKey);
  const typeSet = new Set(types);
  let moves = pool.map(move => classify(move, typeSet, rules)).filter(Boolean);
  const main = mainStat(species.stats);
  if (main !== 'mixed') {
    const follows = moves.filter(move => move.kind !== 'damage' || move.fixed || move.superFang || move.category === main);
    // Keep the off-stat attacks only when the main stat has nothing to use.
    if (follows.some(move => move.kind === 'damage' && !move.fixed && !move.superFang)) moves = follows;
  }
  const reference = competitiveReference(competitiveDex, pool, competitive);
  if (!moves.some(move => move.kind === 'damage' && !move.fixed && !move.superFang)) {
    // Transform, Sketch, Counter or Present only: nothing the simulators can measure.
    const names = pool.filter(move => move.implemented !== false && !move.manualOnly).map(move => move.name).slice(0, 4);
    const empty = { value: 0, role: 'support', priority: ['hp', 'def', 'spd'], natures: [], moves: names, status: true };
    return {
      id: species.id, name: species.name, types: species.types, stats: species.stats, unmeasured: true,
      pve: { ...empty, dps: 0 }, pvp: { ...empty, duel: 0, ...(reference ? { smogon: reference } : {}) },
      ...(species.baseId ? { baseId: species.baseId, isMega: true } : {}),
    };
  }

  const pve = recommend('pve', species.stats, moves, types);
  const pvp = recommend('pvp', species.stats, moves, types);
  return {
    id: species.id, name: species.name, types: species.types, stats: species.stats,
    pve: { ...pve, dps: Math.round(pve.value * 10) / 10 },
    pvp: { ...pvp, duel: Math.round(pvp.value * 10) / 10, ...(reference ? { smogon: reference } : {}) },
    ...(species.baseId ? { baseId: species.baseId, isMega: true } : {}),
  };
}

const LEGENDARY_DEX = new Set([144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386]);
const pvp_unmeasured = 'Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero.';
const ROLE_NAMES = { physical: 'físico', special: 'especial', mixed: 'misto', support: 'de suporte' };

function quantile(sorted, share) {
  if (!sorted.length) return 0;
  const index = clamp(0, sorted.length - 1, Math.floor(share * (sorted.length - 1)));
  return sorted[index];
}

function finishScores(profiles) {
  const normal = profiles.filter(profile => !profile.isMega && !LEGENDARY_DEX.has(Number(profile.id)));
  const topDps = Math.max(...normal.map(profile => profile.pve.dps));
  for (const profile of profiles) {
    profile.pve.score = Math.round(1000 * profile.pve.dps / topDps) / 10;
    const smogon = profile.pvp.smogon?.points;
    profile.pvp.score = Math.round((smogon === undefined ? profile.pvp.duel
      : PVP_DUEL_WEIGHT * profile.pvp.duel + (1 - PVP_DUEL_WEIGHT) * smogon) * 10) / 10;
  }
  const thresholds = {};
  for (const mode of ['pve', 'pvp']) {
    const scores = normal.map(profile => profile[mode].score).sort((a, b) => b - a);
    thresholds[mode] = Object.fromEntries(Object.entries(tierShares)
      .map(([tier, share]) => [tier, quantile(scores, share)]));
    thresholds[mode].D = 0;
    for (const profile of profiles) {
      const score = profile[mode].score;
      profile[mode].tier = ['S', 'A', 'B', 'C'].find(tier => score >= thresholds[mode][tier]) ?? 'D';
    }
  }
  for (const profile of profiles) {
    const pve = profile.pve;
    if (profile.unmeasured) {
      pve.note = pvp_unmeasured;
      profile.pvp.note = pvp_unmeasured;
      delete pve.value;
      delete profile.pvp.value;
      continue;
    }
    pve.note = `Dano estimado por segundo na caça: ${pve.dps.toLocaleString('pt-BR')}`
      + (pve.status ? ', com golpe de reforço mantido ativo.' : '.')
      + (pve.role === 'mixed' ? ' Usa dano físico e especial.' : '');
    const pvp = profile.pvp;
    const smogon = pvp.smogon;
    let note = `Duelo de referência: ${pvp.duel.toLocaleString('pt-BR')}/100 (perfil ${ROLE_NAMES[pvp.role]}).`;
    if (smogon) {
      note += ` Gen 3: ${smogon.tier ?? 'sem tier'}${smogon.tierNote ? ` (${smogon.tierNote})` : ''}`;
      if (smogon.set) {
        note += `; set "${smogon.set}" com ${smogon.covered}/${smogon.slots} golpes por nível`
          + (smogon.missing.length ? ` (faltam ${smogon.missing.join(', ')})` : '');
      }
      note += '.';
    }
    pvp.note = note;
    for (const mode of [pve, pvp]) {
      delete mode.value;
      delete mode.share;
      delete mode.physicalShare;
    }
  }
  return thresholds;
}

// machines: optional HM/TM entries ({ move, dex }) whose moves join the pool of compatible species.
// focusPunchFails: Focus Punch fails when hit during its concentration (used by the TM list).
export function buildGuide(rows, { megaForms = [], competitive = null, machines = [], focusPunchFails = false } = {}) {
  const rules = { focusPunchFails };
  const machineMoves = dex => machines.filter(entry => entry.dex.includes(Number(dex)))
    .map(entry => ({ ...entry.move, level: 0, machine: true }));
  const poolFor = (dex, byIdMap, predecessorMap) => {
    const pool = lineageMoves(dex, byIdMap, predecessorMap);
    const known = new Set(pool.map(move => move.key));
    return [...pool, ...machineMoves(dex).filter(move => !known.has(move.key))];
  };
  const byId = new Map(rows.map(row => [row.id, row]));
  if (byId.size !== rows.length) throw new Error('A Poképédia retornou números de Pokédex duplicados.');

  const predecessors = new Map();
  for (const species of rows) {
    for (const evolution of species.evolutions ?? []) {
      const parents = predecessors.get(evolution) ?? [];
      parents.push(species.id);
      predecessors.set(evolution, parents);
    }
  }

  const memo = new Map();
  const path = new Set();
  function finalIds(id) {
    if (memo.has(id)) return memo.get(id);
    if (path.has(id)) throw new Error('A Poképédia retornou um ciclo de evoluções no número ' + id + '.');
    const species = byId.get(id);
    if (!species) return [id];
    path.add(id);
    const evolutions = species.evolutions ?? [];
    const finals = evolutions.length ? [...new Set(evolutions.flatMap(finalIds))] : [id];
    path.delete(id);
    memo.set(id, finals);
    return finals;
  }

  const species = Object.fromEntries(rows.map(row => [row.id, { name: row.name, finals: finalIds(row.id) }]));
  const finalDex = new Set(Object.values(species).flatMap(row => row.finals));
  const profiles = {};
  const missingProfiles = [];
  for (const id of finalDex) {
    const row = byId.get(id);
    const profile = row && speciesProfile(row, poolFor(id, byId, predecessors), id, competitive, rules);
    if (profile) profiles[id] = profile;
    else missingProfiles.push(id);
  }

  const variantsByBase = new Map();
  for (const mega of megaForms) {
    const profile = mega.movesFromBase && byId.has(mega.baseId)
      && speciesProfile(mega, poolFor(mega.baseId, byId, predecessors), mega.baseId, competitive, rules);
    if (!profile) {
      missingProfiles.push(mega.id);
      continue;
    }
    profiles[mega.id] = profile;
    const variants = variantsByBase.get(mega.baseId) ?? [];
    variants.push(mega.id);
    variantsByBase.set(mega.baseId, variants);
  }

  for (const row of Object.values(species)) {
    const variants = row.finals.flatMap(id => variantsByBase.get(id) ?? []);
    if (variants.length) row.variants = variants;
  }
  const tierThresholds = finishScores(Object.values(profiles));
  return {
    sourceUrl, competitiveSources: competitive?.sources ?? null,
    tierThresholds, species, profiles, missingProfiles,
  };
}

// Model constants, listed in referencia/ by build-reference.mjs.
export const MODEL = {
  GCD, RECHARGE_SECONDS, AREA_FACTOR, PACK_SIZE, PACK_SPREAD_TILES,
  DODGE_MIN_CAST, DODGE_PER_SECOND, DODGE_MAX, INCOMING_DODGE, STEP_SECONDS, KITE_MAX,
  MAIN_STAT_RATIO, PVP_DUEL_WEIGHT, WILD_ATTACK_SECONDS, HM_MIN_GAIN, NEW_TYPE_BONUS,
  PVE_SECONDS, DUEL_SECONDS, OPPONENT_POWER, tierShares,
};
