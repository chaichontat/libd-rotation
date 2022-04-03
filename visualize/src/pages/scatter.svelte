<script lang="ts">
  import Chart, { type ActiveElement, type ChartEvent } from 'chart.js/auto/auto.js';
  import { store } from '../store';
  import { onMount } from 'svelte';
  import colormap from 'colormap';
  import { genLRU } from '../utils';
  import type DataPromise from '../fetcher';
  import { process } from '../fetcher';
  import ButtonGroup from '$src/components/buttonGroup.svelte';

  export let d: Awaited<ReturnType<typeof DataPromise>>;
  const { data, coords } = d;
  const { idxs, maxs, cellTypes } = process(data);
  const colors = colormap({ colormap: 'viridis', nshades: 255, format: 'hex' });

  let showingType = cellTypes[0];
  let myChart: Chart<'scatter', { x: number; y: number }[], string>;

  const getColor = genLRU((name: string): string[] =>
    data[name].map((v) => colors[Math.round((v / maxs[idxs[name]]) * 255)])
  );

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

          $store.currCoords = coords[activeElements[0].index];
          console.log($store.currCoords);
        },
        onClick: (evt: ChartEvent, activeElements: ActiveElement[], chart: Chart) => {
          if (activeElements.length === 0) return;
          const index = activeElements[0].index;
          activeElements[0].element.options.radius = 100;
          myChart.update();

          if (index === $store.lockedIdx) {
            $store.lockedIdx = -1;
            return;
          }

          $store.lockedCoords = coords[index];
          $store.lockedIdx = index;
        }
      }
    });
  });

  $: changeColor(myChart, showingType);
</script>

<ButtonGroup names={cellTypes} color="slate" bind:curr={showingType} />
<div class="relative"><canvas id="myChart" /></div>
