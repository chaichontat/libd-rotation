<script lang="ts">
  import ButtonGroup from '$src/lib/components/buttonGroup.svelte';
  import Chart, { type ActiveElement, type ChartEvent } from 'chart.js/auto/auto.js';
  import colormap from 'colormap';
  import { onMount } from 'svelte';
  import type DataPromise from '../lib/fetcher';
  import { process } from '../lib/fetcher';
  import { store } from '../lib/store';
  import { genLRU } from '../lib/utils';

  let curr = 0;
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

  let fakeEvent = false;
  function fakeHover(idx: number) {
    if (!myChart) return;
    console.log('hi');
    const canvas = myChart.canvas;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = myChart.getDatasetMeta(0).data[idx].getCenterPoint();

    // myChart.setActiveElements([{ index: idx, datasetIndex: 0 }]);
    // myChart.update();

    const event = new MouseEvent('mousemove', {
      clientX: rect.left + x, //376,
      clientY: rect.top + y //409
    });

    console.log(event);

    canvas.dispatchEvent(event);
    fakeEvent = true;
  }

  //   console.log(min);
  let anotherChart: Chart<'scatter', { x: number; y: number }[], string>;
  onMount(() => {
    const ctx = (document.getElementById('myChart') as HTMLCanvasElement).getContext('2d')!;

    anotherChart = new Chart(
      (document.getElementById('another') as HTMLCanvasElement).getContext('2d')!,
      {
        data: {
          datasets: [
            {
              type: 'scatter',
              data: coords.slice(0, 1),
              //   backgroundColor: getColor(showingType)[0],
              normalized: true,
              pointRadius: 25,
              borderColor: '#eeeeee'
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
            tooltip: { enabled: false }
          }
        }
      }
    );

    myChart = new Chart(ctx, {
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
            backgroundColor: getColor(showingType),
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
          y: { min: min[1], max: max[1], grid: { display: false }, ticks: { display: false } }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        onHover: (evt: ChartEvent, activeElements: ActiveElement[]) => {
          if (activeElements.length === 0 || activeElements[0]?.index === 0) return;
          const idx = activeElements[0].index;
          if (fakeEvent) fakeEvent = false;
          if (curr === idx) return;
          //   console.log($store.currIdx);
          $store.currIdx = { idx, source: 'scatter' };
          curr = idx;
        },
        onClick: (evt: ChartEvent, activeElements: ActiveElement[]) => {
          if (activeElements.length === 0 || activeElements[0]?.index === 0) return;
          const index = activeElements[0].index;
          if (index === $store.lockedIdx.idx) {
            $store.lockedIdx.idx = -1;
            return;
          }
        }
      }
    });
  });

  //   $: if (myChart) console.log(myChart.data.datasets);

  // Change color for different markers.
  $: changeColor(myChart, showingType);

  $: if ($store.currIdx.source !== 'scatter') {
    anotherChart.data.datasets[0].data = [coords[$store.currIdx.idx]];
    anotherChart.data.datasets[0].backgroundColor = getColor(showingType)[$store.currIdx.idx];
    anotherChart.update();
    //   fakeHover($store.currIdx.idx);
  }
</script>

<ButtonGroup names={cellTypes} color="slate" bind:curr={showingType} />
<div class="relative">
  <canvas class="absolute" id="another" />
  <canvas class="" id="myChart" />
</div>
