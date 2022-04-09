<script lang="ts">
  import { browser } from '$app/env';
  import getData from '../lib/fetcher';
  import Mapp from '../pages/mapp.svelte';
  import Rna from '../pages/rna.svelte';

  const sample = 'Br6522_Ant_IF';
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
    'OLIG2',
    'Oligo',
    'RBFOX3',
    'TMEM119'
  ] as const;

  const proteinMap = {
    DAPI: 2,
    TMEM119: 6,
    Olig2: 5,
    GFAP: 3,
    NeuN: 4,
    Lipofuschin: 1,
    None: 7
  };

  let dataPromise: ReturnType<typeof getData>;
  if (browser) dataPromise = getData(sample, to_fetch);
</script>

<svelte:head><title>Visium IF</title></svelte:head>

<div class="flex justify-between">
  <div>
    <h1 class="order-1 mb-2 text-3xl font-bold text-white sm:text-5xl sm:leading-none">
      Visium <span class="fancy">IF</span>
    </h1>
    <h3 class="mb-6 text-lg text-slate-100">Sample: {sample}</h3>
  </div>
  <div class="mr-6 text-right leading-6 text-slate-200">
    Hover at any spots to see cell type inference/transcriptomic data.<br />Click to lock spot.
    Click on the same spot to unlock.
  </div>
</div>

<main class="flex flex-wrap gap-x-6 md:flex-nowrap">
  <Mapp {sample} {proteinMap} {dataPromise} />
  <Rna {dataPromise} />
</main>

<style lang="postcss">
  .fancy {
    @apply bg-gradient-to-tl from-purple-500 via-purple-600 to-yellow-600  bg-clip-text font-extrabold text-transparent;
  }
</style>
