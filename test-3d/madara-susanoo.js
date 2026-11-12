/* Articulated chakra anatomy, shared by Madara's three partial avatars. */
(function(){
'use strict';
const T=window.THREE,E=T.MathUtils.smoothstep;
function build(full=false){
 const root=new T.Group();root.name='madara-chakra-warrior';
 const resources=new Set(),materials=[];
 function material(color,opacity){const m=new T.MeshPhongMaterial({color,emissive:color,emissiveIntensity:.18,shininess:85,transparent:true,opacity,depthWrite:false,side:T.DoubleSide});m.userData.alpha=opacity;materials.push(m);resources.add(m);return m;}
 const bone=material(0x5265ed,.72),core=material(0xa6eaff,.85),armor=material(0x263bc5,.66);
 function mesh(g,m,parent=root){resources.add(g);const o=new T.Mesh(g,m);parent.add(o);return o;}
 function link(a,b,r,m,parent){const delta=b.clone().sub(a),o=mesh(new T.CylinderGeometry(r,r*.85,delta.length(),8),m,parent);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;}
 const torso=new T.Group();root.add(torso);const ribs=new T.Group();torso.add(ribs);
 link(new T.Vector3(0,.35,-.2),new T.Vector3(0,1.65,-.2),.065,bone,ribs);
 for(let i=0;i<6;i++)for(const s of [-1,1]){
  const y=.43+i*.20,w=.48+Math.sin(i/5*Math.PI)*.14;
  const curve=new T.CatmullRomCurve3([new T.Vector3(0,y+.12,-.2),new T.Vector3(s*w,y+.09,-.14),new T.Vector3(s*w,y-.04,.24),new T.Vector3(s*.13,y-.15,.36)]);
  mesh(new T.TubeGeometry(curve,16,.045,6,false),bone,ribs);
 }
 for(let i=0;i<9;i++){const v=mesh(new T.OctahedronGeometry(.10,0),core,ribs);v.position.set(0,.40+i*.15,-.22);v.scale.set(1,.65,1.25);}
 const arms=[];
 for(const s of [-1,1]){
  const shoulder=new T.Group();shoulder.position.set(s*.68,1.5,0);torso.add(shoulder);
  mesh(new T.SphereGeometry(.14,10,8),bone,shoulder);
  link(new T.Vector3(),new T.Vector3(0,-.52,0),.085,bone,shoulder);
  const elbow=new T.Group();elbow.position.y=-.52;shoulder.add(elbow);
  mesh(new T.SphereGeometry(.115,10,8),core,elbow);link(new T.Vector3(),new T.Vector3(0,-.48,0),.07,bone,elbow);
  const wrist=new T.Group();wrist.position.y=-.48;elbow.add(wrist);
  const fist=mesh(new T.BoxGeometry(.19,.21,.18),bone,wrist);fist.position.y=-.04;
  for(let i=0;i<4;i++){const finger=mesh(new T.BoxGeometry(.035,.13,.07),core,wrist);finger.position.set(-.067+i*.044,-.07,.1);}
  const sword=new T.Group();wrist.add(sword);sword.rotation.x=-Math.PI/2;
  const bladeShape=new T.Shape();bladeShape.moveTo(-.075,0);bladeShape.lineTo(-.075,1.15);bladeShape.lineTo(0,1.45);bladeShape.lineTo(.075,1.15);bladeShape.lineTo(.075,0);bladeShape.closePath();
  mesh(new T.ExtrudeGeometry(bladeShape,{depth:.035,bevelEnabled:false}),core,sword);
  const guard=mesh(new T.BoxGeometry(.38,.065,.09),armor,sword);guard.position.y=-.02;
  const grip=mesh(new T.CylinderGeometry(.035,.035,.24,8),bone,sword);grip.position.y=-.15;
  arms.push({shoulder,elbow,wrist,sword,s});
 }
 const shell=new T.Group(),head=new T.Group(),legs=new T.Group();torso.add(shell,head);root.add(legs);
 const plates=[];
 function plate(points,depth,m,parent){const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.018,bevelThickness:.012,bevelSegments:1,steps:1}),m,parent);}
 head.position.set(0,1.96,.01);
 {
  const skull=mesh(new T.SphereGeometry(.31,12,10),bone,head);skull.scale.set(.91,1.08,.82);skull.position.z=-.06;
  const cavity=material(0x090b42,.94);
  for(const sign of [-1,1]){
   const socket=plate([[-.12,.08],[.09,.10],[.10,-.055],[-.08,-.08]],.025,cavity,head);socket.position.set(sign*.14,.02,.19);socket.rotation.z=sign*.18;
   const eye=mesh(new T.BoxGeometry(.11,.028,.035),core,head);eye.position.set(sign*.14,.025,.225);eye.rotation.z=sign*.18;
   const cheek=plate([[0,.08],[sign*.17,.02],[sign*.10,-.17],[0,-.12]],.12,bone,head);cheek.position.set(sign*.15,-.06,.06);
   const hornCurve=new T.CatmullRomCurve3([new T.Vector3(sign*.23,.14,-.08),new T.Vector3(sign*.35,.32,-.13),new T.Vector3(sign*.29,.52,-.18)]);
   mesh(new T.TubeGeometry(hornCurve,10,.045,5,false),bone,head);
  }
  const jaw=new T.Group();head.add(jaw);jaw.position.set(0,-.21,.04);jaw.name='skeletal-jaw';
  const jawCurve=new T.CatmullRomCurve3([new T.Vector3(-.24,.06,-.02),new T.Vector3(-.19,-.12,.12),new T.Vector3(0,-.17,.22),new T.Vector3(.19,-.12,.12),new T.Vector3(.24,.06,-.02)]);
  mesh(new T.TubeGeometry(jawCurve,16,.048,6,false),bone,jaw);
  for(let i=0;i<8;i++){const tooth=mesh(new T.ConeGeometry(.025,.085,4),core,jaw);tooth.position.set((i-3.5)*.045,-.09,.19-Math.abs(i-3.5)*.016);}
  const nose=plate([[-.04,0],[.04,0],[0,-.09]],.025,cavity,head);nose.position.set(0,-.035,.22);
 }
 const wings=[];
 if(full){
  torso.position.y=.48;
  // Sculpted plate volumes: each outline is extruded, bevelled and edge-lit.
  function armorPlate(points,depth,parent,x,y,z,m=armor){
   const o=plate(points,depth,m,parent);o.position.set(x,y,z);
   const geo=new T.EdgesGeometry(o.geometry,28);resources.add(geo);
   const edge=new T.LineBasicMaterial({color:0x8cc9ff,transparent:true,opacity:.55,depthWrite:false});edge.userData.alpha=.55;materials.push(edge);resources.add(edge);
   o.add(new T.LineSegments(geo,edge));return o;
  }
  for(const sign of [-1,1]){
   armorPlate([[0,.1],[sign*.31,.18],[sign*.64,.05],[sign*.55,-.28],[sign*.18,-.42],[0,-.33]],.24,shell,0,1.57,.10);
   for(let i=0;i<4;i++)armorPlate([[0,.04],[sign*.42,.06],[sign*.46,-.10],[sign*.10,-.19],[0,-.12]],.15,shell,0,1.16-i*.13,.14);
   // Layered samurai skirt, raised hip guards and long armored greaves.
   for(let i=0;i<3;i++)armorPlate([[0,.04],[sign*.34,.10],[sign*.44,-.15],[sign*.03,-.20]],.14,shell,sign*.13,.62-i*.16,.06);
   const leg=new T.Group();legs.add(leg);leg.position.set(sign*.26,.68,0);leg.rotation.z=sign*.08;
   armorPlate([[-.15,.15],[.15,.15],[.18,-.35],[0,-.43],[-.18,-.35]],.22,leg,0,0,-.12);
   armorPlate([[-.17,.03],[0,.13],[.17,.03],[.11,-.4],[0,-.49],[-.11,-.4]],.25,leg,0,-.37,-.10,bone);
   const foot=armorPlate([[-.17,0],[-.16,.16],[.13,.20],[.20,0]],.45,leg,0,-.69,-.14);foot.rotation.x=.04;
   const wing=new T.Group();wing.position.set(sign*.40,1.55,-.24);torso.add(wing);wings.push({wing,sign});
   armorPlate([[0,0],[sign*.5,.55],[sign*1.22,.74],[sign*.96,.33],[sign*.63,.17],[sign*.39,-.23]],.06,wing,0,0,0);
   for(let i=0;i<4;i++)armorPlate([[0,0],[sign*(.64-i*.08),.12],[sign*(.49-i*.04),-.29],[sign*.09,-.16]],.045,wing,sign*(.38+i*.12),.28-i*.13,-.03, bone);
  }
  for(const a of arms){
   const sign=a.s;
   for(let i=0;i<4;i++){
    const o=armorPlate([[-.24,.08],[0,.20],[.32,.10],[.35,-.13],[.06,-.21],[-.27,-.12]],.31,a.shoulder,sign*i*.035,-i*.115,-.15);
    plates.push(o);
   }
   armorPlate([[-.11,.06],[.13,.06],[.19,-.29],[0,-.39],[-.16,-.26]],.20,a.elbow,0,-.06,-.09);
   a.sword.scale.set(1.15,1.35,1.3);
  }
  // Tengu mask with forward beak, swept horns and a layered kabuto helmet.
  const helmet=new T.Group();head.add(helmet);helmet.name='perfect-kabuto';
  armorPlate([[-.32,-.04],[-.34,.23],[-.19,.39],[0,.48],[.19,.39],[.34,.23],[.32,-.04],[0,.05]],.28,helmet,0,.03,-.21);
  for(const sign of [-1,1]){
   armorPlate([[0,.09],[sign*.25,.16],[sign*.25,-.09],[sign*.12,-.26],[0,-.17]],.13,helmet,0,-.02,.16,bone);
   for(let i=0;i<3;i++)armorPlate([[0,.10],[sign*.22,.16],[sign*.29,-.10],[sign*.06,-.19]],.12,helmet,sign*.20,-.03-i*.105,-.09);
   const horn=armorPlate([[0,0],[sign*.11,.27],[sign*.08,.60],[sign*.25,.39],[sign*.19,.05]],.10,helmet,sign*.20,.24,-.09,bone);horn.rotation.x=-.18;
   const eye=mesh(new T.BoxGeometry(.15,.035,.04),core,helmet);eye.position.set(sign*.13,.045,.31);eye.rotation.z=sign*.22;
   armorPlate([[-.11,0],[.10,.035],[.12,-.025],[-.11,-.04]],.065,helmet,sign*.13,.10,.28);
  }
  // Triangular profile extruded across the face creates the recognisable long nose.
  const beak=armorPlate([[0,0],[.38,-.12],[.12,-.19],[-.04,-.08]],.08,helmet,0,.015,.28,bone);beak.rotation.y=-Math.PI/2;
  armorPlate([[-.10,0],[0,.23],[.10,0],[0,-.08]],.07,helmet,0,.33,.10,core);
  plates.push(helmet);
 }
 const dustGeo=new T.BufferGeometry(),dustPositions=new Float32Array((full?48:18)*3);dustGeo.setAttribute('position',new T.BufferAttribute(dustPositions,3));resources.add(dustGeo);
 const dustMat=new T.PointsMaterial({color:0x56b9ff,size:full?.055:.03,transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending});resources.add(dustMat);
 const dust=new T.Points(dustGeo,dustMat);dust.frustumCulled=false;root.add(dust);
 function update(p,ms,alpha=1){
  shell.visible=legs.visible=full;head.visible=p>.16;
  shell.scale.setScalar(.01+.99*E(p,.23,.46));head.scale.setScalar(.01+.99*E(p,.18,.34));legs.scale.setScalar(.01+.99*E(p,.18,.42));
  if(full)torso.position.y=.48*E(p,.15,.43);
  wings.forEach(({wing,sign})=>{wing.scale.setScalar(E(p,.30,.50));wing.rotation.y=sign*(.25+.35*E(p,.53,.67));});
  for(const plate of plates){plate.visible=p>.26;plate.scale.setScalar(.01+.99*E(p,.26,.48));}
  head.rotation.y=.08*Math.sin(ms*.0018);head.rotation.x=-.06*E(p,.43,.58);
  for(let i=0;i<dustPositions.length/3;i++){const a=i*2.399+ms*.0012,r=.68+(i%5)*.07;dustPositions[i*3]=Math.cos(a)*r;dustPositions[i*3+1]=((i*.17+ms*.001)%2.6);dustPositions[i*3+2]=Math.sin(a)*r*.65;}
  dustGeo.attributes.position.needsUpdate=true;dustMat.opacity=.65*alpha*E(p,0,.12);
  ribs.scale.setScalar(.01+.99*E(p,.04,.27));ribs.visible=p>.02;
  for(const m of materials)m.opacity=m.userData.alpha*alpha;
  const lift=E(p,.20,.43),cut=E(p,.58,.70),recover=E(p,.74,.95);
  torso.rotation.y=-.44*lift+1.05*cut-.61*recover;torso.rotation.x=.10*cut*(1-recover);
  for(const a of arms){
   a.shoulder.scale.setScalar(.01+.99*E(p,.11,.32));
   a.shoulder.rotation.set(-.3-1.8*lift+2.3*cut-.45*recover,a.s*(-.30*lift+.75*cut),a.s*(.25+.30*lift-.20*cut));
   a.elbow.rotation.x=-.45-.65*lift+.9*cut;
   a.wrist.rotation.z=a.s*(.18+.25*cut);a.sword.scale.set(1,full?1.45:1,1).multiplyScalar(.01+.99*E(p,.32,.50));
  }
 }
 function dispose(){resources.forEach(r=>r.dispose());}
 return {root,torso,ribs,arms,head,update,dispose,inspect:()=>({arms:2,swords:2,ribs:12,full,armor:full,head:true,wings:full?2:0})};
}
const duration=4200,impactTime=3318;
function cast(scene,slot,target){
 const warrior=build(true),root=warrior.root;root.name='madara-perfect-susanoo';scene.add(root);
 const victims=(slot.targets||[target]).filter(Boolean),dir=slot.side==='foeTeam'?-1:1;
 const end=victims.reduce((v,t)=>v.add(t.home||t.actor.position),new T.Vector3()).multiplyScalar(1/Math.max(1,victims.length));
 const wave=new T.Group();scene.add(wave);wave.name='perfect-susanoo-sword-wave';
 const shape=new T.Shape();shape.moveTo(-.18,-1.5);shape.quadraticCurveTo(1.0,0,-.18,1.5);shape.quadraticCurveTo(.45,0,-.18,-1.5);
 const geometry=new T.ExtrudeGeometry(shape,{depth:.18,bevelEnabled:false,curveSegments:20});
 const material=new T.MeshBasicMaterial({color:0x8edbff,transparent:true,opacity:.62,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
 for(const angle of [-.33,.33]){const arc=new T.Mesh(geometry,material);arc.rotation.set(Math.PI/2,0,angle);wave.add(arc);}
 const eyeGeo=new T.SphereGeometry(.035,8,6),eyeMat=new T.MeshBasicMaterial({color:0xff2255});
 const eyes=new T.Group();scene.add(eyes);for(const x of [-.07,.07]){const eye=new T.Mesh(eyeGeo,eyeMat);eye.position.x=x;eyes.add(eye);}
 let disposed=false,elapsedMs=0,hit=false;
 function update(ms,ground){
  if(disposed)return false;elapsedMs=ms;const p=ms/duration;
  if(ms>=impactTime&&!hit){hit=true;for(const v of victims){v.hitAt=slot.effectAt+impactTime;v.hitFrom=slot.actor.position.clone();}const cb=slot.onImpact;slot.onImpact=null;cb?.();}
  if(p>=1){dispose();return false;}
  root.position.copy(slot.actor.position).setY(ground);root.quaternion.copy(slot.actor.quaternion);root.scale.setScalar(1.3);warrior.update(p,ms,1-E(p,.83,1));
  const head=slot.actor.getObjectByName('Head');eyes.visible=!!head&&p<.24;
  if(head){head.getWorldPosition(eyes.position);head.getWorldQuaternion(eyes.quaternion);eyes.translateZ(.07);}
  const travel=E(p,.69,.79);wave.visible=p>.68&&p<.94;wave.position.copy(slot.actor.position).lerp(end,travel).setY(ground+.95);wave.rotation.y=dir<0?Math.PI:0;
  wave.scale.set(1+travel,.8+travel*.5,Math.max(1.6,...victims.map(v=>Math.abs((v.home||v.actor.position).z-end.z)+.6))/1.5);
  material.opacity=.62*(1-E(p,.81,.94));return true;
 }
 function dispose(){if(disposed)return;disposed=true;slot.onImpact=null;scene.remove(root,wave,eyes);warrior.dispose();geometry.dispose();material.dispose();eyeGeo.dispose();eyeMat.dispose();}
 return {update,dispose,inspect:()=>({id:'madara',technique:2,kind:'perfect-susanoo',ultimate:'perfect-susanoo',elapsedMs,disposed,hit,victims:victims.length,...warrior.inspect()})};
}
window.MadaraSusanoo={build,cast,duration,impactTime};
})();
