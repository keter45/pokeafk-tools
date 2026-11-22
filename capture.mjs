// Capture price, as the game computes it (selectStyle module of the Poképédia, guide "Captura").
// Capture rules come from pokepedia-data.json → capture (collected from the game config).
//
// The chance of each ball grows with the ₽ already spent on balls for that species since its last
// capture (the "Sorte acumulada"), is certain once that spend reaches certainAt × price, and on
// average a capture costs price / (1 + margin). So the price says how expensive a species is.

// The game's level price: log-log interpolation between the curve points (and past the last one).
export function levelPrice(curve, level) {
  if (!(level > curve[0][0])) return curve[0][1];
  let index = curve.findIndex(([at]) => at >= level);
  if (index < 0) index = curve.length - 1;
  const [[x0, y0], [x1, y1]] = [curve[index - 1], curve[index]];
  return y0 * Math.pow(y1 / y0, Math.log(level / x0) / Math.log(x1 / x0));
}

// Rounded like the game: to 5 below 100, 10 below 1000, 100 below 10000, then 1000.
export const roundPrice = value => {
  const step = value < 100 ? 5 : value < 1000 ? 10 : value < 10000 ? 100 : 1000;
  return Math.max(step, Math.round(value / step) * step);
};

export function captureRules(snapshot) {
  const { capture } = snapshot;
  if (!capture) return null;
  const byId = new Map(snapshot.species.map(species => [species.id, species]));
  const parent = new Map();
  const children = new Map();
  for (const species of snapshot.species) {
    for (const into of species.evolutions) {   // dex numbers in pokepedia-data.json
      if (!parent.has(into)) parent.set(into, species.id);
      children.set(species.id, [...(children.get(species.id) ?? []), into]);
    }
  }

  // The species' own capture factor (the game's capture price does not use the pre-evolutions').
  const factor = dex => {
    const tier = byId.get(dex)?.catchTier;
    if (tier === undefined) return undefined;
    return capture.first.includes(dex) ? capture.groups.first : capture.groups[tier];
  };
  // [stage in the line, length of the line], counting pre-evolutions from other generations.
  const stageOf = dex => {
    let root = dex;
    let stage = 1;
    for (const seen = new Set(); parent.has(root) && !seen.has(root);) { seen.add(root); root = parent.get(root); stage++; }
    const depth = (id, left) => (left > 0 ? 1 + Math.max(0, ...(children.get(id) ?? []).map(next => depth(next, left - 1))) : 1);
    return [stage, depth(root, 5)];
  };
  // Level the Pokémon arrives at: Johto/Hoenn by stage, other regions fixed, Kanto 70–80% of the wild one.
  const caughtLevel = (dex, region, wildLevel) => {
    const byStage = capture.caughtStageLevel?.[region];
    if (byStage) {
      const [stage, length] = stageOf(dex);
      const level = byStage[length]?.[stage - 1];
      if (level) return Math.min(capture.maxLevel ?? 100, level);
    }
    const fixed = capture.caughtRegionLevel?.[region];
    if (fixed) return Math.min(capture.maxLevel ?? 100, fixed);
    const [low, high] = capture.caughtLevel;
    return Math.min(capture.caughtMaxLevel, capture.maxLevel ?? 100, Math.max(5, Math.round(wildLevel * (low + high) / 2)));
  };
  // Johto and Hoenn have a minimum, higher on three-stage lines that end in a Tier 1 (the starters).
  const regionFloor = dex => {
    const floor = (capture.regionFloor ?? []).find(entry => dex >= entry.dex[0] && dex <= entry.dex[1]);
    return floor ? (floor.lines.includes(dex) ? floor.strong : floor.min) : 0;
  };
  const price = (dex, level) => {
    const own = factor(dex);
    if (own === undefined || !(level >= 1)) return 0;
    const common = roundPrice(levelPrice(capture.curve, level) * own);
    return Math.max(common, capture.speciesCatch?.[dex] ?? 0, regionFloor(dex));
  };
  // A species in a hunt: the game's calculator uses the middle of its levels there.
  const inHunt = (hunt, dex) => {
    const levels = hunt.slots.filter(slot => slot.dex === dex).flatMap(slot => slot.lv);
    if (!levels.length) return null;
    const level = caughtLevel(dex, hunt.region, (Math.min(...levels) + Math.max(...levels)) / 2);
    const value = price(dex, level);
    return value ? { dex, level, price: value } : null;
  };
  return { factor, caughtLevel, price, inHunt, catchTier: dex => (capture.first.includes(dex) ? 'first' : byId.get(dex)?.catchTier) };
}
