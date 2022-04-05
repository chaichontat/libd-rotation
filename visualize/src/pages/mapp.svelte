<script lang="ts">
  import { browser, dev } from '$app/env';
  import { base } from '$app/paths';
  import { colorVarFactory } from '$src/lib/maplib';
  import { Zoom } from 'ol/control.js';
  import Feature from 'ol/Feature.js';
  import { Circle } from 'ol/geom.js';
  import { Vector as VectorLayer } from 'ol/layer.js';
  import TileLayer from 'ol/layer/WebGLTile.js';
  import Map from 'ol/Map.js';
  import 'ol/ol.css';
  import { Vector as VectorSource } from 'ol/source.js';
  import GeoTIFF from 'ol/source/GeoTIFF.js';
  import { Fill, Stroke, Style } from 'ol/style.js';
  import { onMount } from 'svelte';
  import ButtonGroup from '../lib/components/buttonGroup.svelte';
  import type Data from '../lib/fetcher';
  import { store } from '../lib/store';

  export let sample: string;
  export let dataPromise: ReturnType<typeof Data>;
  export let proteinMap: { [key: string]: number };

  const proteins = Object.keys(proteinMap);

  const getColorParams = colorVarFactory(proteinMap);
  let coords: { x: number; y: number }[];
  let layer: TileLayer;
  let sourceTiff: GeoTIFF;
  let map: Map;

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

  const selectStyle = new Style({ stroke: new Stroke({ color: '#ffffff', width: 1 }) });
  const circlesSource = new VectorSource({ features: [] });
  const circlesLayer = new VectorLayer({
    minZoom: 4,
    source: circlesSource,
    style: circlesStyle
  });

  onMount(() => {
    dataPromise
      .then(({ coords: c }) => {
        coords = c;
        const circ = coords.map(({ x, y }, i) => {
          const f = new Feature({ geometry: new Circle([x, y], 130.75 / 2) });
          f.setId(i);
          return f;
        });
        circlesSource.addFeatures(circ);
      })
      .catch(console.error);

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

  // Highlight circle on hover.
  $: if ($store.currIdx.idx !== curr) {
    circlesSource.getFeatureById(curr)?.setStyle(circlesStyle);
    circlesSource.getFeatureById($store.currIdx.idx)?.setStyle(selectStyle);
    curr = $store.currIdx.idx;
  }

  // Update "brightness"
  $: if (layer) layer.updateStyleVariables(getColorParams(showing, maxIntensity));

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
  $: console.log($store.currIdx);

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

  <div id="map" class="relative h-[70vh] shadow-lg">
    <!-- <label
      class="absolute right-4 top-4 z-50 inline-flex w-[15.5rem] rounded-lg bg-white/10 p-2 text-sm text-white/90 backdrop-blur-sm"
    >
      <input
        type="checkbox"
        class="mr-1 translate-y-1 "
        checked
        on:change={(e) => {
          if (map) circlesLayer.setVisible(e.currentTarget.checked);
        }}
      />
      <span>Show all spots when zoomed in </span>
    </label> -->
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
