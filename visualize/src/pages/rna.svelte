<script lang="ts">
  import { browser } from '$app/env';
  import { genRetrieve } from '$src/lib/fetcher';
  import { currRna } from '$src/lib/store';
  import { clickOutside, debounce, tooltip } from '$src/lib/utils';
  import { Fzf } from 'fzf';
  import { fade } from 'svelte/transition';
  import type getData from '../lib/fetcher';
  import Bar from './bar.svelte';
  import Scatter from './scatter.svelte';
  export let dataPromise: ReturnType<typeof getData>;

  let names: { [key: string]: number };
  let keys: string[] = [];
  let fzf: Fzf<readonly string[]>;
  let ptr: number[];
  let coords: { x: number; y: number }[];
  let retrieve: (selected: string) => Promise<number[]>;

  let showSearch = true;
  let currShow = '';

  const getHeader = async () => {
    [names, ptr] = await Promise.all([
      fetch('/Br6522_Ant_IF/names.json').then(
        (x) => x.json() as Promise<{ [key: string]: number }>
      ),
      fetch('/Br6522_Ant_IF/ptr.json').then((res) => res.json() as Promise<number[]>)
    ]);
    keys = Object.keys(names);
    fzf = new Fzf(keys, { limit: 8 });
  };

  async function hydrate() {
    const dp = (async () => {
      ({ coords } = await dataPromise);
    })().catch(console.error);
    const he = getHeader().catch(console.error);
    await Promise.all([dp, he]);
    retrieve = genRetrieve(ptr, names, coords.length);
    currShow = 'GFAP';
    setVal('GFAP');
  }

  if (browser) {
    hydrate().catch(console.error);
  }

  let search = '';
  let chosen: { raw: string; embellished: string }[] = [{ raw: '', embellished: '' }];

  function highlightChars(str: string, indices: Set<number>): string {
    const chars = str.split('');
    return chars.map((c, i) => (indices.has(i) ? `<b>${c}</b>` : c)).join('');
  }

  $: if (fzf) {
    showSearch = true;
    const res = fzf.find(search);
    chosen = res.map((x) => ({ raw: x.item, embellished: highlightChars(x.item, x.positions) }));
  }

  // async function retrieve(selected: string): Promise<number[]> {
  //   if (ptr[names[selected]] === ptr[names[selected] + 1]) {
  //     return zero;
  //   }
  //   console.log(`bytes=${ptr[names[selected]]}-${ptr[names[selected] + 1] - 1}`);
  //   return await fetch(
  //     'https://chaichontat-host.s3.amazonaws.com/libd-rotation/Br6522_Ant_IF/Counts_Br6522_Ant_IF.dump',
  //     { headers: { Range: `bytes=${ptr[names[selected]]}-${ptr[names[selected] + 1] - 1}` } }
  //   )
  //     .then((res) => res.blob())
  //     .then((blob) => decompressBlob(blob))
  //     .then((arr) => JSON.parse(arr) as Sparse)
  //     .then((sparse) => genDense(sparse, coords.length));
  // }

  const setVal = debounce(async (selected: string) => {
    if (!retrieve) return;
    if ($currRna.name !== selected) {
      $currRna = { name: selected, values: await retrieve(selected) };
    }
  }, 10);
</script>

<section class="flex flex-grow flex-col gap-y-2">
  <div class="flex w-[50vw] max-w-[600px] flex-col">
    <input
      type="text"
      class="mb-2 w-full rounded border border-gray-600 bg-gray-800 py-2 px-4 "
      bind:value={search}
      on:click={() => (showSearch = true)}
      placeholder="Search genes..."
    />

    {#if search && showSearch}
      <!-- content here -->
      <div
        out:fade={{ duration: 100 }}
        class="fixed z-20 flex min-w-[200px] translate-y-12 flex-col rounded bg-gray-800/80 px-2 pt-1 pb-2  text-slate-100 backdrop-blur"
        use:clickOutside
        on:outclick={() => (showSearch = false)}
        on:mouseout={() => setVal(currShow)}
        on:blur={() => setVal(currShow)}
      >
        {#each chosen as { raw, embellished }}
          <div
            class="cursor-pointer rounded py-1.5 px-3 hover:bg-gray-700/80"
            on:mousemove={() => setVal(raw)}
            on:click={() => {
              showSearch = false;
              currShow = raw;
            }}
          >
            {@html embellished}
          </div>
        {/each}
        {#if chosen.length === 0}
          <i class="py-1 px-3 text-slate-300">No genes found.</i>
        {/if}
      </div>
    {/if}

    <div class="mr-2 translate-y-2 self-end text-lg font-medium">
      Showing <i>{$currRna.name}</i>.
    </div>
    <Scatter {dataPromise} />
    <Bar {dataPromise} />
  </div>
</section>
