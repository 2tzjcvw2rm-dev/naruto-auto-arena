/* Kakashi: rigged clones and procedural techniques, driven only by battle time. */
(function(){
'use strict';
const T=window.THREE,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),ease=T.MathUtils.smoothstep;
const durations=[2800,3000,3200],impactTimes=[1750,2040,2300];
function create(scene,slot,target,technique){
 if(technique===1)return waterDragon(scene,slot,target);
 if(technique===2)return kamui(scene,slot,target);
 const root=new T.Group();root.name='kakashi-double-chidori';scene.add(root);
 const resources=new Set(),victims=(slot.targets||[target]).filter(Boolean);
 let disposed=false,hit=false,elapsedMs=0;
 const mat=(color,opacity=1,add=true)=>{const m=new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:add?T.AdditiveBlending:T.NormalBlending});resources.add(m);return m;};
 const mesh=(geo,m,parent=root)=>{resources.add(geo);const o=new T.Mesh(geo,m);parent.add(o);return o;};
 const ice=mat(0xc9faff),blue=mat(0x269fff,.55),smokeMat=mat(0xe9f4ff,.40,false);
 const clone=instantiateHero(slot.actor);clone.name='kakashi-shadow-clone';root.add(clone);
 // Independent skeleton: sharing geometry/textures does not share bone transforms.
 const clonePose=BattlePose.mount(clone,'kakashi');
 const hands=[new T.Group(),new T.Group()];
 for(const h of hands){root.add(h);mesh(new T.SphereGeometry(.12,12,8),ice,h);mesh(new T.SphereGeometry(.24,12,8),blue,h);}
 const boltGeo=new T.BufferGeometry(),positions=new Float32Array(3*2*96);
 boltGeo.setAttribute('position',new T.BufferAttribute(positions,3));resources.add(boltGeo);
 const boltMat=new T.LineBasicMaterial({color:0xc5f7ff,transparent:true,opacity:1,blending:T.AdditiveBlending,depthWrite:false});resources.add(boltMat);
 const bolt=new T.LineSegments(boltGeo,boltMat);bolt.frustumCulled=false;root.add(bolt);
 const smoke=Array.from({length:16},()=>mesh(new T.SphereGeometry(.19,8,6),smokeMat));
 const rings=victims.map(v=>({v,o:mesh(new T.TorusGeometry(.5,.028,5,28),blue)}));
 const initialScale=slot.actor.scale.clone(),dir=slot.side==='allyTeam'?1:-1;
 const minZ=Math.min(...victims.map(v=>v.home.z))-.65,maxZ=Math.max(...victims.map(v=>v.home.z))+.65;
 const nearX=dir>0?Math.min(...victims.map(v=>v.home.x))-1:Math.max(...victims.map(v=>v.home.x))+1;
 const farX=dir>0?Math.max(...victims.map(v=>v.home.x))+1:Math.min(...victims.map(v=>v.home.x))-1;
 function update(ms,ground){
  if(disposed)return false;elapsedMs=ms;const p=ms/durations[0];
  if(ms>=impactTimes[0]&&!hit){hit=true;for(const v of victims){v.hitAt=slot.effectAt+impactTimes[0];v.hitFrom=slot.home.clone();}const apply=slot.onImpact;slot.onImpact=null;apply?.();}
  if(p>=1){dispose();return false;}
  const spread=ease(p,.18,.34),dash=ease(p,.36,.69),back=ease(p,.77,1);
  const x=T.MathUtils.lerp(slot.home.x,T.MathUtils.lerp(nearX,farX,dash),spread);
  slot.actor.position.x=T.MathUtils.lerp(x,slot.home.x,back);
  slot.actor.position.z=T.MathUtils.lerp(T.MathUtils.lerp(slot.home.z,minZ,spread),slot.home.z,back);
  slot.actor.rotation.y=dir*Math.PI/2;
  slot.fighter.rotation.x=.28*ease(p,.28,.37)*(1-ease(p,.76,.98));
  clone.position.copy(slot.actor.position);clone.position.z=T.MathUtils.lerp(slot.home.z,maxZ,spread);
  clone.rotation.copy(slot.actor.rotation);clone.visible=p>.11&&p<.82;
  clonePose.update(p,0,slot.effectAt+ms);clone.updateMatrixWorld(true);slot.actor.updateMatrixWorld(true);
  for(let i=0;i<2;i++){
   const actor=i?clone:slot.actor,hand=actor.getObjectByName('RightHand');
   if(hand)hand.getWorldPosition(hands[i].position);else hands[i].position.copy(actor.position).add(V(dir*.4,1,0));
   hands[i].visible=p>.22&&p<.77;hands[i].scale.setScalar(.85+.15*Math.sin(ms*.05));
  }
  const a=hands[0].position,b=hands[1].position;
  bolt.visible=p>.30&&p<.76;
  for(let i=0;i<96;i++){
   const branch=Math.floor(i/32),n=i%32,t=n/32,t2=(n+1)/32;
   for(let j=0;j<2;j++){
    const f=j?t2:t,w=Math.sin(f*Math.PI),k=i*6+j*3;
    const jitter=Math.sin((n+j)*7.3+ms*.045+branch*2.1)*(.065+branch*.05)*w;
    positions[k]=T.MathUtils.lerp(a.x,b.x,f)+jitter;
    positions[k+1]=T.MathUtils.lerp(a.y,b.y,f)+Math.cos((n+j)*5+ms*.04)*.09*w;
    positions[k+2]=T.MathUtils.lerp(a.z,b.z,f)+jitter;
   }
  }
  boltGeo.attributes.position.needsUpdate=true;
  for(let i=0;i<smoke.length;i++){
   const out=p>.74,age=out?(p-.74)/.16:(p-.08)/.18,o=smoke[i],angle=i*2.4;
   o.visible=age>0&&age<1;
   o.position.copy(out?clone.position:slot.actor.position);o.position.y=ground+.6+age*.6;
   o.position.x+=Math.cos(angle)*age*.7;o.position.z+=Math.sin(angle)*age*.7;
   o.scale.setScalar(.3+Math.sin(Math.max(0,age)*Math.PI)*1.6);
  }
  for(const {v,o} of rings){const age=(ms-impactTimes[0])/600;o.visible=age>=0&&age<1;o.position.copy(v.home).setY(ground+.7);o.rotation.set(ms*.005,ms*.007,0);o.scale.setScalar(.3+Math.max(0,age)*1.7);}
  return true;
 }
 function dispose(){if(disposed)return;disposed=true;slot.onImpact=null;slot.fighter.rotation.x=0;slot.actor.scale.copy(initialScale);slot.actor.position.x=slot.home.x;slot.actor.position.z=slot.home.z;clonePose.dispose();clone.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();});scene.remove(root);resources.forEach(r=>r.dispose());}
 return {update,dispose,inspect:()=>({id:'kakashi',technique,kind:'double-chidori',elapsedMs,hit,disposed,victims:victims.length,clone:clone.visible,rig:clonePose.inspect()})};
}
function waterDragon(scene,slot,target){
 const root=new T.Group();root.name='kakashi-water-dragon';scene.add(root);
 const resources=new Set();let hit=false,disposed=false,elapsedMs=0;
 const mat=(color,opacity)=>{const m=new T.MeshPhongMaterial({color,emissive:color,emissiveIntensity:.22,shininess:100,transparent:true,opacity,depthWrite:false,side:T.DoubleSide});resources.add(m);return m;};
 const water=mat(0x32b9ed,.64),foam=mat(0xcafaff,.80),dark=mat(0x083c63,.88);
 const mesh=(g,m,parent=root)=>{resources.add(g);const o=new T.Mesh(g,m);parent.add(o);return o;};
 const head=new T.Group();root.add(head);
 const skull=mesh(new T.SphereGeometry(.32,16,12),water,head);skull.scale.set(1,.85,1.4);
 const upper=mesh(new T.SphereGeometry(.25,14,10),water,head);upper.position.set(0,.08,.35);upper.scale.set(.90,.55,1.60);
 const jawPivot=new T.Group();head.add(jawPivot);jawPivot.position.set(0,-.12,.07);
 const jaw=mesh(new T.SphereGeometry(.24,14,10),water,jawPivot);jaw.position.z=.27;jaw.scale.set(.88,.32,1.65);
 const mouth=mesh(new T.SphereGeometry(.20,12,8),dark,head);mouth.position.set(0,-.06,.31);mouth.scale.set(.8,.45,1.6);
 for(const sign of [-1,1]){
  const eye=mesh(new T.SphereGeometry(.06,8,6),foam,head);eye.position.set(sign*.26,.15,.25);
  const horn=mesh(new T.ConeGeometry(.075,.5,7),foam,head);horn.position.set(sign*.21,.39,-.12);horn.rotation.set(-.45,0,sign*.4);
  for(let j=0;j<4;j++){const tooth=mesh(new T.ConeGeometry(.025,.12,5),foam,head);tooth.position.set(sign*.16,-.035,.2+j*.12);tooth.rotation.x=Math.PI;}
 }
 // Connected rings form one continuous deforming tube, tapering toward the tail.
 const count=40,sides=10,positions=new Float32Array((count+1)*(sides+1)*3),indices=[];
 for(let i=0;i<count;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));geo.setIndex(indices);const body=mesh(geo,water);body.frustumCulled=false;
 const rings=Array.from({length:3},(_,i)=>{const r=mesh(new T.TorusGeometry(.6+i*.22,.032,6,48),i===1?foam:water);r.rotation.x=-Math.PI/2;return r;});
 const drops=Array.from({length:42},(_,i)=>mesh(new T.SphereGeometry(.035+(i%3)*.013,6,5),i%3?water:foam));
 const dir=slot.side==='allyTeam'?1:-1,origin=slot.home.clone(),end=target.home.clone();
 const points=Array.from({length:count+1},()=>V()),tangent=V(),normal=V(),binormal=V(),up=V(0,1,0),front=V(0,0,1);
 function update(ms,ground){
  if(disposed)return false;elapsedMs=ms;const p=ms/durations[1];
  if(ms>=impactTimes[1]&&!hit){hit=true;target.hitAt=slot.effectAt+impactTimes[1];target.hitFrom=slot.home.clone();const f=slot.onImpact;slot.onImpact=null;f?.();}
  if(p>=1){dispose();return false;}
  const rise=ease(p,.12,.34),flight=ease(p,.35,.68),fade=1-ease(p,.68,.89);
  for(let i=0;i<=count;i++){
   const t=i/count,lag=t*.24,progress=ease(p-lag,.35,.68);
   const v=points[i];v.copy(origin).lerp(end,progress);v.y=ground+.25+(1-t)*2.7*rise;
   v.y=T.MathUtils.lerp(v.y,ground+1.0,progress);
   v.x-=dir*t*1.6*rise;
   v.z+=Math.sin(t*9-ms*.006)*.38*rise*Math.sin(t*Math.PI);
   v.y+=Math.sin(t*10-ms*.004)*.23*rise*Math.sin(t*Math.PI);
  }
  head.visible=body.visible=p>.12&&p<.89;head.position.copy(points[0]);
  tangent.copy(points[0]).sub(points[1]).normalize();head.quaternion.setFromUnitVectors(front,tangent);head.scale.setScalar((.2+rise*.95)*fade);
  jawPivot.rotation.x=.18+.20*Math.sin(ms*.006)**2;
  for(let i=0;i<=count;i++){
   const t=i/count,v=points[i];tangent.copy(points[Math.max(0,i-1)]).sub(points[Math.min(count,i+1)]).normalize();
   normal.crossVectors(tangent,up);if(normal.lengthSq()<.0001)normal.set(1,0,0);normal.normalize();binormal.crossVectors(tangent,normal).normalize();
   const radius=(.025+.27*(1-t))*rise*fade;
   for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,r=radius*(1+.06*Math.sin(ms*.012+i*.7+j)),k=(i*(sides+1)+j)*3;
    positions[k]=v.x+(normal.x*Math.cos(a)+binormal.x*Math.sin(a))*r;
    positions[k+1]=v.y+(normal.y*Math.cos(a)+binormal.y*Math.sin(a))*r;
    positions[k+2]=v.z+(normal.z*Math.cos(a)+binormal.z*Math.sin(a))*r;
   }
  }
  geo.attributes.position.needsUpdate=true;geo.computeVertexNormals();
  for(let i=0;i<rings.length;i++){const r=rings[i];r.visible=p>.08;r.position.copy(p<.68?origin:end).setY(ground+.03+i*.015);r.rotation.z=ms*.002*(i%2?1:-1);r.scale.setScalar(p<.68?(.1+rise)*(1-ease(p,.4,.67)):(.2+(p-.68)*5));}
  for(let i=0;i<drops.length;i++){
   const drop=drops[i],a=i*2.399,age=p<.68?(p-.12)*1.3:(p-.68)*3.1;
   drop.visible=age>0&&age<1;drop.position.copy(p<.68?origin:end);
   drop.position.x+=Math.cos(a)*age*(p<.68?1.1:2);drop.position.z+=Math.sin(a)*age*(p<.68?1.1:2);
   drop.position.y=ground+.1+Math.sin(age*Math.PI)*(p<.68?1.3:2.2)+(i%4)*.07;
   drop.scale.set(.7,1.9*(1-age)+.2,.7);
  }
  water.opacity=.64*(1-ease(p,.82,1));foam.opacity=.8*(1-ease(p,.82,1));
  return true;
 }
 function dispose(){if(disposed)return;disposed=true;slot.onImpact=null;scene.remove(root);resources.forEach(r=>r.dispose());}
 return {update,dispose,inspect:()=>({id:'kakashi',technique:1,kind:'water-dragon',victims:1,bodyRings:count,elapsedMs,hit,disposed})};
}

function portal(scene,target,returning=false){
 const root=new T.Group();root.name=returning?'kamui-return':'kamui-distortion';scene.add(root);
 const resources=new Set(),materials=[],spirals=[];
 const dark=new T.MeshBasicMaterial({color:0x080314,transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false});resources.add(dark);
 const diskGeo=new T.CircleGeometry(.58,48);resources.add(diskGeo);const disk=new T.Mesh(diskGeo,dark);root.add(disk);
 for(let i=0;i<5;i++){
  const g=new T.BufferGeometry(),p=new Float32Array(80*3);g.setAttribute('position',new T.BufferAttribute(p,3));resources.add(g);
  const m=new T.LineBasicMaterial({color:i%2?0x6a3aa7:0xb997ff,transparent:true,opacity:.85,depthWrite:false,blending:T.AdditiveBlending});resources.add(m);materials.push(m);
  const line=new T.Line(g,m);line.frustumCulled=false;root.add(line);spirals.push({g,p,line});
 }
 let disposed=false;
 function update(ms,ground){
  if(disposed)return false;const p=ms/(returning?1200:3200);
  if(p>=1){dispose();return false;}
  const size=returning?(1-ease(p,.4,1)):(ease(p,.18,.48)*(1-ease(p,.78,1)));
  root.position.copy(target.home).setY(ground+.9);root.rotation.x=-.25;root.scale.setScalar(.03+1.55*size);root.rotation.z=ms*.004;
  for(let i=0;i<spirals.length;i++){
   const s=spirals[i];for(let j=0;j<80;j++){const t=j/79,a=t*Math.PI*4+i*Math.PI*.4-ms*.003,r=.04+t*.83;
    s.p[j*3]=Math.cos(a)*r;s.p[j*3+1]=Math.sin(a)*r;s.p[j*3+2]=-.18*(1-t)+.025*Math.sin(a*3);}
   s.g.attributes.position.needsUpdate=true;
  }
  dark.opacity=.9*size;materials.forEach(m=>m.opacity=.85*size);
  return true;
 }
 function dispose(){if(disposed)return;disposed=true;scene.remove(root);resources.forEach(r=>r.dispose());}
 return {update,dispose};
}
function kamui(scene,slot,target){
 const vortex=portal(scene,target),root=new T.Group();root.name='kakashi-mangekyo';scene.add(root);
 const resources=new Set(),red=new T.MeshBasicMaterial({color:0xff263b,transparent:true,opacity:.95,depthWrite:false,side:T.DoubleSide}),black=new T.MeshBasicMaterial({color:0x180517,side:T.DoubleSide});resources.add(red);resources.add(black);
 const geo=new T.CircleGeometry(.09,32);resources.add(geo);const eye=new T.Mesh(geo,red);root.add(eye);
 const pupilGeo=new T.CircleGeometry(.028,16);resources.add(pupilGeo);const pupil=new T.Mesh(pupilGeo,black);pupil.position.z=.002;root.add(pupil);
 for(let i=0;i<3;i++){const g=new T.TorusGeometry(.038,.008,5,16,Math.PI*1.4);resources.add(g);const tomoe=new T.Mesh(g,black);const a=i*Math.PI*2/3;tomoe.position.set(Math.cos(a)*.035,Math.sin(a)*.035,.003);tomoe.rotation.z=a;root.add(tomoe);}
 let hit=false,disposed=false,elapsedMs=0;
 function update(ms,ground){
  if(disposed)return false;elapsedMs=ms;const p=ms/durations[2];
  if(ms>=impactTimes[2]&&!hit){hit=true;const f=slot.onImpact;slot.onImpact=null;f?.();}
  if(p>=1){dispose();return false;}
  const head=slot.actor.getObjectByName('Head');slot.actor.updateMatrixWorld(true);
  if(head){head.getWorldPosition(root.position);root.position.z+=.08;}else root.position.copy(slot.actor.position).add(V(0,1.45,.1));
  root.visible=p>.05&&p<.45;root.rotation.z=ms*.002;
  target.kamuiWarp=1-ease(p,.40,.72)*.995;
  vortex.update(ms,ground);
  return true;
 }
 function dispose(){if(disposed)return;disposed=true;slot.onImpact=null;target.kamuiWarp=1;vortex.dispose();scene.remove(root);resources.forEach(r=>r.dispose());}
 return {update,dispose,inspect:()=>({id:'kakashi',technique:2,kind:'kamui',ultimate:'space-time-banishment',victims:1,elapsedMs,hit,disposed})};
}

window.KakashiCombat={durations,impactTimes,create,portal};
})();
