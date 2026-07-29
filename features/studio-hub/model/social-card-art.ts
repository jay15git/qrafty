export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`
}

/** Stylized Paris hero — sky, clouds, Eiffel tower, tree line */
export const PARIS_HERO_ART = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 808 652" fill="none">
  <defs>
    <linearGradient id="sky" x1="404" y1="0" x2="404" y2="652" gradientUnits="userSpaceOnUse">
      <stop stop-color="#6ec4be"/>
      <stop offset="1" stop-color="#a8ddd6"/>
    </linearGradient>
    <linearGradient id="ground" x1="404" y1="420" x2="404" y2="652" gradientUnits="userSpaceOnUse">
      <stop stop-color="#8fd06f"/>
      <stop offset="1" stop-color="#c8d84a"/>
    </linearGradient>
  </defs>
  <rect width="808" height="652" rx="28" fill="url(#sky)"/>
  <ellipse cx="160" cy="118" rx="98" ry="42" fill="#fff" opacity="0.92"/>
  <ellipse cx="248" cy="108" rx="72" ry="34" fill="#fff" opacity="0.88"/>
  <ellipse cx="620" cy="96" rx="110" ry="46" fill="#fff" opacity="0.9"/>
  <ellipse cx="700" cy="118" rx="64" ry="30" fill="#fff" opacity="0.82"/>
  <path d="M404 118 L428 248 L476 248 L436 318 L452 448 L404 418 L356 448 L372 318 L332 248 L380 248 Z" fill="#3d4f52"/>
  <path d="M404 168 L416 248 L392 248 Z" fill="#2a383a"/>
  <path d="M364 318 H444 V338 H364 Z" fill="#2a383a"/>
  <path d="M348 338 H460 V358 H348 Z" fill="#2a383a"/>
  <rect x="396" y="248" width="16" height="70" fill="#4a5c5f"/>
  <path d="M0 430 C120 390 220 470 340 430 C460 390 560 450 680 420 C740 405 780 420 808 430 V652 H0 Z" fill="url(#ground)"/>
  <ellipse cx="120" cy="448" rx="46" ry="62" fill="#5fa84a"/>
  <ellipse cx="220" cy="462" rx="38" ry="54" fill="#6eb655"/>
  <ellipse cx="680" cy="450" rx="52" ry="68" fill="#5fa84a"/>
  <ellipse cx="580" cy="468" rx="40" ry="56" fill="#72ba58"/>
</svg>`)

/** Warm Amsterdam canal scene */
export const AMSTERDAM_HERO_ART = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 808 620" fill="none">
  <defs>
    <linearGradient id="amSky" x1="404" y1="0" x2="404" y2="620">
      <stop stop-color="#ffb36b"/>
      <stop offset="1" stop-color="#ff8f4a"/>
    </linearGradient>
    <linearGradient id="amWater" x1="404" y1="380" x2="404" y2="620">
      <stop stop-color="#e86f3f"/>
      <stop offset="1" stop-color="#c94f28"/>
    </linearGradient>
  </defs>
  <rect width="808" height="620" fill="url(#amSky)"/>
  <circle cx="140" cy="120" r="72" fill="#ffd08a" opacity="0.85"/>
  <rect x="88" y="260" width="120" height="150" rx="6" fill="#f25c3a"/>
  <polygon points="88,260 148,210 208,260" fill="#d94828"/>
  <rect x="240" y="220" width="96" height="190" rx="4" fill="#ef6b42"/>
  <polygon points="240,220 288,178 336,220" fill="#cf4f2c"/>
  <rect x="470" y="240" width="110" height="170" rx="5" fill="#f06738"/>
  <polygon points="470,240 525,195 580,240" fill="#d14b2a"/>
  <path d="M0 400 Q200 360 404 390 T808 400 V620 H0 Z" fill="url(#amWater)"/>
  <path d="M120 400 C180 430 240 390 300 410 S420 430 500 400 S660 420 720 395" stroke="#ffd7a8" stroke-width="8" opacity="0.5" fill="none"/>
</svg>`)

/** Orange mesh folder header */
export const STUDIO_FOLDER_ART = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 420" fill="none">
  <defs>
    <radialGradient id="meshA" cx="0.8" cy="0.2" r="0.9">
      <stop stop-color="#ffb347"/>
      <stop offset="0.55" stop-color="#ff8f4a"/>
      <stop offset="1" stop-color="#fff0dc"/>
    </radialGradient>
    <radialGradient id="meshB" cx="0.2" cy="0.7" r="0.7">
      <stop stop-color="#ff6b3d" stop-opacity="0.7"/>
      <stop offset="1" stop-color="#fff0dc" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="920" height="420" rx="32" fill="url(#meshA)"/>
  <rect width="920" height="420" rx="32" fill="url(#meshB)"/>
</svg>`)
