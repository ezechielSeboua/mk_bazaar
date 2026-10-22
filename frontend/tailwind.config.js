/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          terracotta: '#c07b5a',
          'terracotta-dark': '#a5684a',
          'terracotta-light': '#fef4ee',
          sand: '#F9F9F7',
          'sand-dark': '#EFEFEA',
          charcoal: '#18181B',
          gold: '#B38B41',
        },
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'cart-bounce': {
          '0%, 100%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.25) rotate(-6deg)' },
          '60%': { transform: 'scale(0.95) rotate(3deg)' },
        },
        'heart-pop': {
          '0%, 100%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.3)' },
          '70%': { transform: 'scale(0.9)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s infinite',
        'cart-bounce': 'cart-bounce 0.45s ease-out',
        'heart-pop': 'heart-pop 0.35s ease-out',
      },
    },
  },
  plugins: [],
}
