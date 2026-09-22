/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        workspace: {
          bg: '#0f0f0f',
          secondary: '#171717',
          surface: '#1c1c1c',
          border: '#2a2a2a',
          hover: '#242424',
          subtle: '#333333',
        },
        lightspace: {
          bg: '#ffffff',
          secondary: '#f7f7f7',
          surface: '#ffffff',
          border: '#e5e5e5',
          hover: '#f0f0f0',
          subtle: '#e4e4e7',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
