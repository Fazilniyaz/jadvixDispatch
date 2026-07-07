/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        text: 'var(--text)',
        'text-2': 'var(--text-2)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        scheduled: 'var(--scheduled)',
        picked: 'var(--picked)',
        transit: 'var(--transit)',
        out: 'var(--out)',
        delivered: 'var(--delivered)',
        exception: 'var(--exception)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.02em',
      },
      borderRadius: {
        DEFAULT: '3px',
        sm: '2px',
        md: '4px',
        none: '0px',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(0,0,0,.06)',
      },
      fontSize: {
        '2xs': '0.6875rem',
      },
    },
  },
  plugins: [],
};
