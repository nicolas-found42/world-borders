import test from 'node:test';
import assert from 'node:assert/strict';
import { publicationDisposition } from '../scripts/curation-policy.mjs';

test('publication requires reference approval bound to the reviewed input and holds conflicts', () => {
  const source = { hash: 'a'.repeat(64) };
  const approved = {
    status: 'approved-reference',
    reviewer: 'Named curator',
    authority: 'Owner authorization',
    inputSha256: source.hash,
    reason: 'Generalized legal-affiliation reference only',
    conflicts: [],
  };
  assert.equal(publicationDisposition(source, approved).status, 'approved-reference');
  for (const changes of [
    { status: 'pending' },
    { inputSha256: 'b'.repeat(64) },
    { conflicts: ['owner conflict'] },
    { authority: '' },
    { reviewer: '' },
  ])
    assert.throws(
      () => publicationDisposition(source, { ...approved, ...changes }),
      /curator review/i,
    );
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
