import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');

const CDN_URLS = [
  'https://cdn.tailwindcss.com/3.4.17',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
];
const BOOTSTRAP = new Set(('navbar navbar-expand-md fixed-top navbar-toggler collapse navbar-collapse modal fade ' +
  'modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg modal-content modal-header modal-body ' +
  'btn-close toast toast-body visually-hidden visually-hidden-focusable bi').split(' '));

// Utility part of a Tailwind token: text after the last ':' that is outside [...].
function utilityPart(token) {
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < token.length; i++) {
    if (token[i] === '[') depth++;
    else if (token[i] === ']') depth--;
    else if (token[i] === ':' && depth === 0) cut = i;
  }
  return token.slice(cut + 1);
}

export function badClassTokens(source) {
  const bad = [];
  for (const m of source.matchAll(/\sclass="([^"]*)"/g)) {
    for (const token of m[1].split(/\s+/).filter(Boolean)) {
      const u = utilityPart(token).replace(/^!/, '');
      const ok = u.startsWith('tw-') || u.startsWith('-tw-') || BOOTSTRAP.has(token) || token.startsWith('bi-');
      if (!ok) bad.push(token);
    }
  }
  return [...new Set(bad)];
}

test('styles.css is gone and unreferenced', () => {
  assert.equal(existsSync(resolve(root, 'styles.css')), false);
  assert.doesNotMatch(html, /styles\.css/);
});

test('CDNs are pinned exactly', () => {
  for (const u of CDN_URLS) assert.ok(html.includes(u), u);
});

test('every class token is tw- prefixed or an allowed Bootstrap class', { todo: 'Task 5' }, () => {
  assert.deepEqual(badClassTokens(html), []);
});

test('no dead links', () => assert.doesNotMatch(html, /href="#"/));
