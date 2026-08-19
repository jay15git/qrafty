export type IllustrationSetId = "scribbles-doodles" | "sketch-elements" | "vector-sticker-pack" | "hand-drawn"

export type IllustrationAsset = {
  id: string
  label: string
  path: string
}

export type IllustrationSet = {
  id: IllustrationSetId
  label: string
  assets: readonly IllustrationAsset[]
}

export const ILLUSTRATION_SETS: readonly IllustrationSet[] = [
  {
    "id": "scribbles-doodles",
    "label": "Scribbles & Doodles",
    "assets": [
      {
        "id": "arrow-hand-drawn-scribble-doodle-10",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-10.svg",
        "label": "arrow, hand drawn, scribble, doodle, 10"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-9",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-9.svg",
        "label": "arrow, hand drawn, scribble, doodle, 9"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-arrows-7",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-arrows-7.svg",
        "label": "arrow, hand drawn, scribble, doodle, arrows, 7"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-arrows-up-right-direction-path-fork-110",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-arrows-up-right-direction-path-fork-110.svg",
        "label": "arrow, hand drawn, scribble, doodle, arrows, up, right, direction, path, fork, 110"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-curve-wavy-curvy-direction-up-ahead-112",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-curve-wavy-curvy-direction-up-ahead-112.svg",
        "label": "arrow, hand drawn, scribble, doodle, curve, wavy, curvy, direction, up, ahead, 112"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-down-33",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-down-33.svg",
        "label": "arrow, hand drawn, scribble, doodle, down, 33"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-down-curvy-curly-down-right-71",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-down-curvy-curly-down-right-71.svg",
        "label": "arrow, hand drawn, scribble, doodle, down, curvy, curly, down, right, 71"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-down-curvy-curly-up-right-loop-swirl-73",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-down-curvy-curly-up-right-loop-swirl-73.svg",
        "label": "arrow, hand drawn, scribble, doodle, down, curvy, curly, up, right, loop, swirl, 73"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-heart-reload-refresh-loop-65",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-heart-reload-refresh-loop-65.svg",
        "label": "arrow, hand drawn, scribble, doodle, heart, reload, refresh, loop, 65"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-reload-replay-3",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-reload-replay-3.svg",
        "label": "arrow, hand drawn, scribble, doodle, reload, replay, 3"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-shaded-thick-arrows-reload-refresh-load-repeat-",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-shaded-thick-arrows-reload-refresh-load-repeat-.svg",
        "label": "arrow, hand drawn, scribble, doodle, shaded, thick, arrows, reload, refresh, load, repeat, 89"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-spiral-snail-roll-twist-whirl-120",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-spiral-snail-roll-twist-whirl-120.svg",
        "label": "arrow, hand drawn, scribble, doodle, spiral, snail, roll, twist, whirl, 120"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-swirl-curvy-wavy-28",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-swirl-curvy-wavy-28.svg",
        "label": "arrow, hand drawn, scribble, doodle, swirl, curvy, wavy, 28"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-swirl-reload-refresh-redo-36",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-swirl-reload-refresh-redo-36.svg",
        "label": "arrow, hand drawn, scribble, doodle, swirl, reload, refresh, redo, 36"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-thick-arrows-down-53",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-thick-arrows-down-53.svg",
        "label": "arrow, hand drawn, scribble, doodle, thick, arrows, down, 53"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-thick-arrows-inward-pinch-narrow-56",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-thick-arrows-inward-pinch-narrow-56.svg",
        "label": "arrow, hand drawn, scribble, doodle, thick, arrows, inward, pinch, narrow, 56"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-thick-down-left-48",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-thick-down-left-48.svg",
        "label": "arrow, hand drawn, scribble, doodle, thick, down, left, 48"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-thick-down-lightning-cautions-stress-55",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-thick-down-lightning-cautions-stress-55.svg",
        "label": "arrow, hand drawn, scribble, doodle, thick, down, lightning, cautions, stress, 55"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-thick-lightning-reload-return-refresh-rounded-a",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-thick-lightning-reload-return-refresh-rounded-a.svg",
        "label": "arrow, hand drawn, scribble, doodle, thick, lightning, reload, return, refresh, rounded, arrows, 63"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-thick-up-right-47",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-thick-up-right-47.svg",
        "label": "arrow, hand drawn, scribble, doodle, thick, up, right, 47"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-thick-up-right-52",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-thick-up-right-52.svg",
        "label": "arrow, hand drawn, scribble, doodle, thick, up, right, 52"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-thick-up-rounded-59",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-thick-up-rounded-59.svg",
        "label": "arrow, hand drawn, scribble, doodle, thick, up, rounded, 59"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-undo-return-15",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-undo-return-15.svg",
        "label": "arrow, hand drawn, scribble, doodle, undo, return, 15"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-up-45",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-up-45.svg",
        "label": "arrow, hand drawn, scribble, doodle, up, 45"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-up-down-two-ways-each-way-119",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-up-down-two-ways-each-way-119.svg",
        "label": "arrow, hand drawn, scribble, doodle, up, down, two ways, each way, 119"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-up-shaded-thick-81",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-up-shaded-thick-81.svg",
        "label": "arrow, hand drawn, scribble, doodle, up, shaded, thick, 81"
      },
      {
        "id": "arrow-hand-drawn-scribble-doodle-zoom-out-zoom-in-expand-115",
        "path": "/illustrations/scribbles-doodles/arrow-hand-drawn-scribble-doodle-zoom-out-zoom-in-expand-115.svg",
        "label": "arrow, hand drawn, scribble, doodle, zoom out, zoom in, expand, 115"
      },
      {
        "id": "arrows-down-thick-pointing-downward-here-emphazise-point-filled",
        "path": "/illustrations/scribbles-doodles/arrows-down-thick-pointing-downward-here-emphazise-point-filled.svg",
        "label": "arrows, down, thick, pointing, downward, here, emphazise, point, filled"
      },
      {
        "id": "beach-wave-doodle-water-sea-ocean-2",
        "path": "/illustrations/scribbles-doodles/beach-wave-doodle-water-sea-ocean-2.svg",
        "label": "beach, wave, doodle, water, sea, ocean, 2"
      },
      {
        "id": "braces-curly-braces-symbol-close-character-line",
        "path": "/illustrations/scribbles-doodles/braces-curly-braces-symbol-close-character-line.svg",
        "label": "braces, curly braces, symbol, close, character, line"
      },
      {
        "id": "braces-curly-braces-symbol-closed-close-character-filled",
        "path": "/illustrations/scribbles-doodles/braces-curly-braces-symbol-closed-close-character-filled.svg",
        "label": "braces, curly braces, symbol, closed, close, character, filled"
      },
      {
        "id": "braces-curly-braces-symbol-open-character-filled",
        "path": "/illustrations/scribbles-doodles/braces-curly-braces-symbol-open-character-filled.svg",
        "label": "braces, curly braces, symbol, open, character, filled"
      },
      {
        "id": "braces-curly-braces-symbol-open-character-line",
        "path": "/illustrations/scribbles-doodles/braces-curly-braces-symbol-open-character-line.svg",
        "label": "braces, curly braces, symbol, open, character, line"
      },
      {
        "id": "circle-round-mark-30",
        "path": "/illustrations/scribbles-doodles/circle-round-mark-30.svg",
        "label": "circle, round, mark, 30"
      },
      {
        "id": "cloud-fluff-clouds-32",
        "path": "/illustrations/scribbles-doodles/cloud-fluff-clouds-32.svg",
        "label": "cloud, fluff, clouds, 32"
      },
      {
        "id": "cloud-fluff-clouds-35",
        "path": "/illustrations/scribbles-doodles/cloud-fluff-clouds-35.svg",
        "label": "cloud, fluff, clouds, 35"
      },
      {
        "id": "cloud-shape-abstract-36",
        "path": "/illustrations/scribbles-doodles/cloud-shape-abstract-36.svg",
        "label": "cloud, shape, abstract, 36"
      },
      {
        "id": "curve-loop-curl-doodle-scribble-110",
        "path": "/illustrations/scribbles-doodles/curve-loop-curl-doodle-scribble-110.svg",
        "label": "curve, loop, curl, doodle, scribble, 110"
      },
      {
        "id": "curve-loop-curl-doodle-scribble-114",
        "path": "/illustrations/scribbles-doodles/curve-loop-curl-doodle-scribble-114.svg",
        "label": "curve, loop, curl, doodle, scribble, 114"
      },
      {
        "id": "eggplant-cucumber-vegetable-plant-fruit-food-groceries-zucchini",
        "path": "/illustrations/scribbles-doodles/eggplant-cucumber-vegetable-plant-fruit-food-groceries-zucchini.svg",
        "label": "eggplant, cucumber, vegetable, plant, fruit, food, groceries, zucchini"
      },
      {
        "id": "emoji-emoticon-smiley-confused-huh-grumpy-unhappy-mad-annoyed",
        "path": "/illustrations/scribbles-doodles/emoji-emoticon-smiley-confused-huh-grumpy-unhappy-mad-annoyed.svg",
        "label": "emoji, emoticon, smiley, confused, huh, grumpy, unhappy, mad, annoyed"
      },
      {
        "id": "emoji-emoticon-smiley-smile-grin-happy-face-emotion-2",
        "path": "/illustrations/scribbles-doodles/emoji-emoticon-smiley-smile-grin-happy-face-emotion-2.svg",
        "label": "emoji, emoticon, smiley, smile, grin, happy, face, emotion, 2"
      },
      {
        "id": "letter-capital-x-letter-x-x",
        "path": "/illustrations/scribbles-doodles/letter-capital-x-letter-x-x.svg",
        "label": "letter, capital x, letter x, x"
      },
      {
        "id": "letter-capital-y-letter-y-y",
        "path": "/illustrations/scribbles-doodles/letter-capital-y-letter-y-y.svg",
        "label": "letter, capital y, letter y, y"
      },
      {
        "id": "letter-capital-z-letter-z-z",
        "path": "/illustrations/scribbles-doodles/letter-capital-z-letter-z-z.svg",
        "label": "letter, capital z, letter z, z"
      },
      {
        "id": "plant-leaves-leaf-branch-plants-nature-green-52",
        "path": "/illustrations/scribbles-doodles/plant-leaves-leaf-branch-plants-nature-green-52.svg",
        "label": "plant, leaves, leaf, branch, plants, nature, green, 52"
      },
      {
        "id": "plant-leaves-leaf-plants-nature-green-58",
        "path": "/illustrations/scribbles-doodles/plant-leaves-leaf-plants-nature-green-58.svg",
        "label": "plant, leaves, leaf, plants, nature, green, 58"
      },
      {
        "id": "pulse-heart-rate",
        "path": "/illustrations/scribbles-doodles/pulse-heart-rate.svg",
        "label": "pulse, heart rate,"
      },
      {
        "id": "restaurant-food-cutlery-fork-spoon-eat-meal-cross-1",
        "path": "/illustrations/scribbles-doodles/restaurant-food-cutlery-fork-spoon-eat-meal-cross-1.svg",
        "label": "restaurant, food, cutlery, fork. spoon, eat, meal, cross 1"
      },
      {
        "id": "scribble-loop-outline-90",
        "path": "/illustrations/scribbles-doodles/scribble-loop-outline-90.svg",
        "label": "scribble, loop, outline, 90"
      },
      {
        "id": "semicolon-colon-symbol-filled",
        "path": "/illustrations/scribbles-doodles/semicolon-colon-symbol-filled.svg",
        "label": "semicolon, colon, symbol, filled"
      },
      {
        "id": "shape-abstract-blob-stars-spark-sparks-sparkle-shine-night-pattern-magic-dust-fa",
        "path": "/illustrations/scribbles-doodles/shape-abstract-blob-stars-spark-sparks-sparkle-shine-night-pattern-magic-dust-fa.svg",
        "label": "shape, abstract, blob, stars, spark, sparks, sparkle, shine, night, pattern, magic, dust, fairy"
      },
      {
        "id": "shape-doodle-swirl-scribble-loops-4",
        "path": "/illustrations/scribbles-doodles/shape-doodle-swirl-scribble-loops-4.svg",
        "label": "shape, doodle, swirl, scribble, loops, 4"
      },
      {
        "id": "shape-doodle-swirl-spiral-snail-scribble-maze-lapyrinth",
        "path": "/illustrations/scribbles-doodles/shape-doodle-swirl-spiral-snail-scribble-maze-lapyrinth.svg",
        "label": "shape, doodle, swirl, spiral, snail, scribble, maze, lapyrinth"
      },
      {
        "id": "snow-rain-drops-weather-sparkle-pattern",
        "path": "/illustrations/scribbles-doodles/snow-rain-drops-weather-sparkle-pattern.svg",
        "label": "snow, rain, drops, weather, sparkle, pattern"
      },
      {
        "id": "spark-sparkle-26",
        "path": "/illustrations/scribbles-doodles/spark-sparkle-26.svg",
        "label": "spark, sparkle, 26"
      },
      {
        "id": "spark-sparks-sparkle-stars-30",
        "path": "/illustrations/scribbles-doodles/spark-sparks-sparkle-stars-30.svg",
        "label": "spark, sparks, sparkle, stars, 30"
      },
      {
        "id": "speech-bubble-chat-chat-bubble-talk-speak-message-2",
        "path": "/illustrations/scribbles-doodles/speech-bubble-chat-chat-bubble-talk-speak-message-2.svg",
        "label": "speech bubble, chat, chat bubble, talk, speak, message,  2"
      },
      {
        "id": "speech-bubble-chat-chat-bubble-talk-speak-message-4",
        "path": "/illustrations/scribbles-doodles/speech-bubble-chat-chat-bubble-talk-speak-message-4.svg",
        "label": "speech bubble, chat, chat bubble, talk, speak, message,  4"
      },
      {
        "id": "swirl-arrow-hand-drawn-scribble-doodle-6",
        "path": "/illustrations/scribbles-doodles/swirl-arrow-hand-drawn-scribble-doodle-6.svg",
        "label": "swirl, arrow, hand drawn, scribble, doodle, 6"
      },
      {
        "id": "swirl-loops-doodle-scribble-97",
        "path": "/illustrations/scribbles-doodles/swirl-loops-doodle-scribble-97.svg",
        "label": "swirl, loops, doodle, scribble, 97"
      },
      {
        "id": "swirl-spiral-doodle-scribble-117",
        "path": "/illustrations/scribbles-doodles/swirl-spiral-doodle-scribble-117.svg",
        "label": "swirl, spiral, doodle, scribble, 117"
      },
      {
        "id": "swirl-spiral-twist-loops-doodles-doodle-23",
        "path": "/illustrations/scribbles-doodles/swirl-spiral-twist-loops-doodles-doodle-23.svg",
        "label": "swirl, spiral, twist, loops, doodles, doodle, 23"
      },
      {
        "id": "thoughts-dreams-clouds-thought-bubble-11",
        "path": "/illustrations/scribbles-doodles/thoughts-dreams-clouds-thought-bubble-11.svg",
        "label": "thoughts, dreams, clouds, thought bubble, 11"
      },
      {
        "id": "triangle-outline-border-frame-47",
        "path": "/illustrations/scribbles-doodles/triangle-outline-border-frame-47.svg",
        "label": "triangle, outline, border, frame, 47"
      }
    ]
  },
  {
    "id": "sketch-elements",
    "label": "Sketch Elements",
    "assets": [
      {
        "id": "abstract-flower-bush-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-flower-bush-2-streamline-beveled-scribbles.svg",
        "label": "Abstract Flower Bush 2 Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-bookmark-ribbon-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-bookmark-ribbon-streamline-beveled-scribbles.svg",
        "label": "Abstract Bookmark Ribbon Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-bubbles-pop-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-bubbles-pop-1-streamline-beveled-scribbles.svg",
        "label": "Abstract Bubbles Pop 1 Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-circle-rice-dot-dash-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-circle-rice-dot-dash-streamline-beveled-scribbles.svg",
        "label": "Abstract Circle Rice Dot Dash Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-dash-half-radius-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-dash-half-radius-streamline-beveled-scribbles.svg",
        "label": "Abstract Dash Half Radius Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-diamond-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-diamond-2-streamline-beveled-scribbles.svg",
        "label": "Abstract Diamond 2 Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-diamond-double-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-diamond-double-streamline-beveled-scribbles.svg",
        "label": "Abstract Diamond Double Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-dot-flake-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-dot-flake-streamline-beveled-scribbles.svg",
        "label": "Abstract Dot Flake Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-effect-curly-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-effect-curly-streamline-beveled-scribbles.svg",
        "label": "Abstract Effect Curly Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-explode-half-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-explode-half-streamline-beveled-scribbles.svg",
        "label": "Abstract Explode Half Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-flake-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-flake-2-streamline-beveled-scribbles.svg",
        "label": "Abstract Flake 2 Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-flake-3-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-flake-3-streamline-beveled-scribbles.svg",
        "label": "Abstract Flake 3 Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-flower-nature-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-flower-nature-2-streamline-beveled-scribbles.svg",
        "label": "Abstract Flower Nature 2 Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-half-oval-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-half-oval-streamline-beveled-scribbles.svg",
        "label": "Abstract Half Oval Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-hearts-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-hearts-streamline-beveled-scribbles.svg",
        "label": "Abstract Hearts Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-highlight-bling-triangle-line-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-highlight-bling-triangle-line-streamline-beveled-scribbles.svg",
        "label": "Abstract Highlight Bling Triangle Line Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-jellyfish-tulip-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-jellyfish-tulip-streamline-beveled-scribbles.svg",
        "label": "Abstract Jellyfish Tulip Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-line-splash-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-line-splash-streamline-beveled-scribbles.svg",
        "label": "Abstract Line Splash Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-line-wavy-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-line-wavy-2-streamline-beveled-scribbles.svg",
        "label": "Abstract Line Wavy 2 Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-motion-ball-line-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-motion-ball-line-streamline-beveled-scribbles.svg",
        "label": "Abstract Motion Ball Line Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-rainbow-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-rainbow-streamline-beveled-scribbles.svg",
        "label": "Abstract Rainbow Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-ribbon-vine-line-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-ribbon-vine-line-2-streamline-beveled-scribbles.svg",
        "label": "Abstract Ribbon Vine Line 2 Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-rock-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-rock-streamline-beveled-scribbles.svg",
        "label": "Abstract Rock Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-scratch-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-scratch-2-streamline-beveled-scribbles.svg",
        "label": "Abstract Scratch 2 Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-scratch-dash-line-rain-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-scratch-dash-line-rain-streamline-beveled-scribbles.svg",
        "label": "Abstract Scratch Dash Line Rain Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-scratch-line-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-scratch-line-streamline-beveled-scribbles.svg",
        "label": "Abstract Scratch Line Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-spiral-wind-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-spiral-wind-streamline-beveled-scribbles.svg",
        "label": "Abstract Spiral Wind Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-spiral-wood-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-spiral-wood-1-streamline-beveled-scribbles.svg",
        "label": "Abstract Spiral Wood 1 Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-spiral-wood-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-spiral-wood-2-streamline-beveled-scribbles.svg",
        "label": "Abstract Spiral Wood 2 Streamline Beveled Scribbles"
      },
      {
        "id": "abstract-wind-line-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/abstract-wind-line-2-streamline-beveled-scribbles.svg",
        "label": "Abstract Wind Line 2 Streamline Beveled Scribbles"
      },
      {
        "id": "achievement-badge-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/achievement-badge-streamline-beveled-scribbles.svg",
        "label": "Achievement Badge Streamline Beveled Scribbles"
      },
      {
        "id": "achievement-cup-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/achievement-cup-streamline-beveled-scribbles.svg",
        "label": "Achievement Cup Streamline Beveled Scribbles"
      },
      {
        "id": "anger-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/anger-streamline-beveled-scribbles.svg",
        "label": "Anger Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-3d-boomerang-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-3d-boomerang-streamline-beveled-scribbles.svg",
        "label": "Arrow 3d Boomerang Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-3d-turn-down-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-3d-turn-down-streamline-beveled-scribbles.svg",
        "label": "Arrow 3d Turn Down Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-9-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-9-streamline-beveled-scribbles.svg",
        "label": "Arrow 9 Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-dashed-line-head-angled-long-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-dashed-line-head-angled-long-streamline-beveled-scribbles.svg",
        "label": "Arrow Dashed Line Head Angled Long Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-dashed-line-head-straight-long-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-dashed-line-head-straight-long-streamline-beveled-scribbles.svg",
        "label": "Arrow Dashed Line Head Straight Long Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-double-staight-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-double-staight-streamline-beveled-scribbles.svg",
        "label": "Arrow Double Staight Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-double-swirl-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-double-swirl-streamline-beveled-scribbles.svg",
        "label": "Arrow Double Swirl Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-filled-head-swirl-medium-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-filled-head-swirl-medium-streamline-beveled-scribbles.svg",
        "label": "Arrow Filled Head Swirl Medium Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-filled-head-wiggle-medium-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-filled-head-wiggle-medium-streamline-beveled-scribbles.svg",
        "label": "Arrow Filled Head Wiggle Medium Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-hatch-filled-short-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-hatch-filled-short-streamline-beveled-scribbles.svg",
        "label": "Arrow Hatch Filled Short Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-hatch-filled-zigzag-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-hatch-filled-zigzag-streamline-beveled-scribbles.svg",
        "label": "Arrow Hatch Filled Zigzag Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-line-head-angled-long-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-line-head-angled-long-streamline-beveled-scribbles.svg",
        "label": "Arrow Line Head Angled Long Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-line-head-wiggle-short-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-line-head-wiggle-short-streamline-beveled-scribbles.svg",
        "label": "Arrow Line Head Wiggle Short Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-open-back-short-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-open-back-short-streamline-beveled-scribbles.svg",
        "label": "Arrow Open Back Short Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-open-back-turn-back-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-open-back-turn-back-streamline-beveled-scribbles.svg",
        "label": "Arrow Open Back Turn Back Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-pointy-back-short-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-pointy-back-short-streamline-beveled-scribbles.svg",
        "label": "Arrow Pointy Back Short Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-pointy-back-zigzag-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-pointy-back-zigzag-streamline-beveled-scribbles.svg",
        "label": "Arrow Pointy Back Zigzag Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-ribbon-back-short-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-ribbon-back-short-streamline-beveled-scribbles.svg",
        "label": "Arrow Ribbon Back Short Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-ribbon-back-wiggle-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-ribbon-back-wiggle-streamline-beveled-scribbles.svg",
        "label": "Arrow Ribbon Back Wiggle Streamline Beveled Scribbles"
      },
      {
        "id": "arrow-wiggle-medium-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/arrow-wiggle-medium-streamline-beveled-scribbles.svg",
        "label": "Arrow Wiggle Medium Streamline Beveled Scribbles"
      },
      {
        "id": "asterisk-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/asterisk-1-streamline-beveled-scribbles.svg",
        "label": "Asterisk 1 Streamline Beveled Scribbles"
      },
      {
        "id": "banners-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/banners-streamline-beveled-scribbles.svg",
        "label": "Banners Streamline Beveled Scribbles"
      },
      {
        "id": "banners-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/banners-1-streamline-beveled-scribbles.svg",
        "label": "Banners 1 Streamline Beveled Scribbles"
      },
      {
        "id": "banners-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/banners-2-streamline-beveled-scribbles.svg",
        "label": "Banners 2 Streamline Beveled Scribbles"
      },
      {
        "id": "banners-4-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/banners-4-streamline-beveled-scribbles.svg",
        "label": "Banners 4 Streamline Beveled Scribbles"
      },
      {
        "id": "banners-5-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/banners-5-streamline-beveled-scribbles.svg",
        "label": "Banners 5 Streamline Beveled Scribbles"
      },
      {
        "id": "banners-6-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/banners-6-streamline-beveled-scribbles.svg",
        "label": "Banners 6 Streamline Beveled Scribbles"
      },
      {
        "id": "book-glasses-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/book-glasses-streamline-beveled-scribbles.svg",
        "label": "Book Glasses Streamline Beveled Scribbles"
      },
      {
        "id": "bookmark-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bookmark-1-streamline-beveled-scribbles.svg",
        "label": "Bookmark 1 Streamline Beveled Scribbles"
      },
      {
        "id": "bookmark-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bookmark-2-streamline-beveled-scribbles.svg",
        "label": "Bookmark 2 Streamline Beveled Scribbles"
      },
      {
        "id": "bookmark-3-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bookmark-3-streamline-beveled-scribbles.svg",
        "label": "Bookmark 3 Streamline Beveled Scribbles"
      },
      {
        "id": "bookmark-5-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bookmark-5-streamline-beveled-scribbles.svg",
        "label": "Bookmark 5 Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-circle-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-circle-2-streamline-beveled-scribbles.svg",
        "label": "Bubble Circle 2 Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-conversation-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-conversation-streamline-beveled-scribbles.svg",
        "label": "Bubble Conversation Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-conversation-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-conversation-1-streamline-beveled-scribbles.svg",
        "label": "Bubble Conversation 1 Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-crossed-circle-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-crossed-circle-streamline-beveled-scribbles.svg",
        "label": "Bubble Crossed Circle Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-crossed-ellipse-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-crossed-ellipse-streamline-beveled-scribbles.svg",
        "label": "Bubble Crossed Ellipse Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-effect-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-effect-streamline-beveled-scribbles.svg",
        "label": "Bubble Effect Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-effect-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-effect-1-streamline-beveled-scribbles.svg",
        "label": "Bubble Effect 1 Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-effect-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-effect-2-streamline-beveled-scribbles.svg",
        "label": "Bubble Effect 2 Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-ellipse-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-ellipse-streamline-beveled-scribbles.svg",
        "label": "Bubble Ellipse Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-ellipse-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-ellipse-1-streamline-beveled-scribbles.svg",
        "label": "Bubble Ellipse 1 Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-note-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-note-streamline-beveled-scribbles.svg",
        "label": "Bubble Note Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-note-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-note-1-streamline-beveled-scribbles.svg",
        "label": "Bubble Note 1 Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-pointer-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-pointer-streamline-beveled-scribbles.svg",
        "label": "Bubble Pointer Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-pointer-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-pointer-1-streamline-beveled-scribbles.svg",
        "label": "Bubble Pointer 1 Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-rectangle-hatch-shadow-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-rectangle-hatch-shadow-streamline-beveled-scribbles.svg",
        "label": "Bubble Rectangle Hatch Shadow Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-rectangle-hatch-shadow-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-rectangle-hatch-shadow-1-streamline-beveled-scribbles.svg",
        "label": "Bubble Rectangle Hatch Shadow 1 Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-rectangle-hatch-shadow-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-rectangle-hatch-shadow-2-streamline-beveled-scribbles.svg",
        "label": "Bubble Rectangle Hatch Shadow 2 Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-rectangle-scribble-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-rectangle-scribble-streamline-beveled-scribbles.svg",
        "label": "Bubble Rectangle Scribble Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-rectangle-scribble-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-rectangle-scribble-1-streamline-beveled-scribbles.svg",
        "label": "Bubble Rectangle Scribble 1 Streamline Beveled Scribbles"
      },
      {
        "id": "bubble-rectangle-scribble-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bubble-rectangle-scribble-2-streamline-beveled-scribbles.svg",
        "label": "Bubble Rectangle Scribble 2 Streamline Beveled Scribbles"
      },
      {
        "id": "bullet-button-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bullet-button-streamline-beveled-scribbles.svg",
        "label": "Bullet Button Streamline Beveled Scribbles"
      },
      {
        "id": "bullet-pointer-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bullet-pointer-streamline-beveled-scribbles.svg",
        "label": "Bullet Pointer Streamline Beveled Scribbles"
      },
      {
        "id": "bullet-pointer-swirl-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/bullet-pointer-swirl-streamline-beveled-scribbles.svg",
        "label": "Bullet Pointer Swirl Streamline Beveled Scribbles"
      },
      {
        "id": "calendar-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/calendar-streamline-beveled-scribbles.svg",
        "label": "Calendar Streamline Beveled Scribbles"
      },
      {
        "id": "checked-circle-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/checked-circle-streamline-beveled-scribbles.svg",
        "label": "Checked Circle Streamline Beveled Scribbles"
      },
      {
        "id": "crossed-circle-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/crossed-circle-streamline-beveled-scribbles.svg",
        "label": "Crossed Circle Streamline Beveled Scribbles"
      },
      {
        "id": "crown-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/crown-streamline-beveled-scribbles.svg",
        "label": "Crown Streamline Beveled Scribbles"
      },
      {
        "id": "dollar-bill-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/dollar-bill-streamline-beveled-scribbles.svg",
        "label": "Dollar Bill Streamline Beveled Scribbles"
      },
      {
        "id": "due-date-bracket-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/due-date-bracket-streamline-beveled-scribbles.svg",
        "label": "Due Date Bracket Streamline Beveled Scribbles"
      },
      {
        "id": "due-date-time-bracket-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/due-date-time-bracket-streamline-beveled-scribbles.svg",
        "label": "Due Date Time Bracket Streamline Beveled Scribbles"
      },
      {
        "id": "exclamation-mark-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/exclamation-mark-streamline-beveled-scribbles.svg",
        "label": "Exclamation Mark Streamline Beveled Scribbles"
      },
      {
        "id": "eye-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/eye-streamline-beveled-scribbles.svg",
        "label": "Eye Streamline Beveled Scribbles"
      },
      {
        "id": "festive-flags-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/festive-flags-streamline-beveled-scribbles.svg",
        "label": "Festive Flags Streamline Beveled Scribbles"
      },
      {
        "id": "flag-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/flag-streamline-beveled-scribbles.svg",
        "label": "Flag Streamline Beveled Scribbles"
      },
      {
        "id": "flag-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/flag-1-streamline-beveled-scribbles.svg",
        "label": "Flag 1 Streamline Beveled Scribbles"
      },
      {
        "id": "flag-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/flag-2-streamline-beveled-scribbles.svg",
        "label": "Flag 2 Streamline Beveled Scribbles"
      },
      {
        "id": "flag-3-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/flag-3-streamline-beveled-scribbles.svg",
        "label": "Flag 3 Streamline Beveled Scribbles"
      },
      {
        "id": "flag-4-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/flag-4-streamline-beveled-scribbles.svg",
        "label": "Flag 4 Streamline Beveled Scribbles"
      },
      {
        "id": "flag-5-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/flag-5-streamline-beveled-scribbles.svg",
        "label": "Flag 5 Streamline Beveled Scribbles"
      },
      {
        "id": "floppy-disk-drive-save-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/floppy-disk-drive-save-streamline-beveled-scribbles.svg",
        "label": "Floppy Disk Drive Save Streamline Beveled Scribbles"
      },
      {
        "id": "heart-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/heart-streamline-beveled-scribbles.svg",
        "label": "Heart Streamline Beveled Scribbles"
      },
      {
        "id": "highlight-100-point-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/highlight-100-point-streamline-beveled-scribbles.svg",
        "label": "Highlight 100 Point Streamline Beveled Scribbles"
      },
      {
        "id": "highlight-effect-line-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/highlight-effect-line-1-streamline-beveled-scribbles.svg",
        "label": "Highlight Effect Line 1 Streamline Beveled Scribbles"
      },
      {
        "id": "highlight-effect-line-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/highlight-effect-line-2-streamline-beveled-scribbles.svg",
        "label": "Highlight Effect Line 2 Streamline Beveled Scribbles"
      },
      {
        "id": "highlight-effect-line-3-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/highlight-effect-line-3-streamline-beveled-scribbles.svg",
        "label": "Highlight Effect Line 3 Streamline Beveled Scribbles"
      },
      {
        "id": "highlight-perfect-score-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/highlight-perfect-score-streamline-beveled-scribbles.svg",
        "label": "Highlight Perfect Score Streamline Beveled Scribbles"
      },
      {
        "id": "highlight-quote-left-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/highlight-quote-left-streamline-beveled-scribbles.svg",
        "label": "Highlight Quote Left Streamline Beveled Scribbles"
      },
      {
        "id": "highlight-quote-right-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/highlight-quote-right-streamline-beveled-scribbles.svg",
        "label": "Highlight Quote Right Streamline Beveled Scribbles"
      },
      {
        "id": "highlight-sparkle-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/highlight-sparkle-1-streamline-beveled-scribbles.svg",
        "label": "Highlight Sparkle 1 Streamline Beveled Scribbles"
      },
      {
        "id": "highlight-sparkle-2-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/highlight-sparkle-2-streamline-beveled-scribbles.svg",
        "label": "Highlight Sparkle 2 Streamline Beveled Scribbles"
      },
      {
        "id": "highlight-sparkle-3-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/highlight-sparkle-3-streamline-beveled-scribbles.svg",
        "label": "Highlight Sparkle 3 Streamline Beveled Scribbles"
      },
      {
        "id": "highlight-sparkle-5-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/highlight-sparkle-5-streamline-beveled-scribbles.svg",
        "label": "Highlight Sparkle 5 Streamline Beveled Scribbles"
      },
      {
        "id": "highlight-sparkle-6-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/highlight-sparkle-6-streamline-beveled-scribbles.svg",
        "label": "Highlight Sparkle 6 Streamline Beveled Scribbles"
      },
      {
        "id": "highlight-summary-bracket-short-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/highlight-summary-bracket-short-streamline-beveled-scribbles.svg",
        "label": "Highlight Summary Bracket Short Streamline Beveled Scribbles"
      },
      {
        "id": "highlight-summary-line-short-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/highlight-summary-line-short-streamline-beveled-scribbles.svg",
        "label": "Highlight Summary Line Short Streamline Beveled Scribbles"
      },
      {
        "id": "highlight-underline-4-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/highlight-underline-4-streamline-beveled-scribbles.svg",
        "label": "Highlight Underline 4 Streamline Beveled Scribbles"
      },
      {
        "id": "idea-light-bulb-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/idea-light-bulb-streamline-beveled-scribbles.svg",
        "label": "Idea Light Bulb Streamline Beveled Scribbles"
      },
      {
        "id": "image-picture-polaroid-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/image-picture-polaroid-streamline-beveled-scribbles.svg",
        "label": "Image Picture Polaroid Streamline Beveled Scribbles"
      },
      {
        "id": "magnifier-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/magnifier-streamline-beveled-scribbles.svg",
        "label": "Magnifier Streamline Beveled Scribbles"
      },
      {
        "id": "mail-open-envilope-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/mail-open-envilope-streamline-beveled-scribbles.svg",
        "label": "Mail Open Envilope Streamline Beveled Scribbles"
      },
      {
        "id": "megaphone-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/megaphone-streamline-beveled-scribbles.svg",
        "label": "Megaphone Streamline Beveled Scribbles"
      },
      {
        "id": "meteor-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/meteor-streamline-beveled-scribbles.svg",
        "label": "Meteor Streamline Beveled Scribbles"
      },
      {
        "id": "music-headphone-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/music-headphone-streamline-beveled-scribbles.svg",
        "label": "Music Headphone Streamline Beveled Scribbles"
      },
      {
        "id": "nitification-ringtone-bell-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/nitification-ringtone-bell-streamline-beveled-scribbles.svg",
        "label": "Nitification Ringtone Bell Streamline Beveled Scribbles"
      },
      {
        "id": "pencil-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/pencil-streamline-beveled-scribbles.svg",
        "label": "Pencil Streamline Beveled Scribbles"
      },
      {
        "id": "pin-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/pin-streamline-beveled-scribbles.svg",
        "label": "Pin Streamline Beveled Scribbles"
      },
      {
        "id": "raining-cloud-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/raining-cloud-streamline-beveled-scribbles.svg",
        "label": "Raining Cloud Streamline Beveled Scribbles"
      },
      {
        "id": "ribbon-1-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/ribbon-1-streamline-beveled-scribbles.svg",
        "label": "Ribbon 1 Streamline Beveled Scribbles"
      },
      {
        "id": "ribbon-3-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/ribbon-3-streamline-beveled-scribbles.svg",
        "label": "Ribbon 3 Streamline Beveled Scribbles"
      },
      {
        "id": "ribbon-5-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/ribbon-5-streamline-beveled-scribbles.svg",
        "label": "Ribbon 5 Streamline Beveled Scribbles"
      },
      {
        "id": "shared-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/shared-streamline-beveled-scribbles.svg",
        "label": "Shared Streamline Beveled Scribbles"
      },
      {
        "id": "shining-effect-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/shining-effect-streamline-beveled-scribbles.svg",
        "label": "Shining Effect Streamline Beveled Scribbles"
      },
      {
        "id": "sleep-night-moon-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/sleep-night-moon-streamline-beveled-scribbles.svg",
        "label": "Sleep Night Moon Streamline Beveled Scribbles"
      },
      {
        "id": "smartphone-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/smartphone-streamline-beveled-scribbles.svg",
        "label": "Smartphone Streamline Beveled Scribbles"
      },
      {
        "id": "smiley-grinding-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/smiley-grinding-streamline-beveled-scribbles.svg",
        "label": "Smiley Grinding Streamline Beveled Scribbles"
      },
      {
        "id": "snow-flake-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/snow-flake-streamline-beveled-scribbles.svg",
        "label": "Snow Flake Streamline Beveled Scribbles"
      },
      {
        "id": "stopwatch-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/stopwatch-streamline-beveled-scribbles.svg",
        "label": "Stopwatch Streamline Beveled Scribbles"
      },
      {
        "id": "sun-weather-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/sun-weather-streamline-beveled-scribbles.svg",
        "label": "Sun Weather Streamline Beveled Scribbles"
      },
      {
        "id": "termometer-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/termometer-streamline-beveled-scribbles.svg",
        "label": "Termometer Streamline Beveled Scribbles"
      },
      {
        "id": "thumbup-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/thumbup-streamline-beveled-scribbles.svg",
        "label": "Thumbup Streamline Beveled Scribbles"
      },
      {
        "id": "tiktok-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/tiktok-streamline-beveled-scribbles.svg",
        "label": "Tiktok Streamline Beveled Scribbles"
      },
      {
        "id": "trashcan-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/trashcan-streamline-beveled-scribbles.svg",
        "label": "Trashcan Streamline Beveled Scribbles"
      },
      {
        "id": "unlock-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/unlock-streamline-beveled-scribbles.svg",
        "label": "Unlock Streamline Beveled Scribbles"
      },
      {
        "id": "whatsapp-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/whatsapp-streamline-beveled-scribbles.svg",
        "label": "Whatsapp Streamline Beveled Scribbles"
      },
      {
        "id": "wrench-streamline-beveled-scribbles",
        "path": "/illustrations/sketch-elements/wrench-streamline-beveled-scribbles.svg",
        "label": "Wrench Streamline Beveled Scribbles"
      }
    ]
  },
  {
    "id": "vector-sticker-pack",
    "label": "Vector Stickers",
    "assets": [
      {
        "id": "1",
        "path": "/illustrations/vector-sticker-pack/1.svg",
        "label": "1"
      },
      {
        "id": "10",
        "path": "/illustrations/vector-sticker-pack/10.svg",
        "label": "10"
      },
      {
        "id": "100",
        "path": "/illustrations/vector-sticker-pack/100.svg",
        "label": "100"
      },
      {
        "id": "11",
        "path": "/illustrations/vector-sticker-pack/11.svg",
        "label": "11"
      },
      {
        "id": "12",
        "path": "/illustrations/vector-sticker-pack/12.svg",
        "label": "12"
      },
      {
        "id": "13",
        "path": "/illustrations/vector-sticker-pack/13.svg",
        "label": "13"
      },
      {
        "id": "14",
        "path": "/illustrations/vector-sticker-pack/14.svg",
        "label": "14"
      },
      {
        "id": "15",
        "path": "/illustrations/vector-sticker-pack/15.svg",
        "label": "15"
      },
      {
        "id": "16",
        "path": "/illustrations/vector-sticker-pack/16.svg",
        "label": "16"
      },
      {
        "id": "17",
        "path": "/illustrations/vector-sticker-pack/17.svg",
        "label": "17"
      },
      {
        "id": "18",
        "path": "/illustrations/vector-sticker-pack/18.svg",
        "label": "18"
      },
      {
        "id": "19",
        "path": "/illustrations/vector-sticker-pack/19.svg",
        "label": "19"
      },
      {
        "id": "2",
        "path": "/illustrations/vector-sticker-pack/2.svg",
        "label": "2"
      },
      {
        "id": "20",
        "path": "/illustrations/vector-sticker-pack/20.svg",
        "label": "20"
      },
      {
        "id": "21",
        "path": "/illustrations/vector-sticker-pack/21.svg",
        "label": "21"
      },
      {
        "id": "22",
        "path": "/illustrations/vector-sticker-pack/22.svg",
        "label": "22"
      },
      {
        "id": "23",
        "path": "/illustrations/vector-sticker-pack/23.svg",
        "label": "23"
      },
      {
        "id": "24",
        "path": "/illustrations/vector-sticker-pack/24.svg",
        "label": "24"
      },
      {
        "id": "25",
        "path": "/illustrations/vector-sticker-pack/25.svg",
        "label": "25"
      },
      {
        "id": "26",
        "path": "/illustrations/vector-sticker-pack/26.svg",
        "label": "26"
      },
      {
        "id": "27",
        "path": "/illustrations/vector-sticker-pack/27.svg",
        "label": "27"
      },
      {
        "id": "28",
        "path": "/illustrations/vector-sticker-pack/28.svg",
        "label": "28"
      },
      {
        "id": "29",
        "path": "/illustrations/vector-sticker-pack/29.svg",
        "label": "29"
      },
      {
        "id": "3",
        "path": "/illustrations/vector-sticker-pack/3.svg",
        "label": "3"
      },
      {
        "id": "30",
        "path": "/illustrations/vector-sticker-pack/30.svg",
        "label": "30"
      },
      {
        "id": "31",
        "path": "/illustrations/vector-sticker-pack/31.svg",
        "label": "31"
      },
      {
        "id": "32",
        "path": "/illustrations/vector-sticker-pack/32.svg",
        "label": "32"
      },
      {
        "id": "33",
        "path": "/illustrations/vector-sticker-pack/33.svg",
        "label": "33"
      },
      {
        "id": "34",
        "path": "/illustrations/vector-sticker-pack/34.svg",
        "label": "34"
      },
      {
        "id": "35",
        "path": "/illustrations/vector-sticker-pack/35.svg",
        "label": "35"
      },
      {
        "id": "36",
        "path": "/illustrations/vector-sticker-pack/36.svg",
        "label": "36"
      },
      {
        "id": "37",
        "path": "/illustrations/vector-sticker-pack/37.svg",
        "label": "37"
      },
      {
        "id": "38",
        "path": "/illustrations/vector-sticker-pack/38.svg",
        "label": "38"
      },
      {
        "id": "39",
        "path": "/illustrations/vector-sticker-pack/39.svg",
        "label": "39"
      },
      {
        "id": "4",
        "path": "/illustrations/vector-sticker-pack/4.svg",
        "label": "4"
      },
      {
        "id": "40",
        "path": "/illustrations/vector-sticker-pack/40.svg",
        "label": "40"
      },
      {
        "id": "41",
        "path": "/illustrations/vector-sticker-pack/41.svg",
        "label": "41"
      },
      {
        "id": "42",
        "path": "/illustrations/vector-sticker-pack/42.svg",
        "label": "42"
      },
      {
        "id": "43",
        "path": "/illustrations/vector-sticker-pack/43.svg",
        "label": "43"
      },
      {
        "id": "44",
        "path": "/illustrations/vector-sticker-pack/44.svg",
        "label": "44"
      },
      {
        "id": "45",
        "path": "/illustrations/vector-sticker-pack/45.svg",
        "label": "45"
      },
      {
        "id": "46",
        "path": "/illustrations/vector-sticker-pack/46.svg",
        "label": "46"
      },
      {
        "id": "47",
        "path": "/illustrations/vector-sticker-pack/47.svg",
        "label": "47"
      },
      {
        "id": "48",
        "path": "/illustrations/vector-sticker-pack/48.svg",
        "label": "48"
      },
      {
        "id": "49",
        "path": "/illustrations/vector-sticker-pack/49.svg",
        "label": "49"
      },
      {
        "id": "5",
        "path": "/illustrations/vector-sticker-pack/5.svg",
        "label": "5"
      },
      {
        "id": "50",
        "path": "/illustrations/vector-sticker-pack/50.svg",
        "label": "50"
      },
      {
        "id": "51",
        "path": "/illustrations/vector-sticker-pack/51.svg",
        "label": "51"
      },
      {
        "id": "52",
        "path": "/illustrations/vector-sticker-pack/52.svg",
        "label": "52"
      },
      {
        "id": "54",
        "path": "/illustrations/vector-sticker-pack/54.svg",
        "label": "54"
      },
      {
        "id": "55",
        "path": "/illustrations/vector-sticker-pack/55.svg",
        "label": "55"
      },
      {
        "id": "56",
        "path": "/illustrations/vector-sticker-pack/56.svg",
        "label": "56"
      },
      {
        "id": "57",
        "path": "/illustrations/vector-sticker-pack/57.svg",
        "label": "57"
      },
      {
        "id": "58",
        "path": "/illustrations/vector-sticker-pack/58.svg",
        "label": "58"
      },
      {
        "id": "59",
        "path": "/illustrations/vector-sticker-pack/59.svg",
        "label": "59"
      },
      {
        "id": "6",
        "path": "/illustrations/vector-sticker-pack/6.svg",
        "label": "6"
      },
      {
        "id": "60",
        "path": "/illustrations/vector-sticker-pack/60.svg",
        "label": "60"
      },
      {
        "id": "61",
        "path": "/illustrations/vector-sticker-pack/61.svg",
        "label": "61"
      },
      {
        "id": "62",
        "path": "/illustrations/vector-sticker-pack/62.svg",
        "label": "62"
      },
      {
        "id": "63",
        "path": "/illustrations/vector-sticker-pack/63.svg",
        "label": "63"
      },
      {
        "id": "64",
        "path": "/illustrations/vector-sticker-pack/64.svg",
        "label": "64"
      },
      {
        "id": "65",
        "path": "/illustrations/vector-sticker-pack/65.svg",
        "label": "65"
      },
      {
        "id": "66",
        "path": "/illustrations/vector-sticker-pack/66.svg",
        "label": "66"
      },
      {
        "id": "67",
        "path": "/illustrations/vector-sticker-pack/67.svg",
        "label": "67"
      },
      {
        "id": "68",
        "path": "/illustrations/vector-sticker-pack/68.svg",
        "label": "68"
      },
      {
        "id": "69",
        "path": "/illustrations/vector-sticker-pack/69.svg",
        "label": "69"
      },
      {
        "id": "7",
        "path": "/illustrations/vector-sticker-pack/7.svg",
        "label": "7"
      },
      {
        "id": "70",
        "path": "/illustrations/vector-sticker-pack/70.svg",
        "label": "70"
      },
      {
        "id": "71",
        "path": "/illustrations/vector-sticker-pack/71.svg",
        "label": "71"
      },
      {
        "id": "72",
        "path": "/illustrations/vector-sticker-pack/72.svg",
        "label": "72"
      },
      {
        "id": "73",
        "path": "/illustrations/vector-sticker-pack/73.svg",
        "label": "73"
      },
      {
        "id": "74",
        "path": "/illustrations/vector-sticker-pack/74.svg",
        "label": "74"
      },
      {
        "id": "75",
        "path": "/illustrations/vector-sticker-pack/75.svg",
        "label": "75"
      },
      {
        "id": "76",
        "path": "/illustrations/vector-sticker-pack/76.svg",
        "label": "76"
      },
      {
        "id": "77",
        "path": "/illustrations/vector-sticker-pack/77.svg",
        "label": "77"
      },
      {
        "id": "78",
        "path": "/illustrations/vector-sticker-pack/78.svg",
        "label": "78"
      },
      {
        "id": "79",
        "path": "/illustrations/vector-sticker-pack/79.svg",
        "label": "79"
      },
      {
        "id": "8",
        "path": "/illustrations/vector-sticker-pack/8.svg",
        "label": "8"
      },
      {
        "id": "80",
        "path": "/illustrations/vector-sticker-pack/80.svg",
        "label": "80"
      },
      {
        "id": "81",
        "path": "/illustrations/vector-sticker-pack/81.svg",
        "label": "81"
      },
      {
        "id": "82",
        "path": "/illustrations/vector-sticker-pack/82.svg",
        "label": "82"
      },
      {
        "id": "83",
        "path": "/illustrations/vector-sticker-pack/83.svg",
        "label": "83"
      },
      {
        "id": "84",
        "path": "/illustrations/vector-sticker-pack/84.svg",
        "label": "84"
      },
      {
        "id": "85",
        "path": "/illustrations/vector-sticker-pack/85.svg",
        "label": "85"
      },
      {
        "id": "86",
        "path": "/illustrations/vector-sticker-pack/86.svg",
        "label": "86"
      },
      {
        "id": "87",
        "path": "/illustrations/vector-sticker-pack/87.svg",
        "label": "87"
      },
      {
        "id": "88",
        "path": "/illustrations/vector-sticker-pack/88.svg",
        "label": "88"
      },
      {
        "id": "89",
        "path": "/illustrations/vector-sticker-pack/89.svg",
        "label": "89"
      },
      {
        "id": "9",
        "path": "/illustrations/vector-sticker-pack/9.svg",
        "label": "9"
      },
      {
        "id": "90",
        "path": "/illustrations/vector-sticker-pack/90.svg",
        "label": "90"
      },
      {
        "id": "91",
        "path": "/illustrations/vector-sticker-pack/91.svg",
        "label": "91"
      },
      {
        "id": "92",
        "path": "/illustrations/vector-sticker-pack/92.svg",
        "label": "92"
      },
      {
        "id": "93",
        "path": "/illustrations/vector-sticker-pack/93.svg",
        "label": "93"
      },
      {
        "id": "94",
        "path": "/illustrations/vector-sticker-pack/94.svg",
        "label": "94"
      },
      {
        "id": "95",
        "path": "/illustrations/vector-sticker-pack/95.svg",
        "label": "95"
      },
      {
        "id": "96",
        "path": "/illustrations/vector-sticker-pack/96.svg",
        "label": "96"
      },
      {
        "id": "97",
        "path": "/illustrations/vector-sticker-pack/97.svg",
        "label": "97"
      },
      {
        "id": "98",
        "path": "/illustrations/vector-sticker-pack/98.svg",
        "label": "98"
      },
      {
        "id": "99",
        "path": "/illustrations/vector-sticker-pack/99.svg",
        "label": "99"
      }
    ]
  },
  {
    "id": "hand-drawn",
    "label": "Hand Drawn",
    "assets": [
      {
        "id": "vector-1",
        "path": "/illustrations/hand-drawn/vector-1.svg",
        "label": "Vector 1"
      },
      {
        "id": "vector-10",
        "path": "/illustrations/hand-drawn/vector-10.svg",
        "label": "Vector 10"
      },
      {
        "id": "vector-100",
        "path": "/illustrations/hand-drawn/vector-100.svg",
        "label": "Vector 100"
      },
      {
        "id": "vector-101",
        "path": "/illustrations/hand-drawn/vector-101.svg",
        "label": "Vector 101"
      },
      {
        "id": "vector-102",
        "path": "/illustrations/hand-drawn/vector-102.svg",
        "label": "Vector 102"
      },
      {
        "id": "vector-103",
        "path": "/illustrations/hand-drawn/vector-103.svg",
        "label": "Vector 103"
      },
      {
        "id": "vector-104",
        "path": "/illustrations/hand-drawn/vector-104.svg",
        "label": "Vector 104"
      },
      {
        "id": "vector-105",
        "path": "/illustrations/hand-drawn/vector-105.svg",
        "label": "Vector 105"
      },
      {
        "id": "vector-106",
        "path": "/illustrations/hand-drawn/vector-106.svg",
        "label": "Vector 106"
      },
      {
        "id": "vector-107",
        "path": "/illustrations/hand-drawn/vector-107.svg",
        "label": "Vector 107"
      },
      {
        "id": "vector-108",
        "path": "/illustrations/hand-drawn/vector-108.svg",
        "label": "Vector 108"
      },
      {
        "id": "vector-109",
        "path": "/illustrations/hand-drawn/vector-109.svg",
        "label": "Vector 109"
      },
      {
        "id": "vector-11",
        "path": "/illustrations/hand-drawn/vector-11.svg",
        "label": "Vector 11"
      },
      {
        "id": "vector-110",
        "path": "/illustrations/hand-drawn/vector-110.svg",
        "label": "Vector 110"
      },
      {
        "id": "vector-111",
        "path": "/illustrations/hand-drawn/vector-111.svg",
        "label": "Vector 111"
      },
      {
        "id": "vector-112",
        "path": "/illustrations/hand-drawn/vector-112.svg",
        "label": "Vector 112"
      },
      {
        "id": "vector-113",
        "path": "/illustrations/hand-drawn/vector-113.svg",
        "label": "Vector 113"
      },
      {
        "id": "vector-114",
        "path": "/illustrations/hand-drawn/vector-114.svg",
        "label": "Vector 114"
      },
      {
        "id": "vector-115",
        "path": "/illustrations/hand-drawn/vector-115.svg",
        "label": "Vector 115"
      },
      {
        "id": "vector-116",
        "path": "/illustrations/hand-drawn/vector-116.svg",
        "label": "Vector 116"
      },
      {
        "id": "vector-117",
        "path": "/illustrations/hand-drawn/vector-117.svg",
        "label": "Vector 117"
      },
      {
        "id": "vector-118",
        "path": "/illustrations/hand-drawn/vector-118.svg",
        "label": "Vector 118"
      },
      {
        "id": "vector-119",
        "path": "/illustrations/hand-drawn/vector-119.svg",
        "label": "Vector 119"
      },
      {
        "id": "vector-12",
        "path": "/illustrations/hand-drawn/vector-12.svg",
        "label": "Vector 12"
      },
      {
        "id": "vector-120",
        "path": "/illustrations/hand-drawn/vector-120.svg",
        "label": "Vector 120"
      },
      {
        "id": "vector-121",
        "path": "/illustrations/hand-drawn/vector-121.svg",
        "label": "Vector 121"
      },
      {
        "id": "vector-122",
        "path": "/illustrations/hand-drawn/vector-122.svg",
        "label": "Vector 122"
      },
      {
        "id": "vector-123",
        "path": "/illustrations/hand-drawn/vector-123.svg",
        "label": "Vector 123"
      },
      {
        "id": "vector-124",
        "path": "/illustrations/hand-drawn/vector-124.svg",
        "label": "Vector 124"
      },
      {
        "id": "vector-125",
        "path": "/illustrations/hand-drawn/vector-125.svg",
        "label": "Vector 125"
      },
      {
        "id": "vector-126",
        "path": "/illustrations/hand-drawn/vector-126.svg",
        "label": "Vector 126"
      },
      {
        "id": "vector-127",
        "path": "/illustrations/hand-drawn/vector-127.svg",
        "label": "Vector 127"
      },
      {
        "id": "vector-128",
        "path": "/illustrations/hand-drawn/vector-128.svg",
        "label": "Vector 128"
      },
      {
        "id": "vector-129",
        "path": "/illustrations/hand-drawn/vector-129.svg",
        "label": "Vector 129"
      },
      {
        "id": "vector-13",
        "path": "/illustrations/hand-drawn/vector-13.svg",
        "label": "Vector 13"
      },
      {
        "id": "vector-14",
        "path": "/illustrations/hand-drawn/vector-14.svg",
        "label": "Vector 14"
      },
      {
        "id": "vector-15",
        "path": "/illustrations/hand-drawn/vector-15.svg",
        "label": "Vector 15"
      },
      {
        "id": "vector-16",
        "path": "/illustrations/hand-drawn/vector-16.svg",
        "label": "Vector 16"
      },
      {
        "id": "vector-17",
        "path": "/illustrations/hand-drawn/vector-17.svg",
        "label": "Vector 17"
      },
      {
        "id": "vector-18",
        "path": "/illustrations/hand-drawn/vector-18.svg",
        "label": "Vector 18"
      },
      {
        "id": "vector-19",
        "path": "/illustrations/hand-drawn/vector-19.svg",
        "label": "Vector 19"
      },
      {
        "id": "vector-2",
        "path": "/illustrations/hand-drawn/vector-2.svg",
        "label": "Vector 2"
      },
      {
        "id": "vector-20",
        "path": "/illustrations/hand-drawn/vector-20.svg",
        "label": "Vector 20"
      },
      {
        "id": "vector-21",
        "path": "/illustrations/hand-drawn/vector-21.svg",
        "label": "Vector 21"
      },
      {
        "id": "vector-22",
        "path": "/illustrations/hand-drawn/vector-22.svg",
        "label": "Vector 22"
      },
      {
        "id": "vector-23",
        "path": "/illustrations/hand-drawn/vector-23.svg",
        "label": "Vector 23"
      },
      {
        "id": "vector-24",
        "path": "/illustrations/hand-drawn/vector-24.svg",
        "label": "Vector 24"
      },
      {
        "id": "vector-25",
        "path": "/illustrations/hand-drawn/vector-25.svg",
        "label": "Vector 25"
      },
      {
        "id": "vector-26",
        "path": "/illustrations/hand-drawn/vector-26.svg",
        "label": "Vector 26"
      },
      {
        "id": "vector-27",
        "path": "/illustrations/hand-drawn/vector-27.svg",
        "label": "Vector 27"
      },
      {
        "id": "vector-28",
        "path": "/illustrations/hand-drawn/vector-28.svg",
        "label": "Vector 28"
      },
      {
        "id": "vector-29",
        "path": "/illustrations/hand-drawn/vector-29.svg",
        "label": "Vector 29"
      },
      {
        "id": "vector-3",
        "path": "/illustrations/hand-drawn/vector-3.svg",
        "label": "Vector 3"
      },
      {
        "id": "vector-30",
        "path": "/illustrations/hand-drawn/vector-30.svg",
        "label": "Vector 30"
      },
      {
        "id": "vector-31",
        "path": "/illustrations/hand-drawn/vector-31.svg",
        "label": "Vector 31"
      },
      {
        "id": "vector-32",
        "path": "/illustrations/hand-drawn/vector-32.svg",
        "label": "Vector 32"
      },
      {
        "id": "vector-33",
        "path": "/illustrations/hand-drawn/vector-33.svg",
        "label": "Vector 33"
      },
      {
        "id": "vector-34",
        "path": "/illustrations/hand-drawn/vector-34.svg",
        "label": "Vector 34"
      },
      {
        "id": "vector-35",
        "path": "/illustrations/hand-drawn/vector-35.svg",
        "label": "Vector 35"
      },
      {
        "id": "vector-36",
        "path": "/illustrations/hand-drawn/vector-36.svg",
        "label": "Vector 36"
      },
      {
        "id": "vector-37",
        "path": "/illustrations/hand-drawn/vector-37.svg",
        "label": "Vector 37"
      },
      {
        "id": "vector-38",
        "path": "/illustrations/hand-drawn/vector-38.svg",
        "label": "Vector 38"
      },
      {
        "id": "vector-39",
        "path": "/illustrations/hand-drawn/vector-39.svg",
        "label": "Vector 39"
      },
      {
        "id": "vector-4",
        "path": "/illustrations/hand-drawn/vector-4.svg",
        "label": "Vector 4"
      },
      {
        "id": "vector-40",
        "path": "/illustrations/hand-drawn/vector-40.svg",
        "label": "Vector 40"
      },
      {
        "id": "vector-41",
        "path": "/illustrations/hand-drawn/vector-41.svg",
        "label": "Vector 41"
      },
      {
        "id": "vector-42",
        "path": "/illustrations/hand-drawn/vector-42.svg",
        "label": "Vector 42"
      },
      {
        "id": "vector-43",
        "path": "/illustrations/hand-drawn/vector-43.svg",
        "label": "Vector 43"
      },
      {
        "id": "vector-44",
        "path": "/illustrations/hand-drawn/vector-44.svg",
        "label": "Vector 44"
      },
      {
        "id": "vector-45",
        "path": "/illustrations/hand-drawn/vector-45.svg",
        "label": "Vector 45"
      },
      {
        "id": "vector-46",
        "path": "/illustrations/hand-drawn/vector-46.svg",
        "label": "Vector 46"
      },
      {
        "id": "vector-47",
        "path": "/illustrations/hand-drawn/vector-47.svg",
        "label": "Vector 47"
      },
      {
        "id": "vector-48",
        "path": "/illustrations/hand-drawn/vector-48.svg",
        "label": "Vector 48"
      },
      {
        "id": "vector-49",
        "path": "/illustrations/hand-drawn/vector-49.svg",
        "label": "Vector 49"
      },
      {
        "id": "vector-5",
        "path": "/illustrations/hand-drawn/vector-5.svg",
        "label": "Vector 5"
      },
      {
        "id": "vector-50",
        "path": "/illustrations/hand-drawn/vector-50.svg",
        "label": "Vector 50"
      },
      {
        "id": "vector-51",
        "path": "/illustrations/hand-drawn/vector-51.svg",
        "label": "Vector 51"
      },
      {
        "id": "vector-52",
        "path": "/illustrations/hand-drawn/vector-52.svg",
        "label": "Vector 52"
      },
      {
        "id": "vector-53",
        "path": "/illustrations/hand-drawn/vector-53.svg",
        "label": "Vector 53"
      },
      {
        "id": "vector-54",
        "path": "/illustrations/hand-drawn/vector-54.svg",
        "label": "Vector 54"
      },
      {
        "id": "vector-55",
        "path": "/illustrations/hand-drawn/vector-55.svg",
        "label": "Vector 55"
      },
      {
        "id": "vector-56",
        "path": "/illustrations/hand-drawn/vector-56.svg",
        "label": "Vector 56"
      },
      {
        "id": "vector-57",
        "path": "/illustrations/hand-drawn/vector-57.svg",
        "label": "Vector 57"
      },
      {
        "id": "vector-58",
        "path": "/illustrations/hand-drawn/vector-58.svg",
        "label": "Vector 58"
      },
      {
        "id": "vector-59",
        "path": "/illustrations/hand-drawn/vector-59.svg",
        "label": "Vector 59"
      },
      {
        "id": "vector-6",
        "path": "/illustrations/hand-drawn/vector-6.svg",
        "label": "Vector 6"
      },
      {
        "id": "vector-60",
        "path": "/illustrations/hand-drawn/vector-60.svg",
        "label": "Vector 60"
      },
      {
        "id": "vector-61",
        "path": "/illustrations/hand-drawn/vector-61.svg",
        "label": "Vector 61"
      },
      {
        "id": "vector-62",
        "path": "/illustrations/hand-drawn/vector-62.svg",
        "label": "Vector 62"
      },
      {
        "id": "vector-63",
        "path": "/illustrations/hand-drawn/vector-63.svg",
        "label": "Vector 63"
      },
      {
        "id": "vector-64",
        "path": "/illustrations/hand-drawn/vector-64.svg",
        "label": "Vector 64"
      },
      {
        "id": "vector-65",
        "path": "/illustrations/hand-drawn/vector-65.svg",
        "label": "Vector 65"
      },
      {
        "id": "vector-66",
        "path": "/illustrations/hand-drawn/vector-66.svg",
        "label": "Vector 66"
      },
      {
        "id": "vector-67",
        "path": "/illustrations/hand-drawn/vector-67.svg",
        "label": "Vector 67"
      },
      {
        "id": "vector-68",
        "path": "/illustrations/hand-drawn/vector-68.svg",
        "label": "Vector 68"
      },
      {
        "id": "vector-69",
        "path": "/illustrations/hand-drawn/vector-69.svg",
        "label": "Vector 69"
      },
      {
        "id": "vector-7",
        "path": "/illustrations/hand-drawn/vector-7.svg",
        "label": "Vector 7"
      },
      {
        "id": "vector-70",
        "path": "/illustrations/hand-drawn/vector-70.svg",
        "label": "Vector 70"
      },
      {
        "id": "vector-71",
        "path": "/illustrations/hand-drawn/vector-71.svg",
        "label": "Vector 71"
      },
      {
        "id": "vector-72",
        "path": "/illustrations/hand-drawn/vector-72.svg",
        "label": "Vector 72"
      },
      {
        "id": "vector-73",
        "path": "/illustrations/hand-drawn/vector-73.svg",
        "label": "Vector 73"
      },
      {
        "id": "vector-74",
        "path": "/illustrations/hand-drawn/vector-74.svg",
        "label": "Vector 74"
      },
      {
        "id": "vector-75",
        "path": "/illustrations/hand-drawn/vector-75.svg",
        "label": "Vector 75"
      },
      {
        "id": "vector-76",
        "path": "/illustrations/hand-drawn/vector-76.svg",
        "label": "Vector 76"
      },
      {
        "id": "vector-77",
        "path": "/illustrations/hand-drawn/vector-77.svg",
        "label": "Vector 77"
      },
      {
        "id": "vector-78",
        "path": "/illustrations/hand-drawn/vector-78.svg",
        "label": "Vector 78"
      },
      {
        "id": "vector-79",
        "path": "/illustrations/hand-drawn/vector-79.svg",
        "label": "Vector 79"
      },
      {
        "id": "vector-8",
        "path": "/illustrations/hand-drawn/vector-8.svg",
        "label": "Vector 8"
      },
      {
        "id": "vector-80",
        "path": "/illustrations/hand-drawn/vector-80.svg",
        "label": "Vector 80"
      },
      {
        "id": "vector-81",
        "path": "/illustrations/hand-drawn/vector-81.svg",
        "label": "Vector 81"
      },
      {
        "id": "vector-82",
        "path": "/illustrations/hand-drawn/vector-82.svg",
        "label": "Vector 82"
      },
      {
        "id": "vector-83",
        "path": "/illustrations/hand-drawn/vector-83.svg",
        "label": "Vector 83"
      },
      {
        "id": "vector-84",
        "path": "/illustrations/hand-drawn/vector-84.svg",
        "label": "Vector 84"
      },
      {
        "id": "vector-85",
        "path": "/illustrations/hand-drawn/vector-85.svg",
        "label": "Vector 85"
      },
      {
        "id": "vector-86",
        "path": "/illustrations/hand-drawn/vector-86.svg",
        "label": "Vector 86"
      },
      {
        "id": "vector-87",
        "path": "/illustrations/hand-drawn/vector-87.svg",
        "label": "Vector 87"
      },
      {
        "id": "vector-88",
        "path": "/illustrations/hand-drawn/vector-88.svg",
        "label": "Vector 88"
      },
      {
        "id": "vector-89",
        "path": "/illustrations/hand-drawn/vector-89.svg",
        "label": "Vector 89"
      },
      {
        "id": "vector-9",
        "path": "/illustrations/hand-drawn/vector-9.svg",
        "label": "Vector 9"
      },
      {
        "id": "vector-90",
        "path": "/illustrations/hand-drawn/vector-90.svg",
        "label": "Vector 90"
      },
      {
        "id": "vector-91",
        "path": "/illustrations/hand-drawn/vector-91.svg",
        "label": "Vector 91"
      },
      {
        "id": "vector-92",
        "path": "/illustrations/hand-drawn/vector-92.svg",
        "label": "Vector 92"
      },
      {
        "id": "vector-93",
        "path": "/illustrations/hand-drawn/vector-93.svg",
        "label": "Vector 93"
      },
      {
        "id": "vector-94",
        "path": "/illustrations/hand-drawn/vector-94.svg",
        "label": "Vector 94"
      },
      {
        "id": "vector-95",
        "path": "/illustrations/hand-drawn/vector-95.svg",
        "label": "Vector 95"
      },
      {
        "id": "vector-96",
        "path": "/illustrations/hand-drawn/vector-96.svg",
        "label": "Vector 96"
      },
      {
        "id": "vector-97",
        "path": "/illustrations/hand-drawn/vector-97.svg",
        "label": "Vector 97"
      },
      {
        "id": "vector-98",
        "path": "/illustrations/hand-drawn/vector-98.svg",
        "label": "Vector 98"
      },
      {
        "id": "vector-99",
        "path": "/illustrations/hand-drawn/vector-99.svg",
        "label": "Vector 99"
      },
      {
        "id": "vector",
        "path": "/illustrations/hand-drawn/vector.svg",
        "label": "Vector"
      }
    ]
  }
] as const

export function getIllustrationSet(id: IllustrationSetId): IllustrationSet | undefined {
  return ILLUSTRATION_SETS.find((set) => set.id === id)
}
