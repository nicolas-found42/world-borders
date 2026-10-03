import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function describeBundle(directory) {
  const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
  const files = {};
  for (const file of (await readdir(directory)).sort()) {
    const raw = await readFile(join(directory, file));
    files[file] = { sha256: createHash('sha256').update(raw).digest('hex'), bytes: raw.length };
  }
  const coverage = [];
  for (const snapshot of manifest.snapshots) {
    const data = JSON.parse(await readFile(join(directory, snapshot.file), 'utf8'));
    coverage.push({
      year: snapshot.year,
      coverage: snapshot.coverage,
      features: data.features
        .map((f) => ({
          id: f.properties.id,
          name: f.properties.name,
          source: f.properties.sourceId,
          representation: f.properties.representation,
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
      inputs: snapshot.inputs,
    });
  }
  return {
    files,
    coverage,
    sources: manifest.sources,
    exclusions: manifest.excludedSnapshots,
    limitations: manifest.limitations,
    landInput: manifest.landInput,
  };
}
export function compareBundles(before, after) {
  return {
    changedFiles: [...new Set([...Object.keys(before.files), ...Object.keys(after.files)])].filter(
      (file) => before.files[file]?.sha256 !== after.files[file]?.sha256,
    ),
    before,
    after,
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [beforeDir, afterDir, output = 'artifacts/data-review'] = process.argv.slice(2);
  if (!beforeDir || !afterDir) throw new Error('Usage: data-report BEFORE AFTER [OUTPUT]');
  const report = compareBundles(await describeBundle(beforeDir), await describeBundle(afterDir));
  await mkdir(output, { recursive: true });
  await writeFile(join(output, 'evidence.json'), JSON.stringify(report, null, 2));
  const lines = [
    '# Geographic source refresh',
    '',
    `Changed files: ${report.changedFiles.join(', ') || 'none'}`,
    '',
    'Review evidence.json for exact before/after file hashes, source hashes and URLs, licenses, coverage, exclusions and limitations.',
    'Review maps.html and its PNGs for every year. Review jev-review.json for advisory judgments and preserved input.',
    'Historical correctness and licensing require maintainer review; no model judgment authorizes publication.',
    '',
    '| File | Before SHA-256 | After SHA-256 |',
    '| --- | --- | --- |',
  ];
  for (const file of [
    ...new Set([...Object.keys(report.before.files), ...Object.keys(report.after.files)]),
  ])
    lines.push(
      `| ${file} | ${report.before.files[file]?.sha256 ?? 'absent'} | ${report.after.files[file]?.sha256 ?? 'absent'} |`,
    );
  await writeFile(join(output, 'report.md'), lines.join('\n') + '\n');
  console.log(JSON.stringify({ changedFiles: report.changedFiles }));
}
