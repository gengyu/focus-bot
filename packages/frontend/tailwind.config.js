/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        success: '#10B981',
        error: '#EF4444',
      },
    },
  },
  plugins: [require('daisyui')],
}