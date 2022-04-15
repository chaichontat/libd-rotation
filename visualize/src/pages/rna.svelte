<script lang="ts">
  import SearchBox from '$src/lib/components/searchBox.svelte';
  import { currRna } from '$src/lib/store';
  import Bar from './bar.svelte';
  import Scatter from './scatter.svelte';
</script>

<section class="flex flex-grow flex-col gap-y-2">
  <div class="flex w-[50vw] max-w-[600px] flex-col">
    <SearchBox />
    <div class="mr-2 translate-y-2 self-end text-lg font-medium">
      Showing <i>{$currRna.name}</i>.
    </div>
    <Scatter />
    <Bar />
  </div>
</section>
