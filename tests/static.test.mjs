import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { badClassTokens } from './class-audit.mjs';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');

const CDN_URLS = [
  'https://cdn.tailwindcss.com/3.4.17',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
];
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

test('old project names are gone', () => assert.doesNotMatch(html, /Dayoff|Forma|Common Ground/));
