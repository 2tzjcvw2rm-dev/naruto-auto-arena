// Pose the unrigged Sketch Nerd model using its original (+Z forward) mesh space.
// The eyes identify the anatomical right as -X. Distances are in source GLB units.
function makeSasukeProfileMotion(figure) {
  const T = THREE;
  const vector = (x,y,z) => new T.Vector3(x,y,z);
  const bone = (name, position, parent) => {
    const joint = new T.Bone();
    joint.name = name;
    joint.position.copy(position);
    if (parent) parent.add(joint);
    return joint;
  };
  const root = bone('SasukeRoot', vector(0,0,0));
  const chest = bone('SasukeChest', vector(0,1.05,0), root);
  const bones = [root,chest];
  const arms = [-1,1].map(side => {
    const name = side < 0 ? 'Right' : 'Left';
    const shoulder = bone(name+'Shoulder', vector(side*.16,.39,-.012), chest);
    const elbow = bone(name+'Elbow', vector(side*.21,-.205,0), shoulder);
    const wrist = bone(name+'Wrist', vector(side*.165,-.175,.003), elbow);
    const first = bones.length;
    bones.push(shoulder,elbow,wrist);
    return {side,shoulder,elbow,wrist,first};
  });
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton(bones);
  const smooth = (a,b,x) => {
    const u = Math.max(0,Math.min(1,(x-a)/(b-a)));
    return u*u*(3-2*u);
  };
  const meshes = [];
  figure.traverse(o => {if(o.isMesh && !o.isSkinnedMesh) meshes.push(o)});
  for (const src of meshes) {
    const geo = src.geometry.clone(), pos = geo.attributes.position;
    const indices = new Uint16Array(pos.count*4), weights = new Float32Array(pos.count*4);
    for(let i=0;i<pos.count;i++) {
      const x = pos.getX(i), y = pos.getY(i), u = Math.abs(x), k = 4*i;
      const arm = arms[x<0 ? 0 : 1];
      // The belt/sword and hip clothing extend laterally just below the sleeve.
      const sleeve = smooth(.12,.22,u)*smooth(1.25,1.34,y+Math.max(0,u-.19)*1.22);
      const torso = smooth(.86,1.19,y);
      const elbow = smooth(.33,.408,u), wrist = smooth(.49,.56,u);
      indices[k]=0; weights[k]=(1-sleeve)*(1-torso);
      indices[k+1]=1; weights[k+1]=(1-sleeve)*torso;
      indices[k+2]=wrist ? arm.first+1 : arm.first;
      indices[k+3]=wrist ? arm.first+2 : arm.first+1;
      const blend=wrist||elbow;
      weights[k+2]=sleeve*(1-blend);weights[k+3]=sleeve*blend;
    }
    geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));
    geo.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
    const material=src.material.clone();
    material.skinning=true;
    const skinned=new T.SkinnedMesh(geo,material);
    skinned.name=src.name;
    skinned.frustumCulled=false;
    skinned.bind(skeleton,new T.Matrix4());
    const parent=src.parent;
    parent.add(skinned);
    parent.remove(src);
  }
  if(meshes.length) {
    // All GLB primitives have identity transforms and share one local frame.
    let modelRoot=figure;
    while(modelRoot.children.length===1 && !modelRoot.children[0].isMesh)
      modelRoot=modelRoot.children[0];
    modelRoot.add(root);
  }
  for (const arm of arms) {
    const right=arm.side<0;
    const aimUpper=vector(right?-.13:.16,right?-.24:-.21,right?.12:.115).normalize();
    const aimLower=vector(right?-.13:-.13,right?.025:.145,right?.205:.13).normalize();
    arm.shoulder.quaternion.setFromUnitVectors(arm.elbow.position.clone().normalize(),aimUpper);
    const localAim=aimLower.applyQuaternion(arm.shoulder.quaternion.clone().invert());
    arm.elbow.quaternion.setFromUnitVectors(arm.wrist.position.clone().normalize(),localAim);
    arm.rest=arm.elbow.quaternion.clone();
    arm.wrist.rotateOnAxis(arm.wrist.position.clone().normalize(),right?-.35:.17);
  }

  const charge=makeChidoriCharge();
  // Rest wrist (-.535,1.06,-.009); palm (-.605,.989,.012).
  // The charge sits a few centimetres out from the palm surface, beside the fingers.
  charge.group.position.set(-.077,-.071,.046);
  arms[0].wrist.add(charge.group);
  const axis=vector(1,0,0), flutter=new T.Quaternion();
  const update=(dt,time) => {
    const t=time*.001, breath=Math.sin(t*1.85);
    chest.rotation.set(-.075+.015*breath,-.14+.015*Math.sin(t*.83),.028+.008*breath);
    for(const arm of arms) {
      flutter.setFromAxisAngle(axis,.027*Math.sin(t*1.85+arm.side*.45));
      arm.elbow.quaternion.copy(arm.rest).multiply(flutter);
    }
    charge.update(t);
  };
  update(0,0);
  return update;
}

function makeChidoriCharge() {
  const T=THREE, group=new T.Group();
  group.name='RightPalmChidori';
  const add=T.AdditiveBlending;
  const core=new T.Mesh(new T.IcosahedronGeometry(.047,1),new T.MeshBasicMaterial({color:0xedffff}));
  group.add(core);
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d'), grad=ctx.createRadialGradient(32,32,1,32,32,32);
  grad.addColorStop(0,'rgba(245,255,255,1)');
  grad.addColorStop(.13,'rgba(142,247,255,.98)');
  grad.addColorStop(.37,'rgba(27,151,255,.54)');
  grad.addColorStop(1,'rgba(17,73,255,0)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);
  const glowTexture=new T.CanvasTexture(canvas);
  const glow=new T.Sprite(new T.SpriteMaterial({map:glowTexture,blending:add,depthWrite:false}));
  glow.scale.set(.34,.34,1); group.add(glow);
  const light=new T.PointLight(0x59caff,.7,.62,1);
  group.add(light);

  // Two crossed ribbons per segment maintain width when viewed end-on.
  const forks=17, sections=6, stride=36;
  const verts=new Float32Array(forks*sections*stride);
  const geometry=new T.BufferGeometry();
  const attr=new T.BufferAttribute(verts,3).setUsage(T.DynamicDrawUsage);
  geometry.setAttribute('position',attr);
  const stream=new T.Mesh(geometry,new T.MeshBasicMaterial({
    color:0x97ebff,side:T.DoubleSide,transparent:true,blending:add,depthWrite:false
  }));
  stream.frustumCulled=false;group.add(stream);
  const sparkCount=26,sparks=new Float32Array(3*sparkCount),pointsGeo=new T.BufferGeometry();
  const sparkAttr=new T.BufferAttribute(sparks,3).setUsage(T.DynamicDrawUsage);
  pointsGeo.setAttribute('position',sparkAttr);
  const points=new T.Points(pointsGeo,new T.PointsMaterial({
    map:glowTexture,size:.036,color:0xafffff,transparent:true,blending:add,depthWrite:false
  }));
  points.frustumCulled=false;group.add(points);
  const noise=(seed)=>{const v=Math.sin(seed*91.17+13.9)*43758.54;return v-Math.floor(v)};
  const temp=new T.Vector3(),dir=new T.Vector3(),normal=new T.Vector3(),normal2=new T.Vector3();
  const prev=new T.Vector3(),curr=new T.Vector3(),side=new T.Vector3();
  function ribbon(k,a,b,n,width) {
    for(let j=0;j<6;j++){
      const end=j===2||j===4||j===5, pos=end?b:a;
      const sign=j===0||j===3||j===5?-1:1;
      temp.copy(pos).addScaledVector(n,sign*width*(end?.62:1));
      temp.toArray(verts,k+3*j);
    }
  }
  function update(t) {
    const flicker=.94+.06*Math.sin(27*t)*Math.cos(13*t);
    core.scale.setScalar(flicker);core.rotation.set(t,t*2,t*.8);
    glow.scale.setScalar(.34*flicker);light.intensity=.72*flicker;
    const tick=Math.floor(t*12);
    for(let j=0;j<forks;j++) {
      const seed=j*7.12+Math.floor((tick+j%3)/3)*.47;
      const az=j*2.4+(noise(seed)-.5)*.45;
      const elev=noise(seed+7)*1.8-.88,rad=Math.sqrt(1-elev*elev);
      dir.set(Math.cos(az)*rad,elev,Math.sin(az)*rad);
      const length=.115+.13*noise(seed+2);
      prev.copy(dir).multiplyScalar(j%3===0?.055:.013);
      for(let h=0;h<sections;h++){
        const u=(h+1)/sections,n=seed+h*17;
        curr.copy(dir).multiplyScalar(length*u+.028);
        curr.x+=(noise(n+1)-.5)*.047;
        curr.y+=(noise(n+2)-.5)*.047;
        curr.z+=(noise(n+3)-.5)*.047;
        side.subVectors(curr,prev).normalize();
        normal.set(0,1,0);
        if(Math.abs(side.y)>.88)normal.set(0,0,1);
        normal.cross(side).normalize();normal2.crossVectors(side,normal);
        const k=(j*sections+h)*stride,w=.0045*(1-.65*u);
        ribbon(k,prev,curr,normal,w);ribbon(k+18,prev,curr,normal2,w);
        prev.copy(curr);
      }
    }
    for(let i=0;i<sparkCount;i++) {
      const p=(t*(.8+noise(i)*.9)+noise(i+8))%1, a=i*2.4;
      const y=noise(i+2)*2-1,rad=Math.sqrt(1-y*y),d=.046+.23*p;
      sparks[3*i]=Math.cos(a)*rad*d;sparks[3*i+1]=y*d-.055*p*p;sparks[3*i+2]=Math.sin(a)*rad*d;
    }
    attr.needsUpdate=sparkAttr.needsUpdate=true;
  }
  return {group,update};
}
