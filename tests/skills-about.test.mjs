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

const SKILLS = [
  ['Programming', [['Python', 'Used in my Inventory App'], ['Java', 'Used in my Student Grade Tracker'], ['PHP', 'Used in my Library Management System'], ['C++', 'Learning it in my programming class']]],
  ['Web Development', [['HTML', 'The structure of every page I build'], ['CSS', 'Layouts, colors and responsive pages'], ['JavaScript', 'Adds interaction, like the typing effect here'], ['Bootstrap', 'Used in my Library Management System and this site'], ['Tailwind CSS', 'Used to style this portfolio']]],
  ['Tools', [['Git', 'Saving versions of my projects'], ['GitHub', 'Keeping my projects online'], ['VS Code', 'My everyday code editor'], ['MySQL', 'Database for my Library Management System'], ['Cisco Packet Tracer', 'Used in my Network Setup Lab']]],
];

test('three skill groups with the real skills in order', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    assert.equal(await page.eval(`document.querySelector('#skills h2').textContent.trim()`), 'Skills I’m building.');
    const groups = await page.eval(`[...document.querySelectorAll('#skills [data-skill-group]')].map((g) => ({
      title: g.querySelector('h3').textContent.trim(), reveal: g.hasAttribute('data-reveal-group'),
      skills: [...g.querySelectorAll('[data-skill]')].map((s) => [s.textContent.trim(), s.tabIndex, s.dataset.bsToggle, s.dataset.bsTitle, s.hasAttribute('data-reveal')]) }))`);
    assert.deepEqual(groups.map((g) => g.title), SKILLS.map(([t]) => t));
    groups.forEach((g, i) => {
      assert.ok(g.reveal);
      assert.deepEqual(g.skills, SKILLS[i][1].map(([n, note]) => [n, 0, 'tooltip', note, true]));
    });
    assert.equal(await page.eval(`document.querySelectorAll('#skills [data-skill]').length`), 14);
    const cols = await page.eval(`getComputedStyle(document.querySelector('[data-skill-group]').parentElement).gridTemplateColumns.split(' ').length`);
    assert.equal(cols, 3);
    const bgs = await page.eval(`[...document.querySelectorAll('[data-skill-group]:first-child [data-skill]')].map((s) => getComputedStyle(s).backgroundColor)`);
    assert.deepEqual(bgs, ['rgb(237, 207, 105)', 'rgb(198, 213, 183)', 'rgb(214, 172, 184)', 'rgb(226, 229, 216)']);
    assert.equal(await page.eval(`getComputedStyle(document.querySelector('[data-skill]')).color`), 'rgb(20, 43, 35)');
  } finally { await page.close(); }
});

test('every badge and heading has an aria-hidden Bootstrap icon that renders', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    await page.waitFor(`document.fonts.check('16px bootstrap-icons')`);
    const r = await page.eval(`(() => {
      const check = (host) => { const i = host.querySelector('i.bi[aria-hidden="true"]'); if (!i) return false; const c = getComputedStyle(i, '::before').content; return c !== 'none' && c !== '""' && c !== 'normal'; };
      return { badges: [...document.querySelectorAll('#skills [data-skill]')].map(check), heads: [...document.querySelectorAll('#skills [data-skill-group] h3')].map((h) => check(h.parentElement)) };
    })()`);
    assert.equal(r.badges.length, 14);
    assert.ok(r.badges.every(Boolean), 'all badge icons render');
    assert.equal(r.heads.length, 3);
    assert.ok(r.heads.every(Boolean), 'all heading icons render');
  } finally { await page.close(); }
});

test('keyboard focus shows the real tooltip with a visible ring', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    await page.eval(`document.querySelector('#skills').scrollIntoView({ behavior: 'instant' })`);
    await page.waitForScrollEnd();
    await page.eval(`document.querySelector('[data-skill]').focus()`);
    await page.waitFor(`document.querySelector('.tooltip.show')`);
    assert.equal(await page.eval(`document.querySelector('.tooltip.show').textContent.trim()`), 'Used in my Inventory App');
    await page.waitFor(`getComputedStyle(document.querySelector('.tooltip.show')).opacity === '1'`);
    await page.waitFor(`document.querySelector('[data-skill]').querySelector('i').getAnimations().length > 0`);
    await page.screenshot(resolve(SHOTS, 'task6b-desktop-skills.png'));
    await page.eval(`document.activeElement.blur()`);
    await page.waitFor(`!document.querySelector('.tooltip.show')`);
  } finally { await page.close(); }
});

test('heading icons float and badges wiggle only with motion allowed', async () => {
  const tile = `document.querySelector('#skills [data-skill-group] h3').parentElement.querySelector('i').parentElement`;
  const page = await site.open({ width: 1440, height: 900 });
  try {
    assert.ok(await page.eval(`${tile}.getAnimations().length`) > 0, 'heading tile floats');
    const delays = await page.eval(`[...document.querySelectorAll('#skills [data-skill-group] h3')].map((h) => getComputedStyle(h.parentElement.querySelector('i').parentElement).animationDelay)`);
    assert.equal(new Set(delays).size, 3, 'float delays differ');
    await page.eval(`document.querySelector('[data-skill]').focus()`);
    await page.waitFor(`document.querySelector('[data-skill] i').getAnimations().length > 0`);
  } finally { await page.close(); }
  const calm = await site.open({ width: 1440, height: 900, reducedMotion: true });
  try {
    assert.equal(await calm.eval(`${tile}.getAnimations().length`), 0);
    await calm.eval(`document.querySelector('[data-skill]').focus()`);
    await calm.waitFor(`document.querySelector('.tooltip.show')`);
    assert.equal(await calm.eval(`document.querySelector('[data-skill] i').getAnimations().length`), 0);
    assert.equal(await calm.eval(`getComputedStyle(document.querySelector('[data-skill]')).transitionDuration`), '0s');
  } finally { await calm.close(); }
});

test('intro line', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    assert.match(await page.eval(`document.querySelector('#skills').textContent`), /What I’m learning in BSIT so far\./);
    assert.doesNotMatch(await page.eval(`document.querySelector('#skills').textContent`), /Placeholders/);
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
    await page.screenshot(resolve(SHOTS, 'task6b-mobile-skills.png'));
  } finally { await page.close(); }
});

test('no uncaught errors', async () => {
  assert.ok(site.pages.length > 0);
  for (const page of site.pages) assert.deepEqual(page.errors, []);
});
