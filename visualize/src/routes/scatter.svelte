<script lang="ts">
  import Chart from 'chart.js/auto/auto.js';
  import type { PointElement } from 'chart.js/auto';
  import colormap from 'colormap';

  import { store } from '../store';
  import LRU from 'lru-cache';
  import ButtonGroup from '$src/components/buttonGroup.svelte';
  import { onMount } from 'svelte';

  export let data: Record<string, number[]>;

  const coords = data['coords'] as unknown as { x: number; y: number }[];
  console.log(coords);

  const by_row = data['by_row'] as unknown as Record<string, number>[];
  delete data['coords'];
  delete data['by_row'];

  const idxs: Record<string, number> = {};
  const maxs: number[] = [];
  const cellTypes: string[] = [];

  for (const [i, k] of Object.keys(data).entries()) {
    idxs[k] = i;
    cellTypes.push(k);
    maxs.push(Math.max(...data[k]));
  }

  let myChart: Chart<'scatter', number[], string>;
  let bar: Chart<'bar', number[], string>;

  const colors = colormap({ colormap: 'viridis', nshades: 255, format: 'hex' });
  function genColor(name: string): string[] {
    return data[name].map((v) => colors[Math.round((v / maxs[idxs[name]]) * 255)]);
  }

  function genLRU<T extends unknown[], R>(f: (...args: T) => R) {
    const cache = new LRU({ max: 100 });
    return (...args: T): R => {
      if (cache.has(args)) {
        return cache.get(args);
      } else {
        const r = f(...args);
        cache.set(args, r);
        return r;
      }
    };
  }

  const getColor = genLRU(genColor);

  function changeColor(chart: Chart, name: string): void {
    if (!chart) return;
    chart.data.datasets[0].backgroundColor = getColor(name);
    chart.update();
  }

  onMount(() => {
    const ctx = document.getElementById('myChart').getContext('2d');
    $store.showingType = cellTypes[0];
    myChart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            data: coords,
            backgroundColor: getColor($store.showingType),
            normalized: true
          }
        ]
      },
      options: {
        animation: false,
        aspectRatio: 1,
        scales: {
          x: { ticks: { display: false } },
          y: { ticks: { display: false }, reverse: true }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            events: ['mousemove', 'mouseout', 'touchstart', 'touchmove'],
            callbacks: {
              label: (tooltipItem) => {
                $store.currIdx = tooltipItem.dataIndex;
                return tooltipItem.dataIndex;
              }
            }
          }
        }
      }
    });

    const ctx2 = document.getElementById('bar').getContext('2d');
    bar = new Chart(ctx2, {
      type: 'bar',
      data: {
        datasets: [
          {
            data: by_row[0],
            backgroundColor: 'white',
            normalized: true
          }
        ]
      },
      options: {
        scales: {
          x: { color: 'white', grid: { borderColor: 'white' }, ticks: { color: 'white' } },
          y: { min: 0, max: 10, grid: { borderColor: 'white' }, ticks: { color: 'white' } }
        },
        animation: { duration: 200 },
        plugins: {
          tooltip: { enabled: false },
          legend: { display: false }
        }
      }
    });
  });

  function handleClick(evt: MouseEvent) {
    const { index }: { element: PointElement; datasetIndex: number; index: number } =
      myChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true)[0];
    if (index === $store.locked) {
      $store.locked = -1;
      return;
    }
    $store.lockedCoords = coords[index];
    $store.locked = index;
  }

  $: changeColor(myChart, $store.showingType);

  $: {
    $store.currCoords = coords[$store.currIdx];
    if (bar) {
      if ($store.locked !== -1) {
        // Locked
        bar.data.datasets[0].data = by_row[$store.locked];
      } else {
        bar.data.datasets[0].data = by_row[$store.currIdx];
      }
      bar.update();
    }
  }
</script>

<section class="flex flex-col gap-y-2">
  <div>
    <p class="text-lg text-slate-100">
      Now showing: <span class="text-white">{$store.showingType}</span>
    </p>
  </div>

  <ButtonGroup names={cellTypes} color="slate" bind:curr={$store.showingType} />

  <div class="mt-2 flex w-[50vw] max-w-[600px] flex-col">
    <div class="relative"><canvas id="myChart" on:click={handleClick} /></div>
    <div class="relative"><canvas id="bar" /></div>
  </div>
</section>
