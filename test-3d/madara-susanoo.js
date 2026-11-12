/* Articulated chakra anatomy, shared by Madara's three partial avatars. */
(function(){
'use strict';
const T=window.THREE,E=T.MathUtils.smoothstep;
function build(full=false){
 const root=new T.Group();root.name='madara-chakra-warrior';
 const resources=new Set(),materials=[];
 function material(color,opacity){const m=new T.MeshPhongMaterial({color,emissive:color,emissiveIntensity:.18,shininess:85,transparent:true,opacity,depthWrite:false,side:T.DoubleSide});m.userData.alpha=opacity;materials.push(m);resources.add(m);return m;}
 const bone=material(0x258ee5,.68),core=material(0x8ddfff,.82),armor=material(0x185bcb,.48);
 function mesh(g,m,parent=root){resources.add(g);const o=new T.Mesh(g,m);parent.add(o);return o;}
 function link(a,b,r,m,parent){const delta=b.clone().sub(a),o=mesh(new T.CylinderGeometry(r,r*.85,delta.length(),8),m,parent);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;}
 const torso=new T.Group();root.add(torso);const ribs=new T.Group();torso.add(ribs);
 link(new T.Vector3(0,.35,-.2),new T.Vector3(0,1.65,-.2),.065,bone,ribs);
 for(let i=0;i<5;i++)for(const s of [-1,1]){
  const y=.55+i*.20,w=.43+i*.035;
  const curve=new T.CatmullRomCurve3([new T.Vector3(0,y+.12,-.2),new T.Vector3(s*w,y+.09,-.14),new T.Vector3(s*w,y-.04,.24),new T.Vector3(s*.13,y-.15,.36)]);
  mesh(new T.TubeGeometry(curve,12,.033,5,false),bone,ribs);
 }
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
 if(full){
  // Overlapping angular cuirass plates leave the inner ribs readable.
  for(const side of [-1,1]){
   const chest=plate([[0,0],[side*.57,.10],[side*.67,-.10],[side*.46,-.36],[side*.04,-.46]],.17,armor,shell);chest.position.set(0,1.58,.15);
   for(let i=0;i<3;i++){const p=plate([[0,0],[side*.44,.07],[side*.49,-.14],[side*.04,-.20]],.12,bone,shell);p.position.set(0,1.12-i*.15,.12);}
   const skirt=plate([[0,0],[side*.45,.03],[side*.60,-.50],[side*.12,-.55]],.12,armor,shell);skirt.position.set(side*.08,.60,.04);
   const thigh=mesh(new T.CylinderGeometry(.17,.13,.46,6),armor,legs);thigh.position.set(side*.25,.26,-.10);
   const boot=mesh(new T.BoxGeometry(.28,.15,.42),bone,legs);boot.position.set(side*.25,.02,.05);
  }
  for(const a of arms){
   const pauldron=plate([[-.22,.08],[0,.25],[.29,.12],[.30,-.26],[.05,-.38],[-.22,-.25]],.25,armor,a.shoulder);pauldron.position.z=-.1;
   for(let i=0;i<3;i++){const lamella=mesh(new T.BoxGeometry(.28,.09,.24),bone,a.shoulder);lamella.position.set(0,-.18-i*.10,0);}
   const bracer=mesh(new T.CylinderGeometry(.13,.10,.33,6),armor,a.elbow);bracer.position.y=-.27;plates.push(pauldron,bracer);
  }
  head.position.set(0,1.83,.04);
  const helm=mesh(new T.IcosahedronGeometry(.33,1),armor,head);helm.scale.set(.85,1.12,.78);
  const mask=plate([[-.21,.12],[0,.19],[.21,.12],[.17,-.17],[0,-.28],[-.17,-.17]],.10,bone,head);mask.position.z=.17;
  const nose=mesh(new T.ConeGeometry(.07,.27,4),armor,head);nose.rotation.x=Math.PI/2;nose.position.set(0,-.01,.35);
  const eyes=material(0xaaf5ff,.98);
  for(const side of [-1,1]){
   const eye=mesh(new T.BoxGeometry(.13,.035,.04),eyes,head);eye.position.set(side*.105,.045,.30);eye.rotation.z=side*.25;
   const brow=mesh(new T.BoxGeometry(.20,.045,.08),armor,head);brow.position.set(side*.11,.105,.28);brow.rotation.z=side*.25;
   const horn=mesh(new T.ConeGeometry(.095,.55,5),bone,head);horn.position.set(side*.23,.32,-.02);horn.rotation.z=-side*.45;
   const cheek=plate([[0,0],[side*.22,.08],[side*.14,-.14],[0,-.12]],.04,armor,head);cheek.position.set(side*.16,-.02,.19);
   for(let i=0;i<3;i++){const tooth=mesh(new T.ConeGeometry(.025,.08,4),core,head);tooth.position.set(side*(.035+i*.038),-.14,.30);tooth.rotation.x=Math.PI;}
  }
  const crest=plate([[0,0],[-.12,.2],[0,.44],[.12,.2]],.05,core,head);crest.position.set(0,.24,-.02);
 }
 const dustGeo=new T.BufferGeometry(),dustPositions=new Float32Array((full?48:18)*3);dustGeo.setAttribute('position',new T.BufferAttribute(dustPositions,3));resources.add(dustGeo);
 const dustMat=new T.PointsMaterial({color:0x56b9ff,size:full?.055:.03,transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending});resources.add(dustMat);
 const dust=new T.Points(dustGeo,dustMat);dust.frustumCulled=false;root.add(dust);
 function update(p,ms,alpha=1){
  shell.visible=head.visible=legs.visible=full;
  shell.scale.setScalar(.01+.99*E(p,.20,.42));head.scale.setScalar(.01+.99*E(p,.24,.43));legs.scale.setScalar(.01+.99*E(p,.18,.37));
  for(const plate of plates)plate.visible=p>.25;
  head.rotation.y=.08*Math.sin(ms*.0018);head.rotation.x=-.06*E(p,.43,.58);
  for(let i=0;i<dustPositions.length/3;i++){const a=i*2.399+ms*.0012,r=.68+(i%5)*.07;dustPositions[i*3]=Math.cos(a)*r;dustPositions[i*3+1]=((i*.17+ms*.001)%2.6);dustPositions[i*3+2]=Math.sin(a)*r*.65;}
  dustGeo.attributes.position.needsUpdate=true;dustMat.opacity=.65*alpha*E(p,0,.12);
  ribs.scale.setScalar(.01+.99*E(p,.04,.27));ribs.visible=p>.02;
  for(const m of materials)m.opacity=m.userData.alpha*alpha;
  const lift=E(p,.20,.43),cut=E(p,.58,.70),recover=E(p,.74,.95);
  torso.rotation.y=.18*Math.sin(ms*.002)*(1-cut)+.24*cut*(1-recover);
  for(const a of arms){
   a.shoulder.scale.setScalar(.01+.99*E(p,.11,.32));
   a.shoulder.rotation.set(-.3-1.8*lift+2.3*cut-.45*recover,0,a.s*(.25+.30*lift-.20*cut));
   a.elbow.rotation.x=-.45-.65*lift+.9*cut;
   a.wrist.rotation.z=a.s*(.18+.25*cut);a.sword.scale.setScalar(.01+.99*E(p,.25,.43));
  }
 }
 function dispose(){resources.forEach(r=>r.dispose());}
 return {root,torso,ribs,arms,head,update,dispose,inspect:()=>({arms:2,swords:2,ribs:10,full,armor:full,head:full})};
}
function cast(scene,slot,target){
 const warrior=build(true),root=warrior.root;root.name='madara-skeletal-susanoo';scene.add(root);let disposed=false,elapsedMs=0;
 function update(ms,ground){if(disposed)return false;elapsedMs=ms;const p=ms/2300;if(p>=1){dispose();return false;}root.position.copy(slot.actor.position).setY(ground);root.quaternion.copy(slot.actor.quaternion);root.scale.setScalar(1.55);warrior.update(p,ms,1-E(p,.83,1));return true;}
 function dispose(){if(disposed)return;disposed=true;scene.remove(root);warrior.dispose();}
 return {update,dispose,inspect:()=>({id:'madara',technique:2,kind:'perfect-susanoo',ultimate:'perfect-susanoo',elapsedMs,disposed,...warrior.inspect()})};
}
window.MadaraSusanoo={build,cast};
})();
