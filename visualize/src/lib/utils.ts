import LRU from 'lru-cache';

export function genLRU<K extends unknown[], V>(f: (...args: K) => V) {
  const cache = new LRU<string, V>({ max: 100 });
  return (...args: K): V => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key) as V; // Checked
    const r = f(...args);
    cache.set(key, r);
    return r;
  };
}

export function debounce<T extends unknown[]>(
  f: (...args: T) => void | Promise<unknown>,
  timeout = 300
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: T) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => f(...args) as void, timeout);
  };
}

export function clickOutside(node: HTMLElement) {
  const handleClick = (event: MouseEvent) => {
    if (node && !node.contains(event.target) && !event.defaultPrevented) {
      node.dispatchEvent(new CustomEvent('outclick'));
    }
  };

  document.addEventListener('click', handleClick, true);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
    }
  };
}
