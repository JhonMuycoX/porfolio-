import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { useSite } from './harness.mjs';

const site = useSite();

test('no test file references the gitignored .superpowers folder', () => {
  const dir = import.meta.dirname;
  const offenders = readdirSync(dir)
    .filter((f) => /\.(mjs|js)$/.test(f) && f !== 'hygiene.test.mjs')
    .filter((f) => readFileSync(resolve(dir, f), 'utf8').includes('.superpowers'));
  assert.deepEqual(offenders, []);
});

test('page.screenshot creates missing parent folders', async () => {
  const base = await mkdtemp(join(tmpdir(), 'muyco-shot-'));
  const out = join(base, 'a', 'b', 'shot.png');
  const page = await site.open();
  try {
    await page.screenshot(out);
    assert.ok(existsSync(out));
  } finally {
    await page.close();
    await rm(base, { recursive: true, force: true });
  }
});
