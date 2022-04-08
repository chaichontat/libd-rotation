import * as fs from 'fs/promises';
import fetch from 'node-fetch';
import * as path from 'path';

const dir = 'static';
const sample = 'Br6522_Ant_IF';

const s3_url = 'https://chaichontat-host.s3.amazonaws.com/libd-rotation';

const to_fetch = [
  'Astro',
  'Endo',
  'Excit',
  'Inhib',
  'Macrophage',
  'Micro',
  'Mural',
  'Neu',
  'OPC',
  'Oligo',
  'Tcell',
  'by_row',
  'coords',
  'OLIG2',
  'Oligo',
  'RBFOX3',
  'TMEM119'
];

async function getFiles(p: string, urls: string[]): Promise<Promise<void>[]> {
  await fs.mkdir(p, { recursive: true });
  return urls.map(async (url) => {
    const pa = path.join(p, url.split('/').pop()!);
    try {
      await fs.access(pa);
    } catch (e) {
      await fetch(url)
        .then((r) => r.arrayBuffer())
        .then((r) => fs.writeFile(pa, Buffer.from(r)));
    }
  });
}

async function run() {
  const jsons = await getFiles(
    path.join(dir, sample),
    to_fetch.map((name) => `${s3_url}/${sample}/${name}.json`)
  );
  const fonts = await getFiles(path.join(dir, 'fonts'), [
    'https://rsms.me/inter/font-files/Inter-italic.var.woff2',
    'https://rsms.me/inter/font-files/Inter-roman.var.woff2'
  ]);
  await Promise.all([...jsons, ...fonts]);
}

await run();
