import Feature from 'ol/Feature.js';
import { Circle, Point } from 'ol/geom.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import VectorSource from 'ol/source/Vector.js';
import type { Style } from 'ol/style.js';

export function colorVarFactory(mapping: { [key: string]: number }) {
  const len = Object.keys(mapping).length - 1;
  return (showing: [string, string, string], max: [number, number, number]) => {
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
  };
}

// WebGL;

export function getWebGLCircles() {
  const circlesSource = new VectorSource({ features: [] });

  const addData = (coords: { x: number; y: number }[], byRow: { [x: string]: number }[]) =>
    circlesSource.addFeatures(
      coords.map(({ x, y }, i) => {
        const f = new Feature({ geometry: new Point([x, y]), ...byRow[i] });
        f.setId(i);
        return f;
      })
    );

  return { circlesSource, addData };
}

export function getCanvasCircles(style: Style) {
  const circlesSource = new VectorSource({ features: [] });
  const circlesLayer = new VectorLayer({
    minZoom: 4,
    source: circlesSource,
    style
  });

  const addData = (coords: { x: number; y: number }[]) =>
    circlesSource.addFeatures(
      coords.map(({ x, y }, i) => {
        const f = new Feature({ geometry: new Circle([x, y], 130.75 / 2) });
        f.setId(i);

        return f;
      })
    );

  return { circlesSource, circlesLayer, addData };
}
