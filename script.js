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
  // Replay the About introduction when it returns to view.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-visible', entry.isIntersecting));
    }, { threshold: 0.12 });
    document.querySelectorAll('.scroll-intro').forEach((intro) => observer.observe(intro));
  }

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

initScene();
initTyping();
initNavbar();
initProgress();
