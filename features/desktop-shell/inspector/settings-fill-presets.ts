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
] as const

/** Linear and radial gradient fills for the settings fill option grid. */
export const SETTINGS_FILL_GRADIENT_PRESETS = [
  "linear-gradient(in oklch 125deg, oklch(0.82 0.18 45) 0%, oklch(0.58 0.22 15) 100%)",
  "linear-gradient(in oklch 200deg, oklch(0.78 0.12 210) 0%, oklch(0.45 0.18 265) 100%)",
  "linear-gradient(in oklch 160deg, oklch(0.82 0.16 130) 0%, oklch(0.52 0.14 195) 100%)",
  "linear-gradient(in oklch 315deg, oklch(0.75 0.2 330) 0%, oklch(0.55 0.22 280) 100%)",
  "linear-gradient(in oklch 35deg, oklch(0.9 0.14 95) 0%, oklch(0.65 0.2 55) 100%)",
  "linear-gradient(in oklch 270deg, oklch(0.72 0.16 300) 0%, oklch(0.42 0.12 260) 100%)",
  "radial-gradient(circle farthest-corner at 50% 35% in oklch, oklch(0.88 0.14 85) 0%, oklch(0.55 0.2 25) 100%)",
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.75 0.15 200) 0%, oklch(0.38 0.16 265) 100%)",
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.8 0.17 155) 0%, oklch(0.42 0.14 170) 100%)",
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.78 0.2 330) 0%, oklch(0.48 0.22 15) 100%)",
  "linear-gradient(in oklch 90deg, oklch(0.85 0.16 95) 0%, oklch(0.62 0.22 25) 100%)",
  "linear-gradient(in oklch 240deg, oklch(0.7 0.18 330) 0%, oklch(0.48 0.16 250) 100%)",
  "linear-gradient(in oklch 15deg, oklch(0.8 0.12 200) 0%, oklch(0.58 0.2 280) 100%)",
  "linear-gradient(in oklch 145deg, oklch(0.84 0.15 125) 0%, oklch(0.5 0.18 300) 100%)",
  "linear-gradient(in oklch 300deg, oklch(0.76 0.2 50) 0%, oklch(0.42 0.14 220) 100%)",
  "radial-gradient(circle farthest-corner at 30% 30% in oklch, oklch(0.86 0.14 95) 0%, oklch(0.5 0.2 320) 100%)",
  "radial-gradient(circle farthest-corner at 70% 30% in oklch, oklch(0.8 0.17 175) 0%, oklch(0.45 0.18 250) 100%)",
  "radial-gradient(circle farthest-corner at 50% 65% in oklch, oklch(0.82 0.18 60) 0%, oklch(0.48 0.22 10) 100%)",
  "radial-gradient(circle farthest-corner at 50% 50% in oklch, oklch(0.72 0.2 145) 0%, oklch(0.4 0.12 200) 100%)",
  "linear-gradient(in oklch 55deg, oklch(0.88 0.15 110) 0%, oklch(0.52 0.2 340) 100%)",
] as const

/** Linear gradients — multi-stop, contrasting hues, varied angles. */
export const SETTINGS_FILL_LINEAR_PRESETS = [
  // sunset fire → dusk
  "linear-gradient(in oklch 160deg, oklch(0.9 0.16 95) 0%, oklch(0.72 0.24 40) 45%, oklch(0.48 0.2 330) 100%)",
  // ocean deep → foam
  "linear-gradient(in oklch 200deg, oklch(0.35 0.12 260) 0%, oklch(0.62 0.16 220) 55%, oklch(0.88 0.08 190) 100%)",
  // lime → teal → indigo
  "linear-gradient(in oklch 135deg, oklch(0.9 0.22 130) 0%, oklch(0.72 0.14 195) 55%, oklch(0.45 0.16 280) 100%)",
  // hot pink → violet → night
  "linear-gradient(in oklch 300deg, oklch(0.78 0.28 350) 0%, oklch(0.58 0.26 310) 50%, oklch(0.32 0.12 285) 100%)",
  // peach → coral → wine
  "linear-gradient(in oklch 115deg, oklch(0.88 0.12 70) 0%, oklch(0.68 0.24 30) 50%, oklch(0.45 0.18 10) 100%)",
  // sky → lilac → rose
  "linear-gradient(in oklch 45deg, oklch(0.82 0.12 230) 0%, oklch(0.74 0.14 310) 55%, oklch(0.72 0.2 20) 100%)",
  // mint → aqua → cobalt
  "linear-gradient(in oklch 175deg, oklch(0.9 0.12 160) 0%, oklch(0.7 0.15 210) 55%, oklch(0.45 0.18 265) 100%)",
  // amber → ember → plum
  "linear-gradient(in oklch 250deg, oklch(0.85 0.18 85) 0%, oklch(0.62 0.25 35) 50%, oklch(0.42 0.16 320) 100%)",
  // arctic → steel → ink
  "linear-gradient(in oklch 180deg, oklch(0.92 0.05 220) 0%, oklch(0.65 0.08 235) 55%, oklch(0.3 0.06 270) 100%)",
  // candy → grape → midnight
  "linear-gradient(in oklch 285deg, oklch(0.8 0.24 355) 0%, oklch(0.6 0.25 305) 55%, oklch(0.3 0.1 275) 100%)",
  // forest → moss → gold
  "linear-gradient(in oklch 105deg, oklch(0.38 0.1 160) 0%, oklch(0.62 0.16 140) 55%, oklch(0.85 0.16 95) 100%)",
  // ultraviolet split
  "linear-gradient(in oklch 320deg, oklch(0.85 0.2 145) 0%, oklch(0.68 0.22 250) 55%, oklch(0.5 0.26 330) 100%)",
  // rose gold → bronze
  "linear-gradient(in oklch 150deg, oklch(0.85 0.1 40) 0%, oklch(0.68 0.14 55) 50%, oklch(0.48 0.12 75) 100%)",
  // glacier → berry
  "linear-gradient(in oklch 215deg, oklch(0.88 0.07 200) 0%, oklch(0.6 0.18 280) 60%, oklch(0.5 0.24 350) 100%)",
  // lemon → tangerine → raspberry
  "linear-gradient(in oklch 80deg, oklch(0.92 0.18 105) 0%, oklch(0.75 0.22 55) 45%, oklch(0.58 0.26 355) 100%)",
  // dusk → orchid → dawn
  "linear-gradient(in oklch 265deg, oklch(0.4 0.12 280) 0%, oklch(0.62 0.22 320) 55%, oklch(0.85 0.14 60) 100%)",
  // jade → lagoon → navy
  "linear-gradient(in oklch 190deg, oklch(0.82 0.16 165) 0%, oklch(0.6 0.14 215) 55%, oklch(0.32 0.1 260) 100%)",
  // flame → magenta → indigo
  "linear-gradient(in oklch 295deg, oklch(0.75 0.26 45) 0%, oklch(0.62 0.28 355) 45%, oklch(0.4 0.18 285) 100%)",
  // four-stop aurora
  "linear-gradient(in oklch 140deg, oklch(0.88 0.18 130) 0%, oklch(0.75 0.16 190) 35%, oklch(0.62 0.2 275) 70%, oklch(0.5 0.22 330) 100%)",
  // four-stop prism
  "linear-gradient(in oklch 95deg, oklch(0.85 0.22 25) 0%, oklch(0.8 0.2 85) 35%, oklch(0.72 0.18 160) 65%, oklch(0.6 0.2 250) 100%)",
  // copper → noir
  "linear-gradient(in oklch 155deg, oklch(0.72 0.14 60) 0%, oklch(0.5 0.1 40) 55%, oklch(0.25 0.04 30) 100%)",
  // ice → periwinkle → plum
  "linear-gradient(in oklch 230deg, oklch(0.9 0.06 210) 0%, oklch(0.7 0.13 270) 55%, oklch(0.42 0.14 340) 100%)",
  // melon → lagoon → royal
  "linear-gradient(in oklch 170deg, oklch(0.85 0.18 140) 0%, oklch(0.68 0.16 200) 50%, oklch(0.48 0.2 275) 100%)",
  // blush → orchid → deep violet
  "linear-gradient(in oklch 305deg, oklch(0.88 0.1 20) 0%, oklch(0.7 0.2 330) 50%, oklch(0.38 0.16 290) 100%)",
] as const

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
] as const

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
] as const
