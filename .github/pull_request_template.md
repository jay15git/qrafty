## What

<!-- One paragraph: what changed and why. Link issues with "Closes #N". -->

## How

<!-- Non-obvious implementation notes only. Skip what the diff already shows. -->

## Verification

- [ ] `pnpm typecheck` — clean
- [ ] `pnpm lint` — clean
- [ ] `pnpm format:check` — clean
- [ ] `pnpm test` — green
- [ ] `pnpm check` (knip + fallow) — no new dead code
- [ ] `pnpm doctor` — react-doctor clean
- [ ] UI change exercised in a browser (or noted why not)
