# Muyco portfolio

A first-year student portfolio built with HTML, CSS, and a short JavaScript scroll controller. No frameworks, packages, or build step.

Open `index.html` directly, or run `python -m http.server 8000 --bind 127.0.0.1` and visit http://127.0.0.1:8000. An existing Live Server session also works.

## The scroll scene

Inspired by the supplied 19.6-second reference clip: a held composition moves background artwork at a slower speed while a foreground subject enters and the headline changes to an introduction. Here, original project title cards form the backdrop and Muyco's transparent portrait is the foreground. The palette uses forest green, pale paper, and soft project colors.

The hero holds for 75% of one additional screen on desktop. Phones use a compact stacked sequence with repeating text reveals. The portrait settles before the end so the introduction has time to be read. It only translates; it is never enlarged by a transform. Updates use one requested animation frame per scroll event batch, with passive scrolling and no animation library or wheel interception.

Without JavaScript, with reduced motion, or on compact viewports (700px wide or 650px tall or less), the hero becomes a normal static layout. Invisible scene links are removed from keyboard navigation with `inert` while the animated sequence runs. The About introduction still replays its reveal on re-entry.

## Customize

- `index.html`: edit the name, biography, skills, project overviews, and page metadata. Add real email/social details in Contact when available.
- The four projects are illustrative concepts presented as portfolio entries. Replace them with your own screenshots and work later. Native HTML disclosures open their overviews. No client, live demo, result, or achievement is invented.
- `styles.css`: palette, scene positions, typography, project bands, and mobile layouts.
- `script.js`: scroll progress, layer movement, accessibility state, and repeating About reveal.
- `favicon.svg`: the m. monogram.

The original supplied photograph is preserved at `assets/portrait.png`. The portfolio uses `assets/portrait-cutout-v2.png`, a transparent cutout with repaired shoulder and lower edges. The project artwork is original HTML/CSS. Libre Franklin loads from Google Fonts with a local sans-serif fallback.
