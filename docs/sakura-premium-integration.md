# Sakura — Shinobi Striker 3D upgrade (staging)

Status: **awaiting the licensed model files and deployment rights**. Do not merge this branch before a real rigged GLB can be loaded and its appearance checked in mobile Safari. Current live Sakura artwork and 5×5 gameplay remain unchanged.

## Selected source

CGTrader model ID **5820766**, "Sakura Haruno - Naruto to Boruto - Shinobi Striker", creator humayoonajmal-oz:
https://www.cgtrader.com/3d-models/character/fantasy-character/sakura-haruno-naruto-shippuden

Vendor lists DAE (Collada), PNG textures and "rigged". No source asset is checked into this repository; purchase/download is required before conversion. A seller listing or thumbnail is not a model file.

**License / distribution caution:** CGTrader's Royalty Free license restricts redistribution where third parties can independently retrieve model files. A raw GLB in a public GitHub repository or directly served from GitHub Pages is independently downloadable, so **do not upload the paid file to this public repository without explicit permission appropriate to that distribution**. Also clarify the rights to the Naruto character representation with the relevant rights holder if intended use requires it. Source: https://help.cgtrader.com/hc/en-us/articles/360015124437-Royalty-Free-License

## Approved profile appearance

- **Backdrop:** Konoha stone plaza and pink flowering cherry trees, village rooftops, Hokage Rock, flying petals, vivid blue sky. The new character-free background is produced in the corresponding ChatGPT conversation under `sakura-konoha-background-only.avif`. Must be placed in `test-3d/assets/sakura-konoha-background-only.avif` *when legally sourced Sakura is available*.
- **3D source target:** `test-3d/models/sakura-shinobi-striker.glb` (convert DAE + textures via Blender, preserving rig).
- **Pose:** already approved in `docs/sakura-pose-reference.md`; weight mostly neutral, legs shoulder width, fists clenched beside hips, elbows softly bent, head straight, natural idle breathing. Keep touch rotation.
- **Never render the illustrated Sakura behind a new 3D Sakura.** The complete illustrated artwork `sakura-blossom-profile.avif` is only an interim fallback.
- Use real rig bones, not geometric vertex melting. Inspect bone names in converted GLB and calibrate skeleton pose before merge. Required tests: front, side, back rotations and mobile Safari at rest.
- Preserve stats, equipped items, saved progress, and 5×5 auto-battle.

## Activation checklist

1. Obtain and verify legal rights for public browser delivery and the actual DAE/PNG rig files.
2. Convert to a single skinned GLB (animations retained; correct normalized root / axes), optimize mesh and textures for Safari.
3. Add the actual premium GLB and character-free background asset to a permitted delivery mechanism. If publicly hosted, its license must explicitly allow downloadable web assets.
4. Calibrate animation based on the imported skeleton joint names and pose reference.
5. Check both `index.html` and `test-3d/index.html`, ensure image fallback if WebGL/GLB fails.
6. Verify exact files and then publish; do not falsely mark 3D complete before this.

Current branch contains preparatory code only; no paid model file has been obtained or deployed.
