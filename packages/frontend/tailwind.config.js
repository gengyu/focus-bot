
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'oklch(var(--color-primary))',
        success: 'var(--color-success)',
        error: 'var(--color-error)',
      },
    },
  },
  plugins: [],
}