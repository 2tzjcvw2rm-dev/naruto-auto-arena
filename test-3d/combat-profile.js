// Profile-only GLBs have a repaired skeleton and a posed rest frame.
// Keep effect coordinates in the normalized fighter's parent space.
const CombatProfile = (() => {
  const techniques = {itachi: katon};
  function modelKey(id, urls) {
    if (!techniques[id]) return id;
    const key = id + '-combat';
    urls[key] = urls[id].replace(/\.glb(?:\?.*)?$/, '-combat.glb');
    return key;
  }
  function particles(count, color, size) {
    const geometry = new THREE.BufferGeometry();
    const position = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
    geometry.setAttribute('position', position);
    const material = new THREE.PointsMaterial({color, size, transparent:true, opacity:.8,
      blending:THREE.AdditiveBlending, depthWrite:false});
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    return {points, position};
  }
  function halo(color, size) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d'), gradient = ctx.createRadialGradient(32,32,0,32,32,32);
    gradient.addColorStop(0, color); gradient.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0,0,64,64);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),
      transparent:true, blending:THREE.AdditiveBlending, depthWrite:false}));
    sprite.scale.setScalar(size);
    return sprite;
  }
  function katon(root) {
    const glow = halo('rgba(255,98,20,.8)', .10);
    root.add(glow);
    const embers = particles(12, 0xff963b, .007);
    root.add(embers.points);
    return t => {
      glow.material.opacity = .68 + .14*Math.sin(4*t);
      for (let i=0;i<12;i++) {
        const phase = (t*.68+i*.618)%1;
        embers.position.setXYZ(i,.027*Math.sin(i*7+phase*4)*phase,
          phase*.085,.020*Math.cos(i+phase*3));
      }
      embers.position.needsUpdate = true;
    };
  }
  function mount(id, fighter) {
    if (!techniques[id]) return null;
    const parent = fighter.parent, root = new THREE.Group();
    parent.add(root);
    const right = fighter.getObjectByName('RightHand'), left = fighter.getObjectByName('LeftHand');
    const spine = fighter.getObjectByName('Spine1') || fighter.getObjectByName('Spine');
    const rest = spine?.quaternion.clone();
    const breath = new THREE.Quaternion(), axis = new THREE.Vector3(1,0,0);
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    const emberOffset = new THREE.Vector3(.01,.048,.025);
    const update = techniques[id](root);
    function frame(dt, ms) {
      const t = ms*.001;
      if (spine) spine.quaternion.copy(rest).multiply(breath.setFromAxisAngle(axis,.014*Math.sin(t*1.8)));
      if (right && left) {
        parent.worldToLocal(right.getWorldPosition(a)); parent.worldToLocal(left.getWorldPosition(b));
      }
      if (id === 'itachi') root.position.copy(a).add(emberOffset);
      update(t,a,b);
    }
    frame(0,0);
    frame.dispose = () => {
      root.traverse(o => {o.geometry?.dispose(); if(o.material){o.material.map?.dispose();o.material.dispose();}});
      parent.remove(root);
    };
    return frame;
  }
  return {modelKey,mount,has:id => Boolean(techniques[id])};
})();
