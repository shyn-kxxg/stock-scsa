/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0d0d1a',
        card: '#13131f',
        border: '#2a2a42',
      },
    },
  },
  plugins: [],
}
