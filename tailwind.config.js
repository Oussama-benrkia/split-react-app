/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      width: { a4: '794px' },
      height: { a4: '1123px' },
      minHeight: { a4: '1123px' },
    },
  },
  plugins: [],
}

