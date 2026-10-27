# ROUKVERSE — Test log (27 Oct 2026, build that ships in this repo)

## Passed

- **Dependencies:** `npm install` — 76 packages added, no errors.
- **TypeScript + production build:** `npm run build` (tsc -b && vite build)
  passed after fixing one real error (vite.config.ts used `process` without
  Node types; the config was simplified to a static base instead).
  Output: `dist/index.html`, `dist/assets/index-*.js` (636.86 kB, 171.70 kB gzip),
  `dist/assets/index-*.css` (3.98 kB).
  Note: the >500 kB chunk warning is Three.js itself; no code-split was forced
  for this first version.
- **Dev server:** `npm run dev` on port 5173 returned HTTP 200 with title
  `ROUKVERSE — Beyond the Blocks | ROUKMARCO Y`.
- **Parkour physics (pure unit test, Node, no browser):**
  `node --experimental-strip-types /tmp/roukverse-physics-test.ts`
  — PASSED: player lands on a platform, off-platform player does not ground,
  fall detection below y=-12, horizontal movement.
- **Code checks (grep, 27 Oct 2026):**
  - All 6 views present: landing, hub, parkour, videos, creator, secret.
  - 5 mobile touch handlers in App.tsx (forward / left / right / back / jump).
  - Low-graphics, reduced-motion and 2D WebGL fallback code present (11 matches).
  - Secret discovery uses localStorage key `roukverse-secret-found` with a reset.
  - Channel URL `youtube.com/@roukmarcoy_07` present in App.tsx and in the built bundle.
  - Parkour file contains checkpoint, jump and respawn logic.

## Not yet verified in a real browser

- Interactive WebGL rendering, portal clicks, and a full end-to-end parkour
  run (jump across all 8 platforms to the finish portal) were **not** verified
  in a headed browser in this environment. The physics that drives those
  interactions is unit-tested above, and the build/dev server pass, but the
  first live deployment should be smoke-tested by opening the site, clicking
  ENTER THE UNIVERSE, and playing the parkour level once.
- No real YouTube video data was fetched: no API key was used and no titles,
  subscriber counts, or view counts are claimed. Add real video IDs in
  `src/data/videos.ts` to turn the sample cards into real embeds.

## How to re-run

```bash
npm install
npm run build
npm run preview
# then open http://localhost:4173/
```
