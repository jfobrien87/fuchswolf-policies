// Seed determines the assignment, independent of history. Normal entry selects a
// fresh seed if it would reproduce the previous arrangement; explicit replay does not.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffledIndices(count, seed) {
  const order = Array.from({ length: count }, (_, i) => i),
    random = seededRandom(seed);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
export function chooseSpawn(
  level,
  { seed, previous = [], valid = () => true } = {},
) {
  const slots = level.spawnSlots || level.objects.map((o) => o.home),
    count = slots.length;
  const fixed = Array.from({ length: count }, (_, i) => i);
  if (!level.randomizeStartPositions || count < 2)
    return { seed: null, order: fixed, slots, randomized: false };
  const explicit = Number.isInteger(seed);
  let candidate = explicit
    ? seed >>> 0
    : crypto.getRandomValues(new Uint32Array(1))[0];
  // Bounded search; invalid geometry is never accepted just to obtain variety.
  for (let attempt = 0; attempt < 256; attempt++) {
    const order = shuffledIndices(count, candidate);
    if (
      valid(order, slots) &&
      (explicit || order.some((v, i) => v !== previous[i]))
    )
      return { seed: candidate, order, slots, randomized: true };
    candidate = (candidate + 1) >>> 0;
  }
  return { seed: null, order: fixed, slots, randomized: false, fallback: true };
}
