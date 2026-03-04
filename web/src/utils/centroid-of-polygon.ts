export const centroidOfPolygon = (polygon: number[][]) => {
  if (!polygon || polygon.length === 0) return null;

  const isClosed =
    polygon.length > 1 &&
    polygon[0][0] === polygon[polygon.length - 1][0] &&
    polygon[0][1] === polygon[polygon.length - 1][1];

  const pts: number[][] = isClosed
    ? polygon
    : [...polygon, polygon[0]];

  // Fórmula del centroide (shoelace), usando x=lng, y=lat
  let twiceArea = 0; // 2A
  let cx = 0; // acumulador para x (lng)
  let cy = 0; // acumulador para y (lat)

  for (let i = 0; i < pts.length - 1; i++) {
    const [lat1, lng1] = pts[i];
    const [lat2, lng2] = pts[i + 1];

    const x1 = lng1,
      y1 = lat1;
    const x2 = lng2,
      y2 = lat2;

    const cross = x1 * y2 - x2 * y1;
    twiceArea += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }

  // Degenerado: área ~ 0 => promedio de puntos
  if (twiceArea === 0) {
    const base = isClosed ? pts.slice(0, -1) : polygon;
    const n = base.length;

    let sumLat = 0;
    let sumLng = 0;
    for (const [lat, lng] of base) {
      sumLat += lat;
      sumLng += lng;
    }
    return [sumLat / n, sumLng / n];
  }

  // (1/(6A)) y como twiceArea = 2A => 1/(6A) = 1/(3*twiceArea)
  const factor = 1 / (3 * twiceArea);
  return [cy * factor, cx * factor];
}