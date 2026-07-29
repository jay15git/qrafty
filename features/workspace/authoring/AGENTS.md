# Authoring QR card templates

A template is a small data declaration. You do not position layers.

```ts
import { defineTemplate } from "@/features/workspace/authoring/define-template"

export const buildParisTicket = defineTemplate({
  archetype: "ticket",
  data: "https://example.com/trip",
  palette: "mint",
  ratio: "ratio-4-5",
  slots: {
    action: "Reserve",
    caption: "Scan to book",
    meta: "5D 6N",
    title: "Trip to Paris",
  },
})
```

Register it in `AUTHORED_TEMPLATE_BUILDERS` (`features/studio-hub/model/authored-templates.ts`), add its id to `STRICT_TEMPLATE_IDS` (`features/studio-hub/model/template-validation-baseline.ts`), then run `pnpm test` and `pnpm render:templates`.

## Archetypes

| archetype | composition | slots |
| --- | --- | --- |
| `ticket` | surface panel, QR hero, centered caption/title/meta, full-width action pill | all four |
| `label` | no panel, QR hero on bare background, hairline rule, left-aligned block | caption, title, meta |
| `seal` | one catalogue silhouette, QR knocked out inside, caption below | caption |

## Hard rules

- **Never write a `DraftingCanvasLayer` object literal.** Compose `parts.ts` functions, which use the layer factories and keep `cornerRadius`↔`cornerRadii`, `shadow`↔`shadows[]`, `blur`↔`layerFilters[]` in sync. Raw literals desync silently and your styling vanishes.
- **Never write a colour, font size, spacing value, or radius.** Import from `tokens.ts`. Palettes are contrast-checked in `tokens.test.ts`.
- **Never compute `-width / 2`.** `frame.ts` owns center-origin math. Use `createFrame`, `rows`, `columns`, `center`, `inset`, `subFrame`.
- **The QR is the subject.** It must occupy at least 40% of the shorter canvas side. `validateTemplateDocument` errors below 14% and warns below 28%.
- **One silhouette per card, doing one job** — hold the QR, mask the art, or be the card outline. Never decoration scattered around a rectangle.
- **A green test is not a finished card.** Run `pnpm render:templates` and look at `.render/templates/index.html` before you claim it works.

## Adding an archetype

Add the id to `TemplateArchetype`, write a `layoutX(context): ArchetypeLayout` function returning `{ layers, qr, qrInk? }`, add its `case` to `buildArchetype`, and throw a descriptive error for slots it cannot render — never drop a slot silently. Add a test asserting `validateTemplateDocument` returns `[]` and that the QR/shorter-side ratio is at least `0.4`.
