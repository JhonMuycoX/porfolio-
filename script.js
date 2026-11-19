const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (value) => Math.max(0, Math.min(1, value));

// Run `callback` at most once per animation frame; returns the scheduling function.
function rafThrottle(callback) {
  let pending = false;
  return () => {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(() => {
      pending = false;
      callback();
    });
  };
}

// rAF-throttled scroll and resize handler shared by the navbar, progress bar and scene.
function onScrollFrame(callback) {
  const schedule = rafThrottle(callback);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  return schedule;
}

function initScene() {
  // The reference-inspired scene follows native scrolling; no wheel capture or library.
  const scene = document.querySelector('[data-scene]');
  const stage = document.querySelector('[data-scene-stage]');
  const title = document.querySelector('[data-scene-title]');
  const introduction = document.querySelector('[data-scene-intro]');
  if (!(scene && stage && title && introduction)) return;

  const compactScreen = window.matchMedia('(max-width: 700px), (max-height: 650px)');
  function renderScene() {
    const enabled = !reduceMotion.matches && !compactScreen.matches;
    document.documentElement.classList.toggle('scene-enabled', enabled);
    if (!enabled) {
      title.inert = false;
      introduction.inert = false;
      return;
    }
    const distance = Math.max(1, scene.offsetHeight - stage.offsetHeight);
    const progress = clamp(-scene.getBoundingClientRect().top / distance);
    const introProgress = clamp((progress - 0.36) / 0.36);
    const portraitProgress = clamp((progress - 0.05) / 0.72);
    const height = stage.offsetHeight;
    const values = {
      '--title-opacity': clamp(1 - progress * 3),
      '--title-y': `${Math.round(progress * -100)}px`,
      '--intro-opacity': introProgress,
      '--intro-y': `${Math.round((1 - introProgress) * 28)}px`,
      '--portrait-y': `${Math.round((1 - portraitProgress) * height * 0.9)}px`,
      '--back-left-x': `${Math.round(progress * -180)}px`,
      '--back-right-x': `${Math.round(progress * 180)}px`,
      '--back-y': `${Math.round(progress * -100)}px`,
      '--back-bottom-y': `${Math.round(progress * 200)}px`,
      '--art-opacity': 1 - progress * 0.78,
    };
    Object.entries(values).forEach(([name, value]) => scene.style.setProperty(name, value));
    title.inert = progress > 0.34;
    introduction.inert = introProgress < 0.5;
  }
  const schedule = onScrollFrame(renderScene);
  reduceMotion.addEventListener('change', schedule);
  compactScreen.addEventListener('change', schedule);
  renderScene();
}

// Type, hold, delete, pause through the lines. Writes textContent only.
function initTyping() {
  const target = document.querySelector('#typing-text');
  if (!target) return;
  let lines;
  try { lines = JSON.parse(target.dataset.typingLines || '[]'); } catch { lines = []; }
  if (!Array.isArray(lines) || lines.length < 2) return;

  const { typeMs, deleteMs, holdMs, gapMs } = { typeMs: 75, deleteMs: 40, holdMs: 1800, gapMs: 350 };
  let index = Math.max(0, lines.indexOf(target.textContent.trim()));
  let timer = 0;
  let running = false;

  const later = (fn, ms) => { timer = window.setTimeout(fn, ms); };
  function typeNext() {
    const line = lines[index];
    const shown = target.textContent;
    if (shown.length < line.length) {
      target.textContent = line.slice(0, shown.length + 1);
      later(typeNext, typeMs);
    } else {
      later(deleteNext, holdMs);
    }
  }
  function deleteNext() {
    const shown = target.textContent;
    if (shown.length > 0) {
      target.textContent = shown.slice(0, -1);
      later(deleteNext, deleteMs);
    } else {
      index = (index + 1) % lines.length;
      later(typeNext, gapMs);
    }
  }
  function start() {
    if (running) return;
    running = true;
    later(deleteNext, holdMs);
  }
  function stop() {
    running = false;
    window.clearTimeout(timer);
    target.textContent = lines[index];
  }
  function sync() {
    if (reduceMotion.matches) stop();
    else start();
  }
  reduceMotion.addEventListener('change', sync);
  sync();
}

// Fade and lift [data-reveal] elements in as they enter view, replaying on re-entry.
// Nothing is hidden by CSS: the backwards-filled animation is the only thing that hides an element.
// The observer margin starts each reveal just before the element is painted, so it never flashes visible first.
function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length || !('IntersectionObserver' in window) || !('animate' in Element.prototype)) return;
  if (reduceMotion.matches) return;

  const running = new WeakMap();
  function play(el) {
    const group = el.closest('[data-reveal-group]');
    const index = group ? [...group.querySelectorAll('[data-reveal]')].indexOf(el) : 0;
    running.get(el)?.cancel();
    const animation = el.animate(
      [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }],
      { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)', delay: Math.max(0, index) * 90, fill: 'backwards' },
    );
    running.set(el, animation);
  }

  const observer = new IntersectionObserver((entries) => {
    if (reduceMotion.matches) return;
    entries.forEach((entry) => { if (entry.isIntersecting) play(entry.target); });
  }, { threshold: 0, rootMargin: '10% 0px 10% 0px' });
  items.forEach((el) => observer.observe(el));
}

function initNavbar() {
  const nav = document.querySelector('#site-nav');
  const menu = document.querySelector('#nav-links');
  if (!nav) return;

  const update = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  onScrollFrame(update);
  update();

  if (!menu) return;
  menu.querySelectorAll('[data-nav-link]').forEach((link) => {
    link.addEventListener('click', () => {
      if (menu.classList.contains('show')) {
        bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false }).hide();
      }
    });
  });
}

function initProgress() {
  const bar = document.querySelector('#scroll-progress');
  if (!bar) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? clamp(window.scrollY / max) : 0})`;
  };
  onScrollFrame(update);
  update();
}

function initTooltips() {
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => new bootstrap.Tooltip(el));
}

function initCopyEmail() {
  const button = document.querySelector('#copy-email');
  const toastEl = document.querySelector('#copy-toast');
  const text = document.querySelector('#copy-toast-text');
  if (!button || !toastEl || !text) return;
  const email = button.dataset.email;
  const show = (message) => {
    text.textContent = message;
    if (typeof bootstrap !== 'undefined') bootstrap.Toast.getOrCreateInstance(toastEl).show();
  };
  const fail = () => show(`Couldn't copy. The email is ${email}`);
  button.addEventListener('click', () => {
    if (!navigator.clipboard?.writeText) return fail();
    // Called inside the click handler so the user gesture still counts.
    navigator.clipboard.writeText(email).then(() => show('Email copied!'), fail);
  });
}

initScene();
initTyping();
initNavbar();
initProgress();
initReveal();
initTooltips();
initCopyEmail();
