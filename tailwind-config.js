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
      keyframes: {
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
        wiggle: { '0%, 100%': { transform: 'rotate(0deg)' }, '25%': { transform: 'rotate(-12deg)' }, '50%': { transform: 'rotate(10deg)' }, '75%': { transform: 'rotate(-6deg)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        wiggle: 'wiggle 500ms ease-in-out',
        // Three floats with different negative delays so the heading tiles never bob in sync.
        float: 'float 3s ease-in-out -0.6s infinite',
        'float-b': 'float 3s ease-in-out -1.6s infinite',
        'float-c': 'float 3s ease-in-out -2.4s infinite',
      },
    },
  },
  plugins: [
    ({ addVariant, addComponents }) => {
      // scene:tw-... applies only while script.js has switched the pinned hero scene on.
      // An attribute selector, because Tailwind would rename a class selector here to .tw-scene-enabled.
      addVariant('scene', '[class~="scene-enabled"] &');
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
