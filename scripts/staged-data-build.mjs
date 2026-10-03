import { cp, mkdir, rename, rm, readFile, writeFile, lstat, realpath } from 'node:fs/promises';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import lockfile from 'proper-lockfile';

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}
async function canonicalDirectory(path) {
  const absolute = resolve(path);
  await mkdir(dirname(absolute), { recursive: true });
  const target = join(await realpath(dirname(absolute)), basename(absolute));
  if (await exists(target)) {
    const stat = await lstat(target);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error('Data paths must be real directories, not symlinks');
  }
  return target;
}
async function saveJournal(marker, journal) {
  const temporary = `${marker}.next`;
  await writeFile(temporary, JSON.stringify(journal));
  await rename(temporary, marker);
}
async function recover(marker, journal) {
  if (journal.phase !== 'committed') {
    for (const entry of journal.entries.toReversed()) {
      if (await exists(entry.backup)) {
        await rm(entry.target, { recursive: true, force: true });
        await rename(entry.backup, entry.target);
      } else if (!entry.hadOriginal && !(await exists(entry.stage))) {
        await rm(entry.target, { recursive: true, force: true });
      }
    }
  }
  for (const entry of journal.entries) {
    await rm(entry.stage, { recursive: true, force: true });
    await rm(entry.backup, { recursive: true, force: true });
  }
  await rm(`${marker}.next`, { force: true });
  await rm(marker);
}

// A separate lease serializes recovery and installation. All callers use identical timings.
// A killed owner can be recovered after 120 seconds without relying on a reused PID.
export async function stagedDataBuild(cache, output, build, { checkpoint = async () => {} } = {}) {
  const targets = [await canonicalDirectory(cache), await canonicalDirectory(output)];
  if (targets[0] === targets[1] || targets.some((p, i) => targets[1 - i].startsWith(p + sep)))
    throw new Error('Cache and output directories must be separate, non-nested paths');
  const marker = join(dirname(targets[0]), `.${basename(targets[0])}.transaction.json`);
  const releases = [];
  try {
    // Lock both destinations in a stable order, including when different caches share output.
    for (const target of [...targets].sort()) {
      releases.push(
        await lockfile.lock(target, {
          realpath: false,
          lockfilePath: join(dirname(target), `.${basename(target)}.build-lock`),
          stale: 120000,
          update: 5000,
          retries: 0,
        }),
      );
    }
    await checkpoint('locked');
    if (await exists(marker)) {
      const text = await readFile(marker, 'utf8');
      // Legacy empty markers were created before any staging or active-directory mutation.
      if (!text.trim()) {
        await rm(marker);
        await rm(`${marker}.next`, { force: true });
      } else {
        await recover(marker, JSON.parse(text));
      }
    }
    await checkpoint('recovered');
    const journal = { phase: 'building', entries: [] };
    await saveJournal(marker, journal);
    await checkpoint('initialized');
    try {
      for (const [index, target] of targets.entries()) {
        const stage = join(dirname(target), `.${basename(target)}.pending-${randomUUID()}`);
        const entry = {
          target,
          stage,
          backup: `${stage}.previous`,
          hadOriginal: await exists(target),
        };
        journal.entries.push(entry);
        await saveJournal(marker, journal);
        await checkpoint(`planned-${index}`);
        await mkdir(stage);
        await checkpoint(`staged-${index}`);
        if (entry.hadOriginal) await cp(target, stage, { recursive: true });
      }
      await build(journal.entries[0].stage, journal.entries[1].stage);
      journal.phase = 'installing';
      await saveJournal(marker, journal);
      await checkpoint('installing');
      for (const [index, entry] of journal.entries.entries()) {
        if (entry.hadOriginal) await rename(entry.target, entry.backup);
        await checkpoint(`backed-up-${index}`);
        await rename(entry.stage, entry.target);
        await checkpoint(`installed-${index}`);
      }
      journal.phase = 'committed';
      await saveJournal(marker, journal);
      await checkpoint('committed');
    } catch (error) {
      await recover(marker, JSON.parse(await readFile(marker, 'utf8')));
      throw error;
    }
    await recover(marker, journal);
  } finally {
    for (const release of releases.toReversed()) await release();
  }
}
