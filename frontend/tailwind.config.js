/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink:        '#0b0a0d', // base background (warm near-black)
        hall:       '#13100d', // hall floor — section base
        panel:      '#1a1611', // panel surface
        panelup:    '#231d15', // raised panel / hover
        line:       '#2e2619', // warm hairline border
        brass:      '#c9973a', // primary accent (kept from original)
        brassbright:'#ecc878', // gold highlight
        oxblood:    '#8a2f29', // house red — heraldic second color
        oxblooddeep:'#4e1a17',
        bone:       '#e9e0cf', // parchment text
        ash:        '#8c8475', // muted text
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        crest: '0.35em',
      },
    },
  },
  plugins: [],
}
