import type { Polygon } from "geojson";

export const centroidOfPolygon = (polygon: Polygon): number[] | null => {
  if (!polygon?.coordinates?.length) return null;

  const ring = polygon.coordinates[0];
  if (!ring || ring.length === 0) return null;

  // Fórmula del centroide (shoelace), coordenadas GeoJSON: [lng, lat]
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i]; // [lng, lat]
    const [x2, y2] = ring[i + 1];

    const cross = x1 * y2 - x2 * y1;
    twiceArea += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }

  if (twiceArea === 0) {
    const base = ring.slice(0, -1);
    const n = base.length;

    let sumLng = 0;
    let sumLat = 0;
    for (const [lng, lat] of base) {
      sumLng += lng;
      sumLat += lat;
    }
    return [sumLng / n, sumLat / n];
  }

  const factor = 1 / (3 * twiceArea);
  return [cx * factor, cy * factor];
};