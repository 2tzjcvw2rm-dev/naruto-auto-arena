# Madara: skeletal Susanoo — 2026-11-05

## Scope
Automatic Madara ultimate (rage >= 100, action 2) now starts a world-space 3D skeleton, not the former emoji projectile. Six pairs of tube ribs, spine, shoulders, articulated arms/fist, chakra motes, energy arcs and a travelling impact wave form and dissolve over 2.3 seconds of active animation time. The caster remains anchored; victim recoil coincides with wave arrival. Pausing stops effect time; rebinding/death disposes active effects.

Camera, 5v5 formation, actor scale, waterfall backdrop, existing GLBs, archived roster, saved progression and damage calculation are unchanged.

Madara's supplied GLB has no skeleton. This release preserves its geometry and uses a restrained whole-body brace; it does not claim newly rigged fingers or arms. The spectral arms animate independently. The other 29 techniques remain pending.

## Verification
- Source tested: https://github.com/2tzjcvw2rm-dev/naruto-auto-arena/commit/9bf57d67f55dfa3bf60152476d83a859a5caf561
- macOS 15 / WebKit 26 and Linux WebKit, 390 x 844 touch viewport: https://github.com/2tzjcvw2rm-dev/naruto-auto-arena/actions/runs/42023651886 — both passed.
- Actual production index.html, ten loaded GLBs, automatic rage selection, formation and strike screenshots, nine casts, geometry counts, return home and cleanup on rebind checked.
- Phase screenshots use controlled browser time so a slow CI GPU cannot skip the capture interval.
- Formation/grounding regression and 100-cast resource disposal test: https://github.com/2tzjcvw2rm-dev/naruto-auto-arena/actions/runs/42023328222 — passed.
- No physical iPhone was available; emulated WebKit checks do not establish physical-device frame rate.

## Publication
This document belongs to the single main-branch Susanoo release commit. The corresponding GitHub Pages deployment must finish successfully before work proceeds to another technique.
