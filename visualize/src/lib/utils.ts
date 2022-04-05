import LRU from 'lru-cache';

export function genLRU<K extends unknown[], V>(f: (...args: K) => V) {
  const cache = new LRU<K, V>({ max: 100 });
  return (...args: K): V => {
    if (cache.has(args)) return cache.get(args) as V; // Checked

    const r = f(...args);
    cache.set(args, r);
    return r;
  };
}
