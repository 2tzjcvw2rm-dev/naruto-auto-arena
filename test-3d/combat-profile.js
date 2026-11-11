// Profile-only GLBs have a repaired skeleton and a posed rest frame.
// Keep effect coordinates in the normalized fighter's parent space.
const CombatProfile = (() => {
  const techniques = {itachi: katon, kakashi: chidori, pain: shinra, hinata: lions};
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
  // Surface turbulence is evaluated in object space, so the hot seams travel
  // around the volume even when the camera is looking straight down the jet.
  function flameVolume(cold, warm, hot) {
    const material = new THREE.ShaderMaterial({
      uniforms:{clock:{value:0},alpha:{value:1},cold:{value:new THREE.Color(cold)},
        warm:{value:new THREE.Color(warm)},hot:{value:new THREE.Color(hot)}},
      transparent:true,depthWrite:false,
      vertexShader:`
        uniform float clock; varying vec3 coord; varying float facing;
        void main(){
          coord=position;
          float fold=sin(position.y*9.+clock*5.+cos(position.x*6.))*
                     cos(position.z*7.-clock*3.+position.x*3.);
          vec3 p=position+normal*(.09*fold+.045*sin(position.x*17.+clock*7.));
          vec4 eye=modelViewMatrix*vec4(p,1.);
          facing=abs(dot(normalize(normalMatrix*normal),normalize(-eye.xyz)));
          gl_Position=projectionMatrix*eye;
        }`,
      fragmentShader:`
        varying vec3 coord; varying float facing;
        uniform vec3 cold,warm,hot; uniform float clock,alpha;
        void main(){
          vec3 p=coord; float t=clock;
          float swirl=sin(8.*p.y+3.*sin(p.x*4.-t)+2.*sin(p.z*4.+t)-4.*t);
          float fold=cos(p.z*8.+p.x*6.+swirl*2.+t*3.);
          float heat=clamp(.49+.28*swirl+.18*fold+.17*facing,0.,1.);
          vec3 col=mix(cold,warm,smoothstep(.12,.65,heat));
          col=mix(col,hot,smoothstep(.61,.98,heat));
          gl_FragColor=vec4(col,alpha*smoothstep(-.10,.40,facing)*(.78+.22*heat));
        }`
    });
    return new THREE.Mesh(new THREE.SphereBufferGeometry(1,28,18),material);
  }
  function katon(root) {
    const ball=flameVolume(0xa91b0d,0xff7617,0xffef88);
    const jet=new THREE.Mesh(ball.geometry,ball.material);
    const glow=halo('rgba(255,104,19,.85)',.37);
    const embers=particles(32,0xffba4b,.009);
    root.add(jet,ball,glow,embers.points);
    return t=>{
      const p=(t%3.8)/3.8;
      const swell=THREE.MathUtils.smoothstep(p,0,.34);
      const fade=1-THREE.MathUtils.smoothstep(p,.68,.98);
      const intensity=swell*fade;
      root.visible=intensity>.004;
      const distance=.025+.32*swell+.09*p;
      const r=(.026+.123*swell)*(.45+.55*fade);
      ball.position.z=distance;ball.scale.set(r,r*.95,r*1.12);
      jet.position.z=distance*.5;jet.scale.set(.009+.029*intensity,.011+.032*intensity,distance*.52);
      ball.material.uniforms.clock.value=t;
      ball.material.uniforms.alpha.value=intensity;
      glow.position.copy(ball.position);glow.scale.setScalar(r*3.2);glow.material.opacity=intensity*.8;
      for(let i=0;i<32;i++){
        const s=(t*1.2+i*.618)%1,a=i*2.4+s*1.4;
        const spread=(.014+.16*s)*intensity;
        embers.position.setXYZ(i,Math.cos(a)*spread,Math.sin(a)*spread+.075*s*s,distance*s+.11*s*s);
      }
      embers.points.material.opacity=intensity;
      embers.position.needsUpdate=true;
    };
  }
  function braceWrist(fighter) {
    // Local joint rotations for the existing GLB. The left fingers curl
    // around the right forearm just behind the wrist, leaving the palm clear.
    const pose={
      LeftHandIndex1:[0.18605,-0.03457,0.28490,0.93969],
      LeftHandMiddle1:[0.21345,-0.05689,0.26111,0.93969],
      LeftHandRing1:[0.17547,-0.02640,0.29239,0.93969],
      LeftHandPinky1:[0.12650,0.00896,0.31764,0.93969],
      LeftHand:[0.79689,0.01001,-0.14150,0.58723],
      LeftForeArm:[-0.20811,-0.28247,-0.12103,0.92858],
      LeftArm:[0.06751,-0.08427,-0.06706,0.99189],
      RightHand:[0.27558,-0.43088,-0.12843,0.84965],
      RightForeArm:[0.04506,-0.04419,-0.01810,0.99784],
      RightArm:[-0.07383,0.10937,0.05257,0.98986],
    };
    for(const [name,rotation] of Object.entries(pose))
      fighter.getObjectByName(name).quaternion.fromArray(rotation);
  }
  function chidori(root,view) {
    const charge=makeChidoriCharge();
    // The palm is measured in the original right-hand joint's local frame.
    charge.group.scale.setScalar(.72);
    if(view.battle)charge.group.children.filter(o=>o.isLight).forEach(o=>charge.group.remove(o));
    root.add(charge.group);
    return t=>charge.update(t);
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
  function lions(root,view) {
    // Restore the original sculpted twin-lion fists from the first combat pass.
    // mount() attaches this effect to EACH actual hand, so each root needs ONE lion.
    // Batch the sculpted facets into one colored mesh per fist.
    const vertices=[], colors=[];
    function sculpt(geometry, xyz, scale, tint, rotation=0) {
      if(geometry.index) geometry=geometry.toNonIndexed();
      geometry.scale(...scale);geometry.rotateZ(rotation);geometry.translate(...xyz);
      const pts=geometry.attributes.position, color=new THREE.Color(tint).convertSRGBToLinear();
      for(let i=0;i<pts.count;i++){
        vertices.push(pts.getX(i),pts.getY(i),pts.getZ(i));
        colors.push(color.r,color.g,color.b);
      }
      geometry.dispose();
    }
    const oval=(xyz,scale,color,roll=0)=>sculpt(new THREE.SphereBufferGeometry(1,12,8),xyz,scale,color,roll);
    const tuft=(xyz,scale,color,roll)=>sculpt(new THREE.ConeBufferGeometry(1,1,5),xyz,scale,color,roll);
    // Mane with tapered locks, rounded ears, whisker pads and a short square jaw.
    oval([0,0,-.14],[.87,.91,.56],0x5b65df);
    for(let i=0;i<13;i++){
      const a=i*2*Math.PI/13;
      tuft([-.77*Math.sin(a),.78*Math.cos(a),-.10],[.25,.60,.29],
        i%2?0x7376ef:0x648bfa,a+.29);
    }
    oval([0,.03,.16],[.65,.70,.51],0x689cef);
    for(const k of [-1,1]){
      oval([k*.46,.61,.12],[.245,.245,.15],0x8facee);
      oval([k*.46,.64,.246],[.14,.13,.04],0x454caf);
      oval([k*.27,.20,.60],[.225,.084,.075],0x263b88,k*.26);
      oval([k*.26,.20,.66],[.141,.045,.04],0xa5fcff,k*.26);
      oval([k*.27,.30,.58],[.23,.075,.08],0xaabaff,k*.27);
    }
    oval([0,-.26,.54],[.36,.24,.18],0x323e91);
    oval([0,-.40,.53],[.27,.11,.16],0x98adfc);
    for(const k of [-1,1]){
      oval([k*.16,-.11,.67],[.237,.168,.14],0xb2dbff);
      tuft([k*.21,-.27,.66],[.044,.14,.055],0xe5ffff,Math.PI);
    }
    oval([0,.012,.79],[.155,.092,.085],0x17295d);
    for(const k of [-1,1]){
      oval([k*.36,-.13,.72],[.15,.016,.018],0x5772bb,k*.13);
      oval([k*.36,-.18,.70],[.16,.012,.018],0x5772bb,-k*.16);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();

    const head=new THREE.Group();
    head.position.set(0,.012,.052);
    root.add(head);
    const face=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({
      vertexColors:true,transparent:true,opacity:.91,depthWrite:true
    }));
    face.scale.setScalar(.080);
    head.add(face);

    const haze=halo('rgba(75,145,255,.65)',.16);
    haze.position.z=-.036;
    head.add(haze);

    // A tiny concentric Shinra-Tensei-style chakra pressure field around
    // each lion. No tall flame tongues or full-screen postprocessing.
    const shell=new THREE.Mesh(new THREE.SphereBufferGeometry(1,24,16),
      new THREE.ShaderMaterial({
        uniforms:{clock:{value:0}},
        transparent:true,depthWrite:false,
        vertexShader:`varying float rim; varying float height;
          void main(){
            height=position.y;
            vec4 eye=modelViewMatrix*vec4(position,1.);
            rim=1.-abs(dot(normalize(normalMatrix*normal),normalize(-eye.xyz)));
            gl_Position=projectionMatrix*eye;
          }`,
        fragmentShader:`varying float rim; varying float height; uniform float clock;
          void main(){
            float band=pow(.5+.5*cos(height*19.-clock*4.),6.);
            float alpha=pow(rim,2.5)*(.065+.115*band);
            gl_FragColor=vec4(.48,.74,1.,alpha);
          }`
      }));
    shell.scale.set(.112,.120,.105);
    shell.position.z=.008;
    head.add(shell);

    const waves=[];
    for(let i=0;i<2;i++){
      const wave=new THREE.Mesh(new THREE.TorusGeometry(1,.035,5,48),
        new THREE.MeshBasicMaterial({
          color:0x9edcff,transparent:true,opacity:.18,
          blending:THREE.AdditiveBlending,depthWrite:false
        }));
      wave.position.z=.086;
      head.add(wave);
      waves.push(wave);
    }
    const dust=particles(view.battle?8:14,0x9cdfff,.0045);
    head.add(dust.points);
    return t=>{
      head.position.y=.012+.003*Math.sin(t*2.1);
      face.rotation.y=.08*Math.sin(t*1.9);
      face.rotation.z=.02*Math.sin(t*1.4);
      face.material.opacity=.88+.045*Math.sin(t*2.7);
      haze.material.opacity=.45+.09*Math.sin(t*2.3);
      shell.material.uniforms.clock.value=t;
      waves.forEach((wave,i)=>{
        const phase=(t*.78+i*.50)%1;
        wave.scale.setScalar(.065+.14*phase);
        wave.position.z=.075+.09*phase;
        wave.material.opacity=.25*Math.sin(Math.PI*phase);
      });
      for(let i=0;i<dust.position.count;i++){
        const p=(t*.65+i*.379)%1,a=i*2.4+p*3.1;
        dust.position.setXYZ(i,.055*Math.sin(a),.054*Math.cos(a),-.025+p*.12);
      }
      dust.position.needsUpdate=true;
    };
  }
    function mount(id, fighter, view) {
    if (!techniques[id]) return null;
    const parent = fighter.parent, root = new THREE.Group();
    const roots=[root];
    const head=fighter.getObjectByName('Head');
    if(id==='itachi' && head){
      head.add(root);
      root.position.set(0,.028,.081);
    }else if(id==='kakashi'){
      braceWrist(fighter);
      fighter.getObjectByName('RightHand').add(root);
      root.position.set(.035,.052,.054);
    }else if(id==='hinata'){
      roots.push(new THREE.Group());
      for(const [i,side] of ['Right','Left'].entries()){
        const anchor=roots[i];
        fighter.getObjectByName(side+'Hand').add(anchor);
        anchor.position.set(0,.019,.041);
      }
    }else parent.add(root);
    const spine = fighter.getObjectByName('Spine1') || fighter.getObjectByName('Spine');
    const rest = spine?.quaternion.clone();
    const breath = new THREE.Quaternion(), axis = new THREE.Vector3(1,0,0);
    const updates=id==='itachi'&&view.battle?[]:roots.map(anchor=>techniques[id](anchor,view));
    function frame(dt, ms) {
      const t = ms*.001;
      if (spine) spine.quaternion.copy(rest).multiply(breath.setFromAxisAngle(axis,.014*Math.sin(t*1.8)));
      updates.forEach((update,i)=>update(t+i*.37));
    }
    frame(0,0);
    frame.dispose = () => {
      updates.forEach(update=>update.dispose?.());
      for(const anchor of roots){
        anchor.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});
        anchor.parent?.remove(anchor);
      }
    };
    return frame;
  }
  return {modelKey,mount,has:id => Boolean(techniques[id])};
})();
