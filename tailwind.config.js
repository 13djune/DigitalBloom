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
      primary: {
      50: "#F6FDFE",
      100: "#ECFAFD",
      200: "#DAF5FB",
      300: "#C7F0FA",
      400: "#B5EBF8",
      500: "#A1E6F6",
      600: "#57D2EF",
      700: "#15B9DF",
      800: "#0E7C95",
      900: "#073E4A",
      950: "#041F25"
    },
  secondary: {
      50: "#E6E7FC",
      100: "#CDCEF9",
      200: "#9DA1F3",
      300: "#6A72EC",
      400: "#2E40DF",
      500: "#19258D",
      600: "#131D75",
      700: "#0E1761",
      800: "#09104F",
      900: "#040834",
      950: "#020423"
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
        accent: '#3be9c9',
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

        
        primary: 'var(--primary-color)',
        background: '#00031E',
        text: {
          DEFAULT: 'var(--text-color)',
          inverse: 'var(--text-inverse-color)',
        },
      },
    },
  },
  plugins: [],
}
