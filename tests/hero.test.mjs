import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useSite } from './harness.mjs';
import { badClassTokens } from './static.test.mjs';

const site = useSite();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LINES = ['an IT Student', 'an Aspiring Developer', 'a Problem Solver', 'a Tech Enthusiast'];

test('hero markup only uses allowed classes', () => {
  const html = readFileSync(resolve(import.meta.dirname, '..', 'index.html'), 'utf8');
  const start = html.indexOf('<section data-scene');
  const end = html.indexOf('</section>', start);
  assert.ok(start > -1 && end > start, 'hero section found');
  assert.deepEqual(badClassTokens(html.slice(start, end)), []);
});

test('desktop scene pins and animates', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    assert.equal(await page.eval(`document.documentElement.classList.contains('scene-enabled')`), true);
    const h1 = await page.eval(`parseFloat(getComputedStyle(document.querySelector('[data-scene] h1')).fontSize)`);
    assert.ok(h1 >= 80, `h1 font-size ${h1}`);
    const distance = await page.eval(`document.querySelector('[data-scene]').offsetHeight - document.querySelector('[data-scene-stage]').offsetHeight`);
    await page.scrollTo(Math.round(distance / 2));
    await page.waitFor(`+getComputedStyle(document.querySelector('[data-scene-title]')).opacity < 1`);
    await page.waitFor(`getComputedStyle(document.querySelector('[data-scene-portrait]')).transform !== 'none'`);
    await page.waitFor(`+getComputedStyle(document.querySelector('[data-scene-intro]')).opacity > 0`);
  } finally { await page.close(); }
});

for (const [name, opts] of [
  ['phone', { width: 375, height: 812, mobile: true }],
  ['short screen', { width: 1280, height: 600 }],
  ['reduced motion', { width: 1440, height: 900, reducedMotion: true }],
]) {
  test(`scene is static on ${name}`, async () => {
    const page = await site.open(opts);
    try {
      assert.equal(await page.eval(`document.documentElement.classList.contains('scene-enabled')`), false);
      const portrait = await page.eval(`document.querySelector('[data-scene-portrait]').getBoundingClientRect().height`);
      assert.ok(portrait > 0, `portrait height ${portrait}`);
      assert.equal(await page.eval(`+getComputedStyle(document.querySelector('[data-scene-title]')).opacity`), 1);
      assert.equal(await page.eval(`+getComputedStyle(document.querySelector('[data-scene-intro]')).opacity`), 1);
      assert.equal(await page.eval(`document.querySelector('[data-scene-title]').inert || document.querySelector('[data-scene-intro]').inert`), false);
      const over = await page.eval(`document.documentElement.scrollWidth - innerWidth`);
      assert.ok(over <= 0, `horizontal overflow ${over}`);
    } finally { await page.close(); }
  });
}

test('typing cycles through lines', async () => {
  const page = await site.open();
  try {
    const seen = new Set();
    const end = Date.now() + 7000;
    while (Date.now() < end) {
      seen.add(await page.eval(`document.querySelector('#typing-text').textContent`));
      await sleep(100);
    }
    assert.ok(seen.has('an Aspiring Developer'), [...seen].join(' | '));
  } finally { await page.close(); }
});

test('typing is static under reduced motion', async () => {
  const page = await site.open({ reducedMotion: true });
  try {
    await sleep(3000);
    assert.equal(await page.eval(`document.querySelector('#typing-text').textContent`), 'an IT Student');
    assert.equal(await page.eval(`document.querySelector('[data-typing-caret]').getAnimations().length`), 0);
  } finally { await page.close(); }
});

test('typing stops and leaves a full line when reduced motion turns on mid-run', async () => {
  const page = await site.open();
  try {
    await page.waitFor(`document.querySelector('#typing-text').textContent !== 'an IT Student'`, 6000);
    await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await sleep(300);
    const text = await page.eval(`document.querySelector('#typing-text').textContent`);
    assert.ok(LINES.includes(text), `incomplete line: ${text}`);
    await sleep(3000);
    assert.equal(await page.eval(`document.querySelector('#typing-text').textContent`), text);
  } finally { await page.close(); }
});

test('screen readers get a stable line', async () => {
  const page = await site.open();
  try {
    assert.match(await page.eval(`document.querySelector('[data-scene] .visually-hidden').textContent`), /first-year BSIT student/);
    assert.equal(await page.eval(`document.querySelector('#typing-text').getAttribute('aria-hidden')`), 'true');
    assert.equal(await page.eval(`document.querySelector('[data-typing-caret]').getAttribute('aria-hidden')`), 'true');
  } finally { await page.close(); }
});

test('hero links are not Bootstrap blue and not underlined unless intended', async () => {
  const page = await site.open();
  try {
    const links = await page.eval(`[...document.querySelectorAll('[data-scene] a')].map((a) => ({ text: a.textContent.trim(), color: getComputedStyle(a).color, deco: getComputedStyle(a).textDecorationLine }))`);
    assert.ok(links.length >= 2);
    for (const l of links) assert.notEqual(l.color, 'rgb(13, 110, 253)', l.text);
    const button = links.find((l) => l.text.startsWith('See my projects'));
    assert.equal(button.color, 'rgb(20, 43, 35)');
    assert.equal(button.deco, 'none');
    assert.equal(links.find((l) => l.text === 'More about me').deco, 'underline');
  } finally { await page.close(); }
});

test('no uncaught errors', async () => {
  assert.ok(site.pages.length > 0);
  for (const page of site.pages) assert.deepEqual(page.errors, []);
});
