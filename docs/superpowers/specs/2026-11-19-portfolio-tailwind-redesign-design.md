# Muyco portfolio: Tailwind + Bootstrap redesign

Date: 2026-11-19
Status: draft, awaiting approval

## Intent

This is a class project. Muyco's one-page portfolio needs to be restyled with Tailwind instead of the hand-written `styles.css`. It should use a few Bootstrap components, look more polished, and present Muyco as a **first-year BSIT student** rather than a web-design student. The goal is a portfolio that looks impressive and works well, and that clearly shows Tailwind, Bootstrap and lively animations in use. It is not going to employers yet, so made-up content is fine where real details are missing.

## Goals

- All styling done with Tailwind utility classes. `styles.css` is deleted.
- Bootstrap used for interactive components: navbar collapse, modals, tooltips and a toast.
- Eye-catching animations, led by a typing effect in the hero.
- Keep and polish the current look (direction **A** from the visual comparison): forest green, cream "paper", Libre Franklin, and the bright poster-style color cards (yellow/orange, sage/forest, pink/teal, teal/sage).
- Contact is an email address.
- Skills are placeholders the owner fills in later.
- Projects are four made-up IT-student projects, presented as finished entries.

## Non-goals

- Real project content, screenshots, live demos, GitHub links or results.
- A contact form or any backend.
- A build step, npm or Node.
- Multiple pages, a blog, or a dark/light theme toggle.

## Anti-goals (failure even if it "works")

- Tailwind and Bootstrap fighting each other, such as Bootstrap's `collapse` or `container` being restyled by Tailwind, or Bootstrap's base styles overriding Tailwind sizes.
- Losing the scroll-driven hero scene (the portrait rising in while the title cards drift away). It is the page's signature and stays.
- Animations that make the page hard to use: text hidden until an animation finishes with no fallback, motion that ignores the reduce-motion setting, or layout jumps.
- Invented links that go nowhere (fake "Live demo" or "GitHub" buttons).
- A visual shift to a generic template look. It should still feel like the current site, only sharper.

## Constraints

- Static site: `index.html`, `script.js`, `favicon.svg` and `assets/`. It must work when opened directly or through Live Server.
- Libraries load from CDNs with pinned versions. An internet connection is needed for the page to look right, which is acceptable.
- Must keep working at phone width (the existing 700px compact breakpoint stays meaningful) with no horizontal scroll.
- Keep the existing accessibility work: skip link, visible focus, `inert` on hidden scene content, and honoring `prefers-reduced-motion`.

## Approaches considered

1. **Load Tailwind and Bootstrap from CDNs, no build step (chosen).** Tailwind's Play CDN compiles classes in the browser, and Bootstrap's CSS and JS bundle come from jsDelivr. Tailwind classes use a `tw-` prefix so they never collide with Bootstrap class names. This keeps the owner's current workflow (edit, refresh) with nothing to install. The trade-offs are a small in-browser compile delay, a console note that the Play CDN isn't meant for production, and the need for internet access. All of these are fine for a class project.
2. **Tailwind CLI via npm with a build step.** This produces a real compiled CSS file: faster, works offline, the professional route. It was rejected because it needs Node and a rebuild after every class change, and forgetting to rebuild makes the page look broken.

The owner picked approach 1.

## Decided with the owner

- Who: Muyco is a **first-year BSIT (BS Information Technology) student**. The copy says so in the hero, About, footer and meta description, for example "a first-year BSIT student's corner of the web".
- Look: direction A, the current palette and poster cards, polished.
- Libraries: Tailwind + Bootstrap via CDN, `tw-` prefix on Tailwind classes.
- Projects: four made-up IT projects written by the builder (examples discussed: Library Management System, Student Grade Tracker, Network Setup Lab, Inventory App).
- Skills: placeholder badges grouped by category, reading "Skill name".
- Contact: a clickable email address plus a copy button. Use the placeholder `muyco@example.com` until the owner provides the real address.
- Animations: a typing effect in the hero cycling through short role lines; sections and cards fading and sliding in on scroll; hover lift and glow on cards; a scroll progress bar at the top; the existing portrait scroll scene stays. All motion respects reduce-motion.
- Bootstrap components: navbar that collapses to a menu button on phones; a modal with each project's details (replacing the current click-to-expand `<details>`); tooltips on skill badges; a toast saying "Email copied!".

## Page structure (top to bottom)

**Navbar (Bootstrap navbar, collapse on mobile).** The `m.` brand on the left. Links: Projects, Skills, About, Contact. It sits over the hero and turns into a solid forest-green bar once the page scrolls past the top (*builder's call: fixed position with a background change*). The thin scroll-progress bar runs along its top edge in lime.

**Hero scroll scene (kept).** Same two-phase pinned sequence driven by `script.js`:
- Phase 1, the title: "Hi, I'm Muyco." with a typed line beneath it, "I'm an IT Student_". The typing cycles through about four short lines (*builder's call on the exact wording, e.g. IT Student / Aspiring Developer / Problem Solver / Tech Enthusiast*). There's a short sentence below it and a lime "See my projects ↘" button.
- Phase 2, the introduction: the portrait rises in beside the text "Learning by making." and two short paragraphs about studying IT, plus a "More about me" link.
- The three tilted backdrop cards are restyled as title cards for three of the new IT projects. They keep the same colors and drift behavior.
- *My call:* the name and typing now open the page, and "Learning by making." moves into phase 2. This matches the mockup the owner chose.

```
┌─────────────────────────────────────────────┐
│ m.                 Projects Skills About Contact │
│                                             │
│   [card]        Hi, I'm Muyco.        [card]│
│              I'm an IT Student_             │
│      A first-year BSIT student's corner…    │
│             [ See my projects ↘ ]           │
│                    [card]                   │
└─────────────────────────────────────────────┘
        ↓ scroll: title fades, portrait rises
┌─────────────────────────────────────────────┐
│   Learning by making.        ┌──────┐       │
│   I'm studying IT…           │portrait│      │
│   More about me              └──────┘       │
└─────────────────────────────────────────────┘
```

**Projects ("Things I've built.").** Four poster-style cards in a 2×2 grid on desktop and one column on phones (*my call: a grid rather than the current stacked full-width bands, matching the chosen mockup*). Each card has a big stylized title in its color pair, the project name, and a one-line tools list. Clicking or pressing Enter on a card opens a Bootstrap modal with:
- a heading and a 2–3 sentence description,
- "What I worked on" (2–3 bullets),
- tool badges.

There are no links out. The four projects (*builder writes the copy and keeps it believable for a first-year IT student*):

| Project | Kind | Tools (suggested) |
|---|---|---|
| Library Management System | Web system for borrowing and returns | PHP, MySQL, Bootstrap |
| Student Grade Tracker | Desktop app | Java |
| Network Setup Lab | Small school network simulation | Cisco Packet Tracer |
| Inventory App | Stock tracking for a small shop | Python, SQLite |

**Skills (new section).** Three groups: Programming, Web Development and Tools. Each has about four placeholder badges reading "Skill name", in the soft poster colors. Each badge has a Bootstrap tooltip with placeholder text ("Short note about this skill"). The badges animate in with a slight stagger on scroll.

**About ("A little about me.").** Same split layout as today, with the copy rewritten for an IT student: interest in building systems and apps, solving problems, learning programming, databases and networking. The HTML/CSS/JS tool list moves out (Skills covers it).

**Contact ("Let's connect.").** Sage-green band. A short line inviting messages, the email shown large as a `mailto:` link, and a "Copy email" button with a Bootstrap Icon. Clicking copy puts the address on the clipboard and shows a Bootstrap toast, "Email copied!". If the clipboard isn't available, the toast says copying didn't work and shows the address.

**Footer.** Keep the giant `MUYCO` wordmark, the "Back to top ↑" link and the small lines, updated to IT wording.

## Animation details

- **Typing:** vanilla JS with no library. It types a line, pauses, deletes it, moves to the next, and loops, with a blinking caret. The full first line sits in the HTML so it reads correctly without JS. With reduce-motion on, the first line shows statically and doesn't cycle. Screen readers get a stable label instead of every changing letter (*builder's call on the technique*).
- **Scroll reveal:** extend the existing IntersectionObserver pattern so section headings, cards and badges fade and slide up when they enter view, staggered within a group.
- **Hover:** cards lift a few pixels and get a soft colored glow. Buttons lift slightly (the current behavior).
- **Scroll progress bar:** a thin lime bar whose width follows page scroll.
- **Hero scene:** existing logic and timings stay. Only the markup and classes change.
- With `prefers-reduced-motion: reduce`, everything above is off or static, and content is fully visible.

## Technical decisions (builder's calls, stated)

- **Tailwind:** Play CDN, v3.4.x pinned (for example `https://cdn.tailwindcss.com/3.4.17`), configured inline with `prefix: 'tw-'` and `corePlugins: { preflight: false }`. Bootstrap's Reboot acts as the single base reset. The palette (`paper`, `ink`, `forest`, `mist`, `lime`, `soft`, `yellow`, `green`, `blue`, `pink`, `orange`, `muted`), the Libre Franklin font family and any keyframes live in the Tailwind config. *Why v3 and not v4:* v3's Play CDN supports the plain `tw-` prefix, and its output is unlayered and injected after Bootstrap, so Tailwind utilities reliably win over Bootstrap's element styles. v4 puts utilities in cascade layers, which unlayered Bootstrap CSS would override.
- **Bootstrap:** 5.3.x CSS and `bootstrap.bundle.min.js` from jsDelivr, pinned. Bootstrap Icons 1.11.x for the email and copy icons. Set Bootstrap's body font and color variables so its components match the palette (for example the modal background uses paper and ink).
- **No hand-written stylesheet.** Anything Tailwind can't express directly (scroll-scene CSS variables, keyframes, `scene-enabled` state) uses Tailwind arbitrary values and variants or the Tailwind config. If a few lines truly can't be expressed that way, a small `<style type="text/tailwindcss">` block in `index.html` is acceptable.
- `script.js` keeps the scene controller and gains the typing, reveal, progress bar, navbar background, tooltip init and copy-to-clipboard code. Still plain JS, no libraries beyond Bootstrap's bundle.
- Update `<meta name="description">` and the README for the new stack and content. Add `.superpowers/` to `.gitignore`.

## Left to the builder

- Exact copy for projects, About, hero lines and footer, written in a friendly first-year BSIT student voice with no invented achievements, clients or links.
- Stylized title-art treatment for each project card (in the spirit of the current Dayoff/Forma/Loop/Common Ground posters).
- Exact animation timings, distances and easing.
- Responsive tuning at tablet and phone widths.
