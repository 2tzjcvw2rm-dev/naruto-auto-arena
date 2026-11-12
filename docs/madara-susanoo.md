# Madara abilities — 12 November 2026

The existing 15-bone Madara combat GLB and both game entrypoints are retained.
All new chakra geometry is authored procedurally in this repository; no downloaded
models, textures or new third-party asset licenses are required.

## Ability sequence

| Action | Duration | Impact | Behaviour |
| --- | --- | --- | --- |
| Gunbai / tornado | 3600 ms | 1008, 1332, 1692, 2700 ms | Three ordinary hits, run to midfield, two-handed fan swing, nine volumetric helical wind streams and orbiting debris sweep all living opponents, return home. |
| Skeletal Susanoo | 3400 ms | 2312 ms | One enclosing skeleton with twelve curved ribs, nine vertebrae, horned skull, eye sockets, jaw, teeth and two articulated sword arms. Replaces the three clones; retains 70% of the second-action damage per living opponent. |
| Perfect Susanoo | 4200 ms | 3318 ms | Skeleton builds first; overlapping cuirass, shoulder lamellae, tassets, greaves, wing blades and a tengu kabuto form around it. Torso winds up and both swords slash, releasing a travelling intersecting wave. |

The ultimate's existing total damage budget (3.1 × base attack before buffs and
critical modifiers) is distributed across the captured living enemy team, with
integer rounding. It is no longer applied immediately to one target. Both the
3D effect and the no-WebGL fallback deliver the callback at the impact time.

The shared battle clock controls animation, pause and ×1/×2/×3. Each effect owns
its impact guard and resources. Disposal clears the callback; Gunbai also
restores the actor's home position and yaw. The action queue remains blocked
until the effect completes. The camera, other characters, equipment, formation
and save format are unchanged.

## Verification

- `tests/madara-combat.cjs`: actual GLB skin deformation, both entrypoints,
  three speeds, timed damage for all three actions, ultimate cancellation,
  finite transforms, return and effect cleanup.
- `tests/susanoo.cjs`: 100 perfect-Susanoo mounts and exact GPU resource disposal.
- `tests/madara-profile.cjs`: 20 profile mounts, finite transforms and cleanup.
- `tests/madara-mobile.cjs`: mobile WebKit, real game and ten models,
  nine casts, five affected opponents, screenshots at technique windup,
  profile loading and no JavaScript errors.
- Existing formation, clock, third-turn ultimate, cinematics and Naruto,
  Sasuke, Itachi and Kakashi regression tests are retained.

GitHub Actions runs Linux and macOS WebKit separately. A successful Linux run
does not establish physical iPhone frame rate or replace the macOS result.
