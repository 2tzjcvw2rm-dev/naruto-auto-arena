# Side-view battle — staged in test-3d

The test page uses one perspective scene for both teams, instead of rendering each model into a separate screen rectangle. Original formation slots map to front/middle/back world positions. Actors face their opposing team, turn toward their selected target, approach for melee attacks, and return home. Health/rage labels and existing DOM technique effects project from world coordinates. The GLBs, profile rendering, stats, combat timing and saves are unchanged.

The scene adds a training courtyard, contact shadows and camera fitting for portrait/landscape aspect ratios. Existing combat effects are reused, including Pain's combat model and Shinra Tensei. Rendering is capped at 25 updates per second and device pixel ratio 1.5; pause/menu visibility suspends animation time.

Validation: `node tests/side-battle.cjs` parses all 14 original character assets (texture decoding omitted for this GPU-free test), checks idle body bounds and ground contact across 320, 390, 430, 650 and 844 pixel widths and all three formation presets, and exercises all three techniques for each of the ten default fighters with return-to-slot assertions. It also loads Madara, Obito, Gaara and Shikamaru. This does not validate rendered textures, skin deformation, shader appearance, overlap or actual Safari frame rate.

Publication status: promoted to the main game at the user's explicit request after the numeric tests passed. Root index.html now uses the same shared battlefield and projected technique positions; its existing profiles and save key remain intact.

Visual QA limitation remains: the available cloud browser cannot create a WebGL context; local Chrome launch is denied by the execution environment. Texture/shader appearance and actual iPhone Safari performance are not visually verified. The user requested promotion with this limitation disclosed.


## Konoha training overlook (2026-11-05)

The original gray courtyard has been replaced with a layered Leaf Village vista:
a warm sandstone training court and stone lookout, lanterns, cedar/leaf trees,
a rooftop skyline with the Hokage office, distant cliffs with sculpted faces,
a painterly morning sky, subtle drifting cloud forms, swaying treetops and
instanced falling leaves. Scenery is generated locally, with no additional
image downloads or network dependencies. Village roofs and leaves use GPU
instancing to keep draw calls manageable on mobile GPUs.

The scenery is isolated in `test-3d/battle-environment.js`, used by both
`index.html` and `test-3d/index.html`. The existing battle camera,
`fit()`, `formationPosition()`, fighter yaw and scale, character assets,
animations, save key and gameplay rules remain unchanged. The existing
battle scene only invokes `createKonohaOverlook(scene)` and updates its
ambient animations with the battle clock.

**QA:** `node tests/side-battle.cjs` checks 14 GLBs, all formation rows,
five viewport sizes, all three attacks and ten-fighter grounding, plus
the Konoha environment signature. GitHub Actions runs this regression
on changes and has a separate mobile WebKit smoke test
(`tests/konoha-mobile.cjs`) that loads the full test HTML at iPhone
viewport dimensions and captures a screenshot where browser rendering works.

Actual physical iPhone Safari testing remains separate from CI WebKit
emulation and must not be claimed as completed without a device test.
