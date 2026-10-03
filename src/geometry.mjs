// The published GeoJSON keeps its source coordinates. D3's spherical polygon
// convention requires clockwise outer rings; official RFC-style CCW rings
// otherwise describe the complement of an island (almost the whole globe).
import { geoArea } from 'd3-geo';
export function globeGeometry(geometry) {
  const wind = (rings) =>
    rings.map((ring, index) => {
      // Spherical area also handles islands crossing the date line. A planar
      // shoelace sign can invert those islands and fill the entire globe.
      const clockwise = geoArea({ type: 'Polygon', coordinates: [ring] }) < 2 * Math.PI;
      return clockwise === (index === 0) ? ring : [...ring].reverse();
    });
  return {
    ...geometry,
    coordinates:
      geometry.type === 'Polygon' ? wind(geometry.coordinates) : geometry.coordinates.map(wind),
  };
}
