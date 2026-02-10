/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mu: {
          // Updated to feel closer to the bright blue / yellow eFootball look
          navy: '#050824',
          blue: '#2431a8',
          gold: '#ffe600',
          'gold-light': '#fff46b',
          cream: '#f7f5ff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
