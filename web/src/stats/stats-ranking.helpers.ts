export type RankedEntry<T> = {
  item: T;
  position: number;
};

export function deriveRankingLists<T>(
  ranking: T[],
  limit = 10,
): { best: RankedEntry<T>[]; worst: RankedEntry<T>[] } {
  const best = ranking.slice(0, limit).map((item, index) => ({
    item,
    position: index + 1,
  }));
  const usedBest = new Set(best.map(({ item }) => item));
  const worst = ranking
    .map((item, index) => ({ item, position: index + 1 }))
    .filter(({ item }) => !usedBest.has(item))
    .slice(-limit)
    .reverse();

  return { best, worst };
}
