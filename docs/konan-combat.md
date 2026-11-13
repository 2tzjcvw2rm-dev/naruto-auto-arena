# Konan paper combat — 2026-11-13

Both HTML entrypoints load `test-3d/konan-combat.js` before the arena. The source `konan.glb` has no skin/bone rig. Its geometry, materials, proportions and sculpted wings are unchanged. Generic battle morph motion and generic pose are bypassed for Konan only; the new pose gently rotates the intact fighter and the existing arena ground solver plants the model. No camera, formation, equipment, progression or other character abilities are changed.

| Technique | Duration | First impact | Paper elements | Damage per victim |
|---|---:|---:|---:|---|
| Paper shuriken | 1450 ms | 770 ms | 5 folded four-point shuriken | Existing basic attack damage, once |
| Paper wings | 1750 ms | 1050 ms | 12–15 blades in three waves | 60% of existing secondary damage, once |
| Paper storm | 2150 ms | 1400 ms | 36 folded blades | 55% of existing ultimate damage, once |

All times are game time from the arena clock; pause and x1/x2/x3 share the existing battle clock. The storm is an open helix behind the wings, followed by individual directed paths to every live target, and short dissipating fragments. The same geometry and material are reused by meshes; no per-frame geometry, textures or lights are created. Five visual shuriken impacts and three visual wing waves never multiply damage. HP is applied at the first visible contact. Later contacts are visual only. Equipment, buffs and crits feed the existing damage formula before the Konan-only AoE multiplier.

The renderer owns effect lifetime; cast completion, death and rebinding dispose shared geometry/material once and cancel the callback. Logical damage additionally guards stale battles and removed/dead/Kamui targets. The 2D fallback schedules damage through BattleTempo and suppresses old generic Konan VFX; it does not pretend to render these 3D techniques.

## Verification

Run `node tests/konan-combat.cjs`. It checks both real HTML battle handlers, all three skills at x1/x2/x3, damage timing and amount, skipped-frame impact, death/cancel, finite transforms, both attack directions, 1–5 victims, ground clearance of paper centers, effect cleanup, and pose restoration. Existing Itachi, Naruto, Sasuke, Kakashi and Madara combat suites also passed.

Browser preview was attempted in the provided Chrome environment. It failed to create a WebGL context (`THREE.WebGLRenderer: Error creating WebGL context`) and showed the existing 2D fallback. Therefore **3D appearance, real Safari/iPhone performance, small-screen readability and impact screenshots are not visually verified**. Mathematical tests do not prove these visual qualities. No claim of visual perfection or measured mobile FPS is made.
