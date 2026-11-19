import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useSite } from './harness.mjs';
import { badClassTokens } from './class-audit.mjs';

const site = useSite();
const SHOTS = resolve(import.meta.dirname, '..', '.superpowers/sdd/2026-11-19-portfolio-tailwind-redesign/shots');

function sectionHtml(id) {
  const html = readFileSync(resolve(import.meta.dirname, '..', 'index.html'), 'utf8');
  const at = html.indexOf(`id="${id}"`);
  assert.ok(at > -1, `section#${id} exists`);
  return html.slice(html.lastIndexOf('<section', at), html.indexOf('</section>', at));
}

test('skills and about only use allowed classes', () => {
  assert.deepEqual(badClassTokens(sectionHtml('skills')), []);
  assert.deepEqual(badClassTokens(sectionHtml('about')), []);
});

test('three skill groups of four placeholders', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    assert.equal(await page.eval(`document.querySelector('#skills h2').textContent.trim()`), 'Skills I’m building.');
    assert.match(await page.eval(`document.querySelector('#skills').textContent`), /Placeholders for now\. I’ll fill these in as I learn\./);
    const groups = await page.eval(`[...document.querySelectorAll('#skills [data-skill-group]')].map((g) => ({
      title: g.querySelector('h3').textContent.trim(), n: g.querySelectorAll('[data-skill]').length,
      reveal: g.hasAttribute('data-reveal-group') }))`);
    assert.deepEqual(groups.map((g) => g.title), ['Programming', 'Web Development', 'Tools']);
    for (const g of groups) { assert.equal(g.n, 4); assert.ok(g.reveal); }
    const skills = await page.eval(`[...document.querySelectorAll('[data-skill]')].map((s) => [s.textContent.trim(), s.tabIndex, s.dataset.bsToggle, s.dataset.bsTitle])`);
    assert.equal(skills.length, 12);
    for (const s of skills) assert.deepEqual(s, ['Skill name', 0, 'tooltip', 'Short note about this skill']);
    const cols = await page.eval(`getComputedStyle(document.querySelector('[data-skill-group]').parentElement).gridTemplateColumns.split(' ').length`);
    assert.equal(cols, 3);
    const bgs = await page.eval(`[...document.querySelectorAll('[data-skill-group]:first-child [data-skill]')].map((s) => getComputedStyle(s).backgroundColor)`);
    assert.deepEqual(bgs, ['rgb(237, 207, 105)', 'rgb(198, 213, 183)', 'rgb(214, 172, 184)', 'rgb(226, 229, 216)']);
    assert.equal(await page.eval(`getComputedStyle(document.querySelector('[data-skill]')).color`), 'rgb(20, 43, 35)');
  } finally { await page.close(); }
});

test('keyboard focus shows the tooltip with a visible ring', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    await page.eval(`document.querySelector('#skills').scrollIntoView({ behavior: 'instant' })`);
    await page.waitForScrollEnd();
    await page.eval(`document.querySelector('[data-skill]').focus()`);
    await page.waitFor(`document.querySelector('.tooltip.show')`);
    assert.match(await page.eval(`document.querySelector('.tooltip.show').textContent`), /Short note about this skill/);
    await page.waitFor(`getComputedStyle(document.querySelector('.tooltip.show')).opacity === '1'`);
    await page.screenshot(resolve(SHOTS, 'task4-desktop-skills.png'));
    await page.eval(`document.activeElement.blur()`);
    await page.waitFor(`!document.querySelector('.tooltip.show')`);
  } finally { await page.close(); }
});

test('tooltip is readable: mist text on forest', async () => {
  const page = await site.open();
  try {
    await page.eval(`document.querySelector('[data-skill]').focus()`);
    await page.waitFor(`document.querySelector('.tooltip.show .tooltip-inner')`);
    const c = await page.eval(`(() => { const s = getComputedStyle(document.querySelector('.tooltip.show .tooltip-inner')); return [s.color, s.backgroundColor]; })()`);
    assert.deepEqual(c, ['rgb(230, 236, 218)', 'rgb(20, 43, 35)']);
  } finally { await page.close(); }
});

test('badge focus ring is visible', async () => {
  const page = await site.open();
  try {
    await page.eval(`document.querySelector('[data-skill]').focus()`);
    const o = await page.eval(`(() => { const s = getComputedStyle(document.querySelector('[data-skill]')); return [s.outlineStyle, s.outlineWidth]; })()`);
    assert.notEqual(o[0], 'none');
    assert.notEqual(o[1], '0px');
  } finally { await page.close(); }
});

test('about speaks as a first-year BSIT student', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    assert.match(await page.eval(`document.querySelector('#about').textContent`), /BSIT/);
    assert.equal(await page.eval(`document.querySelectorAll('#about [data-skill]').length`), 0);
    assert.equal(await page.eval(`document.querySelector('#about h2').innerText.replace(/\\s+/g, ' ').trim()`), 'A little about me.');
    assert.match(await page.eval(`document.querySelector('#about').textContent`), /Still learning\. Always curious\./);
    assert.equal(await page.eval(`document.querySelectorAll('.about, .tool-list, .scroll-intro').length`), 0);
    await page.eval(`document.querySelector('#about').scrollIntoView({ behavior: 'instant' })`);
    await page.waitForScrollEnd();
    await page.screenshot(resolve(SHOTS, 'task4-desktop-about.png'));
  } finally { await page.close(); }
});

test('sections order and phone layout', async () => {
  const page = await site.open({ width: 375, height: 812, mobile: true });
  try {
    assert.deepEqual(await page.eval(`[...document.querySelectorAll('main > div > section, main > section')].map((s) => s.id)`).then((a) => a.filter((i) => ['projects', 'skills', 'about'].includes(i))), ['projects', 'skills', 'about']);
    assert.ok(await page.eval(`document.documentElement.scrollWidth - innerWidth`) <= 0, 'no horizontal scroll');
    await page.eval(`document.querySelector('#skills').scrollIntoView({ behavior: 'instant' })`);
    await page.waitForScrollEnd();
    await page.screenshot(resolve(SHOTS, 'task4-mobile-skills.png'));
  } finally { await page.close(); }
});

test('no uncaught errors', async () => {
  assert.ok(site.pages.length > 0);
  for (const page of site.pages) assert.deepEqual(page.errors, []);
});
