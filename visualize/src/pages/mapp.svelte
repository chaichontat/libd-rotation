<script lang="ts">
  import { browser, dev } from '$app/env';
  import { base } from '$app/paths';
  import { colorVarFactory, getWebGLCircles } from '$src/lib/maplib';
  import { Zoom } from 'ol/control.js';
  import type { Point } from 'ol/geom';
  import WebGLPointsLayer from 'ol/layer/WebGLPoints.js';
  import TileLayer from 'ol/layer/WebGLTile.js';
  import Map from 'ol/Map.js';
  import 'ol/ol.css';
  import GeoTIFF from 'ol/source/GeoTIFF.js';
  import type VectorSource from 'ol/source/Vector';
  import type { LiteralStyle } from 'ol/src/style/literal';
  import { Fill, Stroke, Style } from 'ol/style.js';
  import { onMount } from 'svelte';
  import ButtonGroup from '../lib/components/buttonGroup.svelte';
  import type Data from '../lib/fetcher';
  import { currRna, store } from '../lib/store';

  export let sample: string;
  export let dataPromise: ReturnType<typeof Data>;
  export let proteinMap: { [key: string]: number };

  const proteins = Object.keys(proteinMap);

  const getColorParams = colorVarFactory(proteinMap);
  let coords: { x: number; y: number }[];
  let layer: TileLayer;
  let sourceTiff: GeoTIFF;
  let map: Map;

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
              url: `https://chaichontat-host.s3.us-west-004.backblazeb2.com/libd-rotation/${sample}/${sample}_1.tif`
            },
            {
              url: `https://chaichontat-host.s3.us-west-004.backblazeb2.com/libd-rotation/${sample}/${sample}_2.tif`
            }
          ]
    });
  }

  const circlesStyle = new Style({
    stroke: new Stroke({ color: '#ffffff55', width: 1 }),
    fill: new Fill({ color: 'transparent' })
  });

  const genStyle = (rna: string): LiteralStyle => ({
    variables: { opacity: 0.5 },
    symbol: {
      symbolType: 'circle',
      size: [
        'interpolate',
        ['exponential', 2],
        ['zoom'],
        1,
        4.0625,
        2,
        8.175,
        3,
        16.34,
        4,
        32.6875,
        5,
        130.75
      ],
      color: ['interpolate', ['linear'], ['get', rna], 0, '#3e0e51', 4, '#428e8c', 8, '#fce652'],
      opacity: ['var', 'opacity']
    }
  });

  const selectStyle = new Style({ stroke: new Stroke({ color: '#ffffff', width: 1 }) });
  // const { circlesSource, circlesLayer, addData } = getCanvasCircles(circlesStyle);
  let { circlesSource, addData } = getWebGLCircles();
  let circlesLayer: WebGLPointsLayer<VectorSource<Point>>;

  onMount(() => {
    dataPromise
      .then(({ coords: c, byRow }) => {
        coords = c;
        addData(c, byRow);
      })
      .catch(console.error);

    circlesLayer = new WebGLPointsLayer({
      minZoom: 3,
      source: circlesSource,
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

    map = new Map({
      target: 'map',
      layers: [layer, circlesLayer],
      view: sourceTiff.getView()
    });

    map.removeControl(map.getControls().getArray()[0]);
    map.addControl(new Zoom({ delta: 0.4 }));

    map.on('pointermove', (e) => {
      map.forEachFeatureAtPixel(e.pixel, (f) => {
        const idx = f.getId() as number;
        if (idx === curr) return true;
        $store.currIdx = { idx, source: 'map' }; // As if came from outside.
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
  $: if (circlesLayer) circlesLayer.updateStyleVariables({ opacity: colorOpacity });

  $: if (circlesLayer) {
    const previousLayer = circlesLayer;
    circlesLayer = new WebGLPointsLayer({
      // minZoom: 3,
      source: circlesSource,
      style: genStyle($currRna)
    });

    map.addLayer(circlesLayer);
    map.removeLayer(previousLayer);
    previousLayer.dispose();
  }

  // Move view
  $: {
    if (map && coords) {
      if ($store.currIdx.source !== 'map') {
        const idx = $store.lockedIdx.idx !== -1 ? $store.lockedIdx : $store.currIdx;
        const zoom = $store.lockedIdx.idx !== -1 ? 5 : 4.5;
        const { x, y } = coords[idx.idx];
        // map.getView().setCenter([x, y]);
        map.getView().animate({ center: [x, y], duration: 100, zoom });
        // circlesSource.getFeatureById(idx)?.getGeometry()?.setCenter([x, y]);  Legacy for one circle.
      }
    }
  }
  // $: console.log($store.currIdx);

  // $: console.log(map?.getControls());
</script>

<div class="flex flex-grow flex-col gap-y-6">
  <div class="flex flex-col">
    <ButtonGroup names={proteins} bind:curr={showing[0]} color="blue" />
    <ButtonGroup names={proteins} bind:curr={showing[1]} color="green" />
    <ButtonGroup names={proteins} bind:curr={showing[2]} color="red" />
  </div>

  <div class="grid max-w-[600px] grid-cols-3 gap-x-4">
    <input type="range" min="0" max="254" bind:value={maxIntensity[0]} class="" />
    <input type="range" min="0" max="254" bind:value={maxIntensity[1]} class="" />
    <input type="range" min="0" max="254" bind:value={maxIntensity[2]} class="" />
  </div>
  <input type="range" min="0" max="1" step="0.01" bind:value={colorOpacity} class="" />

  <div id="map" class="relative h-[70vh] shadow-lg">
    <label
      class="absolute right-4 top-4 z-50 inline-flex cursor-pointer rounded-lg bg-white/10 p-2 px-3 text-sm text-white/90 backdrop-blur-sm transition-all hover:bg-white/20"
    >
      <input
        type="checkbox"
        class="mr-1 translate-y-1 "
        checked
        on:change={(e) => {
          if (map) circlesLayer.setVisible(e.currentTarget.checked);
        }}
      />
      <span>Show all spots</span>
    </label>
  </div>
  "ol-zoom-in"
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
    /* border-radius: 100%; */
  }
</style>
