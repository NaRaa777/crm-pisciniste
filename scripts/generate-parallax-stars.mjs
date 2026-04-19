/**
 * Génère src/starfield-background.css — même logique que le CodePen
 * « Parallax Star background in CSS » (multiple-box-shadow aléatoire 1–2000px).
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Entiers 1..2000 comme random(2000) en Sass. */
function boxShadow(n, seed) {
  const rng = mulberry32(seed)
  const parts = []
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rng() * 2000) + 1
    const y = Math.floor(rng() * 2000) + 1
    parts.push(`${x}px ${y}px #fff`)
  }
  return parts.join(',\n    ')
}

const small = boxShadow(700, 0x9e3779b1)
const medium = boxShadow(200, 0x85ebca6b)
const big = boxShadow(100, 0xc2b2ae35)

const css = `/* Généré par scripts/generate-parallax-stars.mjs — ne pas éditer à la main */
.app-background-container {
  position: fixed;
  inset: 0;
  z-index: 0;
  height: 100%;
  width: 100%;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  overflow: hidden;
  pointer-events: none;
}

.app-background-container #stars,
.app-background-container #stars2,
.app-background-container #stars3 {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

#stars {
  width: 1px;
  height: 1px;
  background: transparent;
  border-radius: 50%;
  box-shadow:
    ${small};
  animation: animStar 50s linear infinite;
}

#stars::after {
  content: '';
  position: absolute;
  top: 2000px;
  width: 1px;
  height: 1px;
  background: transparent;
  border-radius: 50%;
  box-shadow:
    ${small};
}

#stars2 {
  width: 2px;
  height: 2px;
  background: transparent;
  border-radius: 50%;
  box-shadow:
    ${medium};
  animation: animStar 100s linear infinite;
}

#stars2::after {
  content: '';
  position: absolute;
  top: 2000px;
  width: 2px;
  height: 2px;
  background: transparent;
  border-radius: 50%;
  box-shadow:
    ${medium};
}

#stars3 {
  width: 3px;
  height: 3px;
  background: transparent;
  border-radius: 50%;
  box-shadow:
    ${big};
  animation: animStar 150s linear infinite;
}

#stars3::after {
  content: '';
  position: absolute;
  top: 2000px;
  width: 3px;
  height: 3px;
  background: transparent;
  border-radius: 50%;
  box-shadow:
    ${big};
}

@keyframes animStar {
  from {
    transform: translateY(0px);
  }
  to {
    transform: translateY(-2000px);
  }
}
`

writeFileSync(join(__dirname, '../src/starfield-background.css'), css, 'utf8')
console.log('src/starfield-background.css écrit.')
