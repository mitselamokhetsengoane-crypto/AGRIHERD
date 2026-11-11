/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B5E20', // Primary Forest Green
          hover: '#144818',
          dark: '#0E3B13',
          light: '#E8F5E9',   // Light Green
        },
        secondary: {
          DEFAULT: '#2E7D32', // Secondary Green
          hover: '#246328',
          light: '#F1F8F2',
        },
        navy: {
          DEFAULT: '#172B3A', // Dark Navy
          hover: '#101F2B',
          dark: '#0B151D',
          light: '#243A4D',
        },
        background: '#F5F7F6', // Main Background
        surface: '#FFFFFF',    // White
        maintext: '#1F2937',   // Main Text
        subtext: '#6B7280',    // Secondary Text
        warning: {
          DEFAULT: '#F59E0B',  // Warning Orange
          light: '#FEF3C7',
          dark: '#B45309',
        },
        error: {
          DEFAULT: '#DC2626',  // Error Red
          light: '#FEE2E2',
          dark: '#991B1B',
        },
        success: {
          DEFAULT: '#1B5E20',
          light: '#E8F5E9',
        },
        border: {
          DEFAULT: '#E5E7EB',
          strong: '#D1D5DB',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
};
