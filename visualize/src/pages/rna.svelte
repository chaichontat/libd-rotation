<script lang="ts">
  import Bar from './bar.svelte';
  import Scatter from './scatter.svelte';
</script>

<section class="flex flex-grow flex-col gap-y-2">
  <div class="mt-2 flex w-[50vw] max-w-[600px] flex-col">
    <Scatter />
    <Bar />
  </div>
</section>
