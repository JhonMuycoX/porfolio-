import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useSite } from './harness.mjs';

const site = useSite();
const EMAIL = 'muyco@example.com';

async function toContact(page) {
  await page.eval(`document.querySelector('#contact').scrollIntoView({ behavior: 'instant' })`);
  await page.waitForScrollEnd();
}
const toastText = (page) => page.eval(`document.querySelector('#copy-toast-text').textContent.trim()`);

test('contact copy and structure', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    assert.equal(await page.eval(`document.querySelector('#contact h2').textContent.trim()`), 'Let’s connect.');
    assert.match(await page.eval(`document.querySelector('#contact').textContent`), /Class project\? New idea\? Send me an email\./);
    assert.equal(await page.eval(`getComputedStyle(document.querySelector('#contact')).backgroundColor`), 'rgb(198, 213, 183)');
    assert.equal(await page.eval(`document.querySelectorAll('#contact .bi-clipboard, #contact .bi-envelope').length`), 2);
  } finally { await page.close(); }
});

test('email link', async () => {
  const page = await site.open();
  try {
    assert.equal(await page.eval(`document.querySelector('#contact-email').getAttribute('href')`), `mailto:${EMAIL}`);
    assert.equal(await page.eval(`document.querySelector('#contact-email').textContent.trim()`), EMAIL);
    assert.equal(await page.eval(`document.querySelector('#copy-email').dataset.email`), EMAIL);
    const c = await page.eval(`getComputedStyle(document.querySelector('#contact-email')).color`);
    assert.notEqual(c, 'rgb(13, 110, 253)');
  } finally { await page.close(); }
});

test('copy success shows toast and fills clipboard', async () => {
  await site.browser.grantClipboard(site.url);
  const page = await site.open({ width: 1440, height: 900 });
  try {
    await toContact(page);
    await page.eval(`document.querySelector('#copy-email').click()`);
    await page.waitFor(`document.querySelector('#copy-toast').classList.contains('show')`);
    assert.equal(await toastText(page), 'Email copied!');
    assert.equal(await page.eval(`navigator.clipboard.readText()`), EMAIL);
    const t = await page.eval(`(() => { const t = document.querySelector('#copy-toast'); const s = getComputedStyle(t); const r = t.getBoundingClientRect(); return { color: s.color, bg: s.backgroundColor, border: s.borderTopWidth, role: t.parentElement.getAttribute('role'), live: t.parentElement.getAttribute('aria-live'), right: innerWidth - r.right, bottom: innerHeight - r.bottom, pos: s.position }; })()`);
    assert.equal(t.color, 'rgb(230, 236, 218)');
    assert.equal(t.bg, 'rgb(20, 43, 35)');
    assert.equal(t.border, '0px');
    assert.equal(t.role, 'status');
    assert.equal(t.live, 'polite');
    assert.equal(t.pos, 'fixed');
    assert.ok(t.right > 0 && t.right < 80 && t.bottom > 0 && t.bottom < 80, JSON.stringify(t));
    await page.waitFor(`getComputedStyle(document.querySelector('#copy-toast')).opacity === '1'`);
    assert.deepEqual(page.errors, []);
  } finally { await page.close(); }
});

test('toast is bottom-center on phones', async () => {
  await site.browser.grantClipboard(site.url);
  const page = await site.open({ width: 375, height: 812, mobile: true });
  try {
    await toContact(page);
    await page.eval(`document.querySelector('#copy-email').click()`);
    await page.waitFor(`document.querySelector('#copy-toast').classList.contains('show')`);
    const r = await page.eval(`(() => { const b = document.querySelector('#copy-toast').getBoundingClientRect(); return { l: b.left, r: innerWidth - b.right }; })()`);
    assert.ok(Math.abs(r.l - r.r) < 2, JSON.stringify(r));
    assert.equal(await page.eval(`document.documentElement.scrollWidth <= innerWidth`), true);
    await page.waitFor(`getComputedStyle(document.querySelector('#copy-toast')).opacity === '1'`);
  } finally { await page.close(); }
});

test('copy rejection falls back', async () => {
  const page = await site.open();
  try {
    await page.eval(`navigator.clipboard.writeText = () => Promise.reject(new Error('x'))`);
    await page.eval(`document.querySelector('#copy-email').click()`);
    await page.waitFor(`document.querySelector('#copy-toast').classList.contains('show')`);
    assert.equal(await toastText(page), `Couldn't copy. The email is ${EMAIL}`);
    assert.deepEqual(page.errors, []);
  } finally { await page.close(); }
});

test('missing clipboard API falls back without errors', async () => {
  const page = await site.open();
  try {
    await page.eval(`Object.defineProperty(navigator, 'clipboard', { value: undefined })`);
    await page.eval(`document.querySelector('#copy-email').click()`);
    await page.waitFor(`document.querySelector('#copy-toast').classList.contains('show')`);
    assert.equal(await toastText(page), `Couldn't copy. The email is ${EMAIL}`);
    assert.deepEqual(page.errors, []);
  } finally { await page.close(); }
});

test('footer', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    const f = await page.eval(`(() => { const f = document.querySelector('footer'); const w = f.querySelector('[data-wordmark]'); const s = getComputedStyle(f); return { word: w.textContent.trim(), hidden: w.getAttribute('aria-hidden'), bg: s.backgroundColor, color: s.color, text: f.textContent, top: !!f.querySelector('a[href="#top"]'), size: parseFloat(getComputedStyle(w).fontSize) }; })()`);
    assert.equal(f.word, 'MUYCO');
    assert.equal(f.hidden, 'true');
    assert.equal(f.bg, 'rgb(20, 43, 35)');
    assert.equal(f.color, 'rgb(230, 236, 218)');
    assert.match(f.text, /A first-year BSIT portfolio, made with curiosity\./);
    assert.match(f.text, /Learning a little more with every project\./);
    assert.ok(f.top);
    assert.ok(f.size > 300, `wordmark size ${f.size}`);
    await page.scrollTo(99999);
    await page.waitFor(`document.querySelector('#site-nav').classList.contains('is-scrolled')`);
    await page.waitFor(`getComputedStyle(document.querySelector('#site-nav')).backgroundColor === 'rgb(20, 43, 35)'`);
  } finally { await page.close(); }
});

test('no horizontal scroll at 375px', async () => {
  const page = await site.open({ width: 375, height: 812, mobile: true });
  try {
    assert.equal(await page.eval(`document.documentElement.scrollWidth <= innerWidth`), true);
  } finally { await page.close(); }
});

test('init survives a missing bootstrap global and copy still works', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    await site.browser.grantClipboard(new URL(site.url).origin);
    const err = await page.eval(`(() => { delete window.bootstrap; try { initTooltips(); return null; } catch (e) { return e.message; } })()`);
    assert.equal(err, null, 'initTooltips must be a no-op without bootstrap');
    await toContact(page);
    await page.eval(`document.querySelector('#copy-email').click()`);
    await page.waitFor(`document.querySelector('#copy-toast-text').textContent.trim() === 'Email copied!'`);
  } finally { await page.close(); }
});

test('toast sits inside an always-rendered polite live region', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    const r = await page.eval(`(() => {
      const w = document.querySelector('#copy-toast').parentElement;
      return { live: w.getAttribute('aria-live'), atomic: w.getAttribute('aria-atomic'), display: getComputedStyle(w).display,
        toastLive: document.querySelector('#copy-toast').hasAttribute('aria-live') };
    })()`);
    assert.deepEqual(r, { live: 'polite', atomic: 'true', display: 'block', toastLive: false });
  } finally { await page.close(); }
});
