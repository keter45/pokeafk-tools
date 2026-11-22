// Early-game farms: Kanto hunts where a first-stage Pokémon (cheap to catch) evolves into an
// S or A tier final form. Capture rules come from the game config (pokepedia-data.json → capture):
// capture price = level price (log curve, at the level the Pokémon arrives) × capture tier factor,
// and the factor of a species is the cheapest one along its pre-evolutions.
const TIER_RANK = { S: 0, A: 1, B: 2, C: 3, D: 4 };
const GOOD = new Set(['S', 'A']);
const LEGENDARY = new Set([144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386]);

import { levelPrice, roundPrice } from './capture.mjs';

export function buildFarms(snapshot, guide, { regions = ['kanto'] } = {}) {
  const { capture, hunts = [] } = snapshot;
  if (!capture) return [];
  const byId = new Map(snapshot.species.map(species => [species.id, species]));
  const parent = new Map();
  for (const species of snapshot.species) for (const into of species.evolutions) if (!parent.has(into)) parent.set(into, species.id);

  const ownFactor = dex => {
    const tier = byId.get(dex)?.catchTier;
    if (tier === undefined) return undefined;
    return capture.first.includes(dex) ? capture.groups.first : capture.groups[tier];
  };
  const factor = dex => {
    let best = ownFactor(dex);
    for (let at = dex, seen = new Set(); parent.has(at) && !seen.has(at);) {
      seen.add(at);
      at = parent.get(at);
      const value = ownFactor(at);
      if (value !== undefined && (best === undefined || value < best)) best = value;
    }
    return best;
  };
  const tierOf = (id, mode) => guide.profiles[id]?.[mode]?.tier;
  const bestTier = tiers => tiers.filter(Boolean).sort((a, b) => TIER_RANK[a] - TIER_RANK[b])[0];

  const farms = [];
  for (const hunt of hunts) {
    if (!regions.includes(hunt.region)) continue;
    for (const slot of hunt.slots) {
      const species = byId.get(slot.dex);
      // First stage only (no pre-evolution) and it must evolve.
      if (!species || parent.has(slot.dex) || !species.evolutions.length || LEGENDARY.has(slot.dex)) continue;
      const finals = (guide.species[slot.dex]?.finals ?? []).filter(id => guide.profiles[id]).map(id => ({
        id, name: guide.profiles[id].name, pve: tierOf(id, 'pve'), pvp: tierOf(id, 'pvp'),
      }));
      const best = bestTier(finals.flatMap(final => [final.pve, final.pvp]));
      if (!GOOD.has(best)) continue;
      const kindWeight = hunt.slots.filter(other => other.on === slot.on).reduce((sum, other) => sum + other.w, 0);
      const wild = (slot.lv[0] + slot.lv[1]) / 2;
      const [low, high] = capture.caughtLevel;
      const caughtLevel = Math.min(capture.caughtMaxLevel, Math.max(5, Math.round(wild * (low + high) / 2)));
      const speciesFactor = factor(slot.dex);
      if (speciesFactor === undefined) continue;
      farms.push({
        hunt: hunt.id, place: hunt.name.split(' · ').slice(1).join(' · ') || hunt.name, region: hunt.region,
        badge: hunt.badge ?? 0, recLv: hunt.recLv, on: slot.on, rod: hunt.rod ?? null,
        dex: slot.dex, name: species.name, types: species.types.map(type => type.toLowerCase()),
        wild: slot.lv, caughtLevel, share: Math.round(slot.w / kindWeight * 100),
        price: roundPrice(levelPrice(capture.curve, caughtLevel) * speciesFactor),
        catchTier: capture.first.includes(slot.dex) ? 'first' : species.catchTier,
        best, finals,
      });
    }
  }
  return farms.sort((a, b) => TIER_RANK[a.best] - TIER_RANK[b.best] || a.badge - b.badge
    || a.recLv - b.recLv || a.price - b.price || a.name.localeCompare(b.name));
}
