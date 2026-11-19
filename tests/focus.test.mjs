import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useSite } from './harness.mjs';

const site = useSite();
const FOREST = 'rgb(20, 43, 35)';
const BS_BLUE = /13,\s*110,\s*253/;

const rgb = (s) => s.match(/rgba?\(([^)]+)\)/)[1].split(',').slice(0, 3).map((n) => parseFloat(n));
const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// Bootstrap's .btn-close-white: filter invert(1) grayscale(100%) brightness(200%), applied to the ring too.
const whiteFilter = (c) => {
  const inv = c.map((v) => 255 - v);
  const g = 0.2126 * inv[0] + 0.7152 * inv[1] + 0.0722 * inv[2];
  const out = Math.min(255, g * 2);
  return [out, out, out];
};

// Tab until `selector` is the active element (real key presses), then describe the focus indicator.
async function tabTo(page, selector, max = 40) {
  for (let i = 0; i < max; i++) {
    if (await page.eval(`document.activeElement?.matches(${JSON.stringify(selector)})`)) break;
    await page.press('Tab');
  }
  assert.equal(await page.eval(`document.activeElement?.matches(${JSON.stringify(selector)})`), true, `could not Tab to ${selector}`);
  return page.eval(`(() => {
    const el = document.activeElement; const s = getComputedStyle(el);
    let bg = null, n = el;
    while (n && !bg) { const c = getComputedStyle(n).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') bg = c; n = n.parentElement; }
    return { outlineStyle: s.outlineStyle, outlineWidth: parseFloat(s.outlineWidth), outlineColor: s.outlineColor,
      shadow: s.boxShadow, filter: s.filter, bg: bg || getComputedStyle(document.body).backgroundColor,
      onModal: !!el.closest('.modal') };
  })()`);
}

function ringColour(f) {
  if (f.outlineStyle !== 'none' && f.outlineWidth >= 2) return f.outlineColor;
  if (f.shadow !== 'none') return (f.shadow.match(/rgba?\([^)]+\)/g) || []).find((c) => !/,\s*0\)$/.test(c)) || null;
  return null;
}
function assertVisible(name, f, bgOverride) {
  const ring = ringColour(f);
  assert.ok(ring, `${name}: no focus indicator ${JSON.stringify(f)}`);
  assert.doesNotMatch(ring, BS_BLUE, `${name}: Bootstrap blue ring`);
  const bg = bgOverride || f.bg;
  let c = rgb(ring);
  if (/invert/.test(f.filter)) c = whiteFilter(c);
  assert.notDeepEqual(c, rgb(bg), `${name}: ring equals background`);
  const ratio = contrast(c, rgb(bg));
  assert.ok(ratio >= 3, `${name}: ring contrast ${ratio.toFixed(2)} vs ${bg} (${ring}) ${JSON.stringify(f)}`);
  return ring;
}

test('navbar toggler shows a visible keyboard ring on phones', async () => {
  const page = await site.open({ width: 375, height: 812, mobile: true });
  try {
    const f = await tabTo(page, '.navbar-toggler');
    assertVisible('toggler', f, FOREST);
    assert.notEqual(ringColour(f), FOREST);
  } finally { await page.close(); }
});

test('hero button ring is not forest on the forest hero', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    const f = await tabTo(page, 'a[href="#projects"].tw-bg-lime');
    assertVisible('hero button', f, FOREST);
    assert.notEqual(ringColour(f), FOREST);
  } finally { await page.close(); }
});

test('copy button ring contrasts with the sage contact band', async () => {
  const page = await site.open({ width: 1440, height: 900 });
  try {
    await page.eval(`document.querySelector('#copy-email').scrollIntoView({ behavior: 'instant' })`);
    await page.waitForScrollEnd();
    const f = await tabTo(page, '#copy-email', 80);
    assertVisible('copy button', f, 'rgb(198, 213, 183)');
  } finally { await page.close(); }
});

async function openModal(page, slug) {
  await page.eval(`document.querySelector('[data-project="${slug}"]').scrollIntoView({ behavior: 'instant' })`);
  await page.waitForScrollEnd();
  await tabTo(page, `[data-project="${slug}"]`, 40);
  await page.press('Enter');
  await page.waitFor(`document.querySelector('#modal-${slug}').classList.contains('show')`);
  await page.waitFor(`getComputedStyle(document.querySelector('#modal-${slug}')).opacity === '1'`);
}

// Keyboard focus on the close button: Tab if it is reachable quickly, else focus with the focus-visible hint.
async function focusClose(page, selector) {
  for (let i = 0; i < 4; i++) {
    if (await page.eval(`document.activeElement?.matches(${JSON.stringify(selector)})`)) break;
    await page.press('Tab');
  }
  await page.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (document.activeElement !== el) el.focus({ focusVisible: true }); })()`);
  return page.eval(`(() => {
    const el = document.activeElement; const s = getComputedStyle(el);
    return { fv: el.matches(':focus-visible'), isClose: el.matches(${JSON.stringify(selector)}), shadow: s.boxShadow, filter: s.filter,
      outlineStyle: s.outlineStyle, outlineWidth: parseFloat(s.outlineWidth), outlineColor: s.outlineColor, bg: null };
  })()`);
}

for (const [slug, headerBg] of [['library', 'rgb(237, 207, 105)'], ['inventory', 'rgb(32, 61, 58)']]) {
  test(`${slug} modal close button has an on-palette visible ring`, async () => {
    const page = await site.open({ width: 1440, height: 900 });
    try {
      await openModal(page, slug);
      const f = await focusClose(page, `#modal-${slug} .btn-close`);
      assert.equal(f.isClose, true);
      assert.equal(f.fv, true, ':focus-visible must match');
      assertVisible(`${slug} close`, { ...f, outlineStyle: 'none' }, headerBg);
      if (slug === 'library') assert.match(f.shadow, /rgb\(20, 43, 35\)/);
    } finally { await page.close(); }
  });
}

async function hoverTransform(page, selector) {
  await page.eval(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({ block: 'center', behavior: 'instant' })`);
  await page.waitForScrollEnd();
  const r = await page.eval(`(() => { const b = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })()`);
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y });
  await page.waitFor(`document.querySelector(${JSON.stringify(selector)}).matches(':hover')`);
  await new Promise((ok) => setTimeout(ok, 400));
  return page.eval(`getComputedStyle(document.querySelector(${JSON.stringify(selector)})).transform`);
}

for (const [name, selector] of [['copy button', '#copy-email'], ['hero button', 'a[href="#projects"].tw-bg-lime']]) {
  test(`${name} hover lift respects reduced motion`, async () => {
    const calm = await site.open({ width: 1440, height: 900, reducedMotion: true });
    try {
      assert.equal(await hoverTransform(calm, selector), 'none');
    } finally { await calm.close(); }
    const lively = await site.open({ width: 1440, height: 900 });
    try {
      const t = await hoverTransform(lively, selector);
      assert.notEqual(t, 'none');
      assert.match(t, /matrix\(1, 0, 0, 1, 0, -3\)/);
    } finally { await lively.close(); }
  });
}
