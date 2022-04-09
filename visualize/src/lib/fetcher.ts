// Globs do not accept variable. Pass in real string.

// Need rest index signature
// https://github.com/microsoft/TypeScript/issues/17867
// https://github.com/microsoft/TypeScript/issues/7765

// export function getData<T extends string>(dir: string) {
//   const jsons: Record<string, { default: number[] }> = import.meta.globEager(
//     path.join(dir, '*.json')
//   );
//   const data = Object.keys(jsons).reduce((acc, k) => {
//     const name = k.split('/').pop()!.split('.')[0];
//     if (name === 'coords' || name === 'by_row') return acc;
//     return { ...acc, [name]: jsons[k].default };
//   }, {} as Record<T, number[]>);

//   const { coords, by_row } = {
//     coords: import.meta.globEager(path.join(dir, 'coords.json')).default as {
//       x: number;
//       y: number;
//     }[],
//     by_row: import.meta.globEager(path.join(dir, 'by_row.json')).default as Record<T, number>[]
//   };

//   return { data, coords, byRow: by_row };
// }

export async function fetchAll<T extends string>(sample: string, to_fetch: readonly T[]) {
  const promises = to_fetch.map(
    (name) => fetch(`/${sample}/${name}.json`).then((r) => r.json()) as Promise<number[]>
  );
  const coords = fetch(`/${sample}/coords.json`).then(
    (r) => r.json() as Promise<{ x: number; y: number }[]>
  );
  const byRow = fetch(`/${sample}/by_row.json`).then(
    (r) => r.json() as Promise<Record<T, number>[]>
  );

  const data = (await Promise.all(promises)).reduce(
    (acc, v, i) => ({ ...acc, [to_fetch[i]]: v }),
    {} as Record<T, number[]>
  );

  return { data, coords: await coords, byRow: await byRow };
}

export function dataProcess<T extends string>(data: Record<T, number[]>) {
  const idxs = {} as Record<T, number>;
  const maxs: number[] = [];
  const cellTypes: T[] = [];

  for (const [i, k] of Object.keys(data).entries()) {
    idxs[k as T] = i;
    cellTypes.push(k as T);
    maxs.push(Math.max(...data[k as T]));
  }
  return { idxs, maxs, cellTypes };
}

export default fetchAll;
