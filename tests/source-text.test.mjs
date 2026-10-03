import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceText } from '../scripts/source-text.mjs';

test('source evidence uses a real HTML parser and retains literal plain/JSON documents', () => {
  assert.equal(
    sourceText(
      '<p>Public &amp; open</p><script>hidden()</script ><style>.secret{}</style>',
      'text/html',
    ),
    'Public & open',
  );
  assert.equal(
    sourceText('  {"url":"https://example.test/?x=<value>"}  ', 'application/json'),
    '{"url":"https://example.test/?x=<value>"}',
  );
  assert.equal(
    sourceText('<template>not visible</template><p>Visible</p>', 'text/html; charset=utf-8'),
    'Visible',
  );
});
