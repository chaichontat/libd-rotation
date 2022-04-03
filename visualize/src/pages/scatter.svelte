<script lang="ts">
  import Chart, { type ActiveElement, type ChartEvent } from 'chart.js/auto/auto.js';
  import colormap from 'colormap';

  import { store } from '../store';
  import LRU from 'lru-cache';
  import ButtonGroup from '$src/components/buttonGroup.svelte';
  import { onMount } from 'svelte';

  export let data: Record<string, number[]>;

  const coords = data['coords'] as unknown as { x: number; y: number }[];
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

  let myChart: Chart<'scatter', { x: number; y: number }[], string>;
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
    const ctx = (document.getElementById('myChart') as HTMLCanvasElement).getContext('2d')!;
    $store.showingType = cellTypes[0];
    myChart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            data: coords,
            // @ts-ignore
            backgroundColor: getColor($store.showingType),
            normalized: true,
            pointRadius: 2.5,
            pointHoverRadius: 15,
            pointHoverBorderWidth: 1,
            pointHoverBorderColor: '#eeeeee'
          }
        ]
      },
      options: {
        animation: false,
        aspectRatio: 1,
        scales: {
          x: { ticks: { display: false } },
          y: { ticks: { display: false } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false
            // events: ['mousemove', 'mouseout', 'touchstart', 'touchmove']
            // callbacks: {
            //   label: (tooltipItem: TooltipItem<'scatter'>) => {
            //     $store.currIdx = tooltipItem.dataIndex;
            //     return tooltipItem.dataIndex.toString();
            //   }
            // }
          }
        },
        onHover: (evt: ChartEvent, activeElements: ActiveElement[], chart: Chart) => {
          if (activeElements.length === 0) return;
          $store.currIdx = activeElements[0].index;
        },
        onClick: (evt: ChartEvent, activeElements: ActiveElement[], chart: Chart) => {
          if (activeElements.length === 0) return;
          const index = activeElements[0].index;
          activeElements[0].element.options.radius = 100;
          myChart.update();

          if (index === $store.locked) {
            $store.locked = -1;
            return;
          }

          $store.lockedCoords = coords[index];
          $store.locked = index;
        }
      }
    });

    const ctx2 = (document.getElementById('bar') as HTMLCanvasElement).getContext('2d');
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

  // function handleClick(evt: MouseEvent) {
  //   const { element, index }: { element: PointElement; datasetIndex: number; index: number } =
  //     myChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true)[0];

  //   // Unzoom
  //   if (index === $store.locked) {
  //     $store.locked = -1;
  //     return;
  //   }

  //   $store.lockedCoords = coords[index];
  //   $store.locked = index;
  // }

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
    <div class="relative"><canvas id="myChart" /></div>
    <div class="relative"><canvas id="bar" /></div>
  </div>
</section>
