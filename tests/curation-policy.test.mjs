import test from 'node:test';
import assert from 'node:assert/strict';
import { publicationDisposition, publicationHash } from '../scripts/curation-policy.mjs';

test('publication requires reference approval bound to the reviewed input and holds conflicts', () => {
  const source = { hash: 'a'.repeat(64) };
  const scope = {
    geometrySha256: 'c'.repeat(64),
    state: {
      id: 'canada-1949',
      representation: 'legal-affiliation',
      evidenceIds: ['membership'],
      limitations: ['reference only'],
      time: { kind: 'snapshot', year: 1949 },
    },
    evidence: [{ id: 'membership', text: 'legal membership' }],
    transformation: 'dissolve then simplify',
  };
  const approved = {
    id: scope.state.id,
    representation: scope.state.representation,
    evidence: scope.state.evidenceIds,
    transformation: scope.transformation,
    publicationSha256: publicationHash(scope),
    outputSha256: scope.geometrySha256,
    status: 'approved-reference',
    reviewer: 'Named curator',
    authority: 'Owner authorization',
    inputSha256: source.hash,
    reason: 'Generalized legal-affiliation reference only',
    conflicts: [],
  };
  assert.equal(publicationDisposition(source, approved, scope).status, 'approved-reference');
  for (const changes of [
    { status: 'pending' },
    { inputSha256: 'b'.repeat(64) },
    { conflicts: ['owner conflict'] },
    { authority: '' },
    { reviewer: '' },
    { representation: 'effective-control' },
    { id: 'other' },
    { evidence: [] },
    { transformation: 'different' },
    { outputSha256: 'd'.repeat(64) },
  ])
    assert.throws(
      () => publicationDisposition(source, { ...approved, ...changes }, scope),
      /curator review/i,
    );
  for (const field of ['representation', 'limitations', 'time']) {
    const changed = structuredClone(scope);
    changed.state[field] = 'changed';
    assert.throws(() => publicationDisposition(source, approved, changed), /curator review/i);
  }
  const changedEvidence = structuredClone(scope);
  changedEvidence.evidence[0].text = 'different assertion';
  assert.throws(() => publicationDisposition(source, approved, changedEvidence), /curator review/i);
});

test('real recorded source judgments replay offline and retain held or negative evidence', async () => {
  const { readFile } = await import('node:fs/promises');
  const { replaySourceJudgments } = await import('../scripts/curation-policy.mjs');
  const ledger = JSON.parse(
    await readFile(new URL('../research/jev-historical-slice-records.json', import.meta.url)),
  );
  const replay = replaySourceJudgments(ledger);
  assert.equal(replay.publication, 'curator-disposition-required');
  assert(replay.held.some((item) => item.reason === 'contradicted'));
  const extentLedger = JSON.parse(
    await readFile(new URL('../research/jev-labrador-review-records.json', import.meta.url)),
  );
  assert.equal(replaySourceJudgments(extentLedger).publication, 'curator-disposition-required');
  const incomplete = structuredClone(ledger);
  delete incomplete.calls[0].output.model;
  assert.throws(() => replaySourceJudgments(incomplete), /Incomplete/);
});
