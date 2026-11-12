/* Madara's skinned combat choreography. All timing uses the shared battle clock. */
(function(){
'use strict';
const T=window.THREE,E=T.MathUtils.smoothstep,L=T.MathUtils.lerp;
const durations=[3600,1400,2300],impactTimes=[2700,868,1817];
function pose(fighter){
 const bones=[];fighter.traverse(b=>{if(b.isBone)bones.push({b,rest:b.rotation.clone()});});
 let phase='idle';
 function update(p,technique,time){
  const active=p>=0,combo=active&&technique===0;
  const pulse=(a,b,c)=>active?E(p,a,b)*(1-E(p,b,c)):0;
  const running=combo?(pulse(.02,.12,.23)+pulse(.50,.58,.67)+pulse(.81,.9,1)):0;
  const punch1=combo?pulse(.22,.28,.34):0,punch2=combo?pulse(.31,.37,.43):0;
  const kick=combo?pulse(.40,.47,.55):0,fan=combo?pulse(.64,.75,.84):0;
  const gait=Math.sin(time*.035)*running;
  phase=!active?'idle':p<.22?'run':p<.43?'punch':p<.55?'kick':p<.67?'switch-target':p<.82?'gunbai':'return';
  for(const {b,rest} of bones){
   b.rotation.copy(rest);const s=b.name.startsWith('Right')?-1:1;
   if(b.name==='Spine'){b.rotation.x=.13*running+.08*Math.sin(time*.002);b.rotation.y=.5*(punch1-punch2)+.75*kick-.65*fan;}
   if(b.name==='Head'){b.rotation.y=-.18*(punch1-punch2);b.rotation.x=.08*running;}
   if(/Arm$/.test(b.name)&&!/Fore/.test(b.name)){
    b.rotation.z=s*(.13+.30*running);b.rotation.x=-.20+s*.65*gait;
    b.rotation.x-=1.15*(s<0?punch1:punch2);b.rotation.y+=s*.55*(s<0?punch1:punch2);
    if(s<0){b.rotation.x-=1.5*fan;b.rotation.z-=.6*fan;}
   }
   if(/ForeArm/.test(b.name)){b.rotation.x=-.35-.6*running+.32*(s<0?punch1:punch2)-.45*fan;}
   if(/UpLeg/.test(b.name)){b.rotation.x=s*.60*gait-(s<0?1.2*kick:0);b.rotation.z+=s*.04;}
   if(/^(Right|Left)Leg$/.test(b.name))b.rotation.x=.18+.60*Math.max(0,-s*gait)-(s<0?.15*kick:0);
   if(/Foot/.test(b.name))b.rotation.x=-.12*Math.max(0,s*gait);
  }
 }
 return {update,dispose(){bones.forEach(({b,rest})=>b.rotation.copy(rest));},inspect:()=>({id:'madara',rigged:bones.length===15,bones:bones.length,phase,joints:bones.map(x=>x.b.name)})};
}
function create(scene,slot,target,technique){
 if(technique!==0)return null;
 const root=new T.Group();root.name='madara-war-dance';scene.add(root);
 const resources=new Set(),dir=slot.side==='allyTeam'?1:-1;
 const victims=(slot.targets||[target]).filter(Boolean),second=victims.find(v=>v!==target)||target;
 const material=(color,opacity=1)=>{const m=new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,side:T.DoubleSide,depthWrite:opacity===1});resources.add(m);return m;};
 const mesh=(g,m,parent=root)=>{resources.add(g);const o=new T.Mesh(g,m);parent.add(o);return o;};
 const ivory=material(0xd9c8a8),edge=material(0x47242d),red=material(0x963f45),blue=material(0x8ddfff,.65);
 const fan=new T.Group();root.add(fan);fan.name='gunbai';
 const shape=new T.Shape();shape.moveTo(0,-.14);shape.bezierCurveTo(-.38,-.12,-.43,.28,-.18,.42);shape.bezierCurveTo(-.36,.68,-.22,.93,0,.96);shape.bezierCurveTo(.22,.93,.36,.68,.18,.42);shape.bezierCurveTo(.43,.28,.38,-.12,0,-.14);
 const board=mesh(new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelSize:.015,bevelThickness:.01,bevelSegments:1,steps:1,curveSegments:10}),ivory,fan);
 const handle=mesh(new T.CylinderGeometry(.025,.025,.52,8),edge,fan);handle.position.y=-.36;
 for(const s of [-1,1])for(let i=0;i<3;i++){const dot=mesh(new T.SphereGeometry(.04,8,6),red,fan);dot.position.set(s*.11,.18+i*.22,.06);dot.scale.z=.25;}
 const wave=mesh(new T.TorusGeometry(.45,.025,6,40),blue);wave.rotation.x=-Math.PI/2;
 const sparks=Array.from({length:12},()=>mesh(new T.SphereGeometry(.025,6,4),ivory));
 const hits=[1008,1332,1692,2700],done=new Set();let disposed=false,elapsedMs=0;
 const approach=v=>v.home.clone().add(new T.Vector3(-dir*.70,0,0));
 const a=approach(target),b=approach(second);
 function update(ms,ground){
  if(disposed)return false;elapsedMs=ms;const p=ms/durations[0];
  for(let i=0;i<hits.length;i++)if(ms>=hits[i]&&!done.has(i)){
   done.add(i);const hitTargets=i===3?victims:[target];for(const v of hitTargets){v.hitAt=slot.effectAt+hits[i];v.hitFrom=slot.actor.position.clone();}
   slot.onImpact?.(i);if(i===3)slot.onImpact=null;
  }
  if(p>=1){dispose();return false;}
  const position=slot.home.clone().lerp(a,E(p,.03,.21));
  position.lerp(b,E(p,.53,.65));position.lerp(slot.home,E(p,.83,1));
  slot.actor.position.x=position.x;slot.actor.position.z=position.z;
  const facing=p<.53?target:second;slot.actor.rotation.y=Math.atan2(facing.home.x-position.x,facing.home.z-position.z)+(p>.4&&p<.55?Math.PI*2*E(p,.4,.55):0);
  slot.actor.updateMatrixWorld(true);const hand=slot.actor.getObjectByName('RightHand');
  fan.visible=p>.59&&p<.85;
  if(hand){hand.getWorldPosition(fan.position);hand.getWorldQuaternion(fan.quaternion);fan.rotateX(-.5);}
  const age=(ms-hits[3])/600;wave.visible=age>=0&&age<1;wave.position.copy(second.home).setY(ground+.15);wave.scale.setScalar(.3+Math.max(0,age)*4);blue.opacity=.65*(1-Math.max(0,age));
  const last=hits.filter(t=>ms>=t).at(-1),sparkAge=last===undefined?-1:(ms-last)/240;
  sparks.forEach((o,i)=>{o.visible=sparkAge>=0&&sparkAge<1;const v=last===2700?second:target;o.position.copy(v.home);o.position.y=ground+1+Math.sin(i*2.4)*sparkAge*.5;o.position.x+=Math.cos(i*2.4)*sparkAge*.5;o.position.z+=Math.sin(i*3.1)*sparkAge*.4;});
  return true;
 }
 function dispose(){if(disposed)return;disposed=true;slot.onImpact=null;slot.actor.position.x=slot.home.x;slot.actor.position.z=slot.home.z;slot.actor.rotation.y=dir*Math.PI/2;scene.remove(root);resources.forEach(r=>r.dispose());}
 return {update,dispose,inspect:()=>({id:'madara',technique,kind:'war-dance',elapsedMs,disposed,hits:done.size,victims:victims.length})};
}
window.MadaraCombat={durations,impactTimes,pose,create};
})();
