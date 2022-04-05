<script>
  import Mapp from '../pages/mapp.svelte';
  import Rna from '../pages/rna.svelte';
  const sample = 'Br6522_Ant_IF';

  const proteinMap = {
    DAPI: 2,
    TMEM119: 6,
    Olig2: 5,
    GFAP: 3,
    NeuN: 4,
    Lipofuschin: 1,
    None: 7
  };
</script>

<svelte:head><title>Visium IF</title></svelte:head>

<h1 class="order-1 mb-2 text-3xl font-bold text-white sm:text-5xl sm:leading-none">
  Visium <span class="fancy">IF</span>
</h1>
<h3 class="mb-6 text-lg text-slate-100">Sample: {sample}</h3>

<main class="flex flex-wrap gap-x-6 md:flex-nowrap">
  <Mapp {sample} {proteinMap} />
  <Rna />
</main>

<style lang="postcss">
  .fancy {
    @apply bg-gradient-to-tl from-purple-500 via-purple-600 to-yellow-600  bg-clip-text font-extrabold text-transparent;
  }
</style>
