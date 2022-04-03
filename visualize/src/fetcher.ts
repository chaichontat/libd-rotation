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

export default async (sample: string) => {
  const raw = await Promise.all(
    to_fetch.map(
      (name): Promise<number[]> => fetch(`${s3_url}/${sample}/${name}.json`).then((r) => r.json())
    )
  );
  return raw.reduce((acc, v, i) => ({ ...acc, [to_fetch[i]]: v }), {} as Record<string, number[]>);
};
