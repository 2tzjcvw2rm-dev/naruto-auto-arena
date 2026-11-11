/* Naruto's original unskinned mesh: baked articulated poses, shared by clones.
   Eight position targets fit the existing Three.js WebGL1 morph budget.
   No texture/source geometry changes; no per-vertex work during a frame. */
(function(){
'use strict';
const T=window.THREE, V=(x,y,z)=>new T.Vector3(x,y,z), smooth=T.MathUtils.smoothstep;
const names=['guard','seal','runA','runB','punch','kick','hold','throw'];
const cache=new WeakMap();
function arm(side,hand){
 const shoulder=V(side*.174,1.473,-.010),elbow=V(side*.369,1.241,-.012),wrist=V(side*.532,1.050,-.008);
 const end=V(...hand),line=end.clone().sub(shoulder),len=line.length();line.normalize();
 const upper=shoulder.distanceTo(elbow),lower=elbow.distanceTo(wrist);
 const along=(len*len+upper*upper-lower*lower)/(2*len);
 const bend=V(side,-.5,-.7);bend.addScaledVector(line,-bend.dot(line)).normalize();
 const joint=shoulder.clone().addScaledVector(line,along).addScaledVector(bend,Math.sqrt(Math.max(0,upper*upper-along*along)));
 const q1=new T.Quaternion().setFromUnitVectors(elbow.clone().sub(shoulder).normalize(),joint.clone().sub(shoulder).normalize());
 const q2=new T.Quaternion().setFromUnitVectors(wrist.clone().sub(elbow).normalize(),end.clone().sub(joint).normalize());
 return {shoulder,elbow,wrist,end,joint,q1,q2};
}
function spec(name){
 let hands=[[-.23,1.29,.32],[.23,1.30,.33]],legs=[.10,-.10],knees=[.15,.15];
 if(name==='seal')hands=[[-.045,1.36,.31],[.045,1.36,.33]];
 if(name==='runA'||name==='runB'){
  const s=name==='runA'?1:-1;hands=[[-.26,1.15,s*.35],[.26,1.15,-s*.35]];legs=[s*.60,-s*.60];knees=[s>0?.8:.18,s>0?.18:.8];
 }
 if(name==='punch')hands=[[-.22,1.30,.22],[.20,1.39,.55]];
 if(name==='kick'){legs=[.05,-1.15];knees=[.18,.12];hands=[[-.35,1.27,.10],[.30,1.32,.26]];}
 if(name==='hold')hands=[[-.20,1.33,.33],[.24,1.22,.46]];
 if(name==='throw')hands=[[-.34,1.21,-.10],[.21,1.65,.46]];
 return {arms:[arm(-1,hands[0]),arm(1,hands[1])],legs,knees};
}
function bake(source){
 if(cache.has(source))return cache.get(source);
 const geo=source.clone(),src=source.attributes.position;
 geo.morphAttributes={position:[]};
 for(const name of names){
  const pose=spec(name),out=new Float32Array(src.count*3),p=V(0,0,0),a=V(0,0,0),b=V(0,0,0);
  for(let i=0;i<src.count;i++){
   p.fromBufferAttribute(src,i);const original=p.clone(),x=Math.abs(p.x),side=p.x<0?-1:1,k=side<0?0:1;
   const weight=smooth(x,.14,.25)*smooth(p.y,.87,1.02)*(1-smooth(p.y,1.49,1.64));
   if(weight>0){const r=pose.arms[k];a.copy(p).sub(r.shoulder).applyQuaternion(r.q1).add(r.shoulder);
    b.copy(p).sub(r.elbow).applyQuaternion(r.q2).add(r.joint);
    a.lerp(b,smooth(x,.31,.41));p.lerp(a,weight);}
   const leg=(1-smooth(original.y,.83,1.01))*smooth(x,.035,.10);
   if(leg>0){a.copy(original);const hip=V(side*.12,.96,0),knee=V(side*.14,.52,.01);
    if(original.y<.57){b.copy(a).sub(knee).applyAxisAngle(V(1,0,0),pose.knees[k]).add(knee);a.lerp(b,1-smooth(original.y,.47,.59));}
    a.sub(hip).applyAxisAngle(V(1,0,0),pose.legs[k]).add(hip);p.lerp(a,leg);}
   out.set([p.x,p.y,p.z],i*3);
  }
  geo.morphAttributes.position.push(new T.Float32BufferAttribute(out,3));
 }
 geo.morphTargetsRelative=false;geo.computeBoundingBox();geo.computeBoundingSphere();cache.set(source,geo);cache.set(geo,geo);return geo;
}
function mount(figure){
 const meshes=[],materials=[];figure.traverse(m=>{if(!m.isMesh||!m.geometry.attributes.position)return;
  const material=source=>{const result=source.clone();result.morphTargets=true;result.needsUpdate=true;materials.push(result);return result;};
  m.material=Array.isArray(m.material)?m.material.map(material):material(m.material);
  m.geometry=bake(m.geometry);m.updateMorphTargets();m.frustumCulled=false;meshes.push(m);});
 const scale=figure.scale.y;
 function blend(a,b,t){for(const m of meshes){m.morphTargetInfluences.fill(0);m.morphTargetInfluences[names.indexOf(a)]=1-t;m.morphTargetInfluences[names.indexOf(b)]+=t;}}
 const motion=function(dt,now,active,p=-1,technique=0){
  blend('guard','guard',0);
  if(p>=0&&technique===0){
   if(p<.22)blend('guard','seal',smooth(p,0,.10)*(1-smooth(p,.16,.22)));
   else if(p<.43||p>.77){const w=(.5+.5*Math.sin(now*.032));blend('runA','runB',w);}
   else blend('guard','punch',smooth(p,.63,.70)*(1-smooth(p,.71,.77)));
  }
  if(p>=0&&technique===1){
   if(p<.28)blend('guard','hold',smooth(p,.02,.18));
   else if(p<.51)blend('runA','runB',.5+.5*Math.sin(now*.034));
   else if(p<.76)blend('hold','punch',smooth(p,.53,.62)*(1-smooth(p,.67,.76)));
   else blend('hold','guard',smooth(p,.76,1));
  }
  if(p>=0&&technique===2){
   if(p<.18)blend('guard','seal',smooth(p,.01,.08)*(1-smooth(p,.13,.18)));
   else if(p<.45)blend('guard','hold',smooth(p,.18,.25));
   else if(p<.60)blend('hold','throw',smooth(p,.45,.57));
   else if(p<.70)blend('throw','punch',smooth(p,.60,.65));
   else blend('punch','guard',smooth(p,.70,.94));
  }
  figure.scale.y=scale*(1+.004*Math.sin(now*.002));figure.rotation.x=.012*Math.sin(now*.0014);figure.rotation.y=.018*Math.sin(now*.0011);
  if(p>=0&&technique===2){figure.rotation.y+=.50*smooth(p,.43,.56)-.80*smooth(p,.57,.65)+.30*smooth(p,.70,.96);figure.rotation.x+=.10*smooth(p,.58,.65)*(1-smooth(p,.70,.96));}
 };
 motion.hand=out=>{
  out.set(0,0,0);const weights=meshes[0]?.morphTargetInfluences||[1];
  for(let i=0;i<names.length;i++){if(!weights[i])continue;const a=spec(names[i]).arms[1];
   const palm=V(.579,.999,-.006).sub(a.elbow).applyQuaternion(a.q2).add(a.joint);out.addScaledVector(palm,weights[i]);}
  // Original model coordinates, through the normalizing offset and actor yaw.
  const model=figure.children[0]?.children[0];figure.updateWorldMatrix(true,true);if(model)model.localToWorld(out);else figure.localToWorld(out);return out;
 };
 motion.blend=blend;motion.dispose=()=>materials.forEach(m=>m.dispose());motion.inspect=()=>({id:'naruto',articulated:true,poses:names});
 return motion;
}
const durations=[2400,2300,3600];
function createClones(scene,slot,target){
 const root=new T.Group();root.name='naruto-kage-bunshin';scene.add(root);
 const clones=[];for(let i=0;i<2;i++){
  const actor=new T.Group(),figure=slot.fighter.clone(true);actor.add(figure);actor.scale.copy(slot.actor.scale);root.add(actor);
  clones.push({actor,figure,motion:mount(figure),side:i?1:-1});
 }
 const geo=new T.IcosahedronGeometry(1,1),mat=new T.MeshBasicMaterial({color:0xf5faff,transparent:true,opacity:.65,depthWrite:false});
 const smoke=Array.from({length:24},()=>{const m=new T.Mesh(geo,mat);root.add(m);return m;});
 const hitMat=new T.MeshBasicMaterial({color:0xfff0b5,transparent:true,opacity:1,depthWrite:false,blending:T.AdditiveBlending});
 const ringGeo=new T.TorusGeometry(1,.035,5,24),ring=new T.Mesh(ringGeo,hitMat);root.add(ring);
 let disposed=false,next=0,phase='Prepare',elapsedMs=0;
 const hits=[.48,.59,.70],direction=new T.Vector3().subVectors(target.home,slot.home).setY(0).normalize();
 function update(ms,ground){
  if(disposed)return false;elapsedMs=ms;const p=ms/2400;
  // Consume every crossed event even when a slow frame skips several hits.
  while(next<hits.length&&p>=hits[next]){target.hitAt=slot.effectAt+hits[next]*2400;target.hitFrom=slot.home.clone();slot.onImpact?.(1/3);next++;}
  if(p>=1){slot.onImpact=null;dispose();return false;}
  phase=p<.22?'Prepare':p<.43?'Attack':p<.74?'Hit':'Return';
  for(let i=0;i<2;i++){
   const c=clones[i],hit=hits[i],advance=smooth(p,.22+i*.025,.43+i*.025);
   c.actor.visible=p>=.16&&p<.79;c.actor.quaternion.copy(slot.actor.quaternion);
   const start=slot.home.clone().add(new T.Vector3(0,0,c.side*.65));
   const end=target.home.clone().addScaledVector(direction,-.62).add(new T.Vector3(0,0,c.side*.38));
   c.actor.position.copy(start).lerp(end,advance);c.actor.position.y=slot.actor.position.y;
   c.motion(0,ms+i*95,false);
   if(p<.43+i*.025)c.motion.blend('runA','runB',.5+.5*Math.sin(ms*.032+i*2));
   else c.motion.blend('guard',i?'kick':'punch',smooth(p,hit-.055,hit)*(1-smooth(p,hit+.015,hit+.085)));
   c.figure.rotation.x=p<.43?.15:0;c.figure.rotation.y=(i?-.22:.22)*Math.sin(Math.PI*smooth(p,hit-.055,hit+.08));
  }
  const spawn=p<.4,age=spawn?(p-.13)/.16:(p-.76)/.17;
  mat.opacity=.7*(1-Math.max(0,age));
  smoke.forEach((m,i)=>{m.visible=age>=0&&age<=1;const c=clones[i%2],angle=i*2.399;
   m.position.copy(c.actor.position);m.position.y=ground+.5+(i%4)*.22+age*.45;
   m.position.x+=Math.cos(angle)*(.12+age*.65);m.position.z+=Math.sin(angle)*(.12+age*.65);m.scale.setScalar(.15+age*.23);});
  const last=next?hits[next-1]:-1,ageHit=(p-last)/.085;ring.visible=next>0&&ageHit>=0&&ageHit<1;
  ring.position.copy(target.home);ring.position.y=ground+1;ring.rotation.y=Math.atan2(direction.x,direction.z);ring.scale.setScalar(.08+ageHit*.5);hitMat.opacity=1-ageHit;
  return true;
 }
 function dispose(){if(disposed)return;disposed=true;scene.remove(root);geo.dispose();mat.dispose();ringGeo.dispose();hitMat.dispose();clones.forEach(c=>c.motion.dispose());}
 return {update,dispose,inspect:()=>({id:'naruto',kind:'clones',technique:0,phase,elapsedMs,clones:2,disposed})};
}
function createRasengan(scene,slot,target){
 const root=new T.Group();root.name='naruto-rasengan';scene.add(root);const resources=new Set();
 function material(color,opacity){const m=new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending});resources.add(m);return m;}
 function mesh(geo,mat,parent){resources.add(geo);const m=new T.Mesh(geo,mat);parent.add(m);return m;}
 const blue=material(0x38bfff,.65),white=material(0xdfffff,.9),mist=material(0x5bcfff,.12);
 const orb=new T.Group();root.add(orb);
 mesh(new T.SphereGeometry(.14,16,12),blue,orb);mesh(new T.SphereGeometry(.075,12,8),white,orb);mesh(new T.SphereGeometry(.23,16,12),mist,orb);
 const streams=[];for(let i=0;i<7;i++){const r=mesh(new T.TorusGeometry(.11+i*.015,.008,5,32),i%3?blue:white,orb);r.rotation.set(i*.63,i*.87,i*.4);streams.push(r);}
 const light=new T.PointLight(0x35bfff,.8,2.4,2);orb.add(light);
 const burst=new T.Group();root.add(burst);mesh(new T.SphereGeometry(1,16,12),mist,burst);
 const winds=[];for(let i=0;i<9;i++){const m=mesh(new T.TorusGeometry(.55+i*.055,.015,5,36),i%3?blue:white,burst);m.rotation.set(i*.73,i*.83,i*.37);winds.push(m);}
 let disposed=false,hit=false,elapsedMs=0,phase='Prepare';
 function update(ms,ground){
  if(disposed)return false;elapsedMs=ms;const p=ms/2300;
  if(!hit&&p>=.62){hit=true;target.hitAt=slot.effectAt+1426;target.hitFrom=slot.home.clone();slot.onImpact?.();slot.onImpact=null;}
  if(p>=1){dispose();return false;}
  phase=p<.28?'Prepare':p<.62?'Attack':p<.76?'Hit':'Return';
  orb.visible=p>.04&&p<.68;slot.motion.hand(orb.position);orb.scale.setScalar(.1+.9*smooth(p,.04,.22));
  streams.forEach((r,i)=>{r.rotation.x=ms*.009+i*.63;r.rotation.y=ms*.013+i*.87;r.rotation.z=-ms*.011+i*.4;});
  light.intensity=.7+.15*Math.sin(ms*.03);
  burst.visible=p>=.62;burst.position.copy(target.home);burst.position.y=ground+.95;
  const a=smooth(p,.62,.90),fade=1-smooth(p,.72,1);burst.scale.setScalar(.1+a*1.05);
  winds.forEach((r,i)=>{r.rotation.x=ms*.014+i*.73;r.rotation.z=-ms*.02+i*.37;});
  blue.opacity=.65*fade;white.opacity=.9*fade;mist.opacity=.12*fade;
  return true;
 }
 function dispose(){if(disposed)return;disposed=true;scene.remove(root);resources.forEach(r=>r.dispose());resources.clear();}
 return {update,dispose,inspect:()=>({id:'naruto',kind:'rasengan',technique:1,phase,elapsedMs,disposed})};
}
function createRasenshuriken(scene,slot,target){
 const root=new T.Group();root.name='naruto-futon-rasenshuriken';scene.add(root);const resources=new Set();
 function material(color,opacity,additive=true){const m=new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:T.DoubleSide,blending:additive?T.AdditiveBlending:T.NormalBlending});resources.add(m);return m;}
 function mesh(geo,mat,parent=root){resources.add(geo);const m=new T.Mesh(geo,mat);parent.add(m);return m;}
 const blue=material(0x39c6ff,.65),white=material(0xe9ffff,.9),mist=material(0x65d8ff,.13),smokeMat=material(0xf3f9ff,.7,false);
 const orb=new T.Group(),disk=new T.Group();root.add(orb);orb.add(disk);disk.rotation.x=.65;
 mesh(new T.SphereGeometry(.18,18,12),blue,orb);mesh(new T.SphereGeometry(.11,12,8),white,orb);mesh(new T.SphereGeometry(.29,16,10),mist,orb);
 const rings=[];for(let i=0;i<6;i++){const r=mesh(new T.TorusGeometry(.17+i*.023,.009,5,32),i%2?white:blue,orb);rings.push(r);}
 // Four tapered triangular prisms, not a billboard or a flat image.
 const points=[[-.13,.15,-.035],[.13,.15,-.035],[0,.91,0],[-.13,.15,.035],[.13,.15,.035]];
 const indices=[0,1,2,3,2,4,0,3,4,0,4,1,0,2,3,1,4,2];
 const bladeGeo=new T.BufferGeometry();bladeGeo.setAttribute('position',new T.Float32BufferAttribute(indices.flatMap(i=>points[i]),3));bladeGeo.computeVertexNormals();
 const blades=[];for(let i=0;i<4;i++){const pivot=new T.Group();pivot.rotation.z=i*Math.PI/2;disk.add(pivot);mesh(bladeGeo,white,pivot);blades.push(pivot);}
 const light=new T.PointLight(0x67dfff,1,3,2);orb.add(light);
 const clones=[];for(let i=0;i<2;i++){const actor=new T.Group(),figure=slot.fighter.clone(true);actor.scale.copy(slot.actor.scale);actor.add(figure);root.add(actor);clones.push({actor,figure,motion:mount(figure),side:i?1:-1});}
 const smokeGeo=new T.IcosahedronGeometry(1,1),smoke=Array.from({length:20},()=>mesh(smokeGeo,smokeMat));
 const trailGeo=new T.SphereGeometry(.09,6,5),trail=Array.from({length:10},()=>mesh(trailGeo,blue));
 const burst=new T.Group();root.add(burst);mesh(new T.SphereGeometry(1,20,14),mist,burst);
 const winds=[];for(let i=0;i<12;i++){const r=mesh(new T.TorusGeometry(.48+i*.044,.010,5,40),i%4?blue:white,burst);winds.push(r);}
 const flash=mesh(new T.SphereGeometry(.75,12,8),white,burst);
 const particleGeo=new T.BufferGeometry(),positions=new Float32Array(64*3);particleGeo.setAttribute('position',new T.BufferAttribute(positions,3));resources.add(particleGeo);
 const particleMat=new T.PointsMaterial({color:0xdfffff,size:.045,transparent:true,opacity:.8,depthWrite:false,blending:T.AdditiveBlending});resources.add(particleMat);const particles=new T.Points(particleGeo,particleMat);burst.add(particles);
 let disposed=false,hit=false,phase='Prepare',elapsedMs=0,released=false;const release=V(0,0,0),destination=V(0,0,0),hand=V(0,0,0);
 function update(ms,ground){
  if(disposed)return false;elapsedMs=ms;const p=ms/3600;
  if(!hit&&p>=.74){hit=true;target.hitAt=slot.effectAt+2664;target.hitFrom=slot.home.clone();slot.onImpact?.();slot.onImpact=null;}
  if(p>=1){dispose();return false;}
  phase=p<.18?'Prepare':p<.60?'Cast':p<.74?'Attack':p<.90?'Hit':'Return';
  slot.motion.hand(hand);destination.copy(target.home);destination.y=ground+1.05;
  if(p<.60||!released){release.copy(hand);released=p>=.60;}
  orb.visible=p>=.16&&p<.75;orb.position.copy(p<.60?hand:release.clone().lerp(destination,smooth(p,.60,.74)));
  const growth=smooth(p,.16,.42);orb.scale.setScalar(.08+growth*1.05);disk.rotation.z=ms*.022;
  blades.forEach(b=>b.scale.setScalar(Math.max(.001,smooth(p,.28,.46))));
  rings.forEach((r,i)=>{r.rotation.set(ms*.012+i*.8,ms*.017+i*.9,-ms*.020+i*.6);});light.intensity=.8+.2*Math.sin(ms*.035);
  for(let i=0;i<2;i++){
   const c=clones[i];c.actor.visible=p>=.12&&p<.49;c.actor.position.copy(slot.home);c.actor.position.z+=c.side*.60;c.actor.position.x+=(slot.side==='allyTeam'?1:-1)*.25;c.actor.position.y=slot.actor.position.y;
   c.actor.rotation.y=Math.atan2(hand.x-c.actor.position.x,hand.z-c.actor.position.z);c.motion(0,ms+i*130,false);c.motion.blend('hold','punch',.25+.2*Math.sin(ms*.012+i*Math.PI));
   c.figure.rotation.x=.10;c.figure.rotation.y=.09*Math.sin(ms*.009+i);
  }
  const age=p<.3?(p-.10)/.13:(p-.47)/.13;smokeMat.opacity=.65*(1-Math.max(0,age));
  smoke.forEach((m,i)=>{m.visible=age>=0&&age<=1;m.position.copy(clones[i%2].actor.position);m.position.y=ground+.5+(i%4)*.2+age*.4;m.position.x+=Math.cos(i*2.4)*(.1+age*.6);m.position.z+=Math.sin(i*2.4)*(.1+age*.6);m.scale.setScalar(.14+age*.20);});
  trail.forEach((m,i)=>{const q=(p-.60)/.14-i*.028;m.visible=p>=.60&&p<.79&&q>=0&&q<=1;m.position.copy(release).lerp(destination,Math.max(0,Math.min(1,q)));m.scale.setScalar(1-i*.06);});
  burst.visible=p>=.74;burst.position.copy(destination);const ageHit=smooth(p,.74,.94),fade=1-smooth(p,.88,1);burst.scale.setScalar(.10+ageHit*1.50);
  winds.forEach((r,i)=>{r.rotation.set(ms*.019+i*.71,-ms*.023+i*.83,ms*.027+i*.31);});
  for(let i=0;i<64;i++){const angle=i*2.399+ms*.018,r=.5+(i%7)*.08;positions[i*3]=Math.cos(angle)*r;positions[i*3+1]=Math.sin(angle*1.7)*r;positions[i*3+2]=Math.sin(angle)*r;}particleGeo.attributes.position.needsUpdate=true;
  flash.visible=p>.90&&p<.95;flash.scale.setScalar(.1+smooth(p,.90,.95));
  blue.opacity=.65*fade;white.opacity=.9*fade;mist.opacity=.13*fade;particleMat.opacity=.8*fade;
  return true;
 }
 function dispose(){if(disposed)return;disposed=true;scene.remove(root);clones.forEach(c=>c.motion.dispose());resources.forEach(r=>r.dispose());resources.clear();}
 return {update,dispose,inspect:()=>({id:'naruto',kind:'wind',ultimate:'rasenshuriken',technique:2,phase,elapsedMs,clones:2,blades:4,disposed})};
}
window.NarutoCombat={mount,names,durations,create(scene,slot,target,technique){return technique===0?createClones(scene,slot,target):technique===1?createRasengan(scene,slot,target):createRasenshuriken(scene,slot,target)}};
})();
