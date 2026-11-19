# Muyco portfolio

A one-page portfolio for Muyco, a first-year BSIT student. It is a static site: plain HTML, a little JavaScript, Tailwind CSS and a few Bootstrap components. There is no build step and nothing to install.

## Stack

- **Tailwind CSS 3.4.17** from the Play CDN. Every utility carries the `tw-` prefix (`tw-bg-forest`, `tw-py-4`) and Tailwind's preflight is off, so it never collides with Bootstrap. All color, spacing, type and layout is Tailwind. The config is in `tailwind-config.js`.
- **Bootstrap 5.3.3** only for component structure and behavior: the navbar and its collapse menu, the project modals, the skill tooltips and the copy toast. Bootstrap Reboot is the only CSS reset.
- **Bootstrap Icons 1.11.3** for the skill, navbar, button and card icons.
- **Libre Franklin** from Google Fonts, with a sans-serif fallback.
- `script.js` handles the scroll scene, typing text, navbar, scroll progress bar, reveal animations, tooltips and the copy-email toast. It uses the Web Animations API, with no animation library.

The CDNs need an internet connection. Without it the page loads unstyled.

## Open the site

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8000 --bind 127.0.0.1
```

Then visit http://127.0.0.1:8000. A Live Server session also works.

## Tests and screenshots

The tests drive a real Chrome (or Edge) over the DevTools protocol. They need a recent Node (built on v25, which provides the built-in WebSocket and fetch), Chrome or Edge installed, and internet access for the CDNs. There are no npm packages. If Chrome is not in its default location, set `CHROME_PATH`.

```
node --test --test-concurrency=1 "tests/*.test.mjs"
```

To look at the page at desktop (1440x900) and phone (375x812) sizes:

```
node tests/screenshots.mjs
```

This writes PNGs to `tests/screenshots/`, which is gitignored. It is a review helper, not part of the test suite.

## Customize

- **Name, biography, copy and page metadata:** `index.html`. The `<title>` and `<meta name="description">` are in the head.
- **Email:** `muyco@example.com` is a placeholder. Replace it everywhere it appears: the `href="mailto:..."` and text of `#contact-email`, and the `data-email` attribute of `#copy-email`. Search the file for `muyco@example.com`.
- **Skills:** the Skills section has three groups (Programming, Web Development, Tools), each with a heading and a row of badges. Each badge is a `<span data-skill ...>` with three things to edit:
  - the **badge text** after the icon, for example `Python`;
  - the **icon class**, a `bi-*` class on the `<i>` inside the badge, for example `bi-filetype-py`. Browse the names at https://icons.getbootstrap.com;
  - the **tooltip note**, in the span's `data-bs-title` attribute. It shows on hover and on keyboard focus.

  To add a skill, copy an existing badge into the group you want and change those three things. Keep the other attributes (`data-skill`, `tabindex="0"`, `data-bs-toggle="tooltip"`) so the tooltip and keyboard focus keep working. The badge color is a `tw-bg-*` class on the same span (`tw-bg-yellow`, `tw-bg-green`, `tw-bg-pink`, `tw-bg-soft`).
- **Projects and modals:** there are four project cards in `#projects`, each a `<button data-project="<slug>" data-bs-target="#modal-<slug>">`. The slugs are `library`, `grades`, `network` and `inventory`. Edit the poster text, title and tech line on the card. Edit the matching `<div class="modal" id="modal-<slug>">` near the bottom of `index.html` for the overview, the "What I worked on" list and the tech tags. The projects are illustrative class-project entries; no clients, live demos or results are invented, and there are no GitHub or demo links until there is something real to link.
- **Typing lines:** the hero's rotating text is the `data-typing-lines` attribute on `#typing-text`, a JSON array of strings. The span's initial text should match the first entry.
- **Palette and font:** `tailwind-config.js`, under `theme.extend.colors` and `fontFamily`. The Bootstrap font and body colors are set in the `<style type="text/tailwindcss">` block in `index.html`.
- **Favicon:** `favicon.svg`, the m. monogram.
- **Portrait:** the page uses `assets/portrait-cutout-v2.png`, a transparent cutout. The original photograph is kept at `assets/portrait.png`.

## The scroll scene

Inspired by a reference clip: a held composition moves background artwork at a slower speed while a foreground subject enters and the headline changes to an introduction. Here, original project poster cards form the backdrop and Muyco's transparent portrait is the foreground.

The hero holds for 75% of one additional screen on desktop (the section is 175svh tall with a pinned stage). The portrait settles before the end so the introduction has time to be read. It only translates; it is never enlarged by a transform. Updates use one requested animation frame per scroll event batch, with passive scrolling and no wheel interception. `script.js` writes CSS variables such as `--title-opacity` and `--portrait-y` on the scene, and the markup reads them through Tailwind arbitrary values.

Phones use a compact stacked layout. With reduced motion, or on compact viewports (700px wide or 650px tall or less), the hero becomes a normal static layout and the `scene-enabled` class is not set. While the animated sequence runs, invisible scene text is removed from keyboard navigation with `inert`. Scroll reveals replay on re-entry and are skipped entirely under reduced motion, where all content stays visible.
