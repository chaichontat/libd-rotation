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
  import { store } from '../store';

  let layer: TileLayer;
  let sourceTiff: GeoTIFF;
  let map: Map;
  export let sample: string;
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
    style: new Style({
      stroke: new Stroke({
        color: '#eeeeee',
        width: 1
      })
    })
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

  onMount(() => {
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

    map = new Map({ target: 'map', layers: [layer, vector], view: sourceTiff.getView() });

    // map.on('pointermove', (e) => {
    // 	console.log(e.coordinate);
    // });
  });

  $: {
    if ($store.lockedIdx !== -1 && map) {
      let { x, y } = $store.lockedCoords;
      map.getView().animate({
        center: [x, y],
        duration: 100,
        zoom: 5
      });

      circleFeature.getGeometry()?.setCenter([x, y]);
    }
  }

  $: if (layer) {
    layer.updateStyleVariables(getColorParams(showing, maxIntensity));
  }

  $: if (map && $store.lockedIdx === -1) {
    const { x, y } = $store.currCoords;
    map.getView().animate({
      center: [x, y],
      zoom: 4,
      duration: 100
    });
    circleFeature.getGeometry()?.setCenter([x, y]);
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

  <div id="map" class="h-[600px] max-w-[600px] shadow-lg" />
</div>
