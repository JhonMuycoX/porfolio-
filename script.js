// Replay the About introduction when it returns to view.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('is-visible', entry.isIntersecting));
  }, { threshold: 0.12 });
  document.querySelectorAll('.scroll-intro').forEach((intro) => observer.observe(intro));
}

// The reference-inspired scene follows native scrolling; no wheel capture or library.
const scene = document.querySelector('.scene');
const stage = document.querySelector('.scene-stage');
const title = document.querySelector('.scene-title');
const introduction = document.querySelector('.scene-intro');
if (scene && stage && title && introduction) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactScreen = window.matchMedia('(max-width: 700px), (max-height: 650px)');
  const clamp = (value) => Math.max(0, Math.min(1, value));
  let framePending = false;
  function renderScene() {
    framePending = false;
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
  function requestSceneFrame() {
    if (!framePending) {
      framePending = true;
      window.requestAnimationFrame(renderScene);
    }
  }
  window.addEventListener('scroll', requestSceneFrame, { passive: true });
  window.addEventListener('resize', requestSceneFrame);
  reduceMotion.addEventListener('change', requestSceneFrame);
  compactScreen.addEventListener('change', requestSceneFrame);
  renderScene();
}
