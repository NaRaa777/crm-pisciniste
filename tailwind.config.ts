import type { Config } from 'tailwindcss'

/** Couleurs primaires (alignées sur `src/index.css` — @theme et :root). */
export default {
  theme: {
    extend: {
      colors: {
        primary: '#5b21b6',
        accent: '#c4b5fd',
      },
    },
  },
} satisfies Config
