<script>
  import Mapp from '../pages/mapp.svelte';
  import Scatter from '../pages/scatter.svelte';
  import fetcher from '../fetcher';

  const sample = 'Br6522_Ant_IF';
  const dataPromise = fetcher(sample);
</script>

<h1 class="order-1 mb-2 text-3xl font-bold text-white sm:text-5xl sm:leading-none">
  Visium <span class="fancy">IF</span>
</h1>
<h3 class="mb-6 text-lg text-slate-100">Sample: {sample}</h3>

<main class="grid grid-cols-1 gap-x-2 md:grid-cols-2">
  {#await dataPromise then data}
    <Scatter {data} />
  {/await}
  <Mapp {sample} />
</main>

<style lang="postcss">
  .fancy {
    @apply bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500  bg-clip-text text-transparent;
  }
</style>
