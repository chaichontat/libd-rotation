<script lang="ts">
  import { browser, dev } from '$app/env';
  import { base } from '$app/paths';
  import { colorVarFactory, getCanvasCircle, getWebGLCircles } from '$src/lib/maplib';
  import { ScaleLine, Zoom } from 'ol/control.js';
  import type { Point } from 'ol/geom';
  import WebGLPointsLayer from 'ol/layer/WebGLPoints.js';
  import TileLayer from 'ol/layer/WebGLTile.js';
  import Map from 'ol/Map.js';
  import 'ol/ol.css';
  import GeoTIFF from 'ol/source/GeoTIFF.js';
  import type VectorSource from 'ol/source/Vector';
  import type { LiteralStyle } from 'ol/src/style/literal';
  import { Stroke, Style } from 'ol/style.js';
  import { onMount } from 'svelte';
  import ButtonGroup from '../lib/components/buttonGroup.svelte';
  import Data from '../lib/fetcher';
  import { currRna, store, params } from '../lib/store';

  export let sample: string;
  export let proteinMap: { [key: string]: number };

  const proteins = Object.keys(proteinMap);

  const getColorParams = colorVarFactory(proteinMap);
  const { coords, byRow } = Data;

  let layer: TileLayer;
  let sourceTiff: GeoTIFF;
  let map: Map;
  let showAllSpots = true;

  let colorOpacity = 0.8;

  let maxIntensity: [number, number, number] = [100, 100, 100]; // Inverted
  let showing = proteins.slice(0, 3) as [string, string, string];

  let curr = 0;
  // let donotmove = false; // Indicates that the move event comes from the map

  if (browser) {
    sourceTiff = new GeoTIFF({
      normalize: false,
      sources: dev
        ? [
            // TODO: Why does GeoTiff.js fill the last band from the penultimate band?
            { url: `${base}/cogs/${sample}_1.tif` },
            { url: `${base}/cogs/${sample}_2.tif` }
          ]
        : [
            {
              url: `https://chaichontat-host.s3.us-west-004.backblazeb2.com/libd-rotation/${sample}_1.tif`
            },
            {
              url: `https://chaichontat-host.s3.us-west-004.backblazeb2.com/libd-rotation/${sample}_2.tif`
            }
          ]
    });
  }

  const spot_px = params.spotDiam / params.mPerPx;

  const genStyle = (rna: string): LiteralStyle => ({
    variables: { opacity: 0.5 },
    symbol: {
      symbolType: 'circle',
      size: [
        'interpolate',
        ['exponential', 2],
        ['zoom'],
        1,
        spot_px / 32,
        2,
        spot_px / 16,
        3,
        spot_px / 8,
        4,
        spot_px / 4,
        5,
        spot_px
      ],
      color: ['interpolate', ['linear'], ['get', rna], 0, '#3e0e51', 4, '#428e8c', 8, '#fce652'],
      opacity: ['var', 'opacity']
    }
  });

  const selectStyle = new Style({ stroke: new Stroke({ color: '#ffffff', width: 1 }) });
  const { circleFeature, circleLayer } = getCanvasCircle(selectStyle);
  let { webGLSource, addData } = getWebGLCircles();
  let webGLLayer: WebGLPointsLayer<VectorSource<Point>>;

  addData(coords, byRow);

  onMount(() => {
    webGLLayer = new WebGLPointsLayer({
      minZoom: 3,
      source: webGLSource,
      style: genStyle($currRna)
    });

    layer = new TileLayer({
      style: {
        variables: getColorParams(showing, maxIntensity),
        color: [
          'array',
          ['*', ['/', ['band', ['var', 'red']], ['var', 'redMax']], ['var', 'redMask']],
          ['*', ['/', ['band', ['var', 'green']], ['var', 'greenMax']], ['var', 'greenMask']],
          ['*', ['/', ['band', ['var', 'blue']], ['var', 'blueMax']], ['var', 'blueMask']],
          1
        ]
      },
      source: sourceTiff
    });

    console.log(sourceTiff);

    map = new Map({
      target: 'map',
      layers: [layer, webGLLayer, circleLayer],
      view: sourceTiff.getView()
    });

    map.removeControl(map.getControls().getArray()[0]);
    map.addControl(new Zoom({ delta: 0.4 }));
    map.addControl(
      new ScaleLine({
        text: true,
        minWidth: 140
      })
    );

    map.on('pointermove', (e) => {
      map.forEachFeatureAtPixel(e.pixel, (f) => {
        const idx = f.getId() as number | undefined;
        if (idx === curr || !idx) return true;
        $store.currIdx = { idx, source: 'map' }; // As if came from outside.
        curr = idx;
        return true;
      });
    });

    map.on('click', (e) => {
      console.log('hi');

      map.forEachFeatureAtPixel(e.pixel, (f) => {
        // console.log(f);

        const idx = f.getId() as number | undefined;
        if (!idx) return true;
        $store.lockedIdx = { idx: idx === $store.lockedIdx.idx ? -1 : idx, source: 'scatter' }; // As if came from outside.
        curr = idx;
        return true;
      });
    });
  });

  // // Highlight circle on hover.
  // $: if ($store.currIdx.idx !== curr) {
  //   circlesSource.getFeatureById(curr)?.setStyle(circlesStyle);
  //   circlesSource.getFeatureById($store.currIdx.idx)?.setStyle(selectStyle);
  //   curr = $store.currIdx.idx;
  // }

  // Update "brightness"
  $: if (layer) layer.updateStyleVariables(getColorParams(showing, maxIntensity));
  $: if (webGLLayer) webGLLayer.updateStyleVariables({ opacity: colorOpacity });

  // Change RNA color (circles)
  $: if (webGLLayer) {
    const previousLayer = webGLLayer;
    webGLLayer = new WebGLPointsLayer({
      // minZoom: 3,
      source: webGLSource,
      style: genStyle($currRna)
    });

    map.addLayer(webGLLayer);
    map.removeLayer(previousLayer);
    previousLayer.dispose();
  }

  // Move view
  $: {
    if (map) {
      const idx = $store.lockedIdx.idx !== -1 ? $store.lockedIdx : $store.currIdx;
      const { x, y } = coords[idx.idx];
      if ($store.currIdx.source !== 'map') {
        const zoom = $store.lockedIdx.idx !== -1 ? 5 : 4.5;
        // map.getView().setCenter([x, y]);
        map
          .getView()
          .animate({ center: [x * params.mPerPx, -y * params.mPerPx], duration: 100, zoom });
      }
      circleFeature?.getGeometry()?.setCenter([x * params.mPerPx, -y * params.mPerPx]);
    }
  }

  $: if (map) webGLLayer.setVisible(showAllSpots);
  // $: console.log($store.currIdx);

  // $: console.log(map?.getControls());
</script>

<div class="flex flex-grow flex-col gap-y-6">
  <div class="flex flex-col">
    {#each ['blue', 'green', 'red'] as color, i}
      <!-- content here -->
      <div class="flex gap-x-4">
        <ButtonGroup names={proteins} bind:curr={showing[i]} {color} />
        <input
          type="range"
          min="0"
          max="254"
          bind:value={maxIntensity[i]}
          class="hidden 2xl:block"
        />
      </div>
    {/each}
  </div>
  <div class="flex w-full gap-x-8">
    {#each [0, 1, 2] as i}
      <input
        type="range"
        min="0"
        max="254"
        bind:value={maxIntensity[i]}
        class="block w-full 2xl:hidden"
      />
    {/each}
  </div>

  <div id="map" class="relative h-[70vh] shadow-lg">
    <div
      class="absolute left-14 top-[1.2rem] z-10 text-lg font-medium text-white opacity-90 xl:text-xl"
    >
      Spots: {$currRna}
    </div>
    <div
      class="absolute top-[4.75rem] left-3 z-10 flex flex-col text-lg font-medium text-white opacity-90 xl:text-xl"
    >
      {#each ['text-blue-600', 'text-green-600', 'text-red-600'] as color, i}
        {#if showing[i] !== 'None'}
          <span class={`font-semibold ${color}`}>{showing[i]}</span>
        {/if}
      {/each}
    </div>
    <label
      class="absolute right-4 top-4 z-50 inline-flex cursor-pointer flex-col gap-y-1 rounded-lg bg-neutral-600/70 p-2 px-3 text-sm text-white/90 backdrop-blur-sm transition-all hover:bg-neutral-600/90"
      ><div>
        <input
          type="checkbox"
          class="mr-0.5 translate-y-[1.5px] opacity-80"
          bind:checked={showAllSpots}
        />
        <span>Show all spots</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        bind:value={colorOpacity}
        on:mousedown={() => (showAllSpots = true)}
        class="max-w-[36rem] cursor-pointer opacity-80"
      />
    </label>
  </div>
</div>

<style lang="postcss">
  #map :global(.ol-zoomslider) {
    @apply cursor-pointer rounded bg-neutral-500/50 backdrop-blur transition-all;
  }

  #map :global(.ol-zoomslider:hover) {
    @apply bg-white/50;
  }

  #map :global(.ol-zoomslider-thumb) {
    @apply w-3;
  }

  #map :global(.ol-scale-line) {
    @apply left-6 bottom-6 float-right w-3 bg-transparent text-right font-sans;
  }

  #map :global(.ol-scale-line-inner) {
    @apply pb-1 text-sm;
  }
</style>
