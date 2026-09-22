export const HERO_ROTATING_WORDS = [
  "link",
  "mail",
  "text",
  "phone",
  "sms",
  "map",
  "event",
] as const

export const HERO_ROTATE_MS = 2200

export const HERO_SLOT_TEXT_OPTIONS = {
  direction: "up" as const,
  duration: 480,
  bounce: 0,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  skipUnchanged: true,
}

export function getHeroIndefiniteArticle(word: string): "a" | "an" {
  return /^[aeiou]/i.test(word) ? "an" : "a"
}
