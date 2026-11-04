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
  function lions(root) {
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
    const heads=[];
    for(const side of [-1,1]){
      const head=new THREE.Group();root.add(head);
      const face=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({vertexColors:true,
        transparent:true,opacity:.86,depthWrite:true}));
      face.scale.setScalar(.072);head.add(face);
      const haze=halo('rgba(82,128,255,.82)',.17);haze.position.z=-.02;head.add(haze);
      const streams=particles(14,0x96c9ff,.005);head.add(streams.points);
      heads.push({head,face,haze,streams,side});
    }
    return (t,right,left)=>{
      for(const {head,face,haze,streams,side} of heads){
        head.position.copy(side===-1?right:left);
        head.position.z+=.040;head.position.y+=.012;
        face.rotation.y=side*.16+.06*Math.sin(t*2+side);
        face.material.opacity=.81+.075*Math.sin(3*t+side);
        haze.material.opacity=.72+.16*Math.sin(2*t+side);
        for(let i=0;i<14;i++){
          const p=(t*.95+i*.379)%1, a=7*p+i*2.4;
          streams.position.setXYZ(i,.064*Math.sin(a),.064*Math.cos(a),-.07+p*.12);
        }
        streams.position.needsUpdate=true;
      }
    };
  }
  function mount(id, fighter, view) {
    if (!techniques[id]) return null;
    const parent = fighter.parent, root = new THREE.Group();
    const head=fighter.getObjectByName('Head');
    if(id==='itachi' && head){
      head.add(root);
      root.position.set(0,.028,.081);
    }else parent.add(root);
    const right = fighter.getObjectByName('RightHand'), left = fighter.getObjectByName('LeftHand');
    const spine = fighter.getObjectByName('Spine1') || fighter.getObjectByName('Spine');
    const rest = spine?.quaternion.clone();
    const breath = new THREE.Quaternion(), axis = new THREE.Vector3(1,0,0);
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    const update = techniques[id](root, view);
    function frame(dt, ms) {
      const t = ms*.001;
      if (spine) spine.quaternion.copy(rest).multiply(breath.setFromAxisAngle(axis,.014*Math.sin(t*1.8)));
      if (right && left) {
        parent.worldToLocal(right.getWorldPosition(a)); parent.worldToLocal(left.getWorldPosition(b));
      }
      update(t,a,b);
    }
    frame(0,0);
    frame.dispose = () => {
      root.traverse(o => {o.geometry?.dispose(); if(o.material){o.material.map?.dispose();o.material.dispose();}});
      update.dispose?.();
      root.parent?.remove(root);
    };
    return frame;
  }
  return {modelKey,mount,has:id => Boolean(techniques[id])};
})();
