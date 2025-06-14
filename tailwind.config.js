const plugin = require('tailwindcss/plugin')

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        yellow: {
          50: '#FFFAE5',
          100: '#FFF5CC',
          200: '#FFEB99',
          300: '#FFE066',
          400: '#FFD633',
          500: '#FFCC00',
          600: '#CCA300',
          700: '#997A00',
          800: '#665200',
          900: '#332900',
          950: '#1A1400',
        },
        black: {
          50: '#E6E6E6',
          100: '#CCCCCC',
          200: '#999999',
          300: '#666666',
          400: '#333333',
          500: '#000000',
        },
        white: '#F5F5F5',

        neutral: {
          0: '#0000001a',
          200: '#E5E5E5',
          300: '#CCCCCC',
          400: '#B2B2B2',
          500: '#999999',
          600: '#7F7F7F',
          700: '#666666',
          800: '#4C4C4C',
          900: '#333333',
        },

        error: {
          0: '#E04E4E20',
          100: '#E04E4E',
          200: '#B31F1F',
          300: '#A21919',
        },

        // 🎯 Aquí está la magia: con funciones CSS
        primary: 'var(--primary-color)',
        background: 'var(--bg-color)',
        text: {
          DEFAULT: 'var(--text-color)',
          inverse: 'var(--text-inverse-color)',
        },
      },
    },
  },
  plugins: [],
}
