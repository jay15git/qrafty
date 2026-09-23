import path from "node:path";

import { cleanCache, makeRemoteResolver, syncWallpapers } from "./lib/wallpaper-sync.mjs";

const RAYCAST_BASE = "https://misc-assets.raycast.com/wallpapers";
const OUT_DIR = "public/backgrounds/raycast";
const CACHE_DIR = path.join(OUT_DIR, ".cache");

/** Full-resolution sources from https://www.raycast.com/wallpapers */
const WALLPAPERS = [
  { id: "glaze-1", file: "glaze_1.heic", label: "Glaze 1" },
  { id: "glaze-2", file: "glaze_2.heic", label: "Glaze 2" },
  { id: "red-distortion-1", file: "red_distortion_1.heic", label: "Red Distortion 1" },
  { id: "red-distortion-2", file: "red_distortion_2.heic", label: "Red Distortion 2" },
  { id: "red-distortion-3", file: "red_distortion_3.heic", label: "Red Distortion 3" },
  { id: "red-distortion-4", file: "red_distortion_4.heic", label: "Red Distortion 4" },
  { id: "blue-distortion-1", file: "blue_distortion_1.heic", label: "Blue Distortion 1" },
  { id: "blue-distortion-2", file: "blue_distortion_2.heic", label: "Blue Distortion 2" },
  {
    id: "mono-dark-distortion-1",
    file: "mono_dark_distortion_1.heic",
    label: "Mono Dark Distortion 1",
  },
  {
    id: "mono-dark-distortion-2",
    file: "mono_dark_distortion_2.heic",
    label: "Mono Dark Distortion 2",
  },
  {
    id: "mono-light-distortion-1",
    file: "mono_light_distortion_1.heic",
    label: "Mono Light Distortion 1",
  },
  {
    id: "mono-light-distortion-2",
    file: "mono_light_distortion_2.heic",
    label: "Mono Light Distortion 2",
  },
  { id: "chromatic-dark-1", file: "chromatic_dark_1.heic", label: "Chromatic Dark 1" },
  { id: "chromatic-dark-2", file: "chromatic_dark_2.heic", label: "Chromatic Dark 2" },
  { id: "chromatic-light-1", file: "chromatic_light_1.heic", label: "Chromatic Light 1" },
  { id: "chromatic-light-2", file: "chromatic_light_2.heic", label: "Chromatic Light 2" },
  { id: "cube", file: "cube_prod.heic", label: "Cube" },
  { id: "cube-mono", file: "cube_mono.heic", label: "Cube Mono" },
  { id: "loupe", file: "loupe.heic", label: "Loupe" },
  { id: "loupe-mono-dark", file: "loupe-mono-dark.heic", label: "Loupe Mono Dark" },
  { id: "loupe-mono-light", file: "loupe-mono-light.heic", label: "Loupe Mono Light" },
  { id: "blob", file: "blob.heic", label: "Blob" },
  { id: "blob-red", file: "blob-red.heic", label: "Blob Red" },
  { id: "raycast-logo", file: "raycast-logo.heic", label: "Raycast Logo" },
  { id: "autumnal-peach", file: "autumnal-peach.png", label: "Autumnal Peach" },
  { id: "blossom", file: "blossom-2.png", label: "Blossom" },
  { id: "blushing-fire", file: "blushing-fire.png", label: "Blushing Fire" },
  { id: "bright-rain", file: "bright-rain.png", label: "Bright Rain" },
  { id: "floss", file: "floss.png", label: "Floss" },
  { id: "glass-rainbow", file: "glass-rainbow.png", label: "Glass Rainbow" },
  { id: "good-vibes", file: "good-vibes.png", label: "Good Vibes" },
  { id: "moonrise", file: "moonrise.png", label: "Moonrise" },
  { id: "ray-of-lights", file: "ray-of-lights.png", label: "Ray of Lights" },
  { id: "rose-thorn", file: "rose-thorn.png", label: "Rose Thorn" },
];

const resolve = makeRemoteResolver({ baseUrl: RAYCAST_BASE, cacheDir: CACHE_DIR });

await syncWallpapers({
  outDir: OUT_DIR,
  publicPath: "/backgrounds/raycast",
  source: "raycast",
  items: WALLPAPERS.map(({ id, file, label }) => ({
    id,
    label,
    sourceUrl: `${RAYCAST_BASE}/${file}`,
    resolve: resolve(file),
  })),
  module: {
    typeName: "RaycastWallpaper",
    constName: "RAYCAST_WALLPAPERS",
    getterName: "getRaycastWallpaper",
    targetFile: "features/canvas/assets/raycast-wallpapers.ts",
    summaryLabel: "Raycast wallpapers",
  },
});

cleanCache(CACHE_DIR);
