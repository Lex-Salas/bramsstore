/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'bramsstore-blue': '#2593FF',
        'bramsstore-orange': '#FF9500',
        'bramsstore-blue-light': '#60A5FA',
        'bramsstore-orange-light': '#FBBF24'
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      boxShadow: {
        'bramsstore': '0 4px 20px rgba(37, 147, 255, 0.15)',
        'bramsstore-orange': '0 4px 20px rgba(255, 149, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
