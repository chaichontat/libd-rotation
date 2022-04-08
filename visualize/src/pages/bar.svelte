<script lang="ts">
  import Chart from 'chart.js/auto/auto.js';
  import { onMount } from 'svelte';
  import Data from '../lib/fetcher';
  import { multipleSelect, store } from '../lib/store';

  const { byRow, data } = Data;
  Chart.defaults.font.size = 14;

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
    if (bar && $multipleSelect.length === 0) {
      if ($store.lockedIdx.idx !== -1) {
        // Locked
        bar.data.datasets[0].data = byRow[$store.lockedIdx.idx];
      } else {
        bar.data.datasets[0].data = byRow[$store.currIdx.idx];
      }
      bar.options.scales!.y!.max = 10;
      bar.update();
    }
  }

  $: if (bar && $multipleSelect.length > 0) {
    const summed = Object.keys(data).reduce((acc, key) => {
      return { ...acc, [key]: $multipleSelect.map((v) => data[key][v]).reduce((a, b) => a + b, 0) };
    }, {} as typeof byRow[0]);
    bar.data.datasets[0].data = summed;
    bar.options.scales!.y!.max = undefined;
    bar.update();
  }
</script>

<div class="relative w-full"><canvas id="bar" /></div>
