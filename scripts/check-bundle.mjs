import { readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export async function checkBundle(directory, maxBytes) {
  const files = (await readdir(directory, { recursive: true })).filter((file) =>
    file.endsWith('.js'),
  );
  if (!files.length) throw new Error('No JavaScript build files found');
  const sizes = await Promise.all(
    files.map(async (file) => ({
      file,
      bytes: gzipSync(await readFile(resolve(directory, file))).length,
    })),
  );
  const total = sizes.reduce((sum, file) => sum + file.bytes, 0);
  if (total > maxBytes) throw new Error(`JavaScript gzip size ${total} exceeds budget ${maxBytes}`);
  return { total, maxBytes, files: sizes };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const budget = JSON.parse(await readFile('bundle-budget.json', 'utf8'));
  console.log(
    JSON.stringify(await checkBundle('dist/assets', budget.maxJavaScriptGzipBytes), null, 2),
  );
}
