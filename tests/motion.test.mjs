import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useSite } from './harness.mjs';

const site = useSite();
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const toSkills = async (page) => {
  await page.eval(`document.querySelector('#skills').scrollIntoView({ behavior: 'instant' })`);
  await page.waitForScrollEnd();
};
const SKILLS = `[...document.querySelectorAll('#skills [data-skill-group]:first-child [data-skill]')]`;

test('reveal hooks exist on headings, cards, badges, about and contact', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    const n = await page.eval(`({
      h2: [...document.querySelectorAll('#projects h2, #skills h2, #about h2, #contact h2')].every((h) => h.hasAttribute('data-reveal')),
      cards: document.querySelectorAll('[data-project][data-reveal]').length,
      badges: document.querySelectorAll('[data-skill][data-reveal]').length,
      contact: document.querySelectorAll('#contact [data-reveal]').length,
      about: document.querySelectorAll('#about [data-reveal]').length,
      scene: document.querySelectorAll('[data-scene] [data-reveal], .modal [data-reveal], #copy-toast [data-reveal]').length,
    })`);
    assert.equal(n.h2, true);
    assert.equal(n.cards, 4);
    assert.equal(n.badges, 12);
    assert.ok(n.contact >= 3);
    assert.ok(n.about >= 2);
    assert.equal(n.scene, 0);
  } finally { await page.close(); }
});

test('reveal elements are visible before they animate', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    assert.equal(await page.eval(`getComputedStyle(document.querySelector('#skills [data-reveal]')).opacity`), '1');
  } finally { await page.close(); }
});

test('entering view plays a staggered reveal', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    await toSkills(page);
    await page.waitFor(`${SKILLS}[2].getAnimations().length > 0`, 300);
    const r = await page.eval(`(() => { const b = ${SKILLS}; const d = (e) => e.getAnimations()[0].effect.getTiming().delay; return { first: b[0].getAnimations().length, d0: d(b[0]), d2: d(b[2]) }; })()`);
    assert.ok(r.first > 0);
    assert.equal(r.d0, 0);
    assert.equal(r.d2, 180);
    await sleep(1500);
    assert.equal(await page.eval(`[...document.querySelectorAll('#skills [data-reveal]')].every((e) => getComputedStyle(e).opacity === '1' && e.getAnimations().length === 0)`), true);
  } finally { await page.close(); }
});

test('re-entering replays the reveal without stacking animations', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    await toSkills(page);
    await page.waitFor(`${SKILLS}[0].getAnimations().length > 0`, 300);
    await sleep(1200);
    await page.scrollTo(0);
    await sleep(300);
    await toSkills(page);
    await page.waitFor(`${SKILLS}[0].getAnimations().length > 0`, 300);
    // leave and come back quickly while still animating: never more than one
    await page.scrollTo(0);
    await toSkills(page);
    await sleep(100);
    assert.equal(await page.eval(`Math.max(...${SKILLS}.map((e) => e.getAnimations().length))`), 1);
  } finally { await page.close(); }
});

test('reveal starts just before the element enters the viewport', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    // Park the third badge 30px below the fold, inside the 10% root margin.
    const y = await page.eval(`${SKILLS}[2].getBoundingClientRect().top + scrollY - innerHeight - 30`);
    await page.scrollTo(Math.round(y));
    assert.equal(await page.eval(`${SKILLS}[2].getBoundingClientRect().top > innerHeight`), true);
    await page.waitFor(`${SKILLS}[2].getAnimations().length > 0`, 500);
    assert.equal(await page.eval(`${SKILLS}[2].getBoundingClientRect().top > innerHeight`), true);
  } finally { await page.close(); }
});

test('reduced motion: no reveal animations', async () => {
  const page = await site.open({ width: 1440, height: 900, reducedMotion: true });
  try {
    await toSkills(page);
    await sleep(300);
    assert.equal(await page.eval(`[...document.querySelectorAll('[data-reveal]')].filter((e) => e.getAnimations().length).length`), 0);
    assert.equal(await page.eval(`getComputedStyle(document.querySelector('#skills [data-reveal]')).opacity`), '1');
  } finally { await page.close(); }
});

test('no uncaught errors across a full scroll', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    const max = await page.eval(`document.documentElement.scrollHeight - innerHeight`);
    for (let y = 0; y <= max; y += 300) { await page.scrollTo(y); await sleep(40); }
    for (let y = max; y >= 0; y -= 600) { await page.scrollTo(y); await sleep(40); }
  } finally { await page.close(); }
  assert.ok(site.pages.length > 0);
  for (const p of site.pages) assert.deepEqual(p.errors, []);
});
