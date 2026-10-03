import type { Feature, Polygon, MultiPolygon } from 'geojson';
export type Territory = Feature<
  Polygon | MultiPolygon,
  {
    id: string;
    name: string;
    color: string;
    sourceId: string;
    precision: string;
    representation: string;
    review: string;
    upstreamNames: string[];
  }
>;
export interface Snapshot {
  year: number;
  file: string;
  corrections: string[];
  coverage: string;
  inputs: { url: string; sha256: string }[];
}
export interface Source {
  id: string;
  name: string;
  author: string;
  license: string;
  url: string;
  note: string;
}
export interface Manifest {
  schemaVersion: number;
  range: number[];
  snapshots: Snapshot[];
  sources: Source[];
  limitations: string[];
}
