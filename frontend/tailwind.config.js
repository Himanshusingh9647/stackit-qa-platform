/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom slate theme with black and white accents
        primary: {
          50: '#f8fafc',   // Almost white
          100: '#f1f5f9',  // Light slate
          200: '#e2e8f0',  // Lighter slate
          300: '#cbd5e1',  // Medium light slate
          400: '#94a3b8',  // Medium slate
          500: '#64748b',  // Base slate
          600: '#475569',  // Dark slate
          700: '#334155',  // Darker slate
          800: '#1e293b',  // Very dark slate
          900: '#0f172a',  // Almost black
        },
        accent: {
          50: '#fefefe',   // Pure white
          100: '#fdfdfd',  // Off white
          500: '#6366f1',  // Indigo accent for highlights
          600: '#4f46e5',  // Darker indigo
          700: '#4338ca',  // Deep indigo
        },
        dark: {
          50: '#18181b',   // Zinc 900
          100: '#09090b',  // Zinc 950
        },
        success: '#10b981',  // Emerald 500
        warning: '#f59e0b',  // Amber 500
        error: '#ef4444',    // Red 500
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'elegant': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elegant-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elegant-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
