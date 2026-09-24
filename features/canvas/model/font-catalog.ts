export type CanvasFontCategory =
  "sans" | "condensed" | "serif" | "slab" | "display" | "handwriting" | "mono" | "system";

export const DRAFTING_FONT_CATEGORY_ORDER: readonly CanvasFontCategory[] = [
  "sans",
  "condensed",
  "serif",
  "slab",
  "display",
  "handwriting",
  "mono",
  "system",
];

export const DRAFTING_FONT_CATEGORY_LABELS: Record<CanvasFontCategory, string> = {
  sans: "Sans-serif",
  condensed: "Condensed",
  serif: "Serif",
  slab: "Slab",
  display: "Display",
  handwriting: "Handwriting",
  mono: "Monospace",
  system: "System",
};

export const DRAFTING_FONT_CATEGORY_FALLBACKS: Record<CanvasFontCategory, string> = {
  sans: "system-ui, Arial, sans-serif",
  condensed: "'Arial Narrow', system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  slab: "Georgia, serif",
  display: "system-ui, Arial, sans-serif",
  handwriting: "cursive",
  mono: "ui-monospace, 'Courier New', monospace",
  system: "system-ui, Arial, sans-serif",
};

export type GoogleFontSpec = {
  category: Exclude<CanvasFontCategory, "system">;
  family: string;
  italic?: boolean;
  /** Variable `wght` range. When set, one file serves every weight in the range. */
  range?: readonly [number, number];
  /** Weights offered by the UI (and requested when not variable). */
  weights: readonly number[];
};

const W100_900 = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
const W200_800 = [200, 300, 400, 500, 600, 700, 800] as const;
const W200_900 = [200, 300, 400, 500, 600, 700, 800, 900] as const;
const W300_700 = [300, 400, 500, 600, 700] as const;
const W300_800 = [300, 400, 500, 600, 700, 800] as const;
const W300_900 = [300, 400, 500, 600, 700, 800, 900] as const;
const W400_700 = [400, 500, 600, 700] as const;
const W400_800 = [400, 500, 600, 700, 800] as const;
const W400_900 = [400, 500, 600, 700, 800, 900] as const;
const W100_700 = [100, 200, 300, 400, 500, 600, 700] as const;
const W100_800 = [100, 200, 300, 400, 500, 600, 700, 800] as const;

export const GOOGLE_FONT_SPECS: readonly GoogleFontSpec[] = [
  // ---- Sans-serif -------------------------------------------------------
  { category: "sans", family: "Archivo", italic: true, range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Asap", italic: true, range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Barlow", italic: true, weights: W100_900 },
  { category: "sans", family: "Bricolage Grotesque", range: [200, 800], weights: W200_800 },
  { category: "sans", family: "Cabin", italic: true, range: [400, 700], weights: W400_700 },
  { category: "sans", family: "Commissioner", range: [100, 900], weights: W100_900 },
  { category: "sans", family: "DM Sans", italic: true, range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Epilogue", italic: true, range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Exo 2", italic: true, range: [100, 900], weights: W100_900 },
  {
    category: "sans",
    family: "Familjen Grotesk",
    italic: true,
    range: [400, 700],
    weights: W400_700,
  },
  { category: "sans", family: "Figtree", italic: true, range: [300, 900], weights: W300_900 },
  { category: "sans", family: "Fira Sans", italic: true, weights: W100_900 },
  { category: "sans", family: "Geist", range: [100, 900], weights: W100_900 },
  {
    category: "sans",
    family: "Hanken Grotesk",
    italic: true,
    range: [100, 900],
    weights: W100_900,
  },
  { category: "sans", family: "Heebo", range: [100, 900], weights: W100_900 },
  { category: "sans", family: "IBM Plex Sans", italic: true, weights: W100_700 },
  {
    category: "sans",
    family: "Instrument Sans",
    italic: true,
    range: [400, 700],
    weights: W400_700,
  },
  { category: "sans", family: "Inter", italic: true, range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Inter Tight", italic: true, range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Jost", italic: true, range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Kanit", italic: true, weights: W100_900 },
  { category: "sans", family: "Karla", italic: true, range: [200, 800], weights: W200_800 },
  { category: "sans", family: "Lato", italic: true, weights: [100, 300, 400, 700, 900] },
  { category: "sans", family: "Manrope", range: [200, 800], weights: W200_800 },
  { category: "sans", family: "Mulish", italic: true, range: [200, 900], weights: W200_900 },
  { category: "sans", family: "Noto Sans", italic: true, range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Onest", range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Open Sans", italic: true, range: [300, 800], weights: W300_800 },
  { category: "sans", family: "Overpass", italic: true, range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Public Sans", italic: true, range: [100, 900], weights: W100_900 },
  {
    category: "sans",
    family: "Red Hat Display",
    italic: true,
    range: [300, 900],
    weights: W300_900,
  },
  { category: "sans", family: "Roboto", italic: true, weights: [100, 300, 400, 500, 700, 900] },
  { category: "sans", family: "Roboto Flex", italic: true, range: [100, 900], weights: W100_900 },
  {
    category: "sans",
    family: "Schibsted Grotesk",
    italic: true,
    range: [400, 900],
    weights: W400_900,
  },
  { category: "sans", family: "Source Sans 3", italic: true, range: [200, 900], weights: W200_900 },
  { category: "sans", family: "Space Grotesk", range: [300, 700], weights: W300_700 },
  { category: "sans", family: "Work Sans", italic: true, range: [100, 900], weights: W100_900 },

  // ---- Sans-serif: geometric / rounded ----------------------------------
  { category: "sans", family: "Albert Sans", italic: true, range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Baloo 2", range: [400, 800], weights: W400_800 },
  { category: "sans", family: "Comfortaa", range: [300, 700], weights: W300_700 },
  { category: "sans", family: "Fredoka", range: [300, 700], weights: W300_700 },
  { category: "sans", family: "Grandstander", italic: true, range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Josefin Sans", italic: true, range: [100, 700], weights: W100_700 },
  { category: "sans", family: "League Spartan", range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Lexend", range: [100, 900], weights: W100_900 },
  { category: "sans", family: "M PLUS Rounded 1c", weights: [100, 300, 400, 500, 700, 800, 900] },
  { category: "sans", family: "Montserrat", italic: true, range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Nunito", italic: true, range: [200, 900], weights: W200_900 },
  { category: "sans", family: "Nunito Sans", italic: true, range: [200, 900], weights: W200_900 },
  { category: "sans", family: "Outfit", range: [100, 900], weights: W100_900 },
  {
    category: "sans",
    family: "Plus Jakarta Sans",
    italic: true,
    range: [200, 800],
    weights: W200_800,
  },
  { category: "sans", family: "Poppins", italic: true, weights: W100_900 },
  { category: "sans", family: "Quicksand", range: [300, 700], weights: W300_700 },
  { category: "sans", family: "Questrial", weights: [400] },
  { category: "sans", family: "Raleway", italic: true, range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Rubik", italic: true, range: [300, 900], weights: W300_900 },
  { category: "sans", family: "Sora", range: [100, 800], weights: W100_800 },
  { category: "sans", family: "Urbanist", italic: true, range: [100, 900], weights: W100_900 },
  { category: "sans", family: "Varela Round", weights: [400] },

  // ---- Condensed --------------------------------------------------------
  { category: "condensed", family: "Anton", weights: [400] },
  {
    category: "condensed",
    family: "Archivo Narrow",
    italic: true,
    range: [400, 700],
    weights: W400_700,
  },
  { category: "condensed", family: "Barlow Condensed", italic: true, weights: W100_900 },
  { category: "condensed", family: "Bebas Neue", weights: [400] },
  { category: "condensed", family: "Big Shoulders Display", range: [100, 900], weights: W100_900 },
  { category: "condensed", family: "Encode Sans Condensed", weights: W100_900 },
  { category: "condensed", family: "Fjalla One", weights: [400] },
  { category: "condensed", family: "Karantina", weights: [300, 400, 700] },
  {
    category: "condensed",
    family: "Oswald",
    range: [200, 700],
    weights: [200, 300, 400, 500, 600, 700],
  },
  {
    category: "condensed",
    family: "Roboto Condensed",
    italic: true,
    range: [100, 900],
    weights: W100_900,
  },
  { category: "condensed", family: "Saira Condensed", weights: W100_900 },
  { category: "condensed", family: "Six Caps", weights: [400] },
  { category: "condensed", family: "Staatliches", weights: [400] },
  { category: "condensed", family: "Teko", range: [300, 600], weights: [300, 400, 500, 600] },

  // ---- Serif: text ------------------------------------------------------
  { category: "serif", family: "Alegreya", italic: true, range: [400, 900], weights: W400_900 },
  { category: "serif", family: "Andada Pro", italic: true, range: [400, 800], weights: W400_800 },
  { category: "serif", family: "Bitter", italic: true, range: [100, 900], weights: W100_900 },
  { category: "serif", family: "Cardo", italic: true, weights: [400, 700] },
  { category: "serif", family: "Cormorant Garamond", italic: true, weights: W300_700 },
  { category: "serif", family: "Crimson Pro", italic: true, range: [200, 900], weights: W200_900 },
  { category: "serif", family: "Crimson Text", italic: true, weights: [400, 600, 700] },
  { category: "serif", family: "Domine", range: [400, 700], weights: W400_700 },
  { category: "serif", family: "EB Garamond", italic: true, range: [400, 800], weights: W400_800 },
  { category: "serif", family: "Gentium Book Plus", italic: true, weights: [400, 700] },
  { category: "serif", family: "IBM Plex Serif", italic: true, weights: W100_700 },
  { category: "serif", family: "Libre Baskerville", italic: true, weights: [400, 700] },
  { category: "serif", family: "Libre Caslon Text", italic: true, weights: [400, 700] },
  { category: "serif", family: "Literata", italic: true, range: [200, 900], weights: W200_900 },
  { category: "serif", family: "Lora", italic: true, range: [400, 700], weights: W400_700 },
  { category: "serif", family: "Merriweather", italic: true, range: [300, 900], weights: W300_900 },
  { category: "serif", family: "Newsreader", italic: true, range: [200, 800], weights: W200_800 },
  { category: "serif", family: "Noto Serif", italic: true, range: [100, 900], weights: W100_900 },
  { category: "serif", family: "PT Serif", italic: true, weights: [400, 700] },
  { category: "serif", family: "Roboto Serif", italic: true, range: [100, 900], weights: W100_900 },
  {
    category: "serif",
    family: "Source Serif 4",
    italic: true,
    range: [200, 900],
    weights: W200_900,
  },
  { category: "serif", family: "Spectral", italic: true, weights: W200_800 },
  { category: "serif", family: "Vollkorn", italic: true, range: [400, 900], weights: W400_900 },

  // ---- Serif: display ---------------------------------------------------
  { category: "serif", family: "Abril Fatface", weights: [400] },
  { category: "serif", family: "Bodoni Moda", italic: true, range: [400, 900], weights: W400_900 },
  { category: "serif", family: "Cinzel", range: [400, 900], weights: W400_900 },
  { category: "serif", family: "Cinzel Decorative", weights: [400, 700, 900] },
  { category: "serif", family: "Cormorant", italic: true, range: [300, 700], weights: W300_700 },
  { category: "serif", family: "DM Serif Display", italic: true, weights: [400] },
  { category: "serif", family: "DM Serif Text", italic: true, weights: [400] },
  { category: "serif", family: "Fraunces", italic: true, range: [100, 900], weights: W100_900 },
  { category: "serif", family: "Gilda Display", weights: [400] },
  { category: "serif", family: "Gloock", weights: [400] },
  { category: "serif", family: "Instrument Serif", italic: true, weights: [400] },
  { category: "serif", family: "Italiana", weights: [400] },
  { category: "serif", family: "Marcellus", weights: [400] },
  {
    category: "serif",
    family: "Playfair Display",
    italic: true,
    range: [400, 900],
    weights: W400_900,
  },
  { category: "serif", family: "Prata", weights: [400] },
  { category: "serif", family: "Yeseva One", weights: [400] },

  // ---- Slab -------------------------------------------------------------
  { category: "slab", family: "Alfa Slab One", weights: [400] },
  { category: "slab", family: "Arvo", italic: true, weights: [400, 700] },
  { category: "slab", family: "Bree Serif", weights: [400] },
  { category: "slab", family: "Crete Round", italic: true, weights: [400] },
  { category: "slab", family: "Hepta Slab", range: [100, 900], weights: W100_900 },
  { category: "slab", family: "Josefin Slab", italic: true, range: [100, 700], weights: W100_700 },
  { category: "slab", family: "Podkova", range: [400, 800], weights: W400_800 },
  { category: "slab", family: "Roboto Slab", range: [100, 900], weights: W100_900 },
  { category: "slab", family: "Zilla Slab", italic: true, weights: W300_700 },

  // ---- Display / decorative ---------------------------------------------
  { category: "display", family: "Archivo Black", weights: [400] },
  { category: "display", family: "Audiowide", weights: [400] },
  { category: "display", family: "Black Han Sans", weights: [400] },
  { category: "display", family: "Black Ops One", weights: [400] },
  { category: "display", family: "Bowlby One", weights: [400] },
  { category: "display", family: "Bungee", weights: [400] },
  { category: "display", family: "Bungee Shade", weights: [400] },
  { category: "display", family: "Chakra Petch", italic: true, weights: W300_700 },
  { category: "display", family: "Chewy", weights: [400] },
  { category: "display", family: "Cherry Bomb One", weights: [400] },
  { category: "display", family: "Climate Crisis", weights: [400] },
  { category: "display", family: "Coiny", weights: [400] },
  { category: "display", family: "Dela Gothic One", weights: [400] },
  { category: "display", family: "DotGothic16", weights: [400] },
  { category: "display", family: "Fredericka the Great", weights: [400] },
  { category: "display", family: "Graduate", weights: [400] },
  { category: "display", family: "Londrina Solid", weights: [100, 300, 400, 900] },
  { category: "display", family: "Monoton", weights: [400] },
  { category: "display", family: "Orbitron", range: [400, 900], weights: W400_900 },
  { category: "display", family: "Passion One", weights: [400, 700, 900] },
  { category: "display", family: "Paytone One", weights: [400] },
  { category: "display", family: "Press Start 2P", weights: [400] },
  { category: "display", family: "Rampart One", weights: [400] },
  { category: "display", family: "Righteous", weights: [400] },
  { category: "display", family: "Rubik Glitch", weights: [400] },
  { category: "display", family: "Rubik Mono One", weights: [400] },
  { category: "display", family: "Russo One", weights: [400] },
  { category: "display", family: "Shrikhand", weights: [400] },
  { category: "display", family: "Silkscreen", weights: [400, 700] },
  { category: "display", family: "Syncopate", weights: [400, 700] },
  { category: "display", family: "Titan One", weights: [400] },
  { category: "display", family: "Ultra", weights: [400] },
  { category: "display", family: "Unbounded", range: [200, 900], weights: W200_900 },
  { category: "display", family: "VT323", weights: [400] },

  // ---- Handwriting / script ---------------------------------------------
  { category: "handwriting", family: "Alex Brush", weights: [400] },
  { category: "handwriting", family: "Allura", weights: [400] },
  { category: "handwriting", family: "Amatic SC", weights: [400, 700] },
  { category: "handwriting", family: "Architects Daughter", weights: [400] },
  { category: "handwriting", family: "Bad Script", weights: [400] },
  { category: "handwriting", family: "Caveat", range: [400, 700], weights: W400_700 },
  { category: "handwriting", family: "Caveat Brush", weights: [400] },
  { category: "handwriting", family: "Courgette", weights: [400] },
  { category: "handwriting", family: "Covered By Your Grace", weights: [400] },
  { category: "handwriting", family: "Dancing Script", range: [400, 700], weights: W400_700 },
  { category: "handwriting", family: "Gloria Hallelujah", weights: [400] },
  { category: "handwriting", family: "Great Vibes", weights: [400] },
  { category: "handwriting", family: "Handlee", weights: [400] },
  { category: "handwriting", family: "Homemade Apple", weights: [400] },
  { category: "handwriting", family: "Indie Flower", weights: [400] },
  { category: "handwriting", family: "Kaushan Script", weights: [400] },
  { category: "handwriting", family: "Kalam", weights: [300, 400, 700] },
  { category: "handwriting", family: "Lobster", weights: [400] },
  { category: "handwriting", family: "Marck Script", weights: [400] },
  { category: "handwriting", family: "Pacifico", weights: [400] },
  { category: "handwriting", family: "Permanent Marker", weights: [400] },
  { category: "handwriting", family: "Rock Salt", weights: [400] },
  { category: "handwriting", family: "Sacramento", weights: [400] },
  { category: "handwriting", family: "Satisfy", weights: [400] },
  { category: "handwriting", family: "Shadows Into Light", weights: [400] },
  { category: "handwriting", family: "Yellowtail", weights: [400] },

  // ---- Monospace ---------------------------------------------------------
  { category: "mono", family: "Anonymous Pro", italic: true, weights: [400, 700] },
  { category: "mono", family: "Azeret Mono", italic: true, range: [100, 900], weights: W100_900 },
  { category: "mono", family: "Chivo Mono", italic: true, range: [100, 900], weights: W100_900 },
  { category: "mono", family: "Courier Prime", italic: true, weights: [400, 700] },
  { category: "mono", family: "DM Mono", italic: true, weights: [300, 400, 500] },
  { category: "mono", family: "Fira Code", range: [300, 700], weights: W300_700 },
  { category: "mono", family: "Fira Mono", weights: [400, 500, 700] },
  { category: "mono", family: "Fragment Mono", italic: true, weights: [400] },
  { category: "mono", family: "Geist Mono", range: [100, 900], weights: W100_900 },
  { category: "mono", family: "IBM Plex Mono", italic: true, weights: W100_700 },
  { category: "mono", family: "Inconsolata", range: [200, 900], weights: W200_900 },
  {
    category: "mono",
    family: "Intel One Mono",
    italic: true,
    weights: [200, 300, 400, 500, 600, 700],
  },
  {
    category: "mono",
    family: "JetBrains Mono",
    italic: true,
    range: [100, 800],
    weights: W100_800,
  },
  { category: "mono", family: "Martian Mono", range: [100, 800], weights: W100_800 },
  { category: "mono", family: "Red Hat Mono", italic: true, range: [300, 700], weights: W300_700 },
  { category: "mono", family: "Roboto Mono", italic: true, range: [100, 700], weights: W100_700 },
  { category: "mono", family: "Share Tech Mono", weights: [400] },
  { category: "mono", family: "Sometype Mono", italic: true, range: [400, 700], weights: W400_700 },
  {
    category: "mono",
    family: "Source Code Pro",
    italic: true,
    range: [200, 900],
    weights: W200_900,
  },
  { category: "mono", family: "Space Mono", italic: true, weights: [400, 700] },
  {
    category: "mono",
    family: "Spline Sans Mono",
    italic: true,
    range: [300, 700],
    weights: W300_700,
  },
  { category: "mono", family: "Ubuntu Mono", italic: true, weights: [400, 700] },
];

export function googleFontSlug(family: string) {
  return family
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function googleFontAxis(spec: GoogleFontSpec, preview: boolean) {
  if (preview) {
    return "wght@400";
  }

  if (spec.range) {
    const [min, max] = spec.range;
    return spec.italic ? `ital,wght@0,${min}..${max};1,${min}..${max}` : `wght@${min}..${max}`;
  }

  if (spec.italic) {
    const tuples = [
      ...spec.weights.map((weight) => `0,${weight}`),
      ...spec.weights.map((weight) => `1,${weight}`),
    ];
    return `ital,wght@${tuples.join(";")}`;
  }

  return `wght@${spec.weights.join(";")}`;
}

export function googleFontCssUrl(spec: GoogleFontSpec) {
  const family = spec.family.trim().replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${family}:${googleFontAxis(spec, false)}&display=swap`;
}

/**
 * Subset stylesheet for picker previews — only the glyphs needed to render the
 * family name, so each preview is a few KB instead of a full font.
 */
export function googleFontPreviewCssUrl(spec: GoogleFontSpec) {
  const family = spec.family.trim().replace(/\s+/g, "+");
  const text = encodeURIComponent(spec.family);
  return `https://fonts.googleapis.com/css2?family=${family}:${googleFontAxis(spec, true)}&display=swap&text=${text}`;
}
