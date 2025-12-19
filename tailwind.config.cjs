module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Educational-friendly color palette
        primary: {
          50: '#e6f3ff',
          100: '#cce7ff',
          200: '#99cfff',
          300: '#66b7ff',
          400: '#339fff',
          500: '#0087ff', // Main primary - Bright but friendly blue
          600: '#006ecc',
          700: '#005299',
          800: '#003766',
          900: '#001b33',
        },
        secondary: {
          50: '#fff4e6',
          100: '#ffe9cc',
          200: '#ffd399',
          300: '#ffbd66',
          400: '#ffa733',
          500: '#ff9100', // Warm orange accent
          600: '#cc7400',
          700: '#995700',
          800: '#663a00',
          900: '#331d00',
        },
        success: {
          50: '#e8f9f0',
          100: '#d1f3e1',
          200: '#a3e7c3',
          300: '#75dba5',
          400: '#47cf87',
          500: '#10b981', // Fresh green
          600: '#0d9468',
          700: '#0a6f4e',
          800: '#064a34',
          900: '#03251a',
        },
        accent: {
          50: '#f3e6ff',
          100: '#e6ccff',
          200: '#cc99ff',
          300: '#b366ff',
          400: '#9933ff',
          500: '#8000ff', // Vibrant purple for highlights
          600: '#6600cc',
          700: '#4d0099',
          800: '#330066',
          900: '#1a0033',
        },
      },
    },
  },
  plugins: [],
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    purge: {
      enabled: true,
      content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
      options: {
        safelist: ['html', 'body'],
      }
    }
  })
}
