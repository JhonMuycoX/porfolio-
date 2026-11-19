# Portfolio Tailwind + Bootstrap Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Muyco's one-page portfolio with Tailwind (prefixed `tw-`) and Bootstrap components, reframed for a first-year BSIT student. It adds IT projects in modals, placeholder skills, an email contact with a copy toast, and lively animations, while keeping the current look and the scroll-driven hero.

**Architecture:** Static site, no build. `index.html` loads the Tailwind v3 Play CDN (configured by `tailwind-config.js`) plus the Bootstrap 5.3 CSS and JS bundle and Bootstrap Icons from jsDelivr. `script.js` is plain JS with one `init*` function per behavior, all wired to the page through `id`/`data-*` hooks, never through styling classes. Tests use Node's built-in runner to drive headless Chrome over the DevTools protocol, with zero npm packages.

**Tech Stack:** HTML, Tailwind CSS 3.4.17 (Play CDN), Bootstrap 5.3.3, Bootstrap Icons 1.11.3, vanilla JS, Node 25 `node:test` + headless Chrome (tests only).

**Spec:** `docs/superpowers/specs/2026-11-19-portfolio-tailwind-redesign-design.md`

## Global Constraints

- Site files: `index.html`, `tailwind-config.js`, `script.js`, `favicon.svg`, `assets/`. `styles.css` is deleted and never referenced.
- Exact CDN URLs:
  - `https://cdn.tailwindcss.com/3.4.17`
  - `https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css`
  - `https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js`
  - `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css`
  - The existing Libre Franklin Google Fonts link stays.
- Head order: Google Fonts link, then Bootstrap CSS, then Bootstrap Icons CSS, then the Tailwind CDN script, then `tailwind-config.js`, then the one `<style type="text/tailwindcss">` block. At the end of the head, `bootstrap.bundle.min.js` and `script.js`, both with `defer`, in that order.
- Tailwind config: `prefix: 'tw-'` and `corePlugins: { preflight: false }`. Bootstrap Reboot is the only reset.
- Every class token in `index.html` is either a Tailwind utility (its utility part, after the last variant colon outside `[...]`, starts with `tw-` or `-tw-`) or one of these Bootstrap classes: `navbar navbar-expand-md fixed-top navbar-toggler collapse navbar-collapse modal fade modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg modal-content modal-header modal-body btn-close toast toast-body visually-hidden visually-hidden-focusable bi` or any `bi-*` icon class. Use Bootstrap only for component structure and behavior. All color, spacing, type and layout is Tailwind.
- Bootstrap pseudo-class rules (for example `.navbar-toggler:focus`) can beat a plain Tailwind class. Where it matters, add the matching Tailwind variant (`hover:`, `focus:`).
- Palette (Tailwind `theme.extend.colors`, hex values from the old `:root`):
  - paper `#f1f0e8`, ink `#142b23`, muted `#536159`, forest `#142b23`
  - mist `#e6ecda`, lime `#d7e9a5`, soft `#e2e5d8`, yellow `#edcf69`
  - green `#c6d5b7`, blue `#203d3a`, pink `#d6acb8`, orange `#713326`
- Font: `fontFamily.sans = ['"Libre Franklin"', 'sans-serif']`. Bootstrap's `--bs-body-font-family` and `--bs-font-sans-serif` are set to the same in the style block.
- Placeholder email everywhere: `muyco@example.com`.
- Identity copy: Muyco, a **first-year BSIT student**. No invented achievements, clients, grades, links, live demos or GitHub buttons. No `href="#"`.
- Every animation is off or static under `prefers-reduced-motion: reduce`, and all content stays visible.
- No horizontal scroll at 375px width.
- Tests need internet (CDNs) and Chrome. Run them with `node --test --test-concurrency=1 "tests/*.test.mjs"`. The site itself never requires Node.

## Review Focus

1. **Phone menu left open:** after tapping a nav link in the opened mobile menu, the menu closes. Test in Task 1.
2. **Section headings under the fixed navbar:** jumping to `#skills` leaves the heading below the navbar's bottom edge. Test in Task 1.
3. **Short wide screens (1280×600):** the pinned scene turns off and the hero is a readable static layout. Test in Task 2.
4. **Keyboard users on skill badges:** focusing a badge with Tab shows its tooltip. Test in Task 4.
5. **No clipboard API** (`file://` on some browsers, or http over a LAN IP): clicking Copy shows the fallback toast containing the address and throws nothing. Test in Task 5.

---

## DOM contract (shared by all tasks)

| Hook | Element | Notes |
|---|---|---|
| `body#top` | body | classes include `tw-bg-forest tw-font-sans` (test sentinel: body bg `rgb(20, 43, 35)`) |
| `a.visually-hidden-focusable[href="#main"]` | skip link | |
| `nav#site-nav.navbar.navbar-expand-md.fixed-top` | navbar | JS toggles `is-scrolled` when `scrollY > 40` |
| `div#scroll-progress` | inside `#site-nav`, top edge | JS sets `style.transform = "scaleX(p)"`, p in [0,1] |
| `button.navbar-toggler[data-bs-toggle="collapse"][data-bs-target="#nav-links"]` | menu button | `aria-controls="nav-links"`, `aria-label="Open menu"` |
| `div#nav-links.collapse.navbar-collapse` | menu | contains `a[data-nav-link]` to `#projects #skills #about #contact` |
| `main#main` | main | |
| `section[data-scene]` | hero | JS writes the same CSS vars as today (`--title-opacity`, `--title-y`, `--intro-opacity`, `--intro-y`, `--portrait-y`, `--back-left-x`, `--back-right-x`, `--back-y`, `--back-bottom-y`, `--art-opacity`) |
| `[data-scene-stage]`, `[data-scene-title]`, `[data-scene-intro]`, `[data-scene-portrait]` | hero parts | `html.scene-enabled` toggled by JS (unchanged rules: off under reduce-motion, `max-width:700px` or `max-height:650px`) |
| `span#typing-text[data-typing-lines]` | typed text | JSON `["an IT Student","an Aspiring Developer","a Problem Solver","a Tech Enthusiast"]`, initial text `an IT Student`, `aria-hidden="true"` |
| `span[data-typing-caret]` | caret | `aria-hidden="true"` |
| `section#projects` | projects | |
| `button[data-project][data-bs-toggle="modal"][data-bs-target="#modal-<slug>"]` | project cards | slugs `library grades network inventory` |
| `div.modal.fade#modal-<slug>[aria-labelledby="modal-<slug>-title"]` | modals | `h2#modal-<slug>-title` |
| `section#skills` | skills | three `[data-skill-group]` |
| `span[data-skill][tabindex="0"][data-bs-toggle="tooltip"][data-bs-title="Short note about this skill"]` | badges | text `Skill name`, 4 per group |
| `[data-reveal-group]` / `[data-reveal]` | scroll reveal | |
| `section#about`, `section#contact` | | |
| `a#contact-email[href="mailto:muyco@example.com"]` | email link | text `muyco@example.com` |
| `button#copy-email[data-email="muyco@example.com"]` | copy | |
| `div#copy-toast.toast` with `div#copy-toast-text.toast-body` | toast | `role="status"` `aria-live="polite"` |

`script.js` shape: `initScene()`, `initTyping()`, `initNavbar()`, `initProgress()`, `initReveal()`, `initTooltips()`, `initCopyEmail()`, each a no-op when its hook is missing, all called at the bottom. A shared `const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')`.

---

### Task 1: Test harness, foundation and navbar

**Files:**
- Create: `tests/harness.mjs`, `tests/static.test.mjs`, `tests/foundation.test.mjs`, `tailwind-config.js`
- Modify: `index.html` (head, header to `nav#site-nav`, skip link, body classes), `script.js` (wrap the existing scene code in `initScene()`, add `initNavbar()` and `initProgress()`)
- Delete: `styles.css`

**Interfaces:**
- Produces, in `tests/harness.mjs`:
  - `startServer(root: string) → Promise<{ url: string, close(): Promise<void> }>`: a `node:http` static server on `127.0.0.1:0` with content types for html, js, css, svg and png.
  - `launchBrowser() → Promise<Browser>`: spawns Chrome (`process.env.CHROME_PATH`, else `C:/Program Files/Google/Chrome/Application/chrome.exe`, else the Edge path) with `--headless=new --remote-debugging-port=0 --user-data-dir=<mkdtemp> --no-first-run --no-default-browser-check`. It reads the port from `<user-data-dir>/DevToolsActivePort`, gets the ws URL from `http://127.0.0.1:<port>/json/version`, and connects with the global `WebSocket` using flattened sessions (`Target.createTarget` + `Target.attachToTarget({flatten:true})`).
  - `Browser.openPage({ url, width=1440, height=900, mobile=false, reducedMotion=false }) → Promise<Page>`: enables Page/Runtime, collects `Runtime.exceptionThrown` into `page.errors`, sets `Emulation.setDeviceMetricsOverride` and `Emulation.setEmulatedMedia` (`prefers-reduced-motion`), navigates, waits for `Page.loadEventFired`, then waits until the body background is `rgb(20, 43, 35)` (Tailwind ready).
  - `Browser.grantClipboard(origin: string)`: `Browser.grantPermissions` with `clipboardReadWrite` and `clipboardSanitizedWrite`.
  - `Browser.close()`.
  - `Page.eval(expr: string) → Promise<any>`: `Runtime.evaluate` with `awaitPromise`, `returnByValue`, `userGesture: true`; it throws on exceptionDetails.
  - `Page.waitFor(expr: string, timeoutMs=5000) → Promise<any>`: polls every 50ms until truthy.
  - `Page.press(key: 'Enter'|'Escape'|'Tab')`: `Input.dispatchKeyEvent` keyDown and keyUp with `key`, `code` and `windowsVirtualKeyCode` 13/27/9.
  - `Page.scrollTo(y: number)`: `scrollTo(0,y)` then waits 2 animation frames.
  - `Page.screenshot(path: string)` and `Page.close()`.
  - `Page.scrollTo(y)` must use `scrollTo({ top: y, behavior: 'instant' })`, because the page has smooth scrolling. Add `Page.waitForScrollEnd()`, which resolves once `scrollY` stays unchanged for 200ms.
  - `useSite() → { url: string, browser: Browser }`: call it at the top of a test file. It registers `before()` (start the server at the repo root and launch the browser, filling `url` and `browser`) and `after()` (close both).
- Produces in the page: the navbar hooks from the DOM contract, `initNavbar()` and `initProgress()`.

- [ ] **Step 0: Commit the current site as a baseline.** These files are untracked today, and the old CSS is needed for porting. Leave `.taste-skill/` and `docs/plans/` untracked.
```bash
git add index.html styles.css script.js favicon.svg assets README.md
git commit -m "Baseline: portfolio before Tailwind redesign"
```

- [ ] **Step 1: Write the failing tests.**

`tests/static.test.mjs` (reads `index.html` as text, no browser):
```js
test('styles.css is gone and unreferenced', () => {
  assert.equal(existsSync('styles.css'), false);
  assert.doesNotMatch(html, /styles\.css/);
});
test('CDNs are pinned exactly', () => { for (const u of CDN_URLS) assert.ok(html.includes(u), u); });
test('every class token is tw- prefixed or an allowed Bootstrap class', () => {
  assert.deepEqual(badClassTokens(html), []);
}); // allowlist = Global Constraints list; utility part = text after last ':' outside [...]
test('no dead links', () => assert.doesNotMatch(html, /href="#"/));
```

`tests/foundation.test.mjs` (browser, via `withSite`):
```js
test('Tailwind beats Bootstrap on base styles', async () => {
  // body font includes "Libre Franklin"; no visible <a> has color rgb(13, 110, 253)
});
test('navbar turns solid after scrolling', async () => {
  // at top: #site-nav lacks is-scrolled and its bg is rgba(0, 0, 0, 0)
  // scrollTo(600): has is-scrolled, bg rgb(20, 43, 35)
});
test('scroll progress tracks the page', async () => {
  // top: matrix of #scroll-progress transform has scaleX 0
  // scrollTo(document height): scaleX > 0.98
});
test('mobile menu opens, and closes after a link tap', async () => { // 375x812 mobile
  // #nav-links display none; click .navbar-toggler, then waitFor #nav-links.show
  // click a[data-nav-link][href="#skills"], then waitFor !#nav-links.show && !.collapsing
});
test('anchored heading clears the fixed navbar', async () => {
  // location.hash='#skills', then waitForScrollEnd();
  // #skills h2 rect top >= #site-nav rect bottom
});
test('no uncaught errors', async () => assert.deepEqual(page.errors, []));
```
The `#skills` test fails until Task 4. Keep it in the file, mark it `{ todo: 'Task 4' }`, and remove the todo in Task 4.

- [ ] **Step 2: Run the tests and confirm they fail.**
Run: `node --test --test-concurrency=1 "tests/*.test.mjs"`
Expected: FAIL. `styles.css` exists, the CDNs are missing, and `#site-nav` is not found.

- [ ] **Step 3: Implement.**
  - Write `tailwind-config.js` setting `tailwind.config` with the prefix, preflight off, palette and font.
  - Add `keyframes.blink` (opacity 1 → 0 at 50%) and `animation.blink = 'blink 1s step-end infinite'`.
  - Add `plugins: [({ addVariant, addComponents }) => {...}]` that registers the variant `scene` = `.scene-enabled &` and the component `.frame` = `{ maxWidth: '1800px', marginInline: 'auto', paddingInline: 'clamp(20px, 3.4vw, 56px)' }`. The prefix makes it `tw-frame`.
  - In the `<style type="text/tailwindcss">` block, `:root` sets `--bs-body-font-family`, `--bs-font-sans-serif`, `--bs-body-bg: #142b23` and `--bs-body-color: #e6ecda`.
  - Set `<html class="tw-scroll-smooth tw-scroll-pt-24 motion-reduce:tw-scroll-auto">`.
  - Build the navbar: `m.` brand on the left, links on the right, the menu panel `tw-bg-forest` on phones, link hover underline, and the `is-scrolled` styles through `[&.is-scrolled]:` variants. The progress bar is `tw-h-[3px] tw-bg-lime tw-origin-left`.
  - Delete `styles.css`.
  - Keep the rest of the page as is for now. The sections below the hero are temporarily unstyled until Tasks 2 to 5 replace them.
  - `initNavbar()` adds `is-scrolled` on scroll (rAF-throttled, passive), and closes the menu on a `[data-nav-link]` click through `bootstrap.Collapse.getOrCreateInstance(menu).hide()` when the menu has `.show`.
  - `initProgress()` computes `scrollY / (scrollHeight - innerHeight)`, clamped to 0..1.

- [ ] **Step 4: Run the tests and confirm they pass.** Same command. Expected: PASS (one todo).

- [ ] **Step 5: Commit.**
```bash
git rm -q styles.css
git add index.html tailwind-config.js script.js tests/
git commit -m "Switch to Tailwind + Bootstrap foundation with navbar and test harness"
```

---

### Task 2: Hero scroll scene with typing

**Files:**
- Modify: `index.html` (hero section), `script.js` (`initScene()` hooks, new `initTyping()`)
- Test: `tests/hero.test.mjs`

**Interfaces:**
- Consumes: the `withSite` and `Page` helpers from Task 1, and the `scene` variant and `tw-frame` from `tailwind-config.js`.
- Produces: the hero hooks and `initTyping()`, configured as `{ typeMs: 75, deleteMs: 40, holdMs: 1800, gapMs: 350 }`.

Hero copy:
- Phase 1: `h1` "Hi, I'm Muyco.", then `p` with `<span class="visually-hidden">I'm a first-year BSIT student.</span>`, then a visible `aria-hidden` line "I'm " + `#typing-text` + caret.
- Sub-line: "A first-year BSIT student's corner of the web. Small beginnings. Plenty of ideas."
- Lime button "See my projects ↘" linking to `#projects`.
- Phase 2: `h2` "Learning by making.", two short paragraphs about studying IT (written by the implementer), and a "More about me" link to `#about`.
- Backdrop cards show three project posters with the same colors and tilts as today:

| Card | Colors | Big word | Caption | Tag |
|---|---|---|---|---|
| Left | yellow/orange, −12° | `shelf.` | "Borrow. Return. Repeat." | "A library system study" |
| Right | green/forest, 12°, vertical text | `A+` | "Every score in one place." | "A grade tracker study" |
| Bottom | pink/blue, −8° | `ping` ×3 | "Every device, connected." | "A network lab study" |

Port every rule in the old `.scene*` CSS to Tailwind. Read it with `git show "$(git log --format=%h --grep=Baseline -1)":styles.css`.
- Static values become `tw-*` utilities and arbitrary values.
- Pinned-mode rules become `scene:` variants. For example, the title uses `scene:tw-absolute scene:tw-opacity-[var(--title-opacity,1)] scene:tw-translate-y-[var(--title-y,0px)]`, and a card uses `-tw-rotate-12 scene:tw-translate-x-[var(--back-left-x,0px)] scene:tw-translate-y-[var(--back-y,0px)]`.
- The `≤700px` rules use `max-[700px]:` variants.

- [ ] **Step 1: Write the failing tests** in `tests/hero.test.mjs`:
```js
test('desktop scene pins and animates', async () => { // 1440x900
  // html.scene-enabled; h1 fontSize >= 80px (Tailwind won over Bootstrap's h1)
  // scroll to half of (scene height - stage height): [data-scene-title] computed opacity < 1,
  // [data-scene-portrait] transform !== 'none'
});
test('scene is static on phones, short screens and reduced motion', async () => {
  // 375x812 mobile, 1280x600, and 1440x900 with reducedMotion → no html.scene-enabled,
  // portrait rect height > 0, documentElement.scrollWidth <= innerWidth
});
test('typing cycles through lines', async () => {
  // sample #typing-text every 100ms for 7000ms → saw 'an Aspiring Developer'
});
test('typing is static under reduced motion', async () => {
  // after 3000ms text === 'an IT Student'; caret getAnimations().length === 0
});
test('screen readers get a stable line', async () => {
  // .visually-hidden text includes 'first-year BSIT student'; #typing-text aria-hidden="true"
});
```

- [ ] **Step 2: Run the tests and confirm they fail.** Run: `node --test --test-concurrency=1 tests/hero.test.mjs`. Expected: FAIL, because `[data-scene]` and `#typing-text` are missing.

- [ ] **Step 3: Implement** the hero markup and `initTyping()`:
  - `initTyping()` is a type → hold → delete → gap loop driven by `setTimeout`. It writes `textContent` only.
  - When `reduceMotion.matches`, it leaves the first line and returns. It also stops if reduce-motion turns on mid-run.
  - The caret uses `motion-safe:tw-animate-blink`.
  - `initScene()` keeps today's math and thresholds, selecting elements through the `data-scene*` hooks.

- [ ] **Step 4: Run the tests and confirm they pass.** Same command plus the full suite. Expected: PASS.

- [ ] **Step 5: Commit.** `git add index.html script.js tests/hero.test.mjs && git commit -m "Rebuild hero scene in Tailwind with typing animation"`

---

### Task 3: Projects grid and modals

**Files:**
- Modify: `index.html` (replace the `#work` section with `section#projects`, and add four modals before `</body>`)
- Test: `tests/projects.test.mjs`

**Interfaces:**
- Consumes: the Task 1 harness (`useSite`, `Page.eval`, `waitFor`, `press`).
- Produces: project card and modal hooks.

Section heading "Things I've built." with the intro line "Four projects from my first year in BSIT. Open one to see what I worked on."
- Grid: `tw-grid md:tw-grid-cols-2 tw-gap-5`.
- Each card is a `<button type="button">` (spans inside, displayed as block) holding a poster area with a big stylized word, the project name and the tools line.
- Hover/focus: `motion-safe:hover:-tw-translate-y-1.5` plus a colored glow shadow, with a visible focus ring.

| Slug | Name | Colors | Poster word / caption | Tools |
|---|---|---|---|---|
| library | Library Management System | yellow/orange | `shelf.` / "Borrow. Return. Repeat." | PHP, MySQL, Bootstrap |
| grades | Student Grade Tracker | green/forest | `A+` / "Every score in one place." | Java |
| network | Network Setup Lab | pink/blue | `ping ping ping` / "Every device, connected." | Cisco Packet Tracer |
| inventory | Inventory App | blue/green | `in stock.` / "Count less. Know more." | Python, SQLite |

Each modal (`modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg`) contains:
- a `modal-content` with `tw-bg-paper tw-text-ink tw-rounded-none tw-border-0`,
- a top strip in the project's color pair with `h2#modal-<slug>-title` and a `btn-close` (`aria-label="Close"`),
- a 2–3 sentence description,
- "What I worked on" with 3 bullets,
- tool badges.

The implementer writes this copy in a plain first-year voice, with no results or links.

- [ ] **Step 1: Write the failing tests** in `tests/projects.test.mjs`:
```js
test('four project cards with matching modals', async () => {
  // 4 × [data-project]; each data-bs-target resolves to an existing .modal with aria-labelledby title
});
test('click opens the modal, Escape closes it and returns focus', async () => {
  // click library card → waitFor #modal-library.show; title text 'Library Management System';
  // .modal-content bg rgb(241, 240, 232); press Escape → waitFor not .show;
  // document.activeElement === library card
});
test('Enter on a focused card opens its modal', async () => { /* focus grades card, press Enter → #modal-grades.show */ });
test('modal fits a phone', async () => { // 375x667 mobile
  // open inventory → .modal-body is scrollable or fits; documentElement.scrollWidth <= 375
});
```
Also add to `tests/static.test.mjs`: `Dayoff|Forma|Common Ground` do not appear in `index.html`.

- [ ] **Step 2: Run the tests and confirm they fail.** Run: `node --test --test-concurrency=1 tests/projects.test.mjs tests/static.test.mjs`. Expected: FAIL.

- [ ] **Step 3: Implement** the section and modals as specified above.

- [ ] **Step 4: Run the full suite and confirm it passes.**

- [ ] **Step 5: Commit.** `git add -A index.html tests && git commit -m "Add IT project grid with Bootstrap modals"`

---

### Task 4: Skills section and About

**Files:**
- Modify: `index.html` (new `section#skills` between Projects and About, rebuilt `section#about`), `script.js` (`initTooltips()`)
- Modify: `tests/foundation.test.mjs` (remove the `todo` on the anchor test)
- Test: `tests/skills-about.test.mjs`

**Interfaces:**
- Consumes: the harness.
- Produces: skill hooks and `initTooltips()`, which runs `new bootstrap.Tooltip(el)` for each `[data-bs-toggle="tooltip"]`.

Skills:
- Heading "Skills I'm building." with the line "Placeholders for now. I'll fill these in as I learn."
- Three `[data-skill-group][data-reveal-group]` blocks headed Programming, Web Development and Tools, laid out `md:tw-grid-cols-3`.
- Four badges each, as in the DOM contract, with soft background colors cycling yellow/green/pink/soft and a visible focus ring.

About:
- Keep the split layout: the heading "A little about me." with the note "Still learning. Always curious.", and copy about being a first-year BSIT student who likes building systems and apps, solving problems, and learning programming, databases and networking.
- No tool-badge list.

- [ ] **Step 1: Write the failing tests** in `tests/skills-about.test.mjs`:
```js
test('three skill groups of four placeholders', async () => {
  // group headings ['Programming','Web Development','Tools']; 12 × [data-skill] text 'Skill name'
});
test('keyboard focus shows the tooltip', async () => {
  // first [data-skill].focus() → waitFor .tooltip.show text 'Short note about this skill'
});
test('about speaks as a first-year BSIT student', async () => {
  // #about textContent includes 'BSIT'; #about has no [data-skill]
});
```

- [ ] **Step 2: Run the tests and confirm they fail.** Run: `node --test --test-concurrency=1 tests/skills-about.test.mjs`.

- [ ] **Step 3: Implement** the sections and `initTooltips()`. Remove the `todo` from the anchor test in `foundation.test.mjs`.

- [ ] **Step 4: Run the full suite and confirm it passes,** including the anchor test from Task 1.

- [ ] **Step 5: Commit.** `git add -A index.html script.js tests && git commit -m "Add placeholder skills with tooltips and rewrite About"`

---

### Task 5: Contact with copy toast, and footer

**Files:**
- Modify: `index.html` (`section#contact`, footer, toast markup), `script.js` (`initCopyEmail()`)
- Test: `tests/contact.test.mjs`

**Interfaces:**
- Consumes: the harness, including `grantClipboard`.
- Produces: `initCopyEmail()`, which uses `navigator.clipboard?.writeText(email)`.
  - Success: the toast reads "Email copied!".
  - Missing API or rejected promise: the toast reads "Couldn't copy. The email is muyco@example.com".
  - The toast is shown with `bootstrap.Toast.getOrCreateInstance(toastEl).show()`.

Contact (green band):
- Heading "Let's connect.", then the line "Class project? New idea? Send me an email."
- `#contact-email`, large and underlined on hover, with the `bi-envelope` icon.
- `#copy-email` button "Copy email" with the `bi-clipboard` icon.
- The toast is fixed bottom-right (bottom-center on phones), colored `tw-bg-forest tw-text-mist`.

Footer: keep the giant `MUYCO` wordmark and the "Back to top ↑" link to `#top`. Text: "A first-year BSIT portfolio, made with curiosity." / "Learning a little more with every project."

- [ ] **Step 1: Write the failing tests** in `tests/contact.test.mjs`:
```js
test('email link', async () => { /* #contact-email href mailto:muyco@example.com, text muyco@example.com */ });
test('copy success shows toast and fills clipboard', async () => {
  // grantClipboard(origin); click #copy-email → waitFor #copy-toast.show;
  // #copy-toast-text === 'Email copied!'; navigator.clipboard.readText() === 'muyco@example.com'
});
test('copy rejection falls back', async () => {
  // navigator.clipboard.writeText = () => Promise.reject(new Error('x')); click → toast text includes 'muyco@example.com'
});
test('missing clipboard API falls back without errors', async () => {
  // Object.defineProperty(navigator,'clipboard',{value:undefined}); click → toast includes address; page.errors empty
});
test('footer', async () => { /* wordmark 'MUYCO'; a[href="#top"] exists */ });
```

- [ ] **Step 2: Run the tests and confirm they fail.** Run: `node --test --test-concurrency=1 tests/contact.test.mjs`.

- [ ] **Step 3: Implement** the contact section, the footer and `initCopyEmail()`.

- [ ] **Step 4: Run the full suite and confirm it passes.**

- [ ] **Step 5: Commit.** `git add -A index.html script.js tests && git commit -m "Add email contact with copy toast and update footer"`

---

### Task 6: Scroll reveal animations

**Files:**
- Modify: `index.html` (add `data-reveal` / `data-reveal-group` to section headings, intro lines, project cards, skill badges, the About copy and the contact block), `script.js` (`initReveal()` replaces the old `.scroll-intro` observer)
- Test: `tests/motion.test.mjs`

**Interfaces:**
- Consumes: the hooks from Tasks 2–5.
- Produces: `initReveal()`.
  - An IntersectionObserver (threshold `0.12`) watches every `[data-reveal]`.
  - On entering view it runs `el.animate([{opacity:0, transform:'translateY(24px)'},{opacity:1, transform:'none'}], {duration:650, easing:'cubic-bezier(.16,1,.3,1)', delay: indexInGroup*90, fill:'backwards'})`. The animation replays on re-entry, matching the current site.
  - It does nothing under reduce-motion.
  - Elements are never hidden by CSS, so content shows if JS fails.

- [ ] **Step 1: Write the failing tests** in `tests/motion.test.mjs`:
```js
test('reveal elements are visible before they animate', async () => {
  // on load, a [data-reveal] in #skills has computed opacity '1'
});
test('entering view plays a staggered reveal', async () => {
  // scroll #skills into view → within 300ms first and third badge have getAnimations().length > 0,
  // third badge's animation effect delay > first's; after 1500ms all opacity '1'
});
test('reduced motion: no reveal animations', async () => {
  // reducedMotion page, scroll #skills into view, wait 300ms → no [data-reveal] has animations
});
test('no uncaught errors across a full scroll', async () => { /* scroll top→bottom in steps; page.errors empty */ });
```

- [ ] **Step 2: Run the tests and confirm they fail.** Run: `node --test --test-concurrency=1 tests/motion.test.mjs`.

- [ ] **Step 3: Implement** `initReveal()` and add the attributes.

- [ ] **Step 4: Run the full suite and confirm it passes.**

- [ ] **Step 5: Commit.** `git add -A index.html script.js tests && git commit -m "Add staggered scroll reveal animations"`

---

### Task 7: Docs, metadata and visual pass

**Files:**
- Modify: `README.md`, `index.html` (`<meta name="description">` = "Muyco's portfolio. A first-year BSIT student building systems, apps, and websites.", `<title>` = "Muyco | BSIT student portfolio")
- Create: `tests/screenshots.mjs` (writes PNGs to `tests/screenshots/`, which is gitignored)

**Interfaces:**
- Consumes: the harness.

- [ ] **Step 1: Write `tests/screenshots.mjs`.** It captures these shots:
  - Desktop 1440×900: top, mid-scene (scene progress about 0.5), scene settled, `#projects`, the open `#modal-library`, `#skills`, `#about`, `#contact` with the toast shown, and the footer.
  - Phone 375×812: top, menu open, `#projects`, the open modal, `#skills` and `#contact`.

  Add `tests/screenshots/` to `.gitignore`.

- [ ] **Step 2: Run it and review every PNG by eye.** Run `node tests/screenshots.mjs`. Check against spec direction A:
  - forest/cream palette and poster colors,
  - nothing overlapping the fixed navbar,
  - no Bootstrap blue or default-looking elements,
  - balanced spacing,
  - the hero portrait not clipped.

  Fix what you find in `index.html`.

- [ ] **Step 3: Rewrite `README.md`.** Cover:
  - the stack (Tailwind Play CDN with the `tw-` prefix, Bootstrap components used, internet needed),
  - how to open the site,
  - how to run the tests and screenshots,
  - where to edit the name, email (`muyco@example.com` placeholder), skills placeholders, projects and modals, typing lines (`data-typing-lines`), and palette (`tailwind-config.js`),
  - the scroll-scene behavior notes carried over from the current README.

- [ ] **Step 4: Run the full suite and confirm it passes.** Run `node --test --test-concurrency=1 "tests/*.test.mjs"`. Expected: all PASS, no todos.

- [ ] **Step 5: Commit.** `git add -A README.md index.html .gitignore tests && git commit -m "Update README and metadata; add screenshot script"`
