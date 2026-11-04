# Sakura Haruno — profile artwork and future 3D pose reference

Approved: 2026-11-04. The illustrated background is stored at `test-3d/assets/sakura-blossom-profile.avif`. This image is the primary visual reference for Sakura's future high-quality 3D profile model. Original full-resolution image was generated in the corresponding ChatGPT conversation.

## Character stance to reproduce (do not lose this brief)
- Sakura stands in a confident ready-to-fight pose, facing mostly straight ahead, with head raised, gaze forward, shoulders level and slightly firm.
- Legs spread to about shoulder width, knees relaxed; both feet planted naturally on the stone pavement, one foot turned slightly outward. No excessive crouch.
- Both arms hang diagonally out and slightly forward from the torso. Elbows softly bent, forearms tense. Both hands tightly closed into combat-ready fists near hip height.
- Left and right arms are slightly asymmetric, not a stiff T-pose. Preserve clean shoulders, wrists, fingers and elbow joints. The silhouette should read as Sakura preparing for a strong punch.
- Dark gloves, red sleeveless upper garment, black leggings and shinobi sandals, hair pink with leaf forehead protector. Maintain recognizable face and hairstyle.
- Gentle continuous idle breathing and subtle weight shift, no buttons required. Retain one-finger rotation on the profile model.
- Use an actually rigged/skinned character mesh or authored animation; do not distort the mesh by crude per-vertex moves.
- Preserve the Konoha cherry blossom setting, Hokage Rock, vivid pink blossoms and drifting petals. Do not render the 2D Sakura underneath a 3D Sakura (double character).

## Interim presentation
Only Sakura's profile is showing the original art while a better 3D model is sourced and rigged. Her existing `test-3d/models/sakura.glb` remains unchanged and is still used in the 5v5 3D arena. No character stats, progression, gear or save state changes.

## Implementation
CSS selectors for `#hero3d[data-hero="sakura"]` in `index.html` and `test-3d/index.html`; a Sakura-only branch in `mountHero3D` displays the original picture. When upgrading her profile to the rigged 3D model, remove the interim special case but keep this pose reference and backdrop (replace the picture with an empty-stage edit, not a doubled Sakura).
