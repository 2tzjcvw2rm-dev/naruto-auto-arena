# Konan: spear, trap, ocean — 2026-11-13

Both entrypoints use the same `test-3d/konan-combat.js`. Original unrigged
`konan.glb` and the other characters are preserved. Whole-model anticipation
and ten supplemental wing sections replace invented bone animation.

| Skill | Duration | Single damage event | Targets |
|---|---:|---:|---|
| Paper spear | 1750 ms | 1250 ms | One, existing basic damage |
| Paper trap | 1900 ms | 1200 ms | One, existing secondary damage |
| Paper ocean | 3550 ms | 2630 ms | Living opponents, 55% of existing ultimate damage each |

The existing formula supplies equipment, attack, buffs and critical damage.
Times use the arena game clock, including pause and x1/x2/x3. Large skipped
frames still apply damage once. Death, Kamui, stale teams, removed targets and
cancellation are guarded. Renderer rebinding disposes the effect.

Spear: one folded solid BufferGeometry tip and shaft, assembling sheets,
longitudinal rotation, accelerating launch, seven large fracture pieces.
Trap: ten indexed curved ribbons with precomputed paths; draw ranges rise from
a paper circle into a closed egg. Compression, crease rings and segment tearing
never move the target's formation position.
Ocean: two opening floor slabs, a dark chasm plane, two 20-layer walls, sixteen
procedural ink seals, nine low-poly fire volumes with cores, an expanding light
ring and a brief title. The near wall is translucent to keep enemies visible.
The camera pulls back 13% without changing its side angle and receives a small,
time-limited zoom pulse at the final explosion. It returns to its default zoom.
The earlier explosions are visual only. No fullscreen white flash is used.

Geometry/materials are reused within a cast, tracked in Sets, and disposed once,
including the title texture. No geometry or materials are allocated per frame.

## Verification

`node tests/konan-combat.cjs` exercises both HTML handlers, damage timing and
amounts, x1/x2/x3 frame steps, skipped frames, cancellation, caster/target death,
empty targets, equipment/crit/buff calculation, finite transforms, both directions,
1–5 enemies, cleanup and pose reset. `tests/side-battle.cjs` additionally loads
original GLBs and checks the scene integration at five viewport sizes and three
formations, including all characters' effects and disposal. This is GPU-free.

The available browser reports `THREE.WebGLRenderer: Error creating WebGL
context`. The page loads its 2D fallback. **Real 3D appearance, effect composition,
iPhone Safari performance and screenshots of key phases remain unverified.**
Passing JavaScript/geometry tests is not a visual quality approval. Inspect all
three techniques on a WebGL-capable device before considering visual acceptance
complete.
