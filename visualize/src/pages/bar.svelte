<script lang="ts">
  import Chart from 'chart.js/auto/auto.js';
  import { onMount } from 'svelte';
  import type DataPromise from '../lib/fetcher';
  import { store } from '../lib/store';

  export let d: Awaited<ReturnType<typeof DataPromise>>;
  const { byRow } = d;

  let bar: Chart<'bar', Record<string, number>, string>;
  onMount(() => {
    const ctx = (document.getElementById('bar') as HTMLCanvasElement).getContext('2d')!;
    bar = new Chart(ctx, {
      type: 'bar',
      data: {
        datasets: [
          {
            data: byRow[0],
            backgroundColor: 'white',
            normalized: true
          }
        ]
      },
      options: {
        scales: {
          x: {
            grid: { borderColor: 'white' },
            ticks: { color: 'white' },
            position: 'top'
          },
          y: {
            min: 0,
            max: 10,
            grid: { borderColor: 'white' },
            ticks: { color: 'white' },
            reverse: true
          }
        },
        animation: { duration: 200 },
        plugins: {
          tooltip: { enabled: false },
          legend: { display: false }
        }
      }
    });
  });

  $: {
    if (bar) {
      if ($store.lockedIdx.idx !== -1) {
        // Locked
        bar.data.datasets[0].data = byRow[$store.lockedIdx.idx];
      } else {
        bar.data.datasets[0].data = byRow[$store.currIdx.idx];
      }
      bar.update();
    }
  }
</script>

<div class="relative w-full"><canvas id="bar" /></div>
