<script lang="ts">
  import Chart from 'chart.js/auto/auto.js';
  import type { ActiveElement, ChartEvent } from 'chart.js/auto/auto.js';
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

  const min = coords.reduce(
    (acc, { x, y }) => [Math.min(acc[0], x), Math.min(acc[1], y)],
    [Infinity, Infinity]
  );
  const max = coords.reduce((acc, { x, y }) => [Math.max(acc[0], x), Math.max(acc[1], y)], [0, 0]);

  const getColor = genLRU((name: string): string[] =>
    data[name].map((v) => colors[Math.round((v / maxs[idxs[name]]) * 255)])
  );

  function changeColor(chart: Chart, name: string): void {
    if (!chart) return;
    chart.data.datasets[0].backgroundColor = getColor(name);
    chart.update();
  }

  console.log(min);

  onMount(() => {
    const ctx = (document.getElementById('myChart') as HTMLCanvasElement).getContext('2d')!;

    myChart = new Chart(ctx, {
      data: {
        datasets: [
          {
            type: 'scatter',
            data: [{ x: 10000, y: 10000 }],
            // @ts-ignore
            backgroundColor: 'white',
            normalized: true,
            pointRadius: 25,
            borderColor: '#eeeeee'
          },
          {
            type: 'scatter',
            data: coords,
            // @ts-ignore
            backgroundColor: getColor(showingType),
            normalized: true,

            pointRadius: 2.5,
            pointHoverRadius: 20,
            pointHoverBorderWidth: 1,
            pointHoverBorderColor: '#eeeeee'
          }
        ]
      },
      options: {
        animation: false,
        // responsive: false,
        aspectRatio: 1,
        scales: {
          x: {
            min: min[0],
            max: max[0],
            grid: { display: false },
            ticks: { display: false }
          },
          y: { min: min[1], max: max[1], grid: { display: false }, ticks: { display: false } }
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
        onHover: (evt: ChartEvent, activeElements: ActiveElement[]) => {
          if (activeElements.length === 0 || activeElements[0]?.index === 0) return;
          //   console.log($store.currIdx);
          $store.currIdx = activeElements[0].index;
        },
        onClick: (evt: ChartEvent, activeElements: ActiveElement[]) => {
          if (activeElements.length === 0 || activeElements[0]?.index === 0) return;
          const index = activeElements[0].index;
          //   activeElements[0].element.options.radius = 100;
          //   myChart.update();

          if (index === $store.lockedIdx) {
            $store.lockedIdx = -1;
            return;
          }

          $store.lockedIdx = index;
        }
      }
    });
  });
  $: if (myChart) console.log(myChart.data.datasets);

  $: changeColor(myChart, showingType);

  //   $: if (myChart && $store.currIdx !== 0) {
  //     // console.log($store.currIdx);

  //     // $store.currIdx;
  //     // myChart.data.datasets[0].data.pop();
  //     myChart.data.datasets[0].data[0] = coords[$store.currIdx];
  //     myChart.update();
  //   }
</script>

<ButtonGroup names={cellTypes} color="slate" bind:curr={showingType} />
<div class="relative"><canvas class="" id="myChart" /></div>
