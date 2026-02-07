/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0e27',
          surface: '#1a1f3a',
          border: '#2d3561',
          primary: '#00ffff',
          secondary: '#ff00ff',
          accent: '#ffff00',
          success: '#00ff00',
          danger: '#ff0055',
          warning: '#ff9500',
        },
      },
      backgroundImage: {
        'cyber-grid': 'linear-gradient(#2d3561 1px, transparent 1px), linear-gradient(90deg, #2d3561 1px, transparent 1px)',
        'cyber-gradient': 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)',
      },
      boxShadow: {
        'cyber': '0 0 10px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.1)',
        'cyber-lg': '0 0 20px rgba(0, 255, 255, 0.4), 0 0 40px rgba(0, 255, 255, 0.2)',
        'neon-pink': '0 0 10px rgba(255, 0, 255, 0.5)',
        'neon-yellow': '0 0 10px rgba(255, 255, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fadeIn': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 255, 255, 0.5), 0 0 10px rgba(0, 255, 255, 0.3)' },
          '100%': { boxShadow: '0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.5)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
