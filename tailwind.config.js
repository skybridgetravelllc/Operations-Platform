/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] },
      colors: {
        sb: {
          sidebar:   '#0B1426',
          sidebarhover: '#131E33',
          sidebaractive: '#1D3B6E',
          accent:    '#2563EB',
          accenthov: '#1D4ED8',
          accentlt:  '#EFF6FF',
          bg:        '#F1F5F9',
          surface:   '#FFFFFF',
          surface2:  '#F8FAFC',
          border:    '#E2E8F0',
          bordstr:   '#CBD5E1',
          text1:     '#0F172A',
          text2:     '#475569',
          text3:     '#94A3B8',
          success:   '#059669',
          successlt: '#ECFDF5',
          warning:   '#D97706',
          warninglt: '#FFFBEB',
          danger:    '#DC2626',
          dangerlt:  '#FEF2F2',
          info:      '#7C3AED',
          infolt:    '#F5F3FF',
          gold:      '#F59E0B',
          goldlt:    '#FFFBEB',
        }
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        modal: '0 20px 60px rgba(0,0,0,.12), 0 4px 16px rgba(0,0,0,.08)',
        dropdown: '0 8px 24px rgba(0,0,0,.10), 0 2px 8px rgba(0,0,0,.06)',
      }
    }
  },
  plugins: []
}
