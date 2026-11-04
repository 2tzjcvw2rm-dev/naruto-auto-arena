// Profile pose calibrated against the Sketch Nerd Naruto mesh in models/naruto.glb.
// The original has no skin. Bake two articulated arm chains into a private geometry
// once. Each hand (including all fingers) receives a single rigid wrist transform.
function makeNarutoChakraIdle(figure) {
  const THREE = window.THREE;
  const vec = (x,y,z) => new THREE.Vector3(x,y,z);
  const smooth = THREE.MathUtils.smoothstep;
  const model = figure.children[0].children[0];
  const center = vec(0,1.25,.33);
  const palmFrames = [];

  function basis(direction, normal) {
    const x = direction.clone().normalize();
    const z = x.clone().cross(normal).normalize();
    const y = z.clone().cross(x);
    return new THREE.Matrix4().makeBasis(x,y,z);
  }

  function arm(side) {
    const s = vec(side*.174,1.473,-.010);
    const e = vec(side*.369,1.241,-.012);
    const w = vec(side*.532,1.050,-.008);
    const palm = vec(side*.579,.999,-.006);
    const axis = vec(side*.77,-.64,-.02);
    const normal = vec(-side*.64,-.77,0);
    const handAxis = side<0 ? vec(.79,.04,.61) : vec(-.42,.69,.58);
    const palmNormal = side<0 ? vec(-.12,.99,.10) : vec(-.88,-.46,-.08);
    const rotation = basis(handAxis,palmNormal).multiply(basis(axis,normal).invert());
    const wristQ = new THREE.Quaternion().setFromRotationMatrix(rotation);
    const inward = normal.clone().applyQuaternion(wristQ).normalize();
    // Both palms face the same sphere. Place its surface just clear of the skin.
    const palmTarget = center.clone().addScaledVector(inward,-.11);
    const wristTarget = palmTarget.clone().sub(palm.clone().sub(w).applyQuaternion(wristQ));
    const line = wristTarget.clone().sub(s);
    const distance = line.length();
    line.normalize();
    const upper = s.distanceTo(e), fore = e.distanceTo(w);
    const along = (distance*distance+upper*upper-fore*fore)/(2*distance);
    const bend = vec(side,-.75,-.34);
    bend.addScaledVector(line,-bend.dot(line)).normalize();
    const elbowTarget = s.clone().addScaledVector(line,along)
      .addScaledVector(bend,Math.sqrt(Math.max(0,upper*upper-along*along)));
    const pointRotation = (start,end,a,b) => new THREE.Quaternion()
      .setFromUnitVectors(end.clone().sub(start).normalize(),b.clone().sub(a).normalize());
    palmFrames.push(palmTarget.clone().addScaledVector(inward,.11));
    return {
      s,e,w,elbowTarget,wristTarget,wristQ,
      upperQ:pointRotation(s,e,s,elbowTarget),
      foreQ:pointRotation(e,w,elbowTarget,wristTarget)
    };
  }

  const arms = [arm(-1),arm(1)];
  const p = vec(), a = vec(), b = vec(), c = vec();
  model.traverse(mesh => {
    if (!mesh.isMesh) return;
    const source = mesh.geometry;
    const positions = source.attributes.position;
    if (!positions || source.boundingBox && source.boundingBox.max.x < .4) return;
    const posed = source.clone();
    const out = posed.attributes.position, normals = posed.attributes.normal;
    for (let i=0; i<positions.count; i++) {
      p.fromBufferAttribute(positions,i);
      const x = Math.abs(p.x);
      // Jacket sleeves overlap the skin. Weight both from the same rest
      // coordinates so the sleeve and forearm stay joined through the bend.
      if (x<.135 || p.y<.86 || p.y>1.59) continue;
      const lineY = 1.473 - 1.1*(x-.174);
      const mask = smooth(x,.135,.243)*(1-smooth(Math.abs(p.y-lineY),.112,.184));
      if (!mask) continue;
      const r = arms[p.x<0 ? 0 : 1];
      const elbowBlend = smooth(x,.326,.407);
      const wristBlend = smooth(x,.454,.52);
      a.copy(p).sub(r.s).applyQuaternion(r.upperQ).add(r.s);
      b.copy(p).sub(r.e).applyQuaternion(r.foreQ).add(r.elbowTarget);
      c.copy(p).sub(r.w).applyQuaternion(r.wristQ).add(r.wristTarget);
      p.lerp(a.lerp(b,elbowBlend).lerp(c,wristBlend),mask);
      out.setXYZ(i,p.x,p.y,p.z);
      if (normals) {
        p.fromBufferAttribute(source.attributes.normal,i);
        a.copy(p).applyQuaternion(r.upperQ);
        b.copy(p).applyQuaternion(r.foreQ);
        c.copy(p).applyQuaternion(r.wristQ);
        p.lerp(a.lerp(b,elbowBlend).lerp(c,wristBlend),mask).normalize();
        normals.setXYZ(i,p.x,p.y,p.z);
      }
    }
    posed.computeBoundingBox();
    posed.computeBoundingSphere();
    mesh.geometry = posed;
  });

  const chakra = new THREE.Group();
  chakra.name = 'Rasengan';
  chakra.position.copy(palmFrames[0]).lerp(palmFrames[1],.5);
  model.add(chakra);
  const energy = new THREE.ShaderMaterial({
    uniforms:{phase:{value:0}},
    vertexShader:'varying vec3 n; void main(){n=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`
      varying vec3 n; uniform float phase;
      void main(){
        vec3 p=normalize(n);
        float a=atan(p.z,p.x)+phase*1.4;
        float band=sin(6.*a + p.y*13. + 2.2*sin(a*2.+p.y*4.-phase));
        float eddy=sin(atan(p.y,p.z)*5. + p.x*11.-phase*2.);
        float strands=smoothstep(.64,.98,band);
        vec3 color=mix(vec3(.025,.25,.76),vec3(.07,.76,1.),.5+.5*eddy);
        color=mix(color,vec3(.83,1.,1.),strands*.92);
        gl_FragColor=vec4(color,1.);
      }`
  });
  chakra.add(new THREE.Mesh(new THREE.SphereGeometry(.081,28,18),energy));
  const streams = [];
  for (let i=0; i<3; i++) {
    const points = [];
    for (let j=0; j<=48; j++) {
      const t = j/48, a = t*4.9;
      const lat = -.85+t*1.6+.15*Math.sin(a*2+i);
      const radius = .085+.004*Math.sin(a*3+i);
      points.push(vec(Math.cos(a)*Math.cos(lat),Math.sin(lat),Math.sin(a)*Math.cos(lat)).multiplyScalar(radius));
    }
    const strand = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),40,.0024,4,false),
      new THREE.MeshBasicMaterial({color:i===1 ? 0x9af7ff : 0xc7fcff})
    );
    strand.rotation.set(i*1.19,i*1.94,0);
    chakra.add(strand);
    streams.push(strand);
  }
  const light = new THREE.PointLight(0x66cfff,.68,.39);
  chakra.add(light);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const glow = ctx.createRadialGradient(48,48,0,48,48,48);
    glow.addColorStop(0,'rgba(112,236,255,.9)');
    glow.addColorStop(.46,'rgba(45,184,255,.42)');
    glow.addColorStop(.72,'rgba(26,130,255,.15)');
    glow.addColorStop(1,'rgba(26,130,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,96,96);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map:new THREE.CanvasTexture(canvas),blending:THREE.AdditiveBlending,
      transparent:true,depthWrite:false
    }));
    sprite.scale.set(.315,.315,1);
    chakra.add(sprite);
  }
  const y0 = figure.position.y;
  return (dt,time) => {
    const t = time*.001;
    figure.position.y = y0+.0025*Math.sin(t*1.65);
    figure.rotation.x = .01*Math.sin(t*1.65);
    energy.uniforms.phase.value = t;
    streams.forEach((strand,i) => {
      strand.rotation.y = i*1.94+t*(i===1 ? -2.9 : 2.2);
      strand.rotation.z = .29*Math.sin(t*1.75+i);
    });
    chakra.scale.setScalar(1+.022*Math.sin(t*6.8));
    light.intensity = .66+.06*Math.sin(t*6.8);
  };
}
