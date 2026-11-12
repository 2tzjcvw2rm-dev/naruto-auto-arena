/* Articulated chakra anatomy, shared by Madara's three partial avatars. */
(function(){
'use strict';
const T=window.THREE,E=T.MathUtils.smoothstep;
function build(){
 const root=new T.Group();root.name='madara-chakra-warrior';
 const resources=new Set(),materials=[];
 function material(color,opacity){const m=new T.MeshPhongMaterial({color,emissive:color,emissiveIntensity:.32,shininess:85,transparent:true,opacity,depthWrite:false,side:T.DoubleSide});m.userData.alpha=opacity;materials.push(m);resources.add(m);return m;}
 const bone=material(0x65c8ff,.72),core=material(0xccf4ff,.90),armor=material(0x185bcb,.48);
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
 function update(p,ms,alpha=1){
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
 return {root,torso,ribs,arms,update,dispose,inspect:()=>({arms:2,swords:2,ribs:10})};
}
window.MadaraSusanoo={build};
})();
