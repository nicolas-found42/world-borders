import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { stagedDataBuild } from '../../scripts/staged-data-build.mjs';
const [root, stopAt] = process.argv.slice(2);
try {
  await stagedDataBuild(
    join(root, 'cache'),
    join(root, 'output'),
    async (cache, output) => {
      await writeFile(join(cache, 'version'), 'new');
      await writeFile(join(output, 'version'), 'new');
    },
    {
      checkpoint: async (point) => {
        if (point === stopAt) {
          process.send({ point });
          await new Promise((resolve) => process.once('message', resolve));
        }
      },
    },
  );
  process.send({ done: true });
} catch (error) {
  process.send({ error: error.message, code: error.code });
}
process.disconnect();
