/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        water: { dark: '#0c2340', mid: '#1565C0', light: '#42A5F5', pale: '#E3F2FD', accent: '#00BCD4' },
        rb: { dark: '#3e1000', mid: '#BF360C', light: '#FF7043', pale: '#FBE9E7', accent: '#FFC107' },
        delivery: { dark: '#0d2b1a', mid: '#2E7D32', light: '#66BB6A', pale: '#E8F5E9', accent: '#00BFA5' },
        admin: { dark: '#1a0533', mid: '#6A1B9A', light: '#AB47BC', pale: '#F3E5F5', accent: '#E040FB' },
        brand: { 900: '#0a0e1a', 800: '#111827', 700: '#1a2235', 600: '#243049', 500: '#2e3f5c' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        heading: ['"Barlow Condensed"', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
