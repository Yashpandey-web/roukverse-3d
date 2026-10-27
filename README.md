# ROUKVERSE — Beyond the Blocks

Immersive 3D home of **ROUKMARCO Y** (Minecraft PE YouTube channel).

- YouTube: https://youtube.com/@roukmarcoy_07
- GitHub: https://github.com/Yashpandey-web

Original voxel-inspired art only. No Minecraft logos, proprietary assets,
subscriber counts, view counts, or video titles are claimed or copied.

## Features

- **Landing:** real-time Three.js floating voxel island, emerald portals,
  distant islands, particles, drifting cubes, fog and volumetric-style lighting.
  Buttons: ENTER THE UNIVERSE and WATCH ON YOUTUBE.
- **Universe hub:** Parkour Realm, Video Vault, Creator Zone, Secret Dimension,
  YouTube Portal, plus an always-available accessible menu.
- **Parkour Realm:** genuinely playable 3D parkour — WASD/arrows, Space to jump,
  platform collision, checkpoints, fall respawn, timer, finish portal,
  restart, and mobile touch controls.
- **Video Vault:** categories Parkour / Challenges / Survival / Shorts,
  official YouTube embeds, and a prominent SUBSCRIBE link.
  No fake titles or stats: until a real video ID is added, cards are clearly
  labelled as sample layout cards.
- **Secret Dimension:** click the small emerald artifact in the 3D world to
  trigger a particle burst, unlock the chamber, and save the achievement in
  localStorage. A reset option is provided.
- **Performance / accessibility:** low-graphics toggle, reduced-motion support,
  2D fallback if WebGL is unavailable, no autoplay audio, responsive layout.

## Add a real video

Edit `src/data/videos.ts` and add a real YouTube video ID, e.g.:

```ts
{ id: "YOUR_VIDEO_ID", category: "Parkour", sample: false, note: "Verified channel video" }
```

## Develop

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Deploy

Static output is in `dist/` after `npm run build`.

- **Vercel / Netlify:** deploy the `dist/` folder (or connect the repo and
  set build command `npm run build`, output `dist/`).
- **GitHub Pages:** build with `VITE_BASE=/roukverse-3d/ npm run build`
  and deploy `dist/` to the `gh-pages` branch or via Pages settings.

## Tests

See `TESTS.md` for the actual test log from the build that produced this
version. Parkour collision logic lives in `src/game/physics.ts` and is kept
pure (no DOM / Three.js) so it can be reviewed and tested independently.
