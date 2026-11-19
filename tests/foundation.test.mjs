import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useSite } from './harness.mjs';

const site = useSite();

test('Tailwind beats Bootstrap on base styles', async () => {
  const page = await site.open();
  try {
    const font = await page.eval('getComputedStyle(document.body).fontFamily');
    assert.match(font, /Libre Franklin/);
    // Legacy main/footer links keep Bootstrap blue until Tasks 2-5 rebuild them; Task 5 drops the :not() exclusions.
    const blue = await page.eval(`[...document.querySelectorAll('a:not(main a):not(footer a)')].filter((a) => a.offsetParent !== null && getComputedStyle(a).color === 'rgb(13, 110, 253)').length`);
    assert.equal(blue, 0);
  } finally { await page.close(); }
});

test('navbar turns solid after scrolling', async () => {
  const page = await site.open();
  try {
    const nav = `document.querySelector('#site-nav')`;
    assert.equal(await page.eval(`${nav}.classList.contains('is-scrolled')`), false);
    assert.equal(await page.eval(`getComputedStyle(${nav}).backgroundColor`), 'rgba(0, 0, 0, 0)');
    await page.scrollTo(600);
    await page.waitFor(`${nav}.classList.contains('is-scrolled')`);
    await page.waitFor(`getComputedStyle(${nav}).backgroundColor === 'rgb(20, 43, 35)'`);
  } finally { await page.close(); }
});

test('scroll progress tracks the page', async () => {
  const page = await site.open();
  try {
    const scaleX = `new DOMMatrix(getComputedStyle(document.querySelector('#scroll-progress')).transform).a`;
    assert.equal(await page.eval(scaleX), 0);
    await page.scrollTo(await page.eval('document.documentElement.scrollHeight'));
    await page.waitFor(`${scaleX} > 0.98`);
  } finally { await page.close(); }
});

test('mobile menu opens, and closes after a link tap', async () => {
  const page = await site.open({ width: 375, height: 812, mobile: true });
  try {
    const links = `document.querySelector('#nav-links')`;
    assert.equal(await page.eval(`getComputedStyle(${links}).display`), 'none');
    await page.eval(`document.querySelector('.navbar-toggler').click()`);
    await page.waitFor(`${links}.classList.contains('show')`);
    await page.waitFor(`getComputedStyle(document.querySelector('#site-nav')).backgroundColor === 'rgb(20, 43, 35)'`);
    await page.eval(`document.querySelector('a[data-nav-link][href="#skills"]').click()`);
    await page.waitFor(`!${links}.classList.contains('show') && !${links}.classList.contains('collapsing')`);
  } finally { await page.close(); }
});

test('anchored heading clears the fixed navbar', async () => {
  const page = await site.open();
  try {
    await page.eval(`location.hash = '#skills'`);
    await page.waitForScrollEnd();
    const gap = await page.eval(`document.querySelector('#skills h2').getBoundingClientRect().top - document.querySelector('#site-nav').getBoundingClientRect().bottom`);
    assert.ok(gap >= 0, `gap ${gap}`);
  } finally { await page.close(); }
});

test('no uncaught errors', async () => {
  assert.ok(site.pages.length > 0);
  for (const page of site.pages) assert.deepEqual(page.errors, []);
});
