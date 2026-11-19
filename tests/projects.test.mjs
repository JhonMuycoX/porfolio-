import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useSite } from './harness.mjs';
import { badClassTokens } from './class-audit.mjs';

const site = useSite();
const SLUGS = ['library', 'grades', 'network', 'inventory'];

test('projects section and modals only use allowed classes', () => {
  const html = readFileSync(resolve(import.meta.dirname, '..', 'index.html'), 'utf8');
  const id = html.indexOf('id="projects"');
  assert.ok(id > -1, 'section#projects exists');
  const secStart = html.lastIndexOf('<section', id);
  const secEnd = html.indexOf('</section>', id);
  assert.deepEqual(badClassTokens(html.slice(secStart, secEnd)), []);
  const first = html.indexOf('id="modal-library"');
  assert.ok(first > -1, 'modals exist');
  const modals = html.slice(html.lastIndexOf('<div', first), html.indexOf('</body>'));
  assert.deepEqual(badClassTokens(modals), []);
});

test('four project cards with matching modals', async () => {
  const page = await site.open();
  try {
    const info = await page.eval(`[...document.querySelectorAll('#projects button[data-project]')].map((b) => {
      const m = document.querySelector(b.dataset.bsTarget);
      return { slug: b.dataset.project, toggle: b.dataset.bsToggle, type: b.type, target: b.dataset.bsTarget,
        isModal: !!m && m.classList.contains('modal'),
        title: m && document.getElementById(m.getAttribute('aria-labelledby'))?.tagName };
    })`);
    assert.deepEqual(info.map((i) => i.slug), SLUGS);
    for (const i of info) {
      assert.equal(i.toggle, 'modal');
      assert.equal(i.type, 'button');
      assert.equal(i.target, `#modal-${i.slug}`);
      assert.ok(i.isModal);
      assert.equal(i.title, 'H2');
    }
    assert.equal(await page.eval(`document.querySelector('#projects h2').textContent.trim()`), 'Things I’ve built.');
    // Poster art is decorative, so a card's accessible name comes from the project name.
    assert.equal(await page.eval(`document.querySelectorAll('#projects [data-project] [data-poster][aria-hidden="true"]').length`), 4);
    const name = await page.eval(`(() => { const c = document.querySelector('#projects [data-project="grades"]').cloneNode(true); c.querySelectorAll('[aria-hidden]').forEach((n) => n.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); })()`);
    assert.match(name, /^Student Grade Tracker/);
    assert.doesNotMatch(name, /A\+|Every score/);
  } finally { await page.close(); }
});

test('projects sit on cream paper with ink text', async () => {
  const page = await site.open();
  try {
    const c = await page.eval(`(() => { const s = document.querySelector('#projects'); const bg = (e) => getComputedStyle(e).backgroundColor;
      return { bg: bg(s), wrap: bg(s.parentElement), h: getComputedStyle(s.querySelector('h2')).color }; })()`);
    assert.ok(c.bg === 'rgb(241, 240, 232)' || c.wrap === 'rgb(241, 240, 232)', JSON.stringify(c));
    assert.equal(c.h, 'rgb(20, 43, 35)');
  } finally { await page.close(); }
});

test('cards use the grid, poster colors, and no blue links', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    const grid = await page.eval(`(() => { const s = getComputedStyle(document.querySelector('#projects [data-project]').parentElement); return [s.display, s.gridTemplateColumns.split(' ').length]; })()`);
    assert.deepEqual(grid, ['grid', 2]);
    assert.equal(await page.eval(`getComputedStyle(document.querySelector('[data-project="library"] [data-poster]')).backgroundColor`), 'rgb(237, 207, 105)');
    const links = await page.eval(`[...document.querySelectorAll('#projects a, .modal a')].map((a) => getComputedStyle(a).color)`);
    for (const c of links) assert.notEqual(c, 'rgb(13, 110, 253)');
    await page.eval(`document.querySelector('#projects').scrollIntoView({ behavior: 'instant' })`);
    await page.waitForScrollEnd();
  } finally { await page.close(); }
});

test('click opens the modal, Escape closes it and returns focus', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    await page.eval(`document.querySelector('[data-project="library"]').click()`);
    await page.waitFor(`document.querySelector('#modal-library.show')`);
    await page.waitFor(`document.querySelector('#modal-library').contains(document.activeElement)`);
    assert.equal(await page.eval(`document.querySelector('#modal-library-title').textContent.trim()`), 'Library Management System');
    const c = await page.eval(`(() => { const s = getComputedStyle(document.querySelector('#modal-library .modal-content')); return [s.backgroundColor, s.borderTopWidth, s.borderTopLeftRadius]; })()`);
    assert.deepEqual(c, ['rgb(241, 240, 232)', '0px', '0px']);
    assert.equal(await page.eval(`document.querySelectorAll('#modal-library .modal-body li').length`), 3);
    assert.equal(await page.eval(`document.querySelector('#modal-library .btn-close').getAttribute('aria-label')`), 'Close');
    await page.press('Escape');
    await page.waitFor(`!document.querySelector('#modal-library.show')`);
    await page.waitFor(`document.activeElement === document.querySelector('[data-project="library"]')`);
  } finally { await page.close(); }
});

test('Enter on a focused card opens its modal', async () => {
  const page = await site.open();
  try {
    await page.eval(`document.querySelector('[data-project="grades"]').focus()`);
    await page.press('Enter');
    await page.waitFor(`document.querySelector('#modal-grades.show')`);
  } finally { await page.close(); }
});

test('every modal opens with its own title and closes with the X', async () => {
  const page = await site.open();
  try {
    for (const slug of SLUGS) {
      await page.eval(`document.querySelector('[data-project="${slug}"]').click()`);
      await page.waitFor(`document.querySelector('#modal-${slug}.show')`);
      await page.waitFor(`document.querySelector('#modal-${slug}').contains(document.activeElement)`);
      assert.ok((await page.eval(`document.querySelector('#modal-${slug}-title').textContent.trim()`)).length > 3);
      await page.eval(`document.querySelector('#modal-${slug} .btn-close').click()`);
      await page.waitFor(`!document.querySelector('.modal.show') && !document.querySelector('.modal-backdrop')`);
    }
  } finally { await page.close(); }
});

test('modal fits a phone', async () => {
  const page = await site.open({ width: 375, height: 667, mobile: true });
  try {
    assert.ok(await page.eval(`document.documentElement.scrollWidth - innerWidth`) <= 0, 'no overflow before opening');
    await page.eval(`document.querySelector('[data-project="inventory"]').click()`);
    await page.waitFor(`document.querySelector('#modal-inventory.show')`);
    await page.waitFor(`document.querySelector('#modal-inventory').contains(document.activeElement)`);
    const m = await page.eval(`(() => {
      const b = document.querySelector('#modal-inventory .modal-body');
      const c = document.querySelector('#modal-inventory .modal-content').getBoundingClientRect();
      return { scrolls: b.scrollHeight > b.clientHeight && getComputedStyle(b).overflowY !== 'visible', fits: b.scrollHeight <= b.clientHeight,
        w: c.width, h: c.height, over: document.documentElement.scrollWidth - innerWidth };
    })()`);
    assert.ok(m.scrolls || m.fits, JSON.stringify(m));
    assert.ok(m.w <= 375 && m.h <= 667, JSON.stringify(m));
    assert.ok(m.over <= 0, JSON.stringify(m));
    await page.eval(`document.querySelector('#modal-inventory .btn-close').click()`);
    await page.waitFor(`!document.querySelector('.modal.show') && !document.querySelector('.modal-backdrop')`);
    await page.eval(`document.querySelector('#projects').scrollIntoView({ behavior: 'instant' })`);
    await page.waitForScrollEnd();
  } finally { await page.close(); }
});

test('card motion is off under reduced motion', async () => {
  const page = await site.open({ reducedMotion: true });
  try {
    assert.equal(await page.eval(`getComputedStyle(document.querySelector('[data-project]')).transitionDuration`), '0s');
  } finally { await page.close(); }
});

test('no uncaught errors', async () => {
  assert.ok(site.pages.length > 0);
  for (const page of site.pages) assert.deepEqual(page.errors, []);
});
