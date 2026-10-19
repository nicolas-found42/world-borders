import { createHash } from 'node:crypto';
export function boundaryManifest(manifest, collections) {
  const polities = new Map();
  const states = manifest.snapshots.flatMap((snapshot) =>
    collections.get(snapshot.year).features.map((feature) => {
      const p = feature.properties;
      polities.set(p.id, { id: p.id, name: p.name });
      return {
        id: `${p.id}-${snapshot.year}`,
        polityId: p.id,
        featureId: p.id,
        file: snapshot.file,
        sourceIds: [p.sourceId],
        inputs: snapshot.inputs,
        regions: [
          'north-america',
          ['canada', 'newfoundland'].includes(p.id) ? 'canada-newfoundland' : p.id,
        ],
        coverage: 'partial',
        representation: 'source-political',
        time: { kind: 'snapshot', year: snapshot.year, precision: 'year' },
        precision: p.precision,
        review: p.review,
        evidenceIds: [],
        limitations: [
          'Generalized source snapshot; independent historical boundary validation and local dispute coverage are incomplete.',
        ],
        disposition: {
          status: 'legacy-published',
          reviewer: 'Existing published bundle',
          reason: 'Preserve the baseline review grade without promoting historical accuracy.',
          conflicts: [],
        },
      };
    }),
  );
  const result = {
    ...manifest,
    schemaVersion: 2,
    polities: [...polities.values()],
    states,
    evidence: [],
    events: [],
  };
  result.revision = createHash('sha256').update(JSON.stringify(result)).digest('hex');
  return result;
}

export function finalizeAssetRevision(manifest, assets) {
  manifest.assetDigests = Object.fromEntries(
    [...assets].map(([file, data]) => [
      file,
      createHash('sha256').update(JSON.stringify(data)).digest('hex'),
    ]),
  );
  const content = { ...manifest };
  delete content.revision;
  manifest.revision = createHash('sha256').update(JSON.stringify(content)).digest('hex');
  return manifest;
}
