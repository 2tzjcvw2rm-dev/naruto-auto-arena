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
  figure.scale.y=scale*(1+.004*Math.sin(now*.002));figure.rotation.x=.012*Math.sin(now*.0014);figure.rotation.y=.018*Math.sin(now*.0011);
 };
 motion.blend=blend;motion.dispose=()=>materials.forEach(m=>m.dispose());motion.inspect=()=>({id:'naruto',articulated:true,poses:names});
 return motion;
}
const durations=[2400,1400,1400];
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
window.NarutoCombat={mount,names,durations,create(scene,slot,target,technique){return technique===0?createClones(scene,slot,target):null}};
})();
