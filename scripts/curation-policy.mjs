import { createHash } from 'node:crypto';
export const publicationHash = (scope) =>
  createHash('sha256').update(JSON.stringify(scope)).digest('hex');
export function publicationDisposition(source, record, scope) {
  if (
    record?.status !== 'approved-reference' ||
    typeof record.reviewer !== 'string' ||
    !record.reviewer.trim() ||
    typeof record.authority !== 'string' ||
    !record.authority.trim() ||
    typeof record.reason !== 'string' ||
    !record.reason.trim() ||
    record.inputSha256 !== source.hash ||
    !scope ||
    !/^[a-f0-9]{64}$/.test(scope.geometrySha256 || '') ||
    record.outputSha256 !== scope.geometrySha256 ||
    record.publicationSha256 !== publicationHash(scope) ||
    record.id !== scope.state.id ||
    record.representation !== scope.state.representation ||
    JSON.stringify(record.evidence) !== JSON.stringify(scope.state.evidenceIds) ||
    record.transformation !== scope.transformation ||
    !Array.isArray(record.conflicts) ||
    record.conflicts.length
  ) {
    throw new Error(
      'Curator review required: reference approval, reviewer authority, exact input hash and conflict resolution must be recorded',
    );
  }
  return {
    status: record.status,
    reviewer: record.reviewer,
    reason: record.reason,
    conflicts: record.conflicts,
  };
}
function validDistribution(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0 &&
    Object.values(value).every((n) => Number.isFinite(n) && n >= 0 && n <= 1) &&
    Math.abs(Object.values(value).reduce((sum, n) => sum + n, 0) - 1) <= 0.025
  );
}
export function replaySourceJudgments(ledger) {
  const calls =
    ledger?.calls ??
    ledger?.sourcePages?.map((page) =>
      page.screen ? { id: `${page.id}-screen`, ...page.screen } : page,
    );
  if (!Array.isArray(calls) || !calls.length) throw new Error('Missing judgment records');
  const held = [];
  for (const call of calls) {
    if (
      !call.id ||
      !call.tool ||
      !call.input ||
      !call.output?.model ||
      !call.output?.provider ||
      !call.output?.usage
    )
      throw new Error('Incomplete judgment provenance');
    const output = call.output;
    if (call.tool.endsWith('jev_screen')) {
      if (
        !output.probabilities ||
        !Object.values(output.probabilities).every((n) => Number.isFinite(n) && n >= 0 && n <= 1)
      )
        throw new Error('Invalid screen probabilities');
      if (output.recommendation?.action !== 'pass')
        held.push({ id: call.id, reason: 'source-screen-needs-inspection' });
    } else if (call.tool.endsWith('jev_verify')) {
      if (!Array.isArray(output.results)) throw new Error('Missing verification judgments');
      for (const result of output.results) {
        if (
          !['verified', 'contradicted', 'unsupported'].includes(result.verdict) ||
          !validDistribution(result.probabilities) ||
          !Number.isFinite(result.confidence) ||
          result.confidence < 0 ||
          result.confidence > 1
        )
          throw new Error('Invalid evidence judgment');
        if (result.verdict !== 'verified' || result.action !== 'auto')
          held.push({ id: call.id, claim: result.claim, reason: result.verdict });
      }
    } else if (call.tool.endsWith('jev_classify')) {
      if (!Array.isArray(output.results)) throw new Error('Missing classifications');
      for (const result of output.results) {
        if (
          !validDistribution(result.probabilities) ||
          !Number.isFinite(result.confidence) ||
          result.confidence < 0 ||
          result.confidence > 1
        )
          throw new Error('Invalid classification probabilities');
        if (result.decision !== 'auto')
          held.push({ id: call.id, reason: 'classification-needs-review' });
      }
    }
  }
  // Even an entirely positive ledger is advisory; a curator disposition is a separate contract.
  return { publication: 'curator-disposition-required', held };
}
