/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'soc': {
          'critical': '#dc2626',
          'high': '#ea580c',
          'medium': '#ca8a04',
          'low': '#2563eb',
        }
      }
    },
  },
  plugins: [],
}
