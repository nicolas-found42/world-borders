const [site, expectedCommit] = process.argv.slice(2);
if (!site || !/^[a-f0-9]{40}$/.test(expectedCommit || ''))
  throw new Error('Usage: smoke-deploy <site-url/> <commit-sha>');
const base = new URL(site.endsWith('/') ? site : `${site}/`);
let lastError;
for (let attempt = 0; attempt < 24; attempt++) {
  try {
    const get = async (path) => {
      const response = await fetch(new URL(path, base), {
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
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
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
throw lastError;
