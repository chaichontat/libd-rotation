import { dev } from '$app/env';

const s3_url = dev ? '/static/data' : 'https://chaichontat-host.s3.amazonaws.com/libd-rotation';

const to_fetch = [
  'Astro',
  'Endo',
  'Excit',
  'Inhib',
  'MSN.D1',
  'MSN.D2',
  'Macrophage',
  'Micro',
  'Mural',
  'Neu',
  'OPC',
  'Oligo',
  'Tcell',
  'by_row',
  'coords'
];

export function preprocess(data: Record<string, number[]>) {
  const coords = data['coords'] as unknown as { x: number; y: number }[];
  const byRow = data['by_row'] as unknown as Record<string, number>[];
  delete data['coords'];
  delete data['by_row'];
  return { data, coords, byRow };
}

export async function fetchAll(sample: string) {
  const raw = await Promise.all(
    to_fetch.map(
      (name): Promise<number[]> => fetch(`${s3_url}/${sample}/${name}.json`).then((r) => r.json())
    )
  );
  return preprocess(
    raw.reduce((acc, v, i) => ({ ...acc, [to_fetch[i]]: v }), {} as Record<string, number[]>)
  );
}

export function process(data: Record<string, number[]>) {
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

export default fetchAll;
