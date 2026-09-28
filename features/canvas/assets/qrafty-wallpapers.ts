export type QraftyWallpaper = {
  id: string;
  label: string;
  path: string;
  previewPath: string;
  source: "studio";
};

export const QRAFTY_WALLPAPERS: readonly QraftyWallpaper[] = [
  {
    id: "aqua-glow",
    label: "Aqua Glow",
    path: "/backgrounds/studio/aqua-glow.webp",
    previewPath: "/backgrounds/studio/aqua-glow-preview.webp",
    source: "studio",
  },
  {
    id: "blue-hour",
    label: "Blue Hour",
    path: "/backgrounds/studio/blue-hour.webp",
    previewPath: "/backgrounds/studio/blue-hour-preview.webp",
    source: "studio",
  },
  {
    id: "celadon-mist",
    label: "Celadon Mist",
    path: "/backgrounds/studio/celadon-mist.webp",
    previewPath: "/backgrounds/studio/celadon-mist-preview.webp",
    source: "studio",
  },
  {
    id: "cherry-orb",
    label: "Cherry Orb",
    path: "/backgrounds/studio/cherry-orb.webp",
    previewPath: "/backgrounds/studio/cherry-orb-preview.webp",
    source: "studio",
  },
  {
    id: "conference-hero",
    label: "Conference Hero",
    path: "/backgrounds/studio/conference-hero.webp",
    previewPath: "/backgrounds/studio/conference-hero-preview.webp",
    source: "studio",
  },
  {
    id: "emerald-night",
    label: "Emerald Night",
    path: "/backgrounds/studio/emerald-night.webp",
    previewPath: "/backgrounds/studio/emerald-night-preview.webp",
    source: "studio",
  },
  {
    id: "festival-poster",
    label: "Festival Poster",
    path: "/backgrounds/studio/festival-poster.webp",
    previewPath: "/backgrounds/studio/festival-poster-preview.webp",
    source: "studio",
  },
  {
    id: "golden-hour",
    label: "Golden Hour",
    path: "/backgrounds/studio/golden-hour.webp",
    previewPath: "/backgrounds/studio/golden-hour-preview.webp",
    source: "studio",
  },
  {
    id: "honeycomb",
    label: "Honeycomb",
    path: "/backgrounds/studio/honeycomb.webp",
    previewPath: "/backgrounds/studio/honeycomb-preview.webp",
    source: "studio",
  },
  {
    id: "jade-comb",
    label: "Jade Comb",
    path: "/backgrounds/studio/jade-comb.webp",
    previewPath: "/backgrounds/studio/jade-comb-preview.webp",
    source: "studio",
  },
  {
    id: "level",
    label: "Level",
    path: "/backgrounds/studio/level.webp",
    previewPath: "/backgrounds/studio/level-preview.webp",
    source: "studio",
  },
  {
    id: "moonlit",
    label: "Moonlit",
    path: "/backgrounds/studio/moonlit.webp",
    previewPath: "/backgrounds/studio/moonlit-preview.webp",
    source: "studio",
  },
  {
    id: "morning-mist",
    label: "Morning Mist",
    path: "/backgrounds/studio/morning-mist.webp",
    previewPath: "/backgrounds/studio/morning-mist-preview.webp",
    source: "studio",
  },
  {
    id: "new-york",
    label: "New York",
    path: "/backgrounds/studio/new-york.webp",
    previewPath: "/backgrounds/studio/new-york-preview.webp",
    source: "studio",
  },
  {
    id: "open-house",
    label: "Open House",
    path: "/backgrounds/studio/open-house.webp",
    previewPath: "/backgrounds/studio/open-house-preview.webp",
    source: "studio",
  },
  {
    id: "paris",
    label: "Paris",
    path: "/backgrounds/studio/paris.webp",
    previewPath: "/backgrounds/studio/paris-preview.webp",
    source: "studio",
  },
  {
    id: "reverb",
    label: "Reverb",
    path: "/backgrounds/studio/reverb.webp",
    previewPath: "/backgrounds/studio/reverb-preview.webp",
    source: "studio",
  },
  {
    id: "ripple",
    label: "Ripple",
    path: "/backgrounds/studio/ripple.webp",
    previewPath: "/backgrounds/studio/ripple-preview.webp",
    source: "studio",
  },
  {
    id: "sea-swirl",
    label: "Sea Swirl",
    path: "/backgrounds/studio/sea-swirl.webp",
    previewPath: "/backgrounds/studio/sea-swirl-preview.webp",
    source: "studio",
  },
  {
    id: "studio-gradient-1",
    label: "Studio Gradient 1",
    path: "/backgrounds/studio/studio-gradient-1.webp",
    previewPath: "/backgrounds/studio/studio-gradient-1-preview.webp",
    source: "studio",
  },
  {
    id: "studio-gradient-2",
    label: "Studio Gradient 2",
    path: "/backgrounds/studio/studio-gradient-2.webp",
    previewPath: "/backgrounds/studio/studio-gradient-2-preview.webp",
    source: "studio",
  },
  {
    id: "studio-gradient-3",
    label: "Studio Gradient 3",
    path: "/backgrounds/studio/studio-gradient-3.webp",
    previewPath: "/backgrounds/studio/studio-gradient-3-preview.webp",
    source: "studio",
  },
  {
    id: "studio-gradient-4",
    label: "Studio Gradient 4",
    path: "/backgrounds/studio/studio-gradient-4.webp",
    previewPath: "/backgrounds/studio/studio-gradient-4-preview.webp",
    source: "studio",
  },
  {
    id: "studio-gradient-5",
    label: "Studio Gradient 5",
    path: "/backgrounds/studio/studio-gradient-5.webp",
    previewPath: "/backgrounds/studio/studio-gradient-5-preview.webp",
    source: "studio",
  },
  {
    id: "studio-gradient",
    label: "Studio Gradient",
    path: "/backgrounds/studio/studio-gradient.webp",
    previewPath: "/backgrounds/studio/studio-gradient-preview.webp",
    source: "studio",
  },
  {
    id: "sun-rings",
    label: "Sun Rings",
    path: "/backgrounds/studio/sun-rings.webp",
    previewPath: "/backgrounds/studio/sun-rings-preview.webp",
    source: "studio",
  },
  {
    id: "twilight-wheel",
    label: "Twilight Wheel",
    path: "/backgrounds/studio/twilight-wheel.webp",
    previewPath: "/backgrounds/studio/twilight-wheel-preview.webp",
    source: "studio",
  },
] as const;

function getQraftyWallpaper(id: string): QraftyWallpaper | undefined {
  return QRAFTY_WALLPAPERS.find((wallpaper) => wallpaper.id === id);
}
