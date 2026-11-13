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
 if(technique===1){
  const cage=group(),bands=[];
  // Ten precomputed curved ribbons tile a closed, faceted egg. Draw ranges
  // grow from the floor; no per-frame vertex uploads or cloth simulation.
  for(let i=0;i<10;i++){
   const positions=[],indices=[],steps=28;
   for(let j=0;j<=steps;j++){
    const t=j/steps,phi=t*Math.PI,r=Math.sin(phi)*.76;
    for(const edge of [-.53,.53]){const a=(i+edge)*Math.PI*2/10+Math.sin(phi)*.28;positions.push(Math.cos(a)*r,1.25-Math.cos(phi)*1.25,Math.sin(a)*r);}
    if(j<steps){const k=j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
   }
   const g=geo(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
   const m=mesh(g,i%3===0?grey:paper,cage);bands.push(m);
  }
  const circle=mesh(geo(new T.CircleGeometry(.96,48)),paper);circle.rotation.x=-Math.PI/2;
  const creaseGeo=geo(new T.TorusGeometry(.7,.014,3,40)),creases=[];
  for(let i=0;i<5;i++){const m=mesh(creaseGeo,grey,cage);m.rotation.x=Math.PI/2;m.position.y=.45+i*.38;m.scale.setScalar(Math.sin((.45+i*.38)/2.5*Math.PI));creases.push(m);}
  animate=(ms,g)=>{
   cage.position.copy(target.home).setY(g+.025);circle.position.copy(target.home).setY(g+.018);
   const grow=ease(ms,0,400),shrink=1-.25*ease(ms,1050,1250),tear=ease(ms,1450,1900);
   circle.scale.setScalar(grow*(1-tear));cage.scale.set(shrink,shrink,shrink);
   bands.forEach((m,i)=>{const rise=ease(ms,400+i*12,960+i*10);m.geometry.setDrawRange(0,Math.floor(rise*28)*6);const a=i*Math.PI*2/10;
    m.position.set(Math.cos(a)*tear*1.1,tear*.15,Math.sin(a)*tear*1.1);m.rotation.set(tear*Math.cos(a),0,tear*Math.sin(a));m.scale.setScalar(1-tear);
    if(ms>=1050&&ms<1450)m.position.x+=Math.sin(ms*.09+i)*.018*(1-tear);
   });
   creases.forEach(m=>{m.visible=ms>=1050&&ms<1450;});
  };
 }
 if(technique===2){
  const xs=victims.map(v=>v.home.x),zs=victims.map(v=>v.home.z);
  const cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2;
  const width=Math.max(3.4,Math.max(...xs)-Math.min(...xs)+2.3),depth=Math.max(3.2,Math.max(...zs)-Math.min(...zs)+1.8);
  const ocean=group(),walls=[],seals=[],fires=[];
  ocean.position.set(cx,0,cz);
  const abyss=mesh(geo(new T.PlaneGeometry(width,depth)),material({color:0x101321}),ocean);abyss.rotation.x=-Math.PI/2;abyss.position.y=.016;
  const slabGeo=geo(new T.BoxGeometry(width,.07,depth/2));
  const floors=[-1,1].map(sign=>{const m=mesh(slabGeo,paper,ocean);m.position.set(0,.06,sign*depth/4);return m;});
  const wallGeo=geo(new T.BoxGeometry(width,.16,.28));
  for(const sign of [-1,1]){
   const wall=new T.Group();ocean.add(wall);walls.push(wall);
   // Solid rear strata, low front lip: the side camera can still read every fighter.
   const rows=sign<0?20:7;
   for(let i=0;i<rows;i++){const m=mesh(wallGeo,i%4===0?grey:paper,wall);m.position.set((i%3-1)*.025,i*.15,Math.sin(i*1.7)*.04);}
   wall.userData={sign};
   for(let i=0;i<8;i++){
    const seal=new T.Group();wall.add(seal);seal.position.set((i/7-.5)*(width-.35),sign<0?1.05+(i%2)*.8:.38,.17);
    const ink=material({color:0x171a26});
    const ring=mesh(geo(new T.RingGeometry(.085,.115,12)),ink,seal);
    for(let k=0;k<3;k++){const stroke=mesh(geo(new T.PlaneGeometry(.035,.19)),ink,seal);stroke.rotation.z=k*1.1;stroke.position.z=.004;}
    seals.push({seal,ink,index:i+(sign>0?8:0)});
   }
  }
  const fireGeo=geo(new T.IcosahedronGeometry(1,1));
  for(let i=0;i<9;i++){
   const mat=material({color:0xff691b,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending});
   const m=mesh(fireGeo,mat,ocean),core=mesh(fireGeo,material({color:0xffd17a,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}),m);core.scale.setScalar(.57);
   fires.push({m,mat,core});
  }
  const waveMat=material({color:0xffb23f,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending});
  const wave=mesh(geo(new T.RingGeometry(.8,1,48)),waveMat,ocean);wave.rotation.x=-Math.PI/2;wave.position.y=.12;
  let title=null;
  if(typeof document!=='undefined'&&document.createElement){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d');
   if(ctx){ctx.fillStyle='#171b2a';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#fff7e5';ctx.textAlign='center';ctx.font='bold 43px sans-serif';ctx.fillText('КОНАН — БУМАЖНЫЙ ОКЕАН',512,80);const tx=new T.CanvasTexture(canvas);textures.add(tx);const m=new T.SpriteMaterial({map:tx,transparent:true,depthTest:false});materials.add(m);title=new T.Sprite(m);root.add(title);title.scale.set(5,.625,1);title.renderOrder=20;}
  }
  animate=(ms,g)=>{
   const rise=ease(ms,650,1450),end=ease(ms,2850,3550),appear=ease(ms,0,650);
   ocean.position.y=g;ocean.scale.set(appear,1,appear);abyss.scale.set(1,Math.max(.01,rise*(1-end)),1);
   floors.forEach((m,i)=>{const sign=i?1:-1;m.position.z=sign*(depth/4+rise*depth*.22);m.scale.z=(1-rise*.85)*(1-end);});
   walls.forEach(w=>{const sign=w.userData.sign;w.position.set(0,.08-end*.3,sign*(depth/2+.15*rise));w.scale.set(1,rise*(1-end),1);w.rotation.x=sign*end*.28;});
   seals.forEach(({seal,ink,index})=>{const ignition=ease(ms,1450+index*23,1580+index*23);seal.visible=ms>=1450;ink.color.setRGB(.06+ignition*.94,.07+ignition*.28,.10-ignition*.06);});
   fires.forEach(({m,mat,core},i)=>{const launch=i<6?2050+i*65:2630+(i-6)*30,age=(ms-launch)/(i<6?330:480),on=age>=0&&age<1;
    m.visible=on;if(!on)return;const blast=Math.sin(age*Math.PI),big=i>=6;m.position.set(((i%3)-1)*width*.27,.8+(i%2)*.45,((i%2)-.5)*depth*.3);m.scale.setScalar(blast*(big?1.7:.65));m.rotation.set(age*2,i,age);mat.opacity=blast*.85;core.material.opacity=blast*.9;
   });
   const age=(ms-2630)/600;wave.visible=age>=0&&age<1;wave.scale.setScalar(1+Math.max(0,age)*3.3);waveMat.opacity=age>=0?(1-age)*.75:0;
   if(title){title.position.set(cx,g+3.8,cz);title.material.opacity=ease(ms,0,150)*(1-ease(ms,650,900));}
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
