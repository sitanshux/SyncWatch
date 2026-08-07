/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System Palette (01-Visual-Identity.md Source of Truth)
        background:   '#050505',
        'bg-secondary': '#0D0D0D',
        secondary:    '#121212',
        surface:      '#121212',
        elevated:     '#181818',
        border:       '#262626',
        divider:      '#2F2F2F',

        // Text Tokens (High contrast & readability)
        lightGray:    '#FFFFFF',
        mutedGray:    '#A3A3A3',
        'text-secondary': '#B3B3B3',
        primary:      '#FFFFFF',

        // Accent Color
        accent:       '#7C3AED',
        'accent-indigo': '#6366F1',
        'accent-dark': '#4F46E5',

        // Semantic Colors
        danger:       '#EF4444',
        success:      '#22C55E',
        warning:      '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        btn:   '14px',
        card:  '18px',
        input: '14px',
        modal: '22px',
      },
      boxShadow: {
        'glass': '0 20px 50px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.1)',
        'luxury': '0 40px 100px -20px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}
