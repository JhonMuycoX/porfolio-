import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useSite } from './harness.mjs';

const site = useSite();
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const toSkills = async (page) => {
  await page.eval(`document.querySelector('#skills').scrollIntoView({ behavior: 'instant' })`);
  await page.waitForScrollEnd();
};
// Park the badges 30px below the fold: inside the observer margin, not yet painted.
const parkSkills = async (page) => {
  const y = await page.eval(`document.querySelector("#skills [data-skill]").getBoundingClientRect().top + scrollY - innerHeight - 30`);
  await page.scrollTo(Math.round(y));
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
    assert.equal(n.badges, 14);
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
    await parkSkills(page);
    await page.waitFor(`${SKILLS}[2].getAnimations().length > 0`, 300);
    const r = await page.eval(`(() => { const b = ${SKILLS}; const d = (e) => e.getAnimations()[0].effect.getTiming().delay; return { first: b[0].getAnimations().length, d0: d(b[0]), d2: d(b[2]) }; })()`);
    assert.ok(r.first > 0);
    assert.equal(r.d0, 0);
    assert.equal(r.d2, 180);
    await page.waitFor(`[...document.querySelectorAll('#skills [data-reveal]')].every((e) => e.getAnimations().length === 0)`, 3000);
    assert.deepEqual(await page.eval(`[...document.querySelectorAll('#skills [data-reveal]')].filter((e) => getComputedStyle(e).opacity !== '1' || e.getAnimations().length).map((e) => e.textContent.trim().slice(0, 20) + ' ' + getComputedStyle(e).opacity + ' ' + e.getAnimations().length)`), []);
  } finally { await page.close(); }
});

test('re-entering replays the reveal without stacking animations', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    await parkSkills(page);
    await page.waitFor(`${SKILLS}[0].getAnimations().length > 0`, 300);
    await sleep(1200);
    await page.scrollTo(0);
    await sleep(300);
    await parkSkills(page);
    await page.waitFor(`${SKILLS}[0].getAnimations().length > 0`, 300);
    // leave and come back quickly while still animating: never more than one
    await page.scrollTo(0);
    await parkSkills(page);
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

const settled = (page) => page.eval(`new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(ok, 120))))`);
const inViewBadges = `[...document.querySelectorAll("#skills [data-skill]")].filter((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })`;
const assertNoBlink = async (page) => {
  assert.ok(await page.eval(`${inViewBadges}.length`) >= 4, "badges are in view");
  assert.equal(await page.eval(`${inViewBadges}.every((e) => getComputedStyle(e).opacity === "1" && e.getAnimations().length === 0)`), true);
};

test("a jump into view does not blink", async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    await page.scrollTo(0);
    await page.eval(`document.querySelector("#skills [data-skill]").scrollIntoView({ block: "center", behavior: "instant" })`);
    await settled(page);
    await assertNoBlink(page);
  } finally { await page.close(); }
});

test("deep link lands without blinking", async () => {
  // The hash scroll is smooth, so some badges legitimately reveal while entering. Sample every frame
  // from before the page scripts run: a blink is an on-screen element painted plain that then gets an animation.
  const page = await site.open({ width: 1440, height: 900, });
  try {
    await page.send("Page.addScriptToEvaluateOnNewDocument", { source: `
      window.__blinks = [];
      const prev = new Map();
      const sample = () => {
        for (const e of document.querySelectorAll("[data-reveal]")) {
          const r = e.getBoundingClientRect();
          const onScreen = r.top < innerHeight && r.bottom > 0;
          const animating = e.getAnimations().length > 0;
          if (animating && prev.get(e) === "plain") window.__blinks.push(e.textContent.trim().slice(0, 20));
          prev.set(e, onScreen && !animating ? "plain" : "other");
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);` });
    await page.send("Page.navigate", { url: site.url + "?deep=1#skills" });
    await page.waitFor("document.readyState === 'complete' && location.search === '?deep=1'");
    await sleep(500);
    await page.waitForScrollEnd();
    await sleep(2000);
    assert.ok(await page.eval("scrollY") > 1000, "landed on #skills");
    assert.deepEqual(await page.eval("window.__blinks"), []);
    await assertNoBlink(page);
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
