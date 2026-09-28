/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          main: '#1e1e1e',
          sidebar: '#252526',
          border: '#333333'
        },
        accent: {
          toxic: '#39FF14',
          purple: '#9D00FF'
        },
        text: {
          body: '#d4d4d4',
          heading: '#ffffff'
        }
      }
    },
  },
  plugins: [],
}
