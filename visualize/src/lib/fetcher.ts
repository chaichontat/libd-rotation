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

import { tableFromIPC } from 'apache-arrow';

export async function fetchAll(sample: string) {
  const [table, coordsTable] = await Promise.all(
    [`/${sample}/data.arrow`, `/${sample}/coords.arrow`].map(async (url) =>
      fetch(url).then((r) => tableFromIPC(r))
    )
  );

  const data = {} as Record<string, Float32Array>;
  for (const name of table.schema.names) {
    data[name as string] = table.getChild(name)!.toArray() as Float32Array;
  }

  const coords = coordsTable.toArray().map((row) => row!.toJSON()) as { x: number; y: number }[];
  const byRow = table.toArray().map((row) => row!.toJSON());

  return { data, coords, byRow };
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
