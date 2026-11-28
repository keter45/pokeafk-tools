// Shiny farms (pedido do usuário, 2026-11-28): for each evolution line whose best final form is S or
// A tier (PvE or Competitivo), every hunt of every region where a member of the line appears, best
// first for shiny hunting: the user wants shinies, so the higher the capture rate, the better.
//
// The game gives every wild Pokémon the same shiny chance (config shinyOdds, 1 in 2.000; guide
// "Shiny"), Outland hunts carry their own (1 in 1.000) and Nightmare ones are all shiny. So, for a
// species, a hunt is better when more of its wild ones are that species (slot weight share) and
// its shiny chance is higher; the expected pace is killsPerHour (the MAPA's estimate) × share × chance.
// The shiny capture price comes from the game's shinyCatch table (selectStyle: j1 = pe(dex,
// shinyCatch)), the species' own capture tier, and does not depend on the hunt.
const TIER_RANK = { S: 0, A: 1, B: 2, C: 3, D: 4 };
const GOOD = new Set(['S', 'A']);
const LEGENDARY = new Set([144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386]);
export const REGION_NAMES = {
  kanto: 'Kanto', johto: 'Johto', hoenn: 'Hoenn', outland: 'Outland', orre: 'Orre', nightmare: 'Nightmare', castelo: 'Castelo',
};

export function buildFarms(snapshot, guide) {
  const { capture, hunts = [], shiny } = snapshot;
  if (!capture || !shiny) return [];
  const byId = new Map(snapshot.species.map(species => [species.id, species]));
  const parent = new Map();
  for (const species of snapshot.species) for (const into of species.evolutions) if (!parent.has(into)) parent.set(into, species.id);
  const rootOf = dex => {
    let at = dex;
    for (const seen = new Set(); parent.has(at) && !seen.has(at);) { seen.add(at); at = parent.get(at); }
    return at;
  };
  const shinyPrice = dex => {
    const tier = capture.first.includes(dex) ? 'first' : byId.get(dex)?.catchTier;
    return tier === undefined ? null : capture.shinyCatch[tier] ?? null;
  };
  const tierOf = (id, mode) => guide.profiles[id]?.[mode]?.tier;
  const bestTier = tiers => tiers.filter(Boolean).sort((a, b) => TIER_RANK[a] - TIER_RANK[b])[0];

  const lines = new Map();
  const lineOf = root => {
    if (lines.has(root)) return lines.get(root);
    const species = byId.get(root);
    const finals = (guide.species[root]?.finals ?? [root]).filter(id => guide.profiles[id]).map(id => ({
      id, name: guide.profiles[id].name, pve: tierOf(id, 'pve'), pvp: tierOf(id, 'pvp'),
    }));
    const best = bestTier(finals.flatMap(final => [final.pve, final.pvp]));
    const line = species && !LEGENDARY.has(root) && GOOD.has(best) ? {
      dex: root, name: species.name, types: species.types.map(type => type.toLowerCase()), best, finals, hunts: [],
    } : null;
    lines.set(root, line);
    return line;
  };

  for (const hunt of hunts) {
    const odds = hunt.shinyOdds ?? shiny.odds;
    for (const slot of hunt.slots) {
      if (slot.fm) continue;   // Mega forms: a different Pokémon to catch.
      const line = lineOf(rootOf(slot.dex));
      if (!line || line.hunts.some(row => row.hunt === hunt.id && row.dex === slot.dex)) continue;
      // Share among the wild ones of the same kind (land, surf, each rod).
      const sameKind = hunt.slots.filter(other => other.on === slot.on);
      const weight = sameKind.filter(other => other.dex === slot.dex && !other.fm).reduce((sum, other) => sum + other.w, 0);
      const share = weight / sameKind.reduce((sum, other) => sum + other.w, 0);
      const levels = sameKind.filter(other => other.dex === slot.dex).flatMap(other => other.lv);
      const perHour = shiny.killsPerHour * share * odds;
      line.hunts.push({
        hunt: hunt.id, place: hunt.name.split(' · ').slice(1).join(' · ') || hunt.name, region: hunt.region,
        badge: hunt.badge ?? 0, recLv: hunt.recLv, on: slot.on, rod: hunt.rod ?? null,
        dex: slot.dex, name: byId.get(slot.dex)?.name ?? `#${slot.dex}`,
        levels: [Math.min(...levels), Math.max(...levels)],
        share: Math.round(share * 100), odds, allShiny: odds >= 1,
        perHour, hours: odds >= 1 ? 0 : 1 / perHour, shinyPrice: shinyPrice(slot.dex),
      });
    }
  }

  const result = [...lines.values()].filter(line => line?.hunts.length);
  for (const line of result) {
    // Highest shiny capture rate first (the cheapest shiny price: a ball catches with 200 / (2 × price)
    // plus the accumulated luck), then the most shinies per hour, then the lowest level.
    line.hunts.sort((a, b) => (a.shinyPrice ?? Infinity) - (b.shinyPrice ?? Infinity) || b.perHour - a.perHour
      || a.recLv - b.recLv || a.place.localeCompare(b.place));
    line.cheapest = line.hunts[0].shinyPrice ?? Infinity;
    line.easiest = Math.min(...line.hunts.map(row => row.recLv));
  }
  return result.sort((a, b) => TIER_RANK[a.best] - TIER_RANK[b.best] || a.cheapest - b.cheapest || a.easiest - b.easiest
    || a.name.localeCompare(b.name));
}
