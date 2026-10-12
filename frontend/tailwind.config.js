/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Gris cálido (DESIGN.md §2): reemplaza slate en toda la app
        slate: {
          50: '#FAF8F6',
          100: '#F5F3F1',
          200: '#E7E3DF',
          300: '#D6D2CD',
          400: '#A3A3AA',
          500: '#6F717B',
          600: '#565964',
          700: '#3F4350',
          800: '#2A2D38',
          900: '#1B1E2A',
          950: '#12141C',
        },
        canvas: '#F5F3F1',
        ink: '#1B1E2A',
        primary: {
          50: '#EEF2FE',
          100: '#DCE4FD',
          200: '#BFCDFB',
          300: '#93AAF7',
          400: '#6482F0',
          500: '#4570EC',
          600: '#2B5CE6',
          700: '#2149C2',
          800: '#1E3D9C',
          900: '#1E367B',
          950: '#15224A',
        },
        // Colores por concepto (DESIGN.md §2)
        teal: { 50: '#EAF4F2', 100: '#D3E9E6', 500: '#44958C', 600: '#3A8279', 700: '#2F6B63' },
        leaf: { 50: '#EDF6EE', 100: '#D6ECD8', 500: '#4FA65B', 600: '#43904E', 700: '#377640' },
        sky: { 50: '#EBF4FA', 100: '#D3E7F3', 500: '#4E9BC9', 600: '#3F84AE', 700: '#336C8F' },
        coral: { 50: '#FCEFEB', 100: '#F8DBD3', 500: '#DF5E41', 600: '#C64E33', 700: '#A3402A' },
        ochre: { 50: '#FDF4EA', 100: '#FAE5CC', 500: '#E08B35', 600: '#C4742A', 700: '#A15F22' },
        olive: { 50: '#F7F4E6', 100: '#EEE8C8', 500: '#B4A04A', 600: '#97853B', 700: '#786A2F' },
        violet: { 50: '#F3F0FA', 100: '#E5DFF4', 500: '#8D7AC3', 600: '#7562AE', 700: '#5F4F8F' },
        pine: { 50: '#EAF3F0', 100: '#D1E6DF', 500: '#3F8977', 600: '#347464', 700: '#2A5E51' },
        rose: { 50: '#FCEFEF', 100: '#F8DCDD', 500: '#E6888A', 600: '#D06A6C', 700: '#AE5254' },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgb(27 30 42 / 0.04)',
        'card': '0 1px 2px 0 rgb(27 30 42 / 0.04), 0 4px 16px -8px rgb(27 30 42 / 0.08)',
        'elevated': '0 2px 4px 0 rgb(27 30 42 / 0.04), 0 12px 28px -12px rgb(27 30 42 / 0.18)',
        'popover': '0 24px 48px -24px rgb(27 30 42 / 0.25), 0 2px 6px -2px rgb(27 30 42 / 0.08)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
