// Staging adapter for the *licensed* Sakura Shinobi Striker GLB.
// The model and clean background must both exist before this activates.
// Never commit a paid model to public GitHub Pages without appropriate rights.
(function () {
  'use strict';
  const THREE = window.THREE;
  const scriptURL = document.currentScript && document.currentScript.src;
  const modelURL = scriptURL ? new URL('models/sakura-shinobi-striker.glb', scriptURL).href : '';
  const backgroundURL = scriptURL ? new URL('assets/sakura-konoha-background-only.avif', scriptURL).href : '';
  let readiness;
  function isPresent(url) {
    if (!url) return Promise.resolve(false);
    return fetch(url, { method: 'HEAD', cache: 'no-store' })
      .then(response => response.ok && (response.headers.get('content-type') || '').indexOf('text/html') === -1)
      .catch(() => false);
  }
  function ready() {
    if (!readiness) readiness = Promise.all([isPresent(modelURL), isPresent(backgroundURL)])
      .then(results => results.every(Boolean));
    return readiness;
  }
  function makeIdlePose(fighter) {
    if (!THREE) return () => {};
    const skinned = [];
    const bones = [];
    fighter.traverse(node => {
      if (node.isSkinnedMesh) skinned.push(node);
      if (node.isBone) bones.push(node);
    });
    if (!skinned.length || !bones.length) {
      console.warn('Sakura premium GLB does not contain an articulated skeleton');
      return () => {};
    }
    // Bone naming varies between Collada exports; do not assume a particular
    // shoulder axis until the real purchased model has been inspected.
    const torso = bones.find(b => /upperchest|chest|spine2|spine_02/i.test(b.name))
      || bones.find(b => /spine/i.test(b.name));
    const torsoInitial = torso ? torso.quaternion.clone() : null;
    const oscillation = new THREE.Quaternion();
    const localX = new THREE.Vector3(1, 0, 0);
    const baseY = fighter.position.y;
    return (dt, millis) => {
      const t = millis * .001;
      const breath = Math.sin(t * 1.7);
      fighter.position.y = baseY + .0022 * breath;
      if (torso && torsoInitial) {
        oscillation.setFromAxisAngle(localX, .011 * breath);
        torso.quaternion.copy(torsoInitial).multiply(oscillation);
      }
    };
  }
  window.SakuraPremium = Object.freeze({
    modelURL,
    backgroundURL,
    ready,
    makeIdlePose
  });
})();
