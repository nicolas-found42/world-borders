import { parse } from 'parse5';

// Extract text for model evidence. This never produces HTML for browser rendering.
export function sourceText(raw, contentType = '') {
  if (!contentType.includes('text/html')) return raw.replace(/\s+/g, ' ').trim();
  const ignored = new Set(['script', 'style', 'template']);
  function text(node) {
    if (ignored.has(node.nodeName)) return '';
    if (node.nodeName === '#text') return node.value;
    return (node.childNodes || []).map(text).join(' ');
  }
  return text(parse(raw)).replace(/\s+/g, ' ').trim();
}
