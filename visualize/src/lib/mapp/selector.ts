import type { Map } from 'ol';
import Feature from 'ol/Feature.js';
import { Circle, Geometry, Point } from 'ol/geom.js';
import { Modify, Snap } from 'ol/interaction';
import Draw, { DrawEvent } from 'ol/interaction/Draw.js';
import type { ModifyEvent } from 'ol/interaction/Modify';
import { Vector as VectorLayer } from 'ol/layer.js';
import 'ol/ol.css';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style.js';
import { multipleSelect, params } from '../store';

export function select(map: Map, features: Feature[]) {
  const drawSource = new VectorSource();

  const draw = new Draw({
    type: 'Polygon',
    source: drawSource,
    // condition: platformModifierKeyOnly,
    // freehandCondition: shiftKeyOnly,
    // Style for drawing polygons.
    style: new Style({
      fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
      stroke: new Stroke({ color: '#00ffe9', width: 2 })
    }),
    stopClick: true
  });

  // Style for finished polygons.
  const drawLayer = new VectorLayer({
    source: drawSource,
    style: new Style({
      stroke: new Stroke({ color: '#00ffe999', width: 1 })
    })
  });

  const modify = new Modify({ source: drawSource });
  const snap = new Snap({ source: drawSource });

  const selectedFeatures: Feature<Geometry>[] = [];
  const selectSource = new VectorSource({ features: selectedFeatures });
  const select = new VectorLayer({
    source: selectSource,
    style: new Style({ stroke: new Stroke({ color: '#67e8f944' }) })
  });

  map.addInteraction(modify);
  map.addInteraction(snap);

  // draw.on('drawstart', (event: DrawEvent) => {
  //   selectSource.clear();
  // Interactive: too slow.
  // event.feature.getGeometry()!.on('change', (e: BaseEvent) => {
  //   const polygon = e.target as Geometry;
  //   genCircle(source, features, polygon);
  // });
  // });

  draw.on('drawend', (event: DrawEvent) => {
    event.preventDefault();
    const polygon = event.feature.getGeometry()!;
    genCircle(selectSource, features, polygon);
  });

  modify.on('modifyend', (e: ModifyEvent) => {
    console.log(e);
    const polygon = e.features.getArray()[0].getGeometry()!;
    if ('intersectsExtent' in polygon) {
      genCircle(selectSource, features, polygon);
    } else {
      console.error("Polygon doesn't have intersectsExtent");
    }
  });

  map.addLayer(drawLayer);
  map.addLayer(select);
  return draw;
}

function genCircle(source: VectorSource, features: Feature[], polygon: Geometry) {
  const ids: number[] = [];
  source.clear();
  source.addFeatures(
    features
      .filter((f) => polygon.intersectsExtent(f.getGeometry()!.getExtent()))
      .map((f) => {
        ids.push(f.getId() as number);
        const point = f.getGeometry()! as Point;
        return new Feature({ geometry: new Circle(point.getCoordinates(), params.spotDiam / 2) });
      })
  );
  multipleSelect.set(ids);
}
