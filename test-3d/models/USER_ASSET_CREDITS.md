# User-supplied 3D character models

The following four `.glb` assets are bundled directly with Naruto Auto Arena under `test-3d/models/` and are loaded locally through Three.js in the character profile and 5v5 arena. They are not embedded through Sketchfab.

| Game asset | Model and source | Attribution / licence |
| --- | --- | --- |
| `kakashi.glb` | Kakashi Free Fire — rocklee.ff123 — https://sketchfab.com/3d-models/kakashi-free-fire-893873a3c6a547d3bb15ee59ffaa3228 | Source metadata: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `pain.glb` | Free Fire Pain 3D Model — Toxic 3D — https://sketchfab.com/3d-models/free-fire-pain-3d-model-d771a7f58b7d47efbc11eeb1bcbacc25 | Source metadata: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `itachi.glb` | Itachi Free Fire Original Rig — rocklee.ff — https://sketchfab.com/3d-models/itachi-free-fire-original-rig-5ec9c62965e34b038c3b3fba009117e3 | Source metadata: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `hinata.glb` | Hinata Free Fire Skin — rocklee.ff — https://sketchfab.com/3d-models/hinata-free-fire-skin-b1ade2b8fd664add9ca573802bb8de8a | Source metadata: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

The original user-provided files were renamed to their respective in-game IDs. `itachi.glb` is additionally a *static bind-pose conversion* of the exact uploaded Itachi file (`SHA-256 be739577735f2b54377ce9cbcc81e325e7aac8b86194966105100354129d3942`): the unused skin rig / joint-weight references were removed for more reliable iPhone WebGL rendering, while geometry positions, UVs, color textures, materials, pose and original author attribution were preserved. No visible geometry/textures were intentionally modified. Runtime transforms recenter and scale each model to fit the UI. The models are provided by their respective artists; the attribution and Creative Commons status above are based on the embedded GLB source metadata. Additional Naruto / Free Fire intellectual-property rights may apply and should be checked before commercial publication.

## Kakashi and Hinata mobile-viewer correction (November 4, 2026)

`kakashi.glb` and `hinata.glb` are static display/battle copies of the exact user-supplied Sketchfab GLBs. Their original model geometry, UVs, normals, indices, materials and embedded PNG textures remain byte-for-byte unchanged in the GLB binary chunks. The exports contained skin bindings with large incompatible bone transforms plus an inverted mesh orientation. Their unused skin references were removed, and a parent scene node adds an X-axis 180° rotation for upright full-body display on iPhone Safari. Original rest poses are preserved; the game applies only whole-body idle/battle movement, not skeletal deformation.

Original SHA-256: Kakashi `0942fafd01d7a784324dee7d684910237e1b231cfe54458435d849981ab6e639`, Hinata `1464c67e049d85353646ee80591d74199363c9a3b136216afad16e0259d756e1`. Both originals remain available in the user's conversation uploads. Itachi, Pain, Naruto and Sasuke models were not changed by this correction.

## Konan / Конан (4 November 2026)

- Game file: `konan.glb` (replaces only the previous Konan asset; other fighters remain unchanged).
- Original model: **Konan_pre-_akatsuki**, by **renjurenji679** — https://sketchfab.com/3d-models/konan-pre--akatsuki-39d1b5f5333f4b70abfe1fe832006c34
- Embedded source licence: [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution must be retained.
- Source: user-provided `konan_pre-_akatsuki.glb`, copied byte-for-byte to `konan.glb`; the GLB contains its original textures and geometry, without skeletal animation tracks.
- The game's loader scales only its dedicated `Object_16` paper-wing mesh to 68% in X, so Konan stays readable in the existing iPhone profile and 5v5 scenes. The GLB file itself is not altered.
- Naruto anime and character intellectual-property rights are separate from the model author's CC licence.

## Madara Uchiha (November 4, 2026)

`madara.glb` is the user-supplied `freefire_new_3d_character_madara_uchiha..glb` (612,724 bytes). Source model title: **FreeFire New 3D Character Madara Uchiha.** Embedded metadata credits **AJ Studio** and names the source [Sketchfab model](https://sketchfab.com/3d-models/freefire-new-3d-character-madara-uchiha-83e56a5dd37a4902b5887625a2e3905d), with **CC BY 4.0**. The original GLB has four textured meshes and no embedded animation tracks. The game generates a subtle whole-character idle motion and uses ordinary combat motions without editing the mesh. Keep artist attribution visible wherever the model is distributed. Copyright/trademark rights in Naruto characters may require separate permission for commercial use.

## Obito Uchiha / Обито Учиха (4 November 2026)

- Game asset: `obito.glb` (new playable fighter; other characters are untouched).
- Source: user-supplied `obito_uchiha_full_rigged.glb`, bundled **byte-for-byte** at `test-3d/models/obito.glb`.
- Original model: **Obito Uchiha full rigged**, by **Mwilix Alberto** — https://sketchfab.com/3d-models/obito-uchiha-full-rigged-5ab22bc6374e4e0181f34d8104342cd9
- License in embedded glTF metadata: **CC BY 4.0** — https://creativecommons.org/licenses/by/4.0/
- SHA-256 of original GLB: `fe29095ce36c66c362055af53b36ea90c7d4f6fb7f554b19ff61cab7cde814ea` (854,936 bytes).
- The exported GLB includes three meshes and embedded PNG textures, but **no skins or animation clips** despite the title. The game applies a subtle whole-character idle motion, while keeping geometry and textures intact.
- The 3D model is loaded by the existing GLTFLoader in both main and `test-3d` game builds, including the 5v5 auto-battle. All character progress and inventory remain unchanged.
- Naruto characters and trademarks remain the rights of their respective owners; the model author's Creative Commons license does not grant rights to the underlying franchise.
