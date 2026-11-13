import type { Polygon } from 'geojson';
import type { LatLngBoundsExpression } from 'leaflet';

/** Rectángulo que contiene todos los polígonos, en el orden [lat, lng] de Leaflet */
export const polygonsBounds = (polygons: Polygon[]): LatLngBoundsExpression | undefined => {
  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;

  for (const polygon of polygons) {
    for (const ring of polygon.coordinates) {
      for (const [lng, lat] of ring) {
        if (lng === undefined || lat === undefined) continue;
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      }
    }
  }

  return Number.isFinite(minLat)
    ? [[minLat, minLng], [maxLat, maxLng]]
    : undefined;
};
