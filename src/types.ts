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
  schemaVersion: 2;
  revision: string;
  states: BoundaryState[];
  polities: { id: string; name: string }[];
  evidence: EvidenceItem[];
  events: BoundaryEvent[];
  range: number[];
  snapshots: Snapshot[];
  sources: Source[];
  limitations: string[];
}

export interface BoundaryState {
  id: string;
  polityId: string;
  featureId: string;
  file: string;
  sourceIds: string[];
  inputs: { url: string; sha256: string }[];
  regions: string[];
  coverage: 'partial' | 'covered';
  representation:
    | 'source-political'
    | 'legal-affiliation'
    | 'effective-control'
    | 'territorial-claim'
    | 'dispute';
  time:
    | { kind: 'snapshot'; year: number; precision: 'year' }
    | {
        kind: 'interval';
        start: number;
        end: number;
        precision: 'year' | 'day';
        evidenceIds: string[];
      };
  precision: string;
  review: 'source-snapshot' | 'official-source' | 'reviewed-boundary';
  evidenceIds: string[];
  limitations: string[];
  disposition: {
    status: 'legacy-published' | 'approved-reference' | 'approved-boundary';
    reviewer: string;
    reason: string;
    conflicts: string[];
  };
}
export interface EvidenceItem {
  id: string;
  sourceId: string;
  assertion: string;
  text: string;
  sha256: string;
}
export interface BoundaryEvent {
  id: string;
  name: string;
  kind: string;
  precision: 'year' | 'day';
  date: { year: number; month?: number; day?: number };
  polityIds: string[];
  evidenceIds: string[];
  beforeStateIds: string[];
  afterStateIds: string[];
}
