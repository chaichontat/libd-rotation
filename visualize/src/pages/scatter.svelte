<script lang="ts">
  import ButtonGroup from '$src/lib/components/buttonGroup.svelte';
  import Colorbar from '$src/lib/components/colorbar.svelte';
  import Chart, { type ChartEvent } from 'chart.js/auto';
  import colormap from 'colormap';
  import { onMount } from 'svelte';
  import Data, { dataProcess } from '../lib/fetcher';
  import { currRna, store } from '../lib/store';
  import { genLRU } from '../lib/utils';

  let curr = 0;

  const { data, coords } = Data;
  const { idxs, maxs, cellTypes } = dataProcess(data);
  const colors = colormap({ colormap: 'viridis', nshades: 255, format: 'hex' });

  $currRna = cellTypes[0];
  let myChart: Chart<'scatter', { x: number; y: number }[], string>;

  const min = coords
    .reduce((acc, { x, y }) => [Math.min(acc[0], x), Math.min(acc[1], y)], [Infinity, Infinity])
    .map((x) => x - 100);
  const max = coords
    .reduce((acc, { x, y }) => [Math.max(acc[0], x), Math.max(acc[1], y)], [0, 0])
    .map((x) => x + 100);

  const getColor = genLRU((name: string): string[] =>
    data[name].map((v) => colors[Math.round((v / 8) * 255)])
  );

  function changeColor(chart: Chart, name: string): void {
    if (!chart) return;
    chart.data.datasets[0].backgroundColor = getColor(name);
    chart.update();
  }

  //   console.log(min);
  let anotherChart: Chart<'scatter', { x: number; y: number }[], string>;
  onMount(() => {
    anotherChart = new Chart(
      (document.getElementById('another') as HTMLCanvasElement).getContext('2d')!,
      {
        type: 'scatter',
        data: {
          datasets: [
            {
              data: coords.slice(0, 1),
              backgroundColor: getColor($currRna)[0],
              normalized: true,
              pointRadius: 25,
              pointHoverRadius: 25,
              borderColor: '#eeeeeedd'
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
            y: {
              min: min[1],
              max: max[1],
              grid: { display: false },
              ticks: { display: false },
              reverse: true
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          },
          onHover: (evt: ChartEvent) => {
            if (!myChart || !evt.native || $store.lockedIdx.idx !== -1) return;
            const points = myChart.getElementsAtEventForMode(
              evt.native,
              'nearest',
              { intersect: true },
              true
            );
            if (points.length === 0 || points[0].index === curr) return;
            curr = points[0].index;
            if ($store.lockedIdx.idx === -1) {
              $store.currIdx = { idx: points[0].index, source: 'scatter' };
            }
          },

          onClick: (evt: ChartEvent) => {
            if (!myChart) return;
            if (evt.native) {
              const points = myChart.getElementsAtEventForMode(
                evt.native,
                'nearest',
                { intersect: true },
                true
              );
              if (points.length === 0) return;
              // $store.currIdx = { idx: points[0].index, source: 'scatter' };
              curr = points[0].index;
            }
            $store.lockedIdx.idx = $store.lockedIdx.idx === curr ? -1 : curr;
            $store.currIdx = { idx: curr, source: 'scatter' };
            console.log($store.lockedIdx);
          }
        }
      }
    );

    myChart = new Chart(
      (document.getElementById('myChart') as HTMLCanvasElement).getContext('2d')!,
      {
        data: {
          datasets: [
            //   {
            //     type: 'scatter',
            //     data: [{ x: 10000, y: 10000 }],
            //     // @ts-ignore
            //     backgroundColor: 'white',
            //     normalized: true,
            //     pointRadius: 25,
            //     borderColor: '#eeeeee'
            //   },
            {
              type: 'scatter',
              data: coords,
              // @ts-ignore
              backgroundColor: getColor($currRna),
              normalized: true,
              pointRadius: 2.5,
              pointHoverRadius: 20,
              pointHoverBorderWidth: 1,
              pointHoverBorderColor: '#eeeeee',
              pointHitRadius: 3
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
            y: {
              min: min[1],
              max: max[1],
              grid: { display: false },
              ticks: { display: false },
              reverse: true
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          }
        }
      }
    );
  });

  //   $: if (myChart) console.log(myChart.data.datasets);

  // Change color for different markers.
  $: changeColor(myChart, $currRna);

  $: if (anotherChart) {
    const idx = $store.lockedIdx.idx === -1 ? $store.currIdx.idx : $store.lockedIdx.idx;
    anotherChart.data.datasets[0].data = [coords[idx]];
    anotherChart.data.datasets[0].backgroundColor = getColor($currRna)[idx] + 'cc';
    anotherChart.update();
  }
</script>

<ButtonGroup names={cellTypes} color="slate" bind:curr={$currRna} />
<div class="relative">
  <Colorbar min={0} max={10} />
  <canvas class="absolute" id="another" />
  <canvas class="" id="myChart" />
  <!-- <div
    class="absolute left-10 top-10 z-10 rounded-lg bg-white/10 px-3 py-1 text-lg font-medium text-white opacity-90 backdrop-blur-sm"
  >
    {$currRna}
  </div> -->
</div>
