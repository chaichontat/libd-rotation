<script lang="ts">
  import type Data from '../lib/fetcher';
  import Bar from './bar.svelte';
  import Scatter from './scatter.svelte';

  export let dataPromise: ReturnType<typeof Data>;
</script>

<section class="flex flex-grow flex-col gap-y-2">
  <div class="mt-2 flex w-[50vw] max-w-[600px] flex-col">
    {#await dataPromise then d}
      <Scatter {d} />
      <Bar {d} />
    {/await}
  </div>
</section>
