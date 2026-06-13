/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'slate-brand':  '#5b7e8f',
        'slate-dark':   '#3f5f6e',
        'slate-light':  '#7fa0b0',
        'slate-pale':   '#d6e5ec',
        cream:          '#f7f3ee',
        'warm-white':   '#fdfaf6',
        sand:           '#e8ddd0',
        'sand-dark':    '#c4b09a',
        charcoal:       '#2c3a40',
        'text-muted':   '#7a8f96',
        // FSM-specific status colours
        'status-safe':    '#4d9221',
        'status-caution': '#f9cd0b',
        'status-danger':  '#c21f39',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        sub:     ['Marcellus', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      maxWidth: { content: '1240px' },
    },
  },
  plugins: [],
}
