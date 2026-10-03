const [site, expectedCommit] = process.argv.slice(2);
if (!site || !/^[a-f0-9]{40}$/.test(expectedCommit || ''))
  throw new Error('Usage: smoke-deploy <site-url/> <commit-sha>');
const base = new URL(site.endsWith('/') ? site : `${site}/`);
let lastError = new Error('Deployment smoke deadline exceeded');
const deadline = Date.now() + 5 * 60 * 1000;
for (let attempt = 0; attempt < 24 && Date.now() < deadline; attempt++) {
  try {
    const get = async (path) => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error('Deployment smoke deadline exceeded');
      const response = await fetch(new URL(path, base), {
        cache: 'no-store',
        signal: AbortSignal.timeout(Math.min(15000, remaining)),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.url}`);
      return response.json();
    };
    const info = await get(`build-info.json?revision=${expectedCommit}`);
    if (info.commit !== expectedCommit)
      throw new Error(`Expected ${expectedCommit}, received ${info.commit}`);
    const manifest = await get('data/manifest.json');
    await get('data/land.geojson');
    for (const snapshot of manifest.snapshots) await get(`data/${snapshot.file}`);
    console.log(
      `Verified ${base.href}: ${expectedCommit} and ${manifest.snapshots.length} snapshots`,
    );
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn(`Attempt ${attempt + 1}: ${error.message}`);
    if (Date.now() < deadline)
      await new Promise((resolve) => setTimeout(resolve, Math.min(5000, deadline - Date.now())));
  }
}
throw lastError;
