/* Unrigged original model; procedural solid paper, driven solely by arena game time. */
(function(){
'use strict';
const T=window.THREE,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),ease=T.MathUtils.smoothstep;
const durations=[1750,1900,3550],impactTimes=[1250,1200,2630];
function pose(fighter){const rest=fighter.rotation.clone();return {update(p){fighter.rotation.copy(rest);if(p>=0){const b=ease(p,0,.2)*(1-ease(p,.75,1));fighter.rotation.x+=.045*b;fighter.rotation.y+=.09*Math.sin(p*Math.PI*2)*b;}},dispose(){fighter.rotation.copy(rest)},inspect:()=>({rigged:false,mode:'original-static-paper-model'})};}
function folded(length,width){
 const g=new T.BufferGeometry(),a=[],c=[];
 const ring=[[0,width,0],[0,0,width*.35],[0,-width,0],[0,0,-width*.35]];
 for(let i=0;i<4;i++){a.push(length*.65,0,0,...ring[i],...ring[(i+1)%4],-length*.35,0,0,...ring[(i+1)%4],...ring[i]);const shade=i%2?.64:.96;for(let j=0;j<6;j++)c.push(shade,shade,shade*.98);}
 g.setAttribute('position',new T.Float32BufferAttribute(a,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();return g;
}
function create(scene,slot,target,technique){
 const root=new T.Group();root.name='konan-'+['spear','cocoon','ocean'][technique];scene.add(root);
 const geometries=new Set(),materials=new Set(),textures=new Set();
 const geo=g=>(geometries.add(g),g),material=p=>{const m=new T.MeshBasicMaterial(p);materials.add(m);return m;};
 const paper=material({color:0xf5f2e9,side:T.DoubleSide}),grey=material({color:0x9aa6b4,side:T.DoubleSide}),foldMat=material({vertexColors:true,side:T.DoubleSide});
 function mesh(g,m,parent=root){const o=new T.Mesh(g,m);parent.add(o);return o;}
 const group=()=>{const g=new T.Group();root.add(g);return g;};
 const shardGeo=geo(folded(.65,.17)),wings=group(),wingParts=[];
 for(let s=-1;s<=1;s+=2)for(let i=0;i<5;i++){const m=mesh(shardGeo,foldMat,wings);m.position.set(-.12,1.15+i*.12,s*(.28+i*.16));m.rotation.y=s*(.5+i*.07);m.scale.set(1.7,1.15,1);wingParts.push(m);}
 const victims=(technique===2?(slot.targets||[target]):[target]).filter(Boolean);
 let disposed=false,hit=false,elapsedMs=0;
 let animate=()=>{};
 if(technique===0){
  const spear=group(),weapon=mesh(geo(folded(2.15,.22)),foldMat,spear);weapon.name='solid-folded-spear';
  const shaft=mesh(geo(new T.CylinderGeometry(.045,.075,1.3,4)),grey,spear);shaft.rotation.z=Math.PI/2;shaft.position.x=-.65;
  const sheets=Array.from({length:8},()=>mesh(shardGeo,foldMat));
  const pieces=Array.from({length:7},()=>mesh(shardGeo,foldMat));
  const ringMat=material({color:0xffdba1,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false});
  const ring=mesh(geo(new T.RingGeometry(.65,.79,32)),ringMat);
  animate=(ms,g)=>{
   const from=slot.home.clone().setY(g+1.15),to=target.home.clone().setY(g+1.05),dir=to.clone().sub(from).normalize();from.addScaledVector(dir,.65);
   const travel=Math.pow(ease(ms,850,1250),2),build=ease(ms,350,850);
   spear.visible=ms<1250;spear.position.copy(from).lerp(to,travel);spear.quaternion.setFromUnitVectors(V(1,0,0),dir);spear.rotateX(ms*.023);spear.scale.set(build,build,build);
   sheets.forEach((m,i)=>{const p=ease(ms,40+i*22,570+i*30);m.visible=ms<850;m.position.copy(slot.home).add(V(-.12,g+1.2+i*.06,(i%2?1:-1)*(.45+i*.09))).lerp(from,p);m.scale.setScalar((1-p)*1.5);m.rotation.set(p*2,i,p*4);});
   const age=Math.max(0,(ms-1250)/500);pieces.forEach((m,i)=>{m.visible=ms>=1250;m.position.copy(to).add(V((i%3-1)*age*.8,Math.sin(i*2)*age*.65-age*age*.4,Math.cos(i*2)*age*.8));m.scale.setScalar((1-age)*1.1);m.rotation.set(i+age*5,age*4,i);});
   ring.position.copy(to);ring.scale.setScalar(1+age*2);ringMat.opacity=ms>=1250?(1-ease(ms,1250,1490))*.8:0;
  };
 }
 function dispose(){if(disposed)return;disposed=true;slot.onImpact=null;scene.remove(root);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
 function update(ms,ground){
  if(disposed)return false;elapsedMs=ms;
  if(!victims.length){dispose();return false;}
  if(ms>=impactTimes[technique]&&!hit){hit=true;const apply=slot.onImpact;slot.onImpact=null;apply?.();victims.forEach(v=>{v.hitAt=(slot.effectAt||0)+impactTimes[technique];v.hitFrom=slot.home.clone();});}
  if(ms>=durations[technique]){dispose();return false;}
  const spread=ease(ms,0,400)*(1-ease(ms,durations[technique]-350,durations[technique]));
  wings.position.copy(slot.home).setY(ground);wings.scale.set(1,1+spread*.2,spread*(technique===2?1.7:1));wings.rotation.y=(target.home.x>slot.home.x?1:-1)*Math.PI/2;
  animate(ms,ground);return true;
 }
 return {update,dispose,inspect:()=>({id:'konan',technique,kind:['paper-spear','paper-trap','paper-ocean'][technique],victims:victims.length,elapsedMs,hit,disposed,objects:root.children.length})};
}
window.KonanCombat={durations,impactTimes,pose,create};
})();
