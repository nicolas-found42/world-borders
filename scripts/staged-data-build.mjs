import { cp, mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { basename, dirname, resolve, sep } from 'node:path';

// Build the whole source set and bundle before replacing either active directory.
export async function stagedDataBuild(cache, output, build) {
  const targets = [resolve(cache), resolve(output)];
  if (targets[0] === targets[1] || targets.some((p, i) => targets[1 - i].startsWith(p + sep)))
    throw new Error('Cache and output directories must be separate, non-nested paths');
  const entries = [];
  try {
    for (const target of targets) {
      await mkdir(dirname(target), { recursive: true });
      const stage = await mkdtemp(`${dirname(target)}/.${basename(target)}.pending-`);
      const entry = {
        target,
        stage,
        backup: `${stage}.previous`,
        backedUp: false,
        installed: false,
      };
      entries.push(entry);
      try {
        await cp(target, stage, { recursive: true });
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    await build(entries[0].stage, entries[1].stage);
    for (const entry of entries) {
      try {
        await rename(entry.target, entry.backup);
        entry.backedUp = true;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      await rename(entry.stage, entry.target);
      entry.installed = true;
    }
  } catch (error) {
    for (const entry of entries.toReversed()) {
      if (entry.installed) await rm(entry.target, { recursive: true, force: true });
      if (entry.backedUp) await rename(entry.backup, entry.target);
    }
    throw error;
  } finally {
    for (const entry of entries) await rm(entry.stage, { recursive: true, force: true });
  }
  // Remove backups only after both replacements succeeded. Failed rollback leaves backups recoverable.
  for (const entry of entries) await rm(entry.backup, { recursive: true, force: true });
}
