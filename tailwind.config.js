/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // WatchWorthy palette — darker and more cinematic than Netflix.
        ink: '#0A0A0F', // deep near-black background
        surface: '#12121A', // rich dark cards
        'surface-2': '#1A1A24', // raised cards / hover
        violet: {
          DEFAULT: '#7C3AED', // electric violet accent
          soft: '#9F67FF',
        },
        gold: '#F59E0B', // amber highlight for ratings
      },
      fontFamily: {
        display: ['"Bebas Neue"', '"Playfair Display"', 'serif'],
        serif: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(124, 58, 237, 0.5)',
        card: '0 20px 50px -20px rgba(0, 0, 0, 0.8)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.25s ease-out both',
        shimmer: 'shimmer 1.5s linear infinite',
      },
    },
  },
  plugins: [],
};
