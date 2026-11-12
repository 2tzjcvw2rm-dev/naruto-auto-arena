/* Kakashi: rigged clones and procedural techniques, driven only by battle time. */
(function(){
'use strict';
const T=window.THREE,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),ease=T.MathUtils.smoothstep;
const durations=[2800,3000,3200],impactTimes=[1750,2040,2300];
function create(scene,slot,target,technique){
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
window.KakashiCombat={durations,impactTimes,create};
})();
