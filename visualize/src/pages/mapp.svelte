<script lang="ts">
  import { browser, dev } from '$app/env';
  import { base } from '$app/paths';
  import Feature from 'ol/Feature.js';
  import { Circle } from 'ol/geom.js';
  import { Vector as VectorLayer } from 'ol/layer.js';
  import TileLayer from 'ol/layer/WebGLTile.js';
  import Map from 'ol/Map.js';
  import 'ol/ol.css';
  import { Vector as VectorSource } from 'ol/source.js';
  import GeoTIFF from 'ol/source/GeoTIFF.js';
  import { Stroke, Style } from 'ol/style.js';
  import { onMount } from 'svelte';
  import ButtonGroup from '../components/buttonGroup.svelte';
  import type Data from '../fetcher';
  import { store } from '../store';

  export let sample: string;
  export let dataPromise: ReturnType<typeof Data>;

  let layer: TileLayer;
  let sourceTiff: GeoTIFF;
  let map: Map;
  let maxIntensity: [number, number, number] = [100, 100, 100]; // Inverted
  let showing: [Protein, Protein, Protein] = ['DAPI', 'TMEM119', 'Olig2'];

  const mapping = {
    DAPI: 2,
    TMEM119: 6,
    Olig2: 5,
    GFAP: 3,
    NeuN: 4,
    Lipofuschin: 1,
    None: 7
  };
  type Protein = keyof typeof mapping;
  const proteins = Object.keys(mapping) as Protein[];

  function getColorParams(showing: [Protein, Protein, Protein], max: [number, number, number]) {
    const len = proteins.length - 1;
    const variables = {
      blue: Math.min(mapping[showing[0]], len),
      green: Math.min(mapping[showing[1]], len),
      red: Math.min(mapping[showing[2]], len),
      blueMax: 255 - max[0],
      greenMax: 255 - max[1],
      redMax: 255 - max[2],
      blueMask: mapping[showing[0]] > len ? 0 : 1,
      greenMask: mapping[showing[1]] > len ? 0 : 1,
      redMask: mapping[showing[2]] > len ? 0 : 1
    };
    return variables;
  }

  const circleFeature = new Feature({ geometry: new Circle([14000, 6000], 130.75 / 2) });
  const vector = new VectorLayer({
    source: new VectorSource({ features: [circleFeature] }),
    style: new Style({ stroke: new Stroke({ color: '#eeeeee', width: 1 }) })
  });

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

  // All circles
  const circlesLayer = new VectorLayer({
    minZoom: 4,
    source: new VectorSource({ features: [] }),
    style: new Style({
      stroke: new Stroke({ color: '#ffffff44', width: 1 })
    })
  });

  onMount(() => {
    dataPromise
      .then(({ coords }) =>
        coords.map(({ x, y }) => new Feature({ geometry: new Circle([x, y], 130.75 / 2) }))
      )
      .then((c) => circlesLayer.getSource()!.addFeatures(c));

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
      layers: [layer, vector, circlesLayer],
      view: sourceTiff.getView()
    });

    // map.on('pointermove', (e) => {
    // 	console.log(e.coordinate);
    // });
  });

  $: if (layer) layer.updateStyleVariables(getColorParams(showing, maxIntensity));

  $: {
    if (map) {
      let x, y;
      if ($store.lockedIdx !== -1) {
        // Locked
        ({ x, y } = $store.lockedCoords);
        map.getView().animate({ center: [x, y], duration: 100, zoom: 5 });
      } else {
        ({ x, y } = $store.currCoords);
        map.getView().animate({ center: [x, y], duration: 100, zoom: 4.5 });
      }
      circleFeature.getGeometry()?.setCenter([x, y]);
    }
  }
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

  <div id="map" class="relative h-[600px] max-w-[600px] shadow-lg">
    <label
      class="absolute right-4 top-4 z-50 inline-flex w-[15.5rem] rounded-lg bg-white/10 p-2 text-sm text-white/90 backdrop-blur-sm"
    >
      <input
        type="checkbox"
        class="mr-1 translate-y-1 "
        on:change={(e) => {
          if (map) circlesLayer.setVisible(e.currentTarget.checked);
        }}
      />
      <span>Show all spots when zoomed in </span>
    </label>
  </div>
</div>
