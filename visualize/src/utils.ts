import LRU from 'lru-cache';

export function genLRU<T extends unknown[], R>(f: (...args: T) => R) {
  const cache = new LRU({ max: 100 });
  return (...args: T): R => {
    if (cache.has(args)) {
      return cache.get(args);
    } else {
      const r = f(...args);
      cache.set(args, r);
      return r;
    }
  };
}
