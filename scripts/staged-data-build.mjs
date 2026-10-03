import {
  cp,
  mkdir,
  mkdtemp,
  rename,
  rm,
  readFile,
  writeFile,
  lstat,
  realpath,
  open,
} from 'node:fs/promises';
import { basename, dirname, join, resolve, sep } from 'node:path';

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

// A persistent journal also restores an interrupted process before the next build.
export async function stagedDataBuild(cache, output, build) {
  const targets = [await canonicalDirectory(cache), await canonicalDirectory(output)];
  if (targets[0] === targets[1] || targets.some((p, i) => targets[1 - i].startsWith(p + sep)))
    throw new Error('Cache and output directories must be separate, non-nested paths');
  const marker = join(dirname(targets[0]), `.${basename(targets[0])}.transaction.json`);
  if (await exists(marker)) {
    const previous = JSON.parse(await readFile(marker, 'utf8'));
    let alive = true;
    try {
      process.kill(previous.pid, 0);
    } catch (error) {
      if (error.code === 'ESRCH') alive = false;
      else throw error;
    }
    if (alive) throw new Error(`Data build already running as PID ${previous.pid}`);
    await recover(marker, previous);
  }
  const lock = await open(marker, 'wx');
  const journal = { pid: process.pid, phase: 'building', entries: [] };
  await lock.writeFile(JSON.stringify(journal));
  await lock.close();
  try {
    for (const target of targets) {
      const stage = await mkdtemp(join(dirname(target), `.${basename(target)}.pending-`));
      const entry = {
        target,
        stage,
        backup: `${stage}.previous`,
        hadOriginal: await exists(target),
      };
      journal.entries.push(entry);
      await saveJournal(marker, journal);
      if (entry.hadOriginal) await cp(target, stage, { recursive: true });
    }
    await build(journal.entries[0].stage, journal.entries[1].stage);
    // All paths and prior-existence facts are persisted before the first active rename.
    journal.phase = 'installing';
    await saveJournal(marker, journal);
    for (const entry of journal.entries) {
      if (entry.hadOriginal) await rename(entry.target, entry.backup);
      await rename(entry.stage, entry.target);
    }
    journal.phase = 'committed';
    await saveJournal(marker, journal);
  } catch (error) {
    // Recover according to the persisted phase, including a failed commit-marker write.
    await recover(marker, JSON.parse(await readFile(marker, 'utf8')));
    throw error;
  }
  await recover(marker, journal);
}
