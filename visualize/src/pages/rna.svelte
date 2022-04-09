<script lang="ts">
  import type getData from '../lib/fetcher';
  import Bar from './bar.svelte';
  import Scatter from './scatter.svelte';

  export let dataPromise: ReturnType<typeof getData>;
</script>

<section class="flex flex-grow flex-col gap-y-2">
  <div class="mt-2 flex w-[50vw] max-w-[600px] flex-col">
    <Scatter {dataPromise} />
    <Bar {dataPromise} />
  </div>
</section>
