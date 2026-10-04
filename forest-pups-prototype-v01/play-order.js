// One persistent shuffled bag per Lucky Dip session. No scene-specific selection logic.
export function createPlayOrder(levels, random = Math.random) {
  let bag = [],
    cursor = -1,
    cycle = 0,
    active = false,
    last = null;
  const eligible = levels
    .map((level, index) => ({ level, index }))
    .filter((x) => x.level.luckyDipEligible && !x.level.debugOnly)
    .map((x) => x.index);
  function shuffle() {
    bag = [...eligible];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    if (bag.length > 1 && bag[0] === last) [bag[0], bag[1]] = [bag[1], bag[0]];
    cursor = -1;
    cycle++;
  }
  return {
    get snapshot() {
      return { active, order: bag.map((i) => levels[i].id), cursor, cycle };
    },
    start(previous = null) {
      active = true;
      last = previous;
      cycle = 0;
      shuffle();
      return this.next();
    },
    next() {
      if (!active || !eligible.length) return null;
      if (cursor + 1 >= bag.length) shuffle();
      last = bag[++cursor];
      return last;
    },
    stop() {
      active = false;
    },
  };
}
