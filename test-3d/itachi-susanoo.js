/* Skeletal Susanoo: world-space geometry, bounded lifetime, no model mutation. */
function createItachiSusanoo(THREE,scene,slot,target){
  const victims=slot.targets||[target];
  const root=new THREE.Group();root.name='itachi-red-susanoo';scene.add(root);
  const resources=new Set(),materials=[];
  const material=(color,opacity)=>{const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending});m.userData.alpha=opacity;materials.push(m);resources.add(m);return m};
  const bone=material(0xc82418,.72),core=material(0xff9749,.8),veil=material(0xb91c22,.09),red=material(0xff285f,.7);
  bone.blending=THREE.NormalBlending;veil.blending=THREE.NormalBlending;
  const parts=[];
  const mesh=(geo,mat,parent=root)=>{resources.add(geo);const m=new THREE.Mesh(geo,mat);parent.add(m);return m};
  const tube=(points,radius,mat,parent=root)=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,radius,6,false),mat,parent);
  const reveal=(object,start)=>{parts.push({object,start});return object};
  // Front is local +Z, matching each actor's yaw. Open ribs keep Itachi visible.
  const spine=reveal(new THREE.Group(),.12);root.add(spine);
  tube([[0,.42,-.36],[0,1.3,-.56],[0,2.35,-.53],[0,3.45,-.33]],.09,core,spine);
  const jointGeo=new THREE.IcosahedronGeometry(.13,1);resources.add(jointGeo);
  for(let i=0;i<10;i++){const v=mesh(jointGeo,bone,spine);v.position.set(0,.64+i*.28,-.51);v.scale.set(1.35,.65,1)}
  for(let i=0;i<6;i++){
    const pair=reveal(new THREE.Group(),.16+i*.035);root.add(pair);
    const y=1.02+i*.31,w=.62+Math.sin(i/5*Math.PI)*.26;
    for(const sign of [-1,1]){
      const path=[[0,y+.1,-.5],[sign*w*.8,y+.18,-.35],[sign*w,y,.18],[sign*w*.76,y-.16,.58],[sign*.17,y-.19,.69]];
      tube(path,.065,bone,pair);tube(path,.024,core,pair);
    }
  }
  tube([[0,1,.67],[0,1.6,.72],[0,2.4,.62],[0,2.78,.35]],.07,core);
  const shoulders=reveal(new THREE.Group(),.34);root.add(shoulders);
  for(const sign of [-1,1]){
    tube([[0,2.95,-.4],[sign*.55,3.03,-.3],[sign*1.02,2.85,0]],.11,bone,shoulders);
    const cap=mesh(new THREE.IcosahedronGeometry(.29,1),bone,shoulders);cap.position.set(sign*1.03,2.86,0);
  }
  // Articulated humerus / forearm / five knuckles; one side punches, the other guards.
  const cylinder=new THREE.CylinderGeometry(1,1,1,7);resources.add(cylinder);
  function limb(a,b,r,parent){const m=mesh(cylinder,bone,parent);setLimb(m,a,b,r);return m}
  const up=new THREE.Vector3(0,1,0);
  function setLimb(m,a,b,r){m.position.copy(a).add(b).multiplyScalar(.5);const d=b.clone().sub(a);m.scale.set(r,d.length(),r);m.quaternion.setFromUnitVectors(up,d.normalize())}
  const arms=[];
  for(const sign of [-1,1]){
    const group=reveal(new THREE.Group(),.39);root.add(group);
    const shoulder=new THREE.Vector3(sign*1.03,2.85,0),elbow=new THREE.Vector3(sign*1.3,2.13,.12),hand=new THREE.Vector3(sign*.95,1.83,.66);
    const upper=limb(shoulder,elbow,.12,group),fore=limb(elbow,hand,.15,group);
    const fist=mesh(new THREE.IcosahedronGeometry(.25,1),core,group);fist.scale.set(1,1.1,1.35);
    for(let k=0;k<4;k++){const knuckle=mesh(jointGeo,bone,fist);knuckle.scale.set(.6,1,1.2);knuckle.position.set((k-1.5)*.12,.03,.2)}
    arms.push({sign,shoulder,elbow,hand,upper,fore,fist,group});
  }
  // Open rib cage, with a horned skull above it; no enclosing ball.
  const skull=reveal(new THREE.Group(),.37);root.add(skull);
  const cranium=mesh(new THREE.IcosahedronGeometry(.39,1),bone,skull);cranium.position.set(0,3.39,-.22);cranium.scale.set(.85,1.1,.85);
  tube([[-.24,3.27,.03],[0,3.12,.17],[.24,3.27,.03]],.07,core,skull);
  for(const sign of [-1,1]){
    tube([[sign*.25,3.58,-.18],[sign*.34,3.83,-.2],[sign*.27,3.97,-.15]],.055,bone,skull);
    const eye=mesh(new THREE.SphereGeometry(.05,6,4),red,skull);eye.position.set(sign*.13,3.4,.10);eye.scale.set(1.4,.45,.6);
  }
  const auraMat=material(0xb91a22,.10);auraMat.blending=THREE.NormalBlending;
  const aura=mesh(new THREE.SphereGeometry(1,12,8),auraMat);aura.position.y=.86;aura.scale.set(.34,.83,.28);
  // Eyes sit in front of the source head, inside the aura, not on a screen overlay.
  const eyes=new THREE.Group();root.add(eyes);
  for(const x of [-.065,.065]){const e=mesh(new THREE.SphereGeometry(.025,6,4),red,eyes);e.position.set(x,1.48,.18)}
  const count=72,positions=new Float32Array(count*3),particleGeo=new THREE.BufferGeometry();particleGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));resources.add(particleGeo);
  const particleMat=new THREE.PointsMaterial({color:0xff4829,size:.055,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending});resources.add(particleMat);
  const particles=new THREE.Points(particleGeo,particleMat);root.add(particles);
  const boltGeo=new THREE.BufferGeometry(),boltPositions=new Float32Array(8*3*2);boltGeo.setAttribute('position',new THREE.BufferAttribute(boltPositions,3));resources.add(boltGeo);
  const boltMat=new THREE.LineBasicMaterial({color:0xff5a38,transparent:true,opacity:.65,depthWrite:false});resources.add(boltMat);root.add(new THREE.LineSegments(boltGeo,boltMat));
  const wave=new THREE.Group();scene.add(wave);
  const ring=mesh(new THREE.TorusGeometry(1,.04,6,40),core,wave);ring.rotation.x=-Math.PI/2;
  const burst=mesh(new THREE.SphereGeometry(1,12,8),veil,wave);burst.scale.set(1,.45,1);
  const dark=material(0x08050c,.98);dark.blending=THREE.NormalBlending;
  const edge=material(0x951d52,.7);edge.blending=THREE.NormalBlending;
  const flameGeo=new THREE.SphereGeometry(1,7,5);
  const burns=victims.map(victim=>{
    const group=new THREE.Group();scene.add(group);const tongues=[];
    for(let i=0;i<11;i++){
      const fringe=mesh(flameGeo,edge,group),tongue=mesh(flameGeo,dark,group);
      tongues.push({fringe,tongue});
    }
    return {victim,group,tongues};
  });
  let disposed=false,phase='charge',elapsedMs=0;
  const smooth=(x,a,b)=>THREE.MathUtils.smoothstep(x,a,b),aim=new THREE.Vector3(),end=new THREE.Vector3(),elbow=new THREE.Vector3();
  return {
    update(ms,ground){
      if(disposed)return false;
      elapsedMs=ms;const p=ms/2300;if(p>=1){this.dispose();return false}
      phase=p<.16?'charge':p<.48?'forming':p<.62?'windup':p<.76?'strike':'dissolve';
      root.position.set(slot.actor.position.x,ground,slot.actor.position.z);root.quaternion.copy(slot.actor.quaternion);root.updateMatrixWorld(true);
      const fade=smooth(p,0,.12)*(1-smooth(p,.79,1)),pulse=1+.035*Math.sin(ms*.016);
      for(const m of materials)m.opacity=m.userData.alpha*fade*(m===bone?pulse:1);
      for(const item of parts){const amount=smooth(p,item.start,item.start+.12);item.object.visible=amount>0;item.object.scale.setScalar(Math.max(.001,amount))}
      aura.scale.set(.34*pulse,.83,.28*pulse);red.opacity*=1-smooth(p,.45,.7)*.65;
      const wind=smooth(p,.46,.59)*(1-smooth(p,.62,.7)),strike=smooth(p,.60,.73)*(1-smooth(p,.78,.96));
      aim.set(target?target.actor.position.x:slot.actor.position.x+2,ground+1.05,target?target.actor.position.z:slot.actor.position.z);root.worldToLocal(aim);
      // Bound the arm's reach; the pressure wave covers long-range targets.
      const reach=aim.clone().sub(arms[1].shoulder);if(reach.length()>2.6)aim.copy(arms[1].shoulder).add(reach.setLength(2.6));
      for(const a of arms){
        end.copy(a.hand);elbow.copy(a.elbow);
        if(a.sign===1){end.z-=wind*.9;end.y+=wind*.65;end.lerp(aim,strike);elbow.lerp(a.shoulder.clone().lerp(end,.53).add(new THREE.Vector3(.32,.12,0)),strike);}
        else {end.y+=smooth(p,.38,.52)*.55;end.z+=.2;}
        setLimb(a.upper,a.shoulder,elbow,.12);setLimb(a.fore,elbow,end,.15);a.fist.position.copy(end);a.fist.rotation.x=-wind*.7+strike*1.3;
      }
      for(let i=0;i<count;i++){const t=i*2.39996+ms*.0016,r=.55+(i%7)/12;positions[i*3]=Math.cos(t)*r;positions[i*3+1]=((i/count*3.5+ms*.0012)%3.5);positions[i*3+2]=Math.sin(t)*r*.8}
      particleGeo.attributes.position.needsUpdate=true;particleMat.opacity=fade*.75;
      for(let i=0;i<16;i++){const t=i*.9+Math.floor(ms/90)*.8;boltPositions[i*3]=Math.cos(t)*(.8+(i%2)*.16);boltPositions[i*3+1]=.7+(i/16)*2.3;boltPositions[i*3+2]=Math.sin(t)*.65}
      boltGeo.attributes.position.needsUpdate=true;boltMat.opacity=fade*(.3+.25*Math.sin(ms*.09));
      const impact=smooth(p,.71,.94);wave.visible=false;wave.position.copy(arms[1].fist.position);root.localToWorld(wave.position);
      wave.position.lerp(new THREE.Vector3(target?target.actor.position.x:root.position.x,ground+.12,target?target.actor.position.z:root.position.z),smooth(p,.71,.79));wave.scale.setScalar(.12+impact*1.4);
      for(const burn of burns){
        const {group,victim,tongues}=burn;
        const flight=smooth(p,.62,.79),heat=smooth(p,.60,.68)*(1-smooth(p,.91,1));
        group.visible=p>=.60&&p<1;
        group.position.copy(arms[1].fist.position);root.localToWorld(group.position);
        group.position.lerp(new THREE.Vector3(victim.actor.position.x,ground+.45,victim.actor.position.z),flight);
        for(let i=0;i<tongues.length;i++){
          const {tongue,fringe}=tongues[i],a=i*2.39996,r=.18+(i%3)*.13;
          const height=(.36+(i%4)*.17)*(1+.19*Math.sin(ms*.022+i));
          tongue.position.set(Math.cos(a)*r,Math.abs(Math.sin(ms*.015+i))*.18,Math.sin(a)*r);
          tongue.scale.set(.10*heat,height*heat,.10*heat);
          tongue.rotation.set(.2*Math.sin(ms*.012+i),0,.26*Math.cos(ms*.018+i));
          fringe.position.copy(tongue.position);fringe.quaternion.copy(tongue.quaternion);
          fringe.scale.copy(tongue.scale).multiplyScalar(1.22);
        }
      }
      return true;
    },
    inspect(){return {kind:"itachi-susanoo-amaterasu",technique:2,phase,elapsedMs,disposed,objects:root.children.length,height:3.65}},
    dispose(){if(disposed)return;disposed=true;scene.remove(root,wave);for(const burn of burns)scene.remove(burn.group);for(const r of resources)r.dispose();resources.clear()}
  };
}

