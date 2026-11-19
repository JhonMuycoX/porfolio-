// Visual review helper. Run: node tests/screenshots.mjs
// Writes PNGs to tests/screenshots/ (gitignored). Not part of the test suite.
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { startServer, launchBrowser } from './harness.mjs';

const root = resolve(import.meta.dirname, '..');
const out = resolve(import.meta.dirname, 'screenshots');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await mkdir(out, { recursive: true });
const server = await startServer(root);
const browser = await launchBrowser();
try {
  await browser.grantClipboard(new URL(server.url).origin);
  const shot = (page, name) => page.screenshot(resolve(out, `${name}.png`)).then(() => console.log('wrote', name));
  const jump = async (page, id) => {
    await page.eval(`document.querySelector('${id}').scrollIntoView({ behavior: 'instant' })`);
    await page.waitForScrollEnd();
    await sleep(1500); // let scroll reveals finish
  };

  // Desktop 1440x900
  let page = await browser.openPage({ url: server.url, width: 1440, height: 900 });
  await sleep(600);
  await shot(page, 'desktop-01-top');
  const distance = await page.eval(`document.querySelector('[data-scene]').offsetHeight - document.querySelector('[data-scene-stage]').offsetHeight`);
  await page.scrollTo(Math.round(distance * 0.5));
  await sleep(500);
  await shot(page, 'desktop-02-mid-scene');
  await page.scrollTo(distance);
  await sleep(700);
  await shot(page, 'desktop-03-scene-settled');
  await jump(page, '#projects');
  await shot(page, 'desktop-04-projects');
  await page.eval(`document.querySelector('[data-bs-target="#modal-library"]').click()`);
  await page.waitFor(`document.querySelector('#modal-library.show')`);
  await sleep(600);
  await shot(page, 'desktop-05-modal-library');
  await page.eval(`bootstrap.Modal.getInstance(document.querySelector('#modal-library')).hide()`);
  await page.waitFor(`!document.querySelector('#modal-library.show') && !document.querySelector('.modal-backdrop')`);
  await jump(page, '#skills');
  await shot(page, 'desktop-06-skills');
  await jump(page, '#about');
  await shot(page, 'desktop-07-about');
  await jump(page, '#contact');
  await page.eval(`document.querySelector('#copy-email').click()`);
  await page.waitFor(`document.querySelector('#copy-toast.show')`);
  await sleep(500);
  await shot(page, 'desktop-08-contact-toast');
  await sleep(4500);
  await page.eval(`scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })`);
  await page.waitForScrollEnd();
  await sleep(800);
  await shot(page, 'desktop-09-footer');
  await page.close();

  // Phone 375x812
  page = await browser.openPage({ url: server.url, width: 375, height: 812, mobile: true });
  await sleep(600);
  await shot(page, 'phone-01-top');
  await page.eval(`document.querySelector('.navbar-toggler').click()`);
  await page.waitFor(`document.querySelector('#nav-links.show')`);
  await sleep(600);
  await shot(page, 'phone-02-menu-open');
  await page.eval(`document.querySelector('.navbar-toggler').click()`);
  await page.waitFor(`!document.querySelector('#nav-links.show') && !document.querySelector('#nav-links.collapsing')`);
  await jump(page, '#projects');
  await shot(page, 'phone-03-projects');
  await page.eval(`document.querySelector('[data-bs-target="#modal-library"]').click()`);
  await page.waitFor(`document.querySelector('#modal-library.show')`);
  await sleep(600);
  await shot(page, 'phone-04-modal');
  await page.eval(`bootstrap.Modal.getInstance(document.querySelector('#modal-library')).hide()`);
  await page.waitFor(`!document.querySelector('#modal-library.show') && !document.querySelector('.modal-backdrop')`);
  await jump(page, '#skills');
  await shot(page, 'phone-05-skills');
  await jump(page, '#contact');
  await shot(page, 'phone-06-contact');
  await page.close();
} finally {
  await browser.close();
  await server.close();
}
