import type { Config } from 'tailwindcss'

/** Thème (aligné sur `src/index.css` — @theme / :root). */
export default {
  theme: {
    extend: {
      colors: {
        background: '#060d1a',
        surface: '#0a1628',
        card: '#0e1e35',
        sidebar: '#080f1e',
        border: 'rgba(59,130,246,0.15)',
        primary: '#3b82f6',
        accent: '#06b6d4',
        purple: '#7c3aed',
        success: '#059669',
        warning: '#d97706',
        danger: '#dc2626',
        text: {
          DEFAULT: '#e2e8f0',
          muted: '#64748b',
        },
        'black-contrast': '#000000',
        white: '#ffffff',
      },
    },
  },
} satisfies Config
