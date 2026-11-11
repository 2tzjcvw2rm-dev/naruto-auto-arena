# Itachi combat, 2026-11-11

Both game entrypoints use the existing GLB and shared battle scene.

- Idle: combat profile emitter disabled only for Itachi in battle; spine breathing remains.
- Own turns repeat Katon, Karasu Bunshin, Susanoo–Amaterasu using existing rage and speed rules.
- Katon and crows last 1400 game milliseconds, impact at 868 ms.
- Red skeletal Susanoo lasts 2300 game milliseconds, Amaterasu impacts at 1817 ms.
- Damage uses existing attack, critical, equipment and buff calculation. Ultimate hits all living opponents.
- Itachi impact callbacks run on the visual battle clock. Reset/death invalidate queued damage. Scene rebinding disposes effects.
- Ribs, spine, skull, arms, moving wings, feathers and flames use procedural geometry with bounded lifetimes.
- Existing models, arena camera, layout, background and saved progression are retained.

Validation: CPU tests exercise both combat entrypoints, 5v5 targets, two complete cycles at each speed, hit-time damage, early victory, source death/reset, geometry and disposal. Existing formation and skeleton tests pass. WebKit CI includes two Itachi cycles at each speed and technique screenshots.

Limit: the Work cloud browser cannot create a WebGL context. No claim of visual approval or physical iPhone Safari testing is made. WebKit CI status must be checked separately; a queued job is not a pass. On iPhone verify idle, three visually distinct techniques, no lingering effects, HP at impact, speed changes, pause/resume and early battle end.
