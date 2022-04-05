// Globs do not accept variable. Pass in real string.
const jsons = import.meta.globEager(`../../static/Br6522_Ant_IF/*.json`);

// Type not exactly correct. See `process`.
const objs = Object.keys(jsons).reduce((acc, k) => {
  const name = k.split('/').pop()!.split('.')[0];
  return { ...acc, [name]: jsons[k].default as number[] };
}, {} as Record<string, number[]>);

export function preprocess(data: Record<string, number[]>) {
  const coords = data['coords'] as unknown as { x: number; y: number }[];
  const byRow = data['by_row'] as unknown as Record<string, number>[];
  delete data['coords'];
  delete data['by_row'];
  return { data, coords, byRow };
}

// export function fetchAll() {
//   // Type not exactly correct. See `process`.
//   // const raw = await Promise.all(
//   //   to_fetch.map(
//   //     (name) => fetch(`${s3_url}/${sample}/${name}.json`).then((r) => r.json()) as Promise<number[]>
//   //   )
//   // );
//   return;
//   // return preprocess(
//   //   raw.reduce((acc, v, i) => ({ ...acc, [to_fetch[i]]: v }), {} as Record<string, number[]>)
//   // );
// }

export function dataProcess(data: Record<string, number[]>) {
  const idxs: Record<string, number> = {};
  const maxs: number[] = [];
  const cellTypes: string[] = [];

  for (const [i, k] of Object.keys(data).entries()) {
    idxs[k] = i;
    cellTypes.push(k);
    maxs.push(Math.max(...data[k]));
  }
  return { idxs, maxs, cellTypes };
}

export default preprocess(objs);
