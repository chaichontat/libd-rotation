<script lang="ts">
  import Chart, { type ActiveElement, type ChartEvent } from 'chart.js/auto/auto.js';

  import { store } from '../store';

  import type Data from '../fetcher';
  import Scatter from './scatter.svelte';
  import Bar from './bar.svelte';

  export let dataPromise: ReturnType<typeof Data>;
</script>

<section class="flex flex-grow flex-col gap-y-2">
  <div>
    <p class="text-lg text-slate-100">
      Now showing: <span class="text-white">{$store.showingType}</span>
    </p>
  </div>

  <div class="mt-2 flex w-[50vw] max-w-[600px] flex-col">
    {#await dataPromise then d}
      <Scatter {d} />
      <Bar {d} />
    {/await}
  </div>
</section>
