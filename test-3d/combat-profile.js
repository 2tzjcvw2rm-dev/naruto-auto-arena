// Profile-only GLBs have a repaired skeleton and a posed rest frame.
// Keep effect coordinates in the normalized fighter's parent space.
const CombatProfile = (() => {
  const techniques = {itachi: katon, kakashi: chidori, pain: shinra};
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
  function chidori(root) {
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.033,1),
      new THREE.MeshBasicMaterial({color:0xe6ffff}));
    root.add(core,halo('rgba(36,148,255,1)',.23));
    const count=15, steps=7;
    const geometry=new THREE.BufferGeometry();
    const data=new THREE.BufferAttribute(new Float32Array(count*steps*6),3);
    geometry.setAttribute('position',data);
    const bolts=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({
      color:0x74dbff,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));
    bolts.frustumCulled=false;
    root.add(bolts);
    const sparks=particles(18,0xbffbff,.007);
    root.add(sparks.points);
    const from=new THREE.Vector3(), to=new THREE.Vector3();
    return (t,left,right) => {
      root.position.copy(left).lerp(right,.5);
      root.position.z+=.034;
      root.position.y+=.035;
      core.scale.setScalar(1+.09*Math.sin(t*19));
      core.rotation.set(t*.9,t*1.8,0);
      for(let i=0;i<count;i++){
        const yaw=i*2.4+t*.8, elev=.85*Math.sin(i*1.75+t);
        from.set(0,0,0);
        for(let k=0;k<steps;k++){
          const r=(k+1)/steps*(.068+.021*Math.sin(i*3+t*7));
          const a=yaw+.15*Math.sin(i+k*9+t*26), e=elev+.18*Math.cos(k*7+i+t*18);
          to.set(r*Math.cos(a)*Math.cos(e),r*Math.sin(e),r*Math.sin(a)*Math.cos(e));
          const n=(i*steps+k)*2;
          data.setXYZ(n,from.x,from.y,from.z);data.setXYZ(n+1,to.x,to.y,to.z);
          from.copy(to);
        }
      }
      for(let i=0;i<18;i++){
        const r=.04+.057*((t*1.6+i*.413)%1);
        sparks.position.setXYZ(i,r*Math.sin(7*i+t),r*Math.cos(5*i),r*Math.cos(7*i+t));
      }
      sparks.position.needsUpdate=data.needsUpdate=true;
    };
  }
  function shinra(root, view) {
    const {renderer,scene,camera}=view;
    const target=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
    const viewport=new THREE.Vector2();
    let nextCapture=0;
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1,36,22),
      new THREE.ShaderMaterial({
        uniforms:{clock:{value:0},field:{value:target.texture},resolution:{value:viewport}},
        vertexShader:`uniform float clock;
          varying float rim; varying float height;
          void main() {
            height = position.y;
            float wave = sin(height*21.-clock*3.);
            vec4 eye = modelViewMatrix*vec4(position+normal*.012*wave,1.);
            rim = 1.-abs(dot(normalize(normalMatrix*normal),normalize(-eye.xyz)));
            gl_Position = projectionMatrix*eye;
          }`,
        fragmentShader:`uniform sampler2D field; uniform vec2 resolution; varying float rim; varying float height; uniform float clock;
          void main() {
            float band=pow(.5+.5*cos(height*21.-clock*3.),6.);
            vec2 uv=gl_FragCoord.xy/resolution;
            vec2 offset=.004*band*vec2(sin(height*12.+clock),cos(height*14.-clock));
            vec4 bent=texture2D(field,uv+offset);
            float edge=pow(rim,2.5)*(.09+.16*band);
            gl_FragColor=vec4(mix(vec3(.66,.78,1.),bent.rgb,bent.a),edge+bent.a*.14*band);
          }`,transparent:true,depthWrite:false}));
    shell.scale.set(.55,.58,.43); root.add(shell);
    const rings=[];
    for(let i=0;i<3;i++){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.009,5,64),
        new THREE.MeshBasicMaterial({color:0xbedbff,transparent:true,depthWrite:false}));
      ring.rotation.x=Math.PI*.47;root.add(ring);rings.push(ring);
    }
    const dust=particles(32,0xb7ccdf,.006); root.add(dust.points);
    const update=t=>{
      renderer.getDrawingBufferSize(viewport);
      if(t>=nextCapture && viewport.x && viewport.y){
        target.setSize(Math.max(1,Math.round(viewport.x/3)),Math.max(1,Math.round(viewport.y/3)));
        const previous=renderer.getRenderTarget();
        root.visible=false;
        try {renderer.setRenderTarget(target);renderer.render(scene,camera);}
        finally {renderer.setRenderTarget(previous);root.visible=true;}
        nextCapture=t+.10;
      }
      shell.material.uniforms.clock.value=t;
      rings.forEach((ring,i)=>{
        const phase=(t*.44+i/3)%1;
        ring.scale.setScalar(.14+.49*phase);
        ring.position.y=-.29+i*.23+phase*.07;
        ring.material.opacity=.28*Math.sin(Math.PI*phase);
      });
      for(let i=0;i<32;i++){
        const p=(t*.50+i*.618)%1, r=.18+.40*p, a=i*2.4;
        dust.position.setXYZ(i,r*Math.cos(a),.44*Math.sin(i*6.2)+p*.06,r*Math.sin(a));
      }
      dust.position.needsUpdate=true;
    };
    update.dispose=()=>target.dispose();
    return update;
  }
  function mount(id, fighter, view) {
    if (!techniques[id]) return null;
    const parent = fighter.parent, root = new THREE.Group();
    parent.add(root);
    const right = fighter.getObjectByName('RightHand'), left = fighter.getObjectByName('LeftHand');
    const spine = fighter.getObjectByName('Spine1') || fighter.getObjectByName('Spine');
    const rest = spine?.quaternion.clone();
    const breath = new THREE.Quaternion(), axis = new THREE.Vector3(1,0,0);
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    const emberOffset = new THREE.Vector3(.01,.048,.025);
    const update = techniques[id](root, view);
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
      update.dispose?.();
      parent.remove(root);
    };
    return frame;
  }
  return {modelKey,mount,has:id => Boolean(techniques[id])};
})();
