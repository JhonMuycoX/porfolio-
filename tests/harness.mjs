import http from 'node:http';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve, normalize, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { before, after } from 'node:test';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function startServer(root) {
  const base = resolve(root);
  const server = http.createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (path.endsWith('/')) path += 'index.html';
      const file = normalize(join(base, path));
      if (file !== base && !file.startsWith(base + sep)) throw new Error('outside root');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  return {
    url: `http://127.0.0.1:${server.address().port}/`,
    close: () => new Promise((ok) => { server.closeAllConnections?.(); server.close(ok); }),
  };
}

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ];
  const found = candidates.find((p) => p && existsSync(p));
  if (!found) throw new Error('No Chrome or Edge found. Set CHROME_PATH.');
  return found;
}

class Connection {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
    const failAll = () => {
      for (const p of this.pending.values()) p.reject(new Error('Chrome connection closed'));
      this.pending.clear();
    };
    ws.addEventListener('close', failAll);
    ws.addEventListener('error', failAll);
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id) {
        const p = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) p?.reject(new Error(msg.error.message));
        else p?.resolve(msg.result);
      } else {
        for (const fn of this.listeners) fn(msg);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      if (this.ws.readyState !== WebSocket.OPEN) return reject(new Error('Chrome connection closed'));
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }
}

export class Page {
  constructor(conn, sessionId, targetId) {
    this.conn = conn;
    this.sessionId = sessionId;
    this.targetId = targetId;
    this.errors = [];
  }
  send(method, params) { return this.conn.send(method, params, this.sessionId); }

  async eval(expr) {
    const r = await this.send('Runtime.evaluate', {
      expression: expr, awaitPromise: true, returnByValue: true, userGesture: true,
    });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error(d.exception?.description || d.text);
    }
    return r.result.value;
  }
  async waitFor(expr, timeoutMs = 5000) {
    const end = Date.now() + timeoutMs;
    let last;
    while (Date.now() < end) {
      try { last = await this.eval(expr); if (last) return last; } catch (e) { last = e; }
      await sleep(50);
    }
    throw new Error(`waitFor timed out: ${expr} (last: ${last?.message ?? last})`);
  }
  async press(key) {
    const codes = { Enter: 13, Escape: 27, Tab: 9 };
    const base = { key, code: key, windowsVirtualKeyCode: codes[key] };
    // A real Enter press carries a character, which is what makes a focused button click.
    if (key === 'Enter') base.text = '\r';
    await this.send('Input.dispatchKeyEvent', { type: 'keyDown', ...base });
    await this.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
  }
  async scrollTo(y) {
    await this.eval(`new Promise((ok) => { scrollTo({ top: ${y}, behavior: 'instant' }); requestAnimationFrame(() => requestAnimationFrame(ok)); })`);
  }
  async waitForScrollEnd() {
    let last = await this.eval('scrollY');
    let since = Date.now();
    const end = Date.now() + 10000;
    while (Date.now() < end) {
      await sleep(50);
      const now = await this.eval('scrollY');
      if (now !== last) { last = now; since = Date.now(); }
      else if (Date.now() - since >= 200) return last;
    }
    throw new Error('scroll did not settle');
  }
  async screenshot(path) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    await writeFile(path, Buffer.from(data, 'base64'));
  }
  async close() {
    this.conn.listeners.delete(this.onEvent);
    await this.conn.send('Target.closeTarget', { targetId: this.targetId }).catch(() => {});
  }
}

export class Browser {
  constructor(proc, conn, dir) { this.proc = proc; this.conn = conn; this.dir = dir; }

  async openPage({ url, width = 1440, height = 900, mobile = false, reducedMotion = false }) {
    const { targetId } = await this.conn.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await this.conn.send('Target.attachToTarget', { targetId, flatten: true });
    const page = new Page(this.conn, sessionId, targetId);
    page.onEvent = (msg) => {
      if (msg.sessionId === sessionId && msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        page.errors.push(d.exception?.description || d.text);
      }
    };
    this.conn.listeners.add(page.onEvent);
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Page.bringToFront');
    await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await page.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' }],
    });
    const loaded = new Promise((ok) => {
      const fn = (msg) => {
        if (msg.sessionId === sessionId && msg.method === 'Page.loadEventFired') { this.conn.listeners.delete(fn); ok(); }
      };
      this.conn.listeners.add(fn);
    });
    await page.send('Page.navigate', { url });
    let timer;
    const timeout = new Promise((_, fail) => { timer = setTimeout(() => fail(new Error(`Page load timed out: ${url}`)), 15000); });
    try { await Promise.race([loaded, timeout]); } finally { clearTimeout(timer); }
    await page.waitFor(`getComputedStyle(document.body).backgroundColor === 'rgb(20, 43, 35)'`, 15000);
    return page;
  }

  grantClipboard(origin) {
    return this.conn.send('Browser.grantPermissions', {
      origin, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
    });
  }

  async close() {
    try { await this.conn.send('Browser.close'); } catch {}
    let timer;
    await new Promise((ok) => {
      if (this.proc.exitCode !== null) ok();
      else { this.proc.once('exit', ok); timer = setTimeout(ok, 3000); }
    });
    clearTimeout(timer);
    this.proc.kill();
    await rm(this.dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
  }
}

export async function launchBrowser() {
  const dir = await mkdtemp(join(tmpdir(), 'muyco-chrome-'));
  const proc = spawn(chromePath(), [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`,
    '--no-first-run', '--no-default-browser-check', 'about:blank',
  ], { stdio: 'ignore' });
  try {
    let port;
    for (let i = 0; i < 200 && !port; i++) {
      await sleep(100);
      try { port = (await readFile(join(dir, 'DevToolsActivePort'), 'utf8')).split('\n')[0].trim(); } catch {}
    }
    if (!port) throw new Error('Chrome did not expose a debugging port');
    const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
    const ws = new WebSocket(webSocketDebuggerUrl);
    await new Promise((ok, fail) => { ws.addEventListener('open', ok); ws.addEventListener('error', fail); });
    return new Browser(proc, new Connection(ws), dir);
  } catch (err) {
    proc.kill();
    await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
    throw err;
  }
}

// Call at the top of a test file. Returns a live object filled in by before().
// site.open(opts) opens and tracks a page so the final test can check page.errors.
export function useSite() {
  const site = { url: '', browser: null, pages: [] };
  let server;
  site.open = async (opts = {}) => {
    const page = await site.browser.openPage({ url: site.url, ...opts });
    site.pages.push(page);
    return page;
  };
  before(async () => {
    server = await startServer(resolve(import.meta.dirname, '..'));
    site.url = server.url;
    site.browser = await launchBrowser();
  });
  after(async () => {
    await site.browser?.close();
    await server?.close();
  });
  return site;
}
