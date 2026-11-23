// Move descriptions and move rankings, shared by build-reference.mjs and build-tierlist-page.mjs.
//
// describeMove copies the game's own description builder (functions lE, zf, Ar and Mi of the
// Poképédia module selectStyle-*.js; read in game-copy/ on 2026-11-23), so the text matches the move
// card in the game. moveMetrics measures each move for the "Golpes" ranking: damage, DPS, area,
// reach and two judgements, hunting and PvP, scored with the same rules as rank-pokemon.mjs.
import {
  EXCLUDED_EFFECTS, FIXED_DAMAGE, MODEL, areaMultiplier, discTiles, dodgeChance, huntTargets, moveReach, tierShares,
} from './rank-pokemon.mjs';

// ---------- Description (port of the game's text) ----------
const seconds = ms => `${(ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`;
const joinList = (list, word = 'e') => (list.length < 2 ? list.join('') : `${list.slice(0, -1).join(', ')} ${word} ${list.at(-1)}`);
const STAT_TEXT = { atk: 'o ATAQUE', def: 'a DEFESA', spa: 'o AT. ESP.', spd: 'a DEF. ESP.', spe: 'a VELOCIDADE', acc: 'a PRECISÃO', eva: 'a EVASÃO' };
const HEAL = new Set(['EFFECT_RESTORE_HP', 'EFFECT_SOFTBOILED', 'EFFECT_MORNING_SUN', 'EFFECT_SYNTHESIS', 'EFFECT_MOONLIGHT']);
const CURE = new Set(['EFFECT_HEAL_BELL', 'EFFECT_REFRESH']);
const HIGH_CRIT = new Set(['EFFECT_HIGH_CRITICAL', 'EFFECT_RAZOR_WIND', 'EFFECT_SKY_ATTACK', 'EFFECT_BLAZE_KICK', 'EFFECT_POISON_TAIL']);
const HITS_MIDAIR = new Set(['GUST', 'TWISTER', 'THUNDER', 'SKY_UPPERCUT']);
const SELF_EFFECTS = new Set([...HEAL, ...CURE, 'EFFECT_REST', 'EFFECT_WISH', 'EFFECT_BELLY_DRUM', 'EFFECT_DESTINY_BOND']);
const POWER_RULES = {
  RETURN: 'Mais forte quanto mais o seu Pokémon gosta de você (até 102)',
  FRUSTRATION: 'Mais forte quanto menos o seu Pokémon gosta de você (até 102)',
  HIDDEN_POWER: 'O tipo e o poder (30 a 70) dependem dos IVs do seu Pokémon',
  FLAIL: 'Mais forte quanto menos vida o seu Pokémon tem (até 200)',
  ERUPTION: 'Mais forte com a vida cheia: 150 com a vida toda, menos conforme ela cai',
  MAGNITUDE: 'Poder ao acaso, de 10 a 150',
  PRESENT: 'Poder 40, 80 ou 120 ao acaso; 1 vez em 5 não tira nada',
  SONIC_BOOM: 'Dano fixo: o mesmo em qualquer alvo, sem contar ATAQUE, DEFESA nem tipo',
  SEISMIC_TOSS: 'Dano pelo nível do seu Pokémon, sem contar ATAQUE nem DEFESA',
  NIGHT_SHADE: 'Lança uma bola fantasma até 5 passos à frente e acerta uma vez cada inimigo no caminho. Dano pelo nível do seu Pokémon, sem contar ATAQUE nem DEFESA',
  PSYWAVE: 'Dano ao acaso pelo nível do seu Pokémon (de metade a 1,5 vez)',
  SUPER_FANG: 'Tira metade da vida que o alvo tem (de um chefe ou de um treinador, no máximo 10%)',
  ENDEAVOR: 'Deixa a vida do alvo igual à do seu Pokémon (de um chefe ou de um treinador, tira no máximo 10%)',
  GUILLOTINE: 'Derruba de uma vez um selvagem do nível do seu Pokémon ou menor (acerta 30% mais a diferença de nível); de um chefe ou de um treinador, tira 1/4 da vida',
};
POWER_RULES.REVERSAL = POWER_RULES.FLAIL;
POWER_RULES.WATER_SPOUT = POWER_RULES.ERUPTION;
POWER_RULES.DRAGON_RAGE = POWER_RULES.SONIC_BOOM;
POWER_RULES.HORN_DRILL = POWER_RULES.FISSURE = POWER_RULES.SHEER_COLD = POWER_RULES.GUILLOTINE;
const SHAPE_TEXT = {
  STOMP: 'Um pisão atinge os inimigos até 2 passos ao redor do seu Pokémon',
  MEGAHORN: 'Avança até 4 passos e acerta os inimigos no caminho; termina num espaço livre, sem atravessar paredes',
  SPARK: 'Uma descarga elétrica atinge os inimigos até 2 passos ao redor do seu Pokémon',
  TRI_ATTACK: 'Dispara três faixas paralelas até 4 passos à frente; cada inimigo é atingido uma vez',
  SLUDGE: 'Lança uma bola de lodo até 6 passos, que explode a 1 passo ao redor do impacto; paredes bloqueiam a bola e a explosão',
  SMOG: 'Uma nuvem de veneno cobre três faixas por até 3 passos à frente',
  WING_ATTACK: 'Avança num rasante até 4 passos, atingindo os inimigos no caminho e terminando num espaço livre',
  LOW_KICK: 'Avança com uma bicuda por até 3 passos e acerta os inimigos no caminho; termina num espaço livre',
  CROSS_CHOP: 'Dois cortes cruzados acertam os inimigos num X de 3 passos à frente',
  PIN_MISSILE: 'Espalha agulhas num leque de até 5 passos à frente',
  VICE_GRIP: 'As pinças se fecham sobre os inimigos num cone de 2 passos à frente',
  ROLLING_KICK: 'Um chute em meia-lua atinge os inimigos no semicírculo de 2 passos à frente',
  COMET_PUNCH: 'Uma sequência de socos atinge os inimigos numa faixa de 3 passos à frente',
};
const AURA_TEXT = {
  reflect: 'quem estiver perto do seu Pokémon leva metade do dano físico',
  lightScreen: 'quem estiver perto do seu Pokémon leva metade do dano especial',
  mist: 'os inimigos não baixam os status de quem estiver perto do seu Pokémon',
  safeguard: 'os inimigos não causam estados (sono, veneno, confusão...) em quem estiver perto do seu Pokémon',
  mudSport: 'golpes ELÉTRICOS em quem estiver perto do seu Pokémon têm metade do poder',
  waterSport: 'golpes de FOGO em quem estiver perto do seu Pokémon têm metade do poder',
};
const RECHARGE_MS = 1500;      // combat.rechargeMs
const THUNDER_RAIN_MS = 300;   // combat.thunderRainMs

// One effect as text: inf (after "chance de") and pres (a sentence of its own). Port of Ar.
function effectText(effect) {
  const time = seconds(effect.ms ?? 0);
  const onFoe = effect.on === 'foe';
  const who = onFoe ? 'o alvo' : 'o seu Pokémon';
  const pair = (inf, pres, rest) => ({ inf: `${inf} ${rest}`, pres: `${pres} ${rest}` });
  switch (effect.kind) {
    case 'stage': {
      const entries = Object.entries(effect.stages ?? {});
      const part = (list, up) => {
        const much = list.every(([, amount]) => Math.abs(amount) >= 2) ? ' muito' : '';
        const stats = joinList(list.map(([stat]) => STAT_TEXT[stat]));
        return { inf: `${up ? 'subir' : 'baixar'}${much} ${stats}`, pres: `${up ? 'sobe' : 'baixa'}${much} ${stats}` };
      };
      const ups = entries.filter(([, amount]) => amount > 0);
      const downs = entries.filter(([, amount]) => amount < 0);
      const parts = [...(ups.length ? [part(ups, true)] : []), ...(downs.length ? [part(downs, false)] : [])];
      if (!parts.length) return undefined;
      const tail = ` ${onFoe ? 'do alvo' : 'do seu Pokémon'} por ${time}`;
      const pres = joinList(parts.map(item => item.pres)) + tail;
      return { inf: joinList(parts.map(item => item.inf)) + tail, pres: pres.charAt(0).toUpperCase() + pres.slice(1) };
    }
    case 'par': return pair('paralisar', 'Paralisa', `${who} por ${time}: mais lento, e 1 em cada 4 golpes dele falha`);
    case 'slp': return pair('fazer', 'Faz', `${who} dormir por ${time}${effect.delayMs ? `, ${seconds(effect.delayMs)} depois de acertar` : ''}`);
    case 'frz': return pair('congelar', 'Congela', `${who} por ${time} (um golpe de FOGO descongela)`);
    case 'brn': return pair('queimar', 'Queima', `${who} por ${time}: perde vida aos poucos e bate mais fraco`);
    case 'psn': return pair('envenenar', 'Envenena', `${who} por ${time}: perde vida aos poucos`);
    case 'tox': return pair('envenenar gravemente', 'Envenena gravemente', `${who} por ${time}: perde cada vez mais vida`);
    case 'conf': return onFoe ? pair('confundir', 'Confunde', `o alvo por ${time}: às vezes ele bate em si mesmo`)
      : { inf: `deixar o seu Pokémon confuso por ${time}`, pres: `Depois, o seu Pokémon fica confuso por ${time}` };
    case 'flinch': return pair('fazer', 'Faz', 'o alvo recuar: o próximo golpe dele atrasa, e o que ele preparava se perde');
    case 'trap': return pair('prender', 'Prende', `o alvo por ${time}: ele não anda e perde vida`);
    case 'root': return onFoe ? pair('impedir', 'Impede', `o alvo de andar por ${time}`)
      : pair('enraizar', 'Enraíza', `o seu Pokémon por ${time}: não anda, mas recupera vida aos poucos`);
    case 'seed': return pair('plantar', 'Planta', `uma semente no alvo por ${time}: ela tira vida dele e cura o seu Pokémon`);
    case 'shield': return pair('proteger', 'Protege', `o seu Pokémon de todo golpe por ${time}; de novo em menos de 10 s, pode falhar`);
    case 'endure': return pair('aguentar', 'Aguenta', `por ${time}: nenhum golpe deixa o seu Pokémon com menos de 1 de vida`);
    case 'sub': return pair('gastar', 'Gasta', `1/4 da vida num boneco que leva os golpes no lugar do seu Pokémon, por até ${time}`);
    case 'aura': {
      const text = AURA_TEXT[effect.variant ?? ''];
      return text ? { inf: `por ${time}, ${text}`, pres: `Por ${time}, ${text}` } : undefined;
    }
    case 'weather': {
      const text = {
        rain: ['fazer', 'Faz', `chover por ${time} em volta: golpes de ÁGUA mais fortes e de FOGO mais fracos`],
        sun: ['fazer', 'Faz', `sol por ${time} em volta: golpes de FOGO mais fortes e de ÁGUA mais fracos`],
        sand: ['levantar', 'Levanta', `uma tempestade de areia por ${time} em volta (por enquanto, só a WEATHER BALL sente)`],
        hail: ['fazer', 'Faz', `cair granizo por ${time} em volta (por enquanto, só a WEATHER BALL sente)`],
      }[effect.variant ?? ''];
      return text ? pair(...text) : undefined;
    }
    case 'taunt': return pair('fazer', 'Faz', `o alvo usar só golpes de dano por ${time}`);
    case 'torment': return pair('impedir', 'Impede', `o alvo de repetir o mesmo golpe por ${time}`);
    case 'disable': return pair('travar', 'Trava', `por ${time} o último golpe que o alvo usou`);
    case 'encore': return pair('fazer', 'Faz', `o alvo só repetir o último golpe que usou, por ${time}`);
    case 'attract': return pair('deixar', 'Deixa', `o alvo apaixonado por ${time}: 1 em cada 4 golpes dele falha`);
    default: return undefined;
  }
}

// Effects as sentences. Port of zf.
function effectsText(move) {
  const selfShape = move.target === 'self' || move.target === 'field';
  const effects = (move.effects ?? []).filter(effect => !selfShape || effect.on === 'self');
  const lines = [];
  const oneOf = effects.filter(effect => effect.oneOf);
  if (oneOf.length) {
    const verbs = oneOf.map(effect => effectText(effect)?.inf.split(' ')[0]).filter(Boolean);
    lines.push(`${oneOf[0].chance}% de chance de ${joinList(verbs, 'ou')} o alvo`);
  }
  for (const effect of effects) {
    if (effect.oneOf) continue;
    const text = effectText(effect);
    if (text) lines.push((effect.chance ?? 100) >= 100 ? text.pres : `${effect.chance}% de chance de ${text.inf}`);
  }
  return lines;
}

// True when the move does nothing in the game yet. Port of Mi.
export function doesNothing(move) {
  if (move.target === 'borrow' || move.target === 'trap') return true;
  if (move.target === 'self' || move.target === 'field') {
    return !SELF_EFFECTS.has(move.effect) && !(move.effects ?? []).some(effect => effect.on === 'self');
  }
  if (move.category !== 'status') return false;
  return !(move.effects ?? []).length;
}

// The game's description of a move (the text of its card). Port of lE.
export function describeMove(move) {
  const effect = move.effect;
  const key = move.key;
  if (effect === 'EFFECT_ROAR' || effect === 'EFFECT_BATON_PASS') return 'Não troca Pokémon: durante o combate, o próximo só entra após um desmaio';
  if (doesNothing(move)) return 'Ainda não faz nada neste jogo: usá-lo só gasta a recarga.';
  if (move.id === 194) return 'Somente no manual: aura azul por 4 s, recarga de 20 s. Devolve ao agressor 50% do HP perdido em cada golpe direto ao qual sobreviver, sem reduzir o dano recebido. Golpes fatais, veneno, recuo e outros reflexos não ativam o efeito. Não funciona contra lendários nem bosses.';
  const lines = [];
  if (SHAPE_TEXT[key]) lines.push(SHAPE_TEXT[key]);
  if (POWER_RULES[key]) lines.push(POWER_RULES[key]);
  if (key === 'LOW_KICK') lines.push('Poder 60 em qualquer alvo (o peso ainda não conta)');
  if (key === 'DREAM_EATER') lines.push('Só acerta um alvo dormindo; recupera metade do dano que causar');
  else if (effect === 'EFFECT_ABSORB') lines.push('Recupera metade do dano que causar');
  if (effect === 'EFFECT_RECOIL') lines.push('O seu Pokémon perde 1/4 do dano que causar');
  if (effect === 'EFFECT_DOUBLE_EDGE') lines.push('O seu Pokémon perde 1/3 do dano que causar');
  if (effect === 'EFFECT_RECOIL_IF_MISS') lines.push('Se errar, o seu Pokémon perde 1/8 da vida');
  if (effect === 'EFFECT_RECHARGE') lines.push(`Depois de acertar, o seu Pokémon fica ${seconds(RECHARGE_MS)} sem agir`);
  if (effect === 'EFFECT_EXPLOSION') lines.push('O seu Pokémon desmaia ao usar; a DEFESA do alvo conta pela metade');
  if (effect === 'EFFECT_MULTI_HIT') lines.push('Acerta de 2 a 5 vezes seguidas');
  if (effect === 'EFFECT_DOUBLE_HIT' || effect === 'EFFECT_TWINEEDLE') lines.push('Acerta 2 vezes seguidas');
  if (effect === 'EFFECT_TRIPLE_KICK') lines.push('Acerta 3 vezes seguidas');
  if (HEAL.has(effect)) lines.push('Recupera metade da vida do seu Pokémon');
  if (effect === 'EFFECT_REST') {
    const sleep = (move.effects ?? []).find(item => item.kind === 'slp');
    lines.push(`Recupera toda a vida e cura o estado, mas o seu Pokémon dorme ${seconds(sleep?.ms ?? 3000)}`);
  }
  if (effect === 'EFFECT_WISH') lines.push('2 s depois, recupera metade da vida do seu Pokémon');
  if (CURE.has(effect)) lines.push('Cura o estado do seu Pokémon (veneno, queimadura, paralisia...)');
  if (key === 'BELLY_DRUM') lines.push('Gasta metade da vida e leva o ATAQUE do seu Pokémon ao máximo por 10 s');
  if (key === 'FALSE_SWIPE') lines.push('Nunca derruba: deixa o alvo com pelo menos 1 de vida (bom para capturar)');
  if (key === 'FOCUS_PUNCH') lines.push('Falha se o seu Pokémon levar um golpe enquanto se concentra');
  if (key === 'THUNDER') lines.push(`Na chuva, nunca erra e sai em ${seconds(THUNDER_RAIN_MS)}`);
  if (key === 'WEATHER_BALL') lines.push('No clima, vira ÁGUA, FOGO, PEDRA ou GELO, com poder 100');
  if (HITS_MIDAIR.has(key)) lines.push('Acerta até quem está no meio de um salto');
  if (move.target === 'leap') lines.push('No meio do salto, quase nenhum golpe acerta o seu Pokémon');
  if (HIGH_CRIT.has(effect)) lines.push('Mais chance de acerto crítico');
  if (move.offGcd) lines.push('Sai mesmo logo depois de outro golpe (não espera a vez)');
  if (effect !== 'EFFECT_REST' && key !== 'BELLY_DRUM') lines.push(...effectsText(move));
  if ((move.cast ?? 0) >= 1) lines.push(`Demora ${seconds(move.cast * 1000)} para sair${key === 'SOLAR_BEAM' ? '; no sol, sai na hora' : ''}`);
  return lines.length ? lines.join('. ') + '.' : '';
}

// ---------- Ranking metrics ----------
// Tiles a shape covers, the target's included (the same shapes as huntTargets in rank-pokemon.mjs).
export function areaTiles(move) {
  const radius = Math.max(1, Math.round(move.radius ?? 1));
  switch (move.target) {
    case 'cone': return 1 + Math.round(Math.PI * radius * radius / 4);
    case 'circle': case 'field': return discTiles(radius) - 1;
    case 'area': case 'leap': return discTiles(radius);
    case 'beam': return move.range ?? 6;
    default: return 1;
  }
}

// Kind of a status move, for the list filter.
export function statusKind(move) {
  const effects = move.effects ?? [];
  if (HEAL.has(move.effect) || move.effect === 'EFFECT_REST' || move.effect === 'EFFECT_WISH' || CURE.has(move.effect)) return 'heal';
  if (effects.some(effect => ['shield', 'endure', 'sub', 'aura'].includes(effect.kind))) return 'protect';
  if (effects.some(effect => effect.kind === 'weather')) return 'weather';
  if (move.key === 'BELLY_DRUM' || effects.some(effect => effect.kind === 'stage' && effect.on === 'self'
    && Object.values(effect.stages ?? {}).some(amount => amount > 0))) return 'boost';
  if (effects.some(effect => ['par', 'slp', 'frz', 'brn', 'psn', 'tox', 'conf', 'attract', 'seed', 'trap', 'root', 'flinch'].includes(effect.kind))) return 'ailment';
  if (effects.some(effect => effect.kind === 'stage')) return 'debuff';
  if (effects.length) return 'control';
  return 'none';
}

// Numbers of one move. Scores use no species stats or STAB: they compare moves, not Pokémon.
export function moveMetrics(move) {
  const hits = move.hits ?? move.estimatedHits
    ?? (move.effect === 'EFFECT_MULTI_HIT' ? 3 : ['EFFECT_DOUBLE_HIT', 'EFFECT_TWINEEDLE'].includes(move.effect) ? 2 : 1);
  const cast = (move.cast ?? 0) + (move.hitSpan ?? 0);
  const accuracy = move.alwaysHits || !move.accuracy ? 1 : move.accuracy / 100;
  const fixed = Boolean(FIXED_DAMAGE[move.effect]) || move.effect === 'EFFECT_SUPER_FANG';
  const power = move.combatPower ?? move.power;
  const damaging = move.category !== 'status' && !doesNothing(move);
  const scored = damaging && !fixed && Number.isFinite(power) && power > 1 && !EXCLUDED_EFFECTS.has(move.effect);
  const lock = move.effect === 'EFFECT_RECHARGE' ? MODEL.RECHARGE_SECONDS : 0;
  // Time the move takes up: never less than the base interval between moves, its cooldown or its cast.
  const interval = Math.max(MODEL.GCD.base, move.cooldown ?? 0, cast + lock);
  const reach = moveReach(move);
  const dodge = dodgeChance(move);
  const targets = damaging ? huntTargets(move) : 1;
  const metrics = {
    hits, cast, accuracy, interval, reach, dodge, tiles: areaTiles(move), targets,
    huntMult: damaging ? areaMultiplier(targets) : 1, fixed, scored, kind: move.category === 'status' ? statusKind(move) : 'damage',
  };
  if (!scored) return metrics;
  const damage = power * hits;
  // Thrash, Outrage, Petal Dance: the confusion afterwards costs about 15% (as in the hunt simulation).
  const selfConfusion = (move.effects ?? []).some(effect => effect.kind === 'conf' && effect.on === 'self') ? 0.85 : 1;
  // Focus Punch fails when hit while concentrating: it lands 1 − cast / 1.2 s of the time (see rank-pokemon.mjs).
  const lands = move.effect === 'EFFECT_FOCUS_PUNCH' ? Math.max(0, 1 - cast / MODEL.WILD_ATTACK_SECONDS) : 1;
  const dps = damage * accuracy * selfConfusion * lands / interval;
  // Dream Eater only hits a sleeping target: it depends on another move, so it gets no score.
  if (move.key === 'DREAM_EATER') return { ...metrics, scored: false, damage, dps };
  const kite = 1 + MODEL.KITE_MAX * Math.min(1, Math.max(0, (reach - 2) / 3));
  return {
    ...metrics, damage, dps,
    hunt: dps * metrics.huntMult,               // the area multiplies the damage in a hunt
    pvp: dps * (1 - dodge) * kite,              // dodgeable shapes lose what the target dodges; range keeps melee away
  };
}

// Tier letter by percentile among the scored moves (same shares as the species).
export function moveTiers(rows, field) {
  const values = rows.filter(row => Number.isFinite(row[field])).map(row => row[field]).sort((a, b) => b - a);
  const cut = share => values[Math.min(values.length - 1, Math.floor(share * (values.length - 1)))];
  const limits = Object.entries(tierShares).map(([tier, share]) => [tier, cut(share)]);
  return value => {
    if (!Number.isFinite(value)) return null;
    for (const [tier, limit] of limits) if (value >= limit) return tier;
    return 'D';
  };
}
