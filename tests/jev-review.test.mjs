import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { questions, disposition } from '../scripts/jev-data-review.mjs';
const fixture = JSON.parse(
  await readFile(new URL('./fixtures/jev-data-review.json', import.meta.url), 'utf8'),
);

test('recorded live advisory replays without credentials and cannot authorize publication', () => {
  assert.deepEqual(
    questions,
    fixture.input.questions,
    'Question changes require an explicitly reviewed fixture refresh',
  );
  assert.deepEqual(disposition(fixture.response.answers), fixture.disposition);
  assert.equal(disposition(fixture.response.answers).publication, 'human-review-required');
});
test('injected source text, changed interpretation and unsupported claims remain visible for review', () => {
  const answers = structuredClone(fixture.response.answers);
  answers.injection.noul = 0.99;
  answers.interpretationChanged.noul = 0.9;
  answers.canada.choice = 'unknown';
  answers.accuracy.choice = 'supported';
  const result = disposition(answers);
  assert.equal(result.flags.length, 4);
  assert.equal(result.publication, 'human-review-required');
  assert.throws(() => disposition({}), /Invalid/);
  answers.injection.noul = NaN;
  assert.throws(() => disposition(answers), /Invalid/);
});
