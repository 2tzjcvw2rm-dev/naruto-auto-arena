/* Madara's skinned combat choreography. All timing uses the shared battle clock. */
(function(){
'use strict';
const T=window.THREE,E=T.MathUtils.smoothstep,L=T.MathUtils.lerp;
const durations=[3600,3400,4200],impactTimes=[2700,2312,3318];
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
  const seal=active&&technique>0?pulse(.02,.16,.38):0;
  phase=!active?'idle':p<.22?'run':p<.43?'punch':p<.55?'kick':p<.67?'switch-target':p<.82?'gunbai':'return';
  for(const {b,rest} of bones){
   b.rotation.copy(rest);const s=b.name.startsWith('Right')?-1:1;
   if(b.name==='Spine'){b.rotation.x=.13*running+.08*Math.sin(time*.002);b.rotation.y=.5*(punch1-punch2)+.75*kick-.65*fan;}
   if(b.name==='Head'){b.rotation.y=-.18*(punch1-punch2);b.rotation.x=.08*running;}
   if(/Arm$/.test(b.name)&&!/Fore/.test(b.name)){
    b.rotation.z=s*(.13+.30*running);b.rotation.x=-.20+s*.65*gait-1.1*seal;b.rotation.z-=s*.45*seal;
    b.rotation.x-=1.15*(s<0?punch1:punch2);b.rotation.y+=s*.55*(s<0?punch1:punch2);
    b.rotation.x-=1.5*fan;b.rotation.z-=s*.6*fan;b.rotation.y+=.8*fan;
   }
   if(/ForeArm/.test(b.name)){b.rotation.x=-.35-.6*running+.32*(s<0?punch1:punch2)-.45*fan-1.0*seal;}
   if(/UpLeg/.test(b.name)){b.rotation.x=s*.60*gait-(s<0?1.2*kick:0);b.rotation.z+=s*.04;}
   if(/^(Right|Left)Leg$/.test(b.name))b.rotation.x=.18+.60*Math.max(0,-s*gait)-(s<0?.15*kick:0);
   if(/Foot/.test(b.name))b.rotation.x=-.12*Math.max(0,s*gait);
  }
 }
 return {update,dispose(){bones.forEach(({b,rest})=>b.rotation.copy(rest));},inspect:()=>({id:'madara',rigged:bones.length===15,bones:bones.length,phase,joints:bones.map(x=>x.b.name)})};
}
function create(scene,slot,target,technique){
 if(technique===1)return skeletal(scene,slot,target);
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
 const a=approach(target),b=new T.Vector3(0,slot.home.y,0);
 const vortex=new T.Group();root.add(vortex);vortex.name='gunbai-volumetric-tornado';
 const wind=material(0xb8edff,.32),windCore=material(0xefffff,.6),debrisMat=material(0x766959);
 const ribbons=[];
 for(let j=0;j<9;j++){
  const points=[];for(let k=0;k<=64;k++){const t=k/64,y=t*2.8,r=.24+1.05*t,a=t*Math.PI*5+j*2.399;points.push(new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r));}
  const o=mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),64,j%3===0?.034:.018,4,false),j%3===0?windCore:wind,vortex);ribbons.push(o);
 }
 const debris=Array.from({length:24},(_,i)=>mesh(new T.TetrahedronGeometry(.025+(i%4)*.012),debrisMat,vortex));
 const center=victims.reduce((v,t)=>v.add(t.home),new T.Vector3()).multiplyScalar(1/victims.length);
 const spread=Math.max(1.3,...victims.map(v=>Math.abs(v.home.z-center.z)+.6));
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
  const travel=E(p,.69,.75),dissolve=1-E(p,.79,.91);vortex.visible=p>.68&&p<.92;vortex.position.copy(b).lerp(center,travel).setY(ground);vortex.scale.set(.7+travel*.7,.9,spread/1.1);vortex.rotation.y=ms*.009;
  wind.opacity=.32*dissolve;windCore.opacity=.6*dissolve;
  ribbons.forEach((o,i)=>{o.rotation.y=-ms*.002*(1+i%3);o.scale.y=1+.06*Math.sin(ms*.006+i);});
  debris.forEach((o,i)=>{const t=((ms*.0007+i/24)%1),a=i*2.399+ms*.008,r=.24+t; o.position.set(Math.cos(a)*r,t*2.8,Math.sin(a)*r);o.rotation.set(ms*.004+i,ms*.003,0);});
  const age=(ms-hits[3])/600;wave.visible=age>=0&&age<1;wave.position.copy(center).setY(ground+.15);wave.scale.setScalar(.3+Math.max(0,age)*4);blue.opacity=.65*(1-Math.max(0,age));
  const last=hits.filter(t=>ms>=t).at(-1),sparkAge=last===undefined?-1:(ms-last)/240;
  sparks.forEach((o,i)=>{o.visible=sparkAge>=0&&sparkAge<1;const v=last===2700?second:target;o.position.copy(v.home);o.position.y=ground+1+Math.sin(i*2.4)*sparkAge*.5;o.position.x+=Math.cos(i*2.4)*sparkAge*.5;o.position.z+=Math.sin(i*3.1)*sparkAge*.4;});
  return true;
 }
 function dispose(){if(disposed)return;disposed=true;slot.onImpact=null;slot.actor.position.x=slot.home.x;slot.actor.position.z=slot.home.z;slot.actor.rotation.y=dir*Math.PI/2;scene.remove(root);resources.forEach(r=>r.dispose());}
 return {update,dispose,inspect:()=>({id:'madara',technique,kind:'war-dance',elapsedMs,disposed,hits:done.size,victims:victims.length})};
}
function skeletal(scene,slot,target){
 const avatar=MadaraSusanoo.build(false),root=avatar.root;root.name='madara-skeletal-susanoo';scene.add(root);
 const victims=(slot.targets||[target]).filter(Boolean);let disposed=false,hit=false,elapsedMs=0;
 const geometry=new T.TorusGeometry(.6,.045,6,32,Math.PI*1.5),material=new T.MeshBasicMaterial({color:0x9ebcff,transparent:true,opacity:.7,depthWrite:false,side:T.DoubleSide});
 const waves=victims.map(v=>{const o=new T.Mesh(geometry,material);scene.add(o);return {v,o};});
 function update(ms,ground){
  if(disposed)return false;elapsedMs=ms;const p=ms/durations[1];
  if(ms>=impactTimes[1]&&!hit){hit=true;for(const v of victims){v.hitAt=slot.effectAt+impactTimes[1];v.hitFrom=slot.home.clone();}const cb=slot.onImpact;slot.onImpact=null;cb?.();}
  if(p>=1){dispose();return false;}
  root.position.copy(slot.actor.position).setY(ground);root.quaternion.copy(slot.actor.quaternion);root.scale.setScalar(1.48);
  avatar.update(p,ms,1-E(p,.80,1));
  const age=(ms-impactTimes[1])/650;
  for(const {v,o} of waves){o.visible=age>=0&&age<1;o.position.copy(v.home).setY(ground+1);o.rotation.set(.2,.5,-.6);o.scale.setScalar(.4+Math.max(0,age)*2);}
  material.opacity=.7*(1-Math.max(0,age));return true;
 }
 function dispose(){if(disposed)return;disposed=true;slot.onImpact=null;scene.remove(root);avatar.dispose();waves.forEach(({o})=>scene.remove(o));geometry.dispose();material.dispose();}
 return {update,dispose,inspect:()=>({id:'madara',technique:1,kind:'skeletal-susanoo',elapsedMs,hit,disposed,rigged:true,victims:victims.length,...avatar.inspect()})};
}
window.MadaraCombat={durations,impactTimes,pose,create};
})();
