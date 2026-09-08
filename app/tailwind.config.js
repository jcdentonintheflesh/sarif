/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Data stays mono (bundled IBM Plex Mono); display face for headings/labels.
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Single accent — a refined azure. Replaces default Tailwind indigo-blue,
        // so every existing blue-* class adopts it. Used for interactive/active
        // and key data highlights only.
        blue: {
          50:  '#eef8fd',
          100: '#d5eefa',
          200: '#aaddf4',
          300: '#82c8f0',
          400: '#4bade8',
          500: '#2f97d8',
          600: '#1f7cb8',
          700: '#175f8e',
          800: '#134b70',
          900: '#123f5d',
          950: '#0c283d',
        },
        // Surface ramp + hairline (mirror the CSS tokens in index.css).
        surface: {
          0: '#050505',
          1: '#0b0b0c',
          2: '#151517',
        },
        line: 'rgba(255,255,255,0.16)',
      },
    },
  },
  plugins: [],
}
