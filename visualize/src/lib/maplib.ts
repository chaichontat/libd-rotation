import WebGLPointsLayer from 'ol/layer/WebGLPoints.js';
import VectorSource from 'ol/source/Vector.js';

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
  const webglstyle = {
    symbol: {
      symbolType: 'circle',
      size: ['interpolate', ['exponential', 5], ['zoom'], 1, 2, 5, 130.75],
      color: '#ffffff20',
      opacity: 0.95
    }
  };
  const circlesSource = new VectorSource({ features: [] });
  const circlesLayer = new WebGLPointsLayer({
    minZoom: 4,
    source: circlesSource,
    style: webglstyle
  });

  //   const points = coords.map(({ x, y }, i) => {
  //     const f = new Feature({ geometry: new Point([x, y]), style: circlesStyle });
  //     f.setId(i);
  //     return f;
  //   });
  return { circlesSource, circlesLayer };
}
