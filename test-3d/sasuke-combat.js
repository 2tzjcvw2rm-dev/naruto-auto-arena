/* Sasuke's three original battle techniques. Everything uses the arena battle clock.
   No downloaded effects, extra GLBs, 2D sprites or separate render loops. */
(function(){
'use strict';
const T=window.THREE, smooth=T.MathUtils.smoothstep;
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const durations=[2100,2300,3400],impactTimes=[1281,1495,2516];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
function create(scene,slot,target,technique){
 const root=new T.Group();root.name=['sasuke-goukakyuu','sasuke-chidori','sasuke-kirin'][technique];
 scene.add(root);
 const resources=new Set();
 function material(color,opacity=.85,additive=true){
  const m=new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,
   side:T.DoubleSide,blending:additive?T.AdditiveBlending:T.NormalBlending});
  resources.add(m);return m;
 }
 function mesh(geo,mat,parent=root){
  resources.add(geo);const obj=new T.Mesh(geo,mat);parent.add(obj);return obj;
 }
 function line(points,color=.85){
  const geo=new T.BufferGeometry(),positions=new Float32Array(points*6);
  geo.setAttribute('position',new T.BufferAttribute(positions,3));resources.add(geo);
  const mat=new T.LineBasicMaterial({color:color===.85?0xb8f2ff:color,transparent:true,opacity:.94,depthWrite:false,blending:T.AdditiveBlending});
  resources.add(mat);const obj=new T.LineSegments(geo,mat);root.add(obj);
  return {obj,positions,geo};
 }
 const orange=material(0xff6c16,.86),gold=material(0xffc342,.86),
       blue=material(0x37aaff,.82),ice=material(0xc4faff,.94),
       aura=material(0x289bff,.20),embers=material(0x8b2530,.42,false);
 const duration=durations[technique],impactTime=impactTimes[technique];
 const victims=(technique===1?[target]:(slot.targets||[target])).filter(Boolean);
 const origin=V(),destination=V(),toward=V();
 let phase='Prepare',elapsedMs=0,disposed=false,hit=false;
 function midpoint(){
   if(!victims.length){destination.copy(target.home);return destination;}
   destination.set(0,0,0);
   for(const v of victims)destination.add(v.home);
   return destination.multiplyScalar(1/victims.length);
 }
 const group=new T.Group();root.add(group);
 const fireParts=[],fireTrail=[],shock=[];
 if(technique===0){
  const flame=mesh(new T.SphereGeometry(.67,18,12),orange,group);
  const hot=mesh(new T.SphereGeometry(.48,14,10),gold,group);
  const glow=mesh(new T.SphereGeometry(.91,12,10),embers,group);
  for(let i=0;i<22;i++){
   const tongue=mesh(new T.ConeGeometry(.10+(i%3)*.03,.58+(i%5)*.12,5),i%4===0?gold:orange,group);
   fireParts.push(tongue);
  }
  for(let i=0;i<18;i++)fireTrail.push(mesh(new T.IcosahedronGeometry(.09,0),i%4===0?gold:orange));
  shock.push(flame,hot,glow);
 }
 const orb=new T.Group();root.add(orb);
 let lightning=null;
 const streaks=[];
 if(technique===1){
  mesh(new T.IcosahedronGeometry(.15,2),ice,orb);
  mesh(new T.SphereGeometry(.24,12,8),aura,orb);
  const halos=[];
  for(let i=0;i<5;i++){const h=mesh(new T.TorusGeometry(.20+i*.036,.008,4,24),i%2?blue:ice,orb);h.rotation.set(i*.73,i*.54,i*.31);halos.push(h);}
  lightning=line(32);
  for(let i=0;i<11;i++)streaks.push(mesh(new T.IcosahedronGeometry(.035,0),i%2?ice:blue));
  shock.push(...halos);
 }
 const dragon=new T.Group();root.add(dragon);
 const bones=[],scales=[],horns=[];
 let bolt=null;
 if(technique===2){
  // Coherent head/muzzle, luminous eyes, pointed horns and a tapering serpentine body.
  const neck=mesh(new T.SphereGeometry(.28,10,8),blue,dragon);neck.position.z=-.36;neck.scale.set(1,.84,1.75);
  const head=mesh(new T.IcosahedronGeometry(.36,1),ice,dragon);head.position.z=.13;head.scale.set(1.02,.8,1.32);
  const snout=mesh(new T.ConeGeometry(.18,.52,6),ice,dragon);snout.rotation.x=Math.PI/2;snout.position.z=.52;
  for(const sign of [-1,1]){
   const eye=mesh(new T.SphereGeometry(.075,8,6),gold,dragon);eye.position.set(sign*.26,.065,.33);
   const horn=mesh(new T.ConeGeometry(.105,.50,5),blue,dragon);horn.position.set(sign*.25,.33,-.05);horn.rotation.z=sign*.25;horn.rotation.x=-.35;
   horns.push(horn);
  }
  // Cylinders connect successive body segments; no flat dragon decal.
  const bodyMat=blue,bodyCore=ice;
  for(let i=0;i<14;i++){
   const segment=new T.Group();dragon.add(segment);
   const body=mesh(new T.SphereGeometry(.24,9,7),i%3===0?bodyCore:bodyMat,segment);
   const tube=mesh(new T.CylinderGeometry(.18,.20,1,7),bodyMat,segment);
   bones.push({segment,body,tube});scales.push(.94-i*.053);
  }
  bolt=line(30,0xe0faff);
 }
 const rings=[];
 const targets=technique===1?[target]:victims;
 for(let i=0;i<targets.length;i++){
  const g=new T.Group();root.add(g);
  const ring=mesh(new T.TorusGeometry(1,.046,5,32),technique===0?orange:blue,g);
  ring.rotation.x=-Math.PI/2;
  const flash=mesh(new T.IcosahedronGeometry(1,1),technique===0?gold:ice,g);
  const halo=mesh(new T.TorusGeometry(1,.024,4,28),technique===0?gold:ice,g);
  halo.rotation.set(Math.PI/2,.4,.3);rings.push({g,ring,flash,halo,slot:targets[i]});
 }
 const light=new T.PointLight(technique===0?0xff701a:0x69caff,.85,3.4,2);
 if(technique===2)dragon.add(light);else group.add(light);
 const scratch=V(),axis=V(),from=V(),to=V(),up=V(0,1,0);
 function connectCylinder(obj,a,b,radius){
  const delta=scratch.copy(b).sub(a),len=Math.max(.0001,delta.length());
  obj.position.copy(a).add(b).multiplyScalar(.5);
  obj.quaternion.setFromUnitVectors(up,delta.normalize());obj.scale.set(radius,len,radius);
 }
 function hitOnce(){
  if(hit)return;hit=true;
  for(const v of victims){v.hitAt=slot.effectAt+impactTime;v.hitFrom=slot.home.clone();}
  const apply=slot.onImpact;slot.onImpact=null;
  apply?.();
 }
 function update(ms,ground){
  if(disposed)return false;
  elapsedMs=Math.max(0,ms);const p=elapsedMs/duration;
  // Apply any skipped hit event exactly once at the real impact frame.
  if(elapsedMs>=impactTime)hitOnce();
  if(p>=1){dispose();return false;}
  midpoint();
  const span=scratch.copy(destination).sub(slot.actor.position);span.y=0;
  if(span.lengthSq()<.0001)span.set(slot.side==='allyTeam'?1:-1,0,0);
  span.normalize();toward.copy(span);
  phase=p<.18?'Prepare':p<.50?'Attack':p<.75?'Impact':'Return';
  const end=destination.clone().setY(ground+1.12);
  const wind=smooth(p,.08,.25)*(1-smooth(p,.64,.79));
  if(technique===0){
   const mouth=origin.copy(slot.actor.position).add(V(0,.62,0)).addScaledVector(toward,.29);
   mouth.y=ground+1.39;
   const progress=smooth(p,.27,.61),size=(.32+.68*smooth(p,.22,.37))*(1+.07*Math.sin(ms*.016));
   group.visible=p>=.12&&p<.78;
   group.position.copy(mouth).lerp(end,progress);group.scale.setScalar(size);
   group.rotation.y=ms*.002;group.rotation.x=.12*Math.sin(ms*.008);
   for(let i=0;i<fireParts.length;i++){
    const f=fireParts[i],a=i*2.39996+ms*.0035,r=.49+(i%5)*.09;
    f.position.set(Math.cos(a)*r,Math.sin(a*1.37)*r,Math.sin(a)*r);
    f.rotation.set(Math.sin(a)*.6,a,Math.cos(a)*.7);
    f.scale.setScalar(.70+(i%4)*.13+.14*Math.sin(ms*.019+i));
   }
   for(let i=0;i<fireTrail.length;i++){
    const v=fireTrail[i],t=clamp(progress-i*.045);
    v.visible=p>.27&&p<.80&&t>0;
    v.position.copy(mouth).lerp(end,t);
    v.position.y+=Math.sin(i*5.1+ms*.005)*.19;
    v.position.z+=Math.cos(i*3.4)*.18;
    v.scale.setScalar(.6+(i%4)*.22);
   }
   light.intensity=.7+.30*Math.sin(ms*.018);
  }else if(technique===1){
   const hand=slot.actor.localToWorld(V(-.38,.25,.27)); // rigged right palm, world-oriented
   hand.y=ground+1.04;
   orb.visible=p>.08&&p<.72;
   orb.position.copy(hand);orb.scale.setScalar(.22+.78*smooth(p,.08,.29)*(1-smooth(p,.69,.76)));
   orb.rotation.set(ms*.017,ms*.025,ms*.011);
   const pos=lightning.positions;
   for(let i=0;i<32;i++){
    const a=i*.13+ms*.018,dist=.12+(i%5)*.055,off=i*6;
    pos[off]=hand.x;pos[off+1]=hand.y;pos[off+2]=hand.z;
    pos[off+3]=hand.x+Math.cos(a)*dist;
    pos[off+4]=hand.y+Math.sin(a*1.7)*dist;
    pos[off+5]=hand.z+Math.sin(a)*dist;
   }
   lightning.obj.visible=p>.11&&p<.79;lightning.geo.attributes.position.needsUpdate=true;
   for(let i=0;i<streaks.length;i++){
    const t=i*.13+ms*.012,v=streaks[i];
    v.visible=p>.24&&p<.76;
    v.position.copy(hand).add(V(-toward.x*(i%5)*.22,Math.sin(t*1.4)*.14,Math.cos(t)*.18));
    v.scale.setScalar(.6+.3*Math.sin(t)*Math.sin(t));
   }
   light.intensity=1.1+.35*Math.sin(ms*.030);
   group.position.copy(hand); // light stays near the Chidori hand
  }else{
   const charge=smooth(p,.13,.29),strike=smooth(p,.43,.72),fade=1-smooth(p,.82,.99);
   dragon.visible=p>.09&&p<.97;
   const start=destination.clone().add(V(-toward.x*2.0,ground+3.8,-1.8));
   const finish=end.clone().add(V(0,-.05,0));
   dragon.position.copy(start).lerp(finish,strike);
   dragon.position.y+=.28*Math.sin(Math.PI*strike);
   dragon.rotation.y=Math.atan2(toward.x,toward.z)+Math.PI;
   dragon.rotation.x=.55+strike*.43;
   dragon.scale.setScalar((.12+.88*charge)*fade);
   for(let i=0;i<bones.length;i++){
    const t=(i+1)/bones.length,b=bones[i],r=scales[i];
    const a=V(Math.sin(t*8-ms*.005)*.24,Math.cos(t*6+ms*.004)*.28,-.26-i*.28);
    const prev=i===0?V(0,0,-.23):V(Math.sin((i)*8/14-ms*.005)*.24,Math.cos((i)*6/14+ms*.004)*.28,-.26-(i-1)*.28);
    b.segment.position.copy(a);b.body.scale.setScalar(r);
    const localTo=prev.clone().sub(a);
    const delta=localTo.clone().sub(V(0,0,0));
    // Tube occupies the distance to the preceding body segment in segment-local space.
    connectCylinder(b.tube,V(0,0,0),delta,.10*r);
   }
   for(let i=0;i<horns.length;i++)horns[i].rotation.z=(i?.30:-.30)+Math.sin(ms*.015)*.035;
   const pos=bolt.positions;
   for(let i=0;i<30;i++){
    const t=(i%10)/10,which=Math.floor(i/10),a=destination.clone();
    const len=which*1.5;
    const z=ground+.16+t*(3.1+len),w=.20*Math.sin(i*12.7+ms*.022);
    const off=i*6;
    pos[off]=a.x+which*.47+w;pos[off+1]=z;pos[off+2]=a.z+which*.30-w;
    pos[off+3]=a.x+which*.47+Math.sin((i+1)*12.7+ms*.022)*.20;
    pos[off+4]=z+.32;pos[off+5]=a.z+which*.30+Math.cos(i*8.5)*.20;
   }
   bolt.obj.visible=p>.56&&p<.86;bolt.geo.attributes.position.needsUpdate=true;
   light.intensity=1.2+.50*Math.sin(ms*.024);
  }
  for(const v of rings){
   const a=smooth(p,impactTime/duration,(impactTime+300)/duration);
   const fade=1-smooth(p,(impactTime+310)/duration,.99);
   v.g.visible=p>=impactTime/duration;
   v.g.position.copy(v.slot.home).setY(ground+.15);
   v.ring.scale.setScalar(.12+1.35*a);
   v.halo.scale.setScalar(.12+.83*a);
   v.flash.position.y=.92;v.flash.scale.setScalar(.01+(.36+.18*wind)*fade);
   v.ring.rotation.z=ms*.0012;v.flash.rotation.y=ms*.005;
  }
  return true;
 }
 function dispose(){
  if(disposed)return;disposed=true;slot.onImpact=null;
  scene.remove(root);resources.forEach(r=>r.dispose());resources.clear();
 }
 return {update,dispose,inspect:()=>({id:'sasuke',technique,
  kind:['fireball','chidori','kirin'][technique],
  ultimate:technique===2?'lightning-dragon':null,
  victims:victims.length,phase,elapsedMs,hit,disposed})};
}
window.SasukeCombat={durations,impactTimes,create};
})();