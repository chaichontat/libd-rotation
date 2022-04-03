<script lang="ts">
  import Chart from 'chart.js/auto/auto.js';
  import { store } from '../store';
  import { onMount } from 'svelte';
  import type DataPromise from '../fetcher';

  export let d: Awaited<ReturnType<typeof DataPromise>>;
  const { byRow } = d;

  let bar: Chart<'bar', number[], string>;
  onMount(() => {
    const ctx2 = (document.getElementById('bar') as HTMLCanvasElement).getContext('2d');
    bar = new Chart(ctx2, {
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
            color: 'white',
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
      if ($store.lockedIdx !== -1) {
        // Locked
        bar.data.datasets[0].data = byRow[$store.lockedIdx];
      } else {
        bar.data.datasets[0].data = byRow[$store.currIdx];
      }
      bar.update();
    }
  }
</script>

<div class="relative w-full"><canvas id="bar" /></div>
