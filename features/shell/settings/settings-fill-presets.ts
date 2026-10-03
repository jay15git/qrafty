/** Colorful solid fills for the settings fill option grid. */
export const SETTINGS_FILL_SOLID_PRESETS = [
  "oklch(0.68 0.22 25)",
  "oklch(0.72 0.19 45)",
  "oklch(0.78 0.16 75)",
  "oklch(0.78 0.18 130)",
  "oklch(0.7 0.17 155)",
  "oklch(0.72 0.14 185)",
  "oklch(0.75 0.12 210)",
  "oklch(0.65 0.18 250)",
  "oklch(0.62 0.2 285)",
  "oklch(0.68 0.22 330)",
  "oklch(0.74 0.15 205)",
  "oklch(0.66 0.24 350)",
  "oklch(0.52 0.2 265)",
  "oklch(0.76 0.19 142)",
  "oklch(0.74 0.21 40)",
  "oklch(0.74 0.16 305)",
  "oklch(0.7 0.14 178)",
  "oklch(0.58 0.24 20)",
  "oklch(0.8 0.16 88)",
  "oklch(0.78 0.13 195)",
  "oklch(0.66 0.19 240)",
  "oklch(0.72 0.21 10)",
  "oklch(0.7 0.16 290)",
  "oklch(0.76 0.14 160)",
] as const;

/** Linear gradients — top→bottom multi-hue recipes: skies, sunsets, spectrums. */
export const SETTINGS_FILL_LINEAR_PRESETS = [
  // spectrum: violet → magenta → tangerine → amber → green
  "linear-gradient(in oklch 180deg, oklch(0.5 0.25 295) 0%, oklch(0.58 0.26 335) 25%, oklch(0.68 0.24 30) 55%, oklch(0.8 0.18 85) 78%, oklch(0.72 0.19 145) 100%)",
  // sunset ember: peach → coral → rose → violet
  "linear-gradient(in oklch 180deg, oklch(0.9 0.13 75) 0%, oklch(0.72 0.22 40) 40%, oklch(0.58 0.24 350) 70%, oklch(0.35 0.16 305) 100%)",
  // signal flare: magenta → orange → yellow → white → cobalt
  "linear-gradient(in oklch 180deg, oklch(0.62 0.29 330) 0%, oklch(0.72 0.22 50) 28%, oklch(0.9 0.19 100) 48%, oklch(0.97 0.02 200) 62%, oklch(0.45 0.2 265) 100%)",
  // daybreak: powder blue → cream → gold → coral
  "linear-gradient(in oklch 180deg, oklch(0.82 0.08 235) 0%, oklch(0.94 0.05 100) 40%, oklch(0.87 0.15 95) 70%, oklch(0.72 0.2 40) 100%)",
  // twilight: azure → lavender → peach
  "linear-gradient(in oklch 180deg, oklch(0.65 0.17 260) 0%, oklch(0.72 0.1 300) 55%, oklch(0.83 0.11 55) 100%)",
  // desert sky: indigo → magenta → tangerine → pale yellow
  "linear-gradient(in oklch 180deg, oklch(0.35 0.14 290) 0%, oklch(0.55 0.24 330) 40%, oklch(0.72 0.22 45) 72%, oklch(0.93 0.12 100) 100%)",
  // northern lights: pine → teal → cyan → violet → magenta
  "linear-gradient(in oklch 180deg, oklch(0.35 0.12 175) 0%, oklch(0.55 0.16 195) 30%, oklch(0.72 0.15 220) 55%, oklch(0.6 0.22 290) 78%, oklch(0.68 0.24 340) 100%)",
  // ocean sunset: teal → turquoise → gold → coral → plum
  "linear-gradient(in oklch 180deg, oklch(0.45 0.13 200) 0%, oklch(0.7 0.14 190) 28%, oklch(0.87 0.16 90) 55%, oklch(0.7 0.23 35) 78%, oklch(0.4 0.15 310) 100%)",
  // synthwave: hot pink → orange → yellow → cyan
  "linear-gradient(in oklch 180deg, oklch(0.65 0.28 340) 0%, oklch(0.7 0.24 45) 40%, oklch(0.9 0.18 105) 68%, oklch(0.8 0.13 210) 100%)",
  // peach rain: navy → rose → peach → ice
  "linear-gradient(in oklch 180deg, oklch(0.3 0.1 265) 0%, oklch(0.6 0.2 355) 45%, oklch(0.85 0.1 55) 75%, oklch(0.95 0.03 220) 100%)",
  // fire to ice: crimson → orange → cream → sky blue → indigo
  "linear-gradient(in oklch 180deg, oklch(0.55 0.24 30) 0%, oklch(0.78 0.18 60) 28%, oklch(0.95 0.04 90) 50%, oklch(0.75 0.11 230) 74%, oklch(0.4 0.14 270) 100%)",
  // citrus pop: lime → lemon → orange → magenta → grape
  "linear-gradient(in oklch 180deg, oklch(0.85 0.21 125) 0%, oklch(0.93 0.18 100) 25%, oklch(0.72 0.22 55) 50%, oklch(0.58 0.27 350) 75%, oklch(0.42 0.17 300) 100%)",
  // vaporwave: cyan → pink → violet → deep blue
  "linear-gradient(in oklch 180deg, oklch(0.85 0.11 200) 0%, oklch(0.8 0.12 350) 38%, oklch(0.62 0.2 295) 70%, oklch(0.35 0.13 275) 100%)",
  // golden storm: charcoal → gold → peach → rose → violet
  "linear-gradient(in oklch 180deg, oklch(0.3 0.05 70) 0%, oklch(0.78 0.16 85) 35%, oklch(0.86 0.1 50) 55%, oklch(0.7 0.19 15) 75%, oklch(0.4 0.15 300) 100%)",
  // blueberry cream: cream → lavender → periwinkle → deep blue
  "linear-gradient(in oklch 180deg, oklch(0.95 0.03 80) 0%, oklch(0.85 0.07 300) 35%, oklch(0.65 0.13 280) 68%, oklch(0.35 0.14 270) 100%)",
  // miami: aqua → peach → hot pink → indigo
  "linear-gradient(in oklch 180deg, oklch(0.88 0.1 195) 0%, oklch(0.85 0.11 55) 38%, oklch(0.65 0.26 355) 70%, oklch(0.38 0.15 285) 100%)",
  // ember sky: black → ember → gold → pale cream
  "linear-gradient(in oklch 180deg, oklch(0.2 0.04 40) 0%, oklch(0.5 0.2 35) 42%, oklch(0.8 0.17 85) 72%, oklch(0.96 0.05 100) 100%)",
  // grapefruit sunrise: plum → coral → grapefruit → yellow
  "linear-gradient(in oklch 180deg, oklch(0.38 0.13 320) 0%, oklch(0.6 0.22 20) 40%, oklch(0.75 0.19 55) 70%, oklch(0.9 0.15 95) 100%)",
  // iceberg: navy → royal → ice → white
  "linear-gradient(in oklch 180deg, oklch(0.3 0.1 270) 0%, oklch(0.45 0.18 265) 45%, oklch(0.8 0.08 230) 75%, oklch(0.97 0.01 240) 100%)",
  // prism: red → orange → green → blue → violet
  "linear-gradient(in oklch 180deg, oklch(0.6 0.25 25) 0%, oklch(0.75 0.19 75) 25%, oklch(0.68 0.18 150) 50%, oklch(0.55 0.17 255) 75%, oklch(0.5 0.22 300) 100%)",
  // rosewater: soft pink → mauve → teal → deep sea
  "linear-gradient(in oklch 180deg, oklch(0.85 0.08 350) 0%, oklch(0.68 0.11 320) 35%, oklch(0.62 0.11 200) 70%, oklch(0.3 0.1 220) 100%)",
  // candy stripe: bubblegum → violet → cobalt → mint
  "linear-gradient(in oklch 180deg, oklch(0.75 0.19 350) 0%, oklch(0.58 0.22 300) 35%, oklch(0.45 0.2 270) 65%, oklch(0.85 0.12 165) 100%)",
  // autumn dusk: olive → rust → magenta → indigo
  "linear-gradient(in oklch 180deg, oklch(0.6 0.11 110) 0%, oklch(0.58 0.2 35) 35%, oklch(0.55 0.24 345) 65%, oklch(0.32 0.13 280) 100%)",
  // cloud horizon: deep blue → peach → gold → pale rose
  "linear-gradient(in oklch 180deg, oklch(0.35 0.15 260) 0%, oklch(0.78 0.12 50) 48%, oklch(0.88 0.14 90) 75%, oklch(0.9 0.06 350) 100%)",
] as const;

/** Centered radial gradients — light→dark, dark→light, and pastel→pastel recipes interleaved. */
export const SETTINGS_FILL_RADIAL_PRESETS = [
  // candlelight: cream core → ember edge
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.95 0.1 90) 0%, oklch(0.75 0.19 60) 55%, oklch(0.42 0.17 25) 100%)",
  // spotlight: navy core → powder blue rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.3 0.12 265) 0%, oklch(0.6 0.15 235) 55%, oklch(0.9 0.07 215) 100%)",
  // porcelain: white core → rose quartz rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.97 0.02 350) 0%, oklch(0.82 0.1 350) 100%)",
  // sakura: blush → rose → wine
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.92 0.08 10) 0%, oklch(0.7 0.22 350) 50%, oklch(0.35 0.15 330) 100%)",
  // ember pit: near-black core → tangerine rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.25 0.08 30) 0%, oklch(0.6 0.22 40) 60%, oklch(0.88 0.16 70) 100%)",
  // sorbet: pale peach core → mint rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.93 0.08 70) 0%, oklch(0.87 0.1 165) 100%)",
  // royal: lilac → violet → void
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.85 0.12 300) 0%, oklch(0.55 0.22 290) 55%, oklch(0.24 0.09 280) 100%)",
  // moonstone: charcoal core → lilac mist rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.28 0.05 280) 0%, oklch(0.55 0.1 290) 60%, oklch(0.88 0.07 300) 100%)",
  // dawn: pale gold core → soft coral rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.94 0.09 95) 0%, oklch(0.8 0.14 25) 100%)",
  // aurora: mint → blue → indigo
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.9 0.14 150) 0%, oklch(0.6 0.18 230) 55%, oklch(0.3 0.14 280) 100%)",
  // coral halo: deep plum core → coral rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.3 0.12 310) 0%, oklch(0.62 0.22 345) 55%, oklch(0.85 0.16 30) 100%)",
  // mist: powder blue core → lilac rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.94 0.05 230) 0%, oklch(0.82 0.09 290) 100%)",
  // melon: pale green → watermelon → dark rose
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.9 0.15 140) 0%, oklch(0.68 0.24 20) 55%, oklch(0.4 0.18 350) 100%)",
  // wine cellar: dark burgundy core → rose gold rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.26 0.1 20) 0%, oklch(0.55 0.18 15) 55%, oklch(0.87 0.1 45) 100%)",
  // glacier: ice → cerulean → ink blue
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.94 0.05 225) 0%, oklch(0.62 0.16 240) 55%, oklch(0.26 0.11 265) 100%)",
  // lilac mist: ice core → lavender rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.96 0.03 270) 0%, oklch(0.8 0.11 290) 100%)",
  // jade lantern: pine core → chartreuse rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.28 0.07 165) 0%, oklch(0.58 0.17 145) 55%, oklch(0.9 0.2 125) 100%)",
  // orchid haze: pink-white → magenta → plum
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.93 0.06 340) 0%, oklch(0.65 0.26 330) 50%, oklch(0.32 0.14 300) 100%)",
  // seafoam: white core → powder teal rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.97 0.02 190) 0%, oklch(0.82 0.1 195) 100%)",
  // oasis: deep teal core → seafoam rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.28 0.09 210) 0%, oklch(0.55 0.14 195) 55%, oklch(0.9 0.09 175) 100%)",
  // tidepool: pale aqua core → cyan → abyss edge
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.93 0.08 200) 0%, oklch(0.6 0.17 225) 55%, oklch(0.24 0.1 275) 100%)",
  // eclipse: ink core → amber halo → pale sky rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.22 0.06 280) 0%, oklch(0.7 0.18 75) 70%, oklch(0.92 0.07 210) 100%)",
  // blossom: blush core → mauve rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.95 0.05 15) 0%, oklch(0.78 0.1 325) 100%)",
  // honey: champagne → caramel → chestnut
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.93 0.09 85) 0%, oklch(0.68 0.15 60) 55%, oklch(0.36 0.1 40) 100%)",
  // nebula: violet core → magenta → pale cyan rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.3 0.14 290) 0%, oklch(0.6 0.26 320) 60%, oklch(0.9 0.09 200) 100%)",
  // sunbeam: pale lemon core → honey rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.96 0.1 105) 0%, oklch(0.82 0.13 80) 100%)",
  // copper glow: pale peach → copper → espresso
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.9 0.1 60) 0%, oklch(0.62 0.16 50) 55%, oklch(0.3 0.07 40) 100%)",
  // cotton candy: blush core → powder blue rim
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.94 0.07 350) 0%, oklch(0.84 0.08 235) 100%)",
  // plum wine: pale mauve → plum → black cherry
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.88 0.08 320) 0%, oklch(0.55 0.2 325) 55%, oklch(0.25 0.1 340) 100%)",
] as const;

/** Solids and gradients interleaved for the horizontal fill picker row. */
export const SETTINGS_FILL_PRESETS = [
  "oklch(0.68 0.22 25)",
  "linear-gradient(in oklch 125deg, oklch(0.82 0.18 45) 0%, oklch(0.58 0.22 15) 100%)",
  "oklch(0.72 0.19 45)",
  "linear-gradient(in oklch 200deg, oklch(0.78 0.12 210) 0%, oklch(0.45 0.18 265) 100%)",
  "oklch(0.78 0.16 75)",
  "linear-gradient(in oklch 160deg, oklch(0.82 0.16 130) 0%, oklch(0.52 0.14 195) 100%)",
  "oklch(0.78 0.18 130)",
  "linear-gradient(in oklch 315deg, oklch(0.75 0.2 330) 0%, oklch(0.55 0.22 280) 100%)",
  "oklch(0.7 0.17 155)",
  "linear-gradient(in oklch 35deg, oklch(0.9 0.14 95) 0%, oklch(0.65 0.2 55) 100%)",
  "oklch(0.72 0.14 185)",
  "linear-gradient(in oklch 270deg, oklch(0.72 0.16 300) 0%, oklch(0.42 0.12 260) 100%)",
  "oklch(0.75 0.12 210)",
  "radial-gradient(circle farthest-corner at 50% 35% in oklch, oklch(0.88 0.14 85) 0%, oklch(0.55 0.2 25) 100%)",
  "oklch(0.65 0.18 250)",
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.75 0.15 200) 0%, oklch(0.38 0.16 265) 100%)",
  "oklch(0.62 0.2 285)",
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.8 0.17 155) 0%, oklch(0.42 0.14 170) 100%)",
  "oklch(0.68 0.22 330)",
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.78 0.2 330) 0%, oklch(0.48 0.22 15) 100%)",
  "oklch(0.74 0.15 205)",
  "linear-gradient(in oklch 90deg, oklch(0.85 0.16 95) 0%, oklch(0.62 0.22 25) 100%)",
  "oklch(0.66 0.24 350)",
  "linear-gradient(in oklch 240deg, oklch(0.7 0.18 330) 0%, oklch(0.48 0.16 250) 100%)",
  "oklch(0.52 0.2 265)",
  "linear-gradient(in oklch 15deg, oklch(0.8 0.12 200) 0%, oklch(0.58 0.2 280) 100%)",
  "oklch(0.76 0.19 142)",
  "linear-gradient(in oklch 145deg, oklch(0.84 0.15 125) 0%, oklch(0.5 0.18 300) 100%)",
  "oklch(0.74 0.21 40)",
  "linear-gradient(in oklch 300deg, oklch(0.76 0.2 50) 0%, oklch(0.42 0.14 220) 100%)",
  "oklch(0.74 0.16 305)",
  "radial-gradient(circle farthest-corner at 30% 30% in oklch, oklch(0.86 0.14 95) 0%, oklch(0.5 0.2 320) 100%)",
  "oklch(0.7 0.14 178)",
  "radial-gradient(circle farthest-corner at 70% 30% in oklch, oklch(0.8 0.17 175) 0%, oklch(0.45 0.18 250) 100%)",
  "oklch(0.58 0.24 20)",
  "radial-gradient(circle farthest-corner at 50% 65% in oklch, oklch(0.82 0.18 60) 0%, oklch(0.48 0.22 10) 100%)",
  "oklch(0.8 0.16 88)",
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.72 0.2 145) 0%, oklch(0.4 0.12 200) 100%)",
  "oklch(0.78 0.13 195)",
  "linear-gradient(in oklch 55deg, oklch(0.88 0.15 110) 0%, oklch(0.52 0.2 340) 100%)",
] as const;
