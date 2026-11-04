// Pose the unrigged Sketch Nerd model using its original (+Z forward) mesh space.
// The eyes identify the anatomical right as -X. Distances are in source GLB units.
function makeSasukeProfileMotion(figure,battle=false) {
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
    // Curl the distal vertices of the left fingers around the grip axis.
    // Operate on this instance's cloned arm only, leaving the shared GLB intact.
    if(src.material.name.includes('Left_Arm')){
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),y=pos.getY(i);
        const along=(x-.625)*.707-(y-.977)*.707;
        if(along<=0 || x<.575)continue;
        const turn=Math.min(2.5,along/.034),across=(x-.625)*.707+(y-.977)*.707;
        const bent=.034*Math.sin(turn);
        const inward=.034*(Math.cos(turn)-1);
        pos.setXY(i,.625+.707*(bent+across+inward),.977+.707*(-bent+across+inward));
      }
      geo.computeVertexNormals();
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
  // Relax Sasuke's left arm beside his hip, without changing the right-hand Chidori.
  // The forearm points down instead of folding up across the torso.
  for (const arm of arms) {
    const right=arm.side<0;
    const aimUpper=right
      ? vector(-.13,-.24,.12).normalize()
      : vector(.15,-.35,.035).normalize();
    const aimLower=right
      ? vector(-.13,.025,.205).normalize()
      : vector(.085,-.24,.045).normalize();
    arm.shoulder.quaternion.setFromUnitVectors(arm.elbow.position.clone().normalize(),aimUpper);
    const localAim=aimLower.applyQuaternion(arm.shoulder.quaternion.clone().invert());
    arm.elbow.quaternion.setFromUnitVectors(arm.wrist.position.clone().normalize(),localAim);
    arm.rest=arm.elbow.quaternion.clone();
    arm.wrist.rotateOnAxis(arm.wrist.position.clone().normalize(),right?-.35:-.10);
  }

  const sword=makeKusanagi();
  const leftWrist=arms[1].wrist;
  // Align the *blade* with Sasuke's downward body axis, not the wrist's tilted
  // local Y axis. The grip/pommel stays inside the closed left hand.
  root.updateWorldMatrix(true,true);
  const bladeDown=vector(.085,-.995,.035).normalize()
    .applyQuaternion(root.getWorldQuaternion(new T.Quaternion()))
    .applyQuaternion(leftWrist.getWorldQuaternion(new T.Quaternion()).invert());
  sword.quaternion.setFromUnitVectors(vector(0,1,0),bladeDown);
  sword.position.set(.052,-.080,.018);
  leftWrist.add(sword);
  const charge=makeChidoriCharge();
  if(battle)charge.group.children.filter(o=>o.isLight).forEach(o=>charge.group.remove(o));
  // Rest wrist (-.535,1.06,-.009); palm (-.605,.989,.012).
  // The charge sits a few centimetres out from the palm surface, beside the fingers.
  charge.group.position.set(-.077,-.071,.046);
  arms[0].wrist.add(charge.group);
  const axis=vector(1,0,0), flutter=new T.Quaternion();
  const update=(dt,time,attacking,progress=-1,technique=0) => {
    const t=time*.001, breath=Math.sin(t*1.85);
    chest.rotation.set(-.075+.015*breath,-.14+.015*Math.sin(t*.83),.028+.008*breath);
    for(const arm of arms) {
      flutter.setFromAxisAngle(axis,.027*Math.sin(t*1.85+arm.side*.45));
      arm.elbow.quaternion.copy(arm.rest).multiply(flutter);
    }
    if(battle){
      const strike=attacking?Math.sin(Math.PI*progress):0;
      arms[1].elbow.rotateX(-.34*strike);
      arms[0].elbow.rotateX(-.26*strike);
      charge.group.visible=technique===2&&progress>.1&&progress<.88;
    }
    if(charge.group.visible)charge.update(t);
  };
  update.dispose=()=>{
    const owned=[sword,charge.group];
    for(const obj of owned){
      obj.traverse(node=>{node.geometry?.dispose();if(node.material){node.material.map?.dispose();node.material.dispose();}});
      obj.parent?.remove(obj);
    }
    figure.traverse(node=>{if(node.isSkinnedMesh&&node.skeleton===skeleton){node.geometry.dispose();node.material.dispose();}});
    skeleton.dispose?.();
  };
  update(0,0);
  return update;
}

// Faceted straight chokutō. Four longitudinal faces separate the back,
// polished bevel and narrow cutting edge even in the small mobile viewport.
function makeKusanagi() {
  const sword=new THREE.Group();sword.name='LeftHandKusanagi';
  const steel=new THREE.MeshStandardMaterial({vertexColors:true,metalness:.48,roughness:.27});
  const vertices=[],colors=[];
  const stations=[[-.001,.023,0],[.57,.022,0],[.70,.013,-.004],[.77,.0004,-.014]];
  const tint=[0x8394a5,0xe6f2ff,0xc0d4e4,0x708394];
  function ring([y,width,drift]){
    return [[drift-width,y,0],[drift-.006,y,.006],[drift+width,y,0],[drift-.006,y,-.006]];
  }
  for(let i=1;i<stations.length;i++){
    const a=ring(stations[i-1]),b=ring(stations[i]);
    for(let k=0;k<4;k++){
      const next=(k+1)%4,c=new THREE.Color(tint[k]);
      for(const v of [a[k],b[k],a[next],a[next],b[k],b[next]]){
        vertices.push(...v);colors.push(c.r,c.g,c.b);
      }
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  steel.side=THREE.DoubleSide;
  const blade=new THREE.Mesh(geo,steel);blade.position.y=.107;sword.add(blade);
  const lacquer=new THREE.MeshStandardMaterial({color:0x302c35,roughness:.51});
  const silver=new THREE.MeshStandardMaterial({color:0x91a4af,metalness:.62,roughness:.34});
  function fitting(radius,length,y,depth,mat){
    const piece=new THREE.Mesh(new THREE.CylinderBufferGeometry(radius,radius,length,12),mat);
    piece.position.y=y;piece.scale.z=depth;sword.add(piece);
  }
  fitting(.025,.197,0,.81,lacquer);
  fitting(.027,.013,-.099,.82,silver);fitting(.040,.016,.100,.78,lacquer);
  fitting(.026,.023,.114,.68,silver);
  return sword;
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
