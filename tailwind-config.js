// Tailwind Play CDN config. Utilities are prefixed (tw-) so they never collide with Bootstrap.
tailwind.config = {
  prefix: 'tw-',
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        paper: '#f1f0e8',
        ink: '#142b23',
        muted: '#536159',
        forest: '#142b23',
        mist: '#e6ecda',
        lime: '#d7e9a5',
        soft: '#e2e5d8',
        yellow: '#edcf69',
        green: '#c6d5b7',
        blue: '#203d3a',
        pink: '#d6acb8',
        orange: '#713326',
      },
      fontFamily: { sans: ['"Libre Franklin"', 'sans-serif'] },
      keyframes: { blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } } },
      animation: { blink: 'blink 1s step-end infinite' },
    },
  },
  plugins: [
    ({ addVariant, addComponents }) => {
      // scene:tw-... applies only while script.js has switched the pinned hero scene on.
      addVariant('scene', '.scene-enabled &');
      // The prefix turns this into .tw-frame.
      addComponents({
        '.frame': {
          maxWidth: '1800px',
          marginInline: 'auto',
          paddingInline: 'clamp(20px, 3.4vw, 56px)',
        },
      });
    },
  ],
};
