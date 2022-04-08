// Globs do not accept variable. Pass in real string.

type AllTypes = number[] | { x: string; y: string }[] | { [key: string]: number }[];
type AllData<T extends string> = {
  [key in T]: AllTypes;
} & {
  coords: { x: number; y: number }[];
  by_row: Record<T, number>[];
};

const jsons: Record<string, { default: AllTypes }> = import.meta.globEager(
  `../../static/Br6522_Ant_IF/*.json`
);

// Type not exactly correct. See `process`.
// Need rest index signature
// https://github.com/microsoft/TypeScript/issues/17867
// https://github.com/microsoft/TypeScript/issues/7765
const objs = Object.keys(jsons).reduce((acc, k) => {
  const name = k.split('/').pop()!.split('.')[0];
  return { ...acc, [name]: jsons[k].default };
}, {} as AllData<string>);

export function preprocess(data: AllData<string>) {
  const coords = data['coords'] as unknown as { x: number; y: number }[];
  const byRow = data['by_row'] as unknown as Record<string, number>[];
  const removed: Omit<AllData<string>, 'coords' | 'by_row'> = { ...data };
  delete removed['coords'];
  delete removed['by_row'];
  return { data: data as Record<string, number[]>, coords, byRow };
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
