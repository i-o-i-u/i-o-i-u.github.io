/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './templates/**/*.html',
    './content/**/*.md',
  ],
  safelist: [
    'dark:hover:bg-orange-900/30',
    'dark:hover:border-orange-600',
    'dark:group-hover:text-orange-400',
  ],
  theme: { extend: {} },
  plugins: [],
}
