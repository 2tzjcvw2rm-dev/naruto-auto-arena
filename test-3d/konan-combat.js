/* Original unrigged konan.glb is preserved. All times are arena GAME milliseconds. */
(function(){
'use strict';
const T=window.THREE,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),ease=T.MathUtils.smoothstep;
const durations=[1450,1750,2150],impactTimes=[770,1050,1400];
function pose(fighter){
 const rest=fighter.rotation.clone();
 return {update(p,technique){fighter.rotation.copy(rest);if(p<0)return;
 const brace=ease(p,0,.20)*(1-ease(p,.72,1));
 fighter.rotation.x+=.045*brace;fighter.rotation.y+=.035*Math.sin(p*Math.PI*2)*brace;
 },dispose(){fighter.rotation.copy(rest)},inspect:()=>({rigged:false,mode:'original-static-paper-model'})};
}
// Raised folds, pointed silhouettes and separate grey undersides, never square particles.
function paperGeometry(star=false){
 const vertices=[],colors=[],white=new T.Color(0xf1f5f5),grey=new T.Color(0x99aeb9);
 const points=star?Array.from({length:8},(_,i)=>{const a=i*Math.PI/4,r=i%2?.075:.28;return [Math.cos(a)*r,Math.sin(a)*r,0]}):[[0,.32,0],[-.085,-.12,0],[0,-.23,0],[.085,-.12,0]];
 points.forEach((a,i)=>{const b=points[(i+1)%points.length];vertices.push(0,0,.035,...a,...b);const c=i%2?grey:white;for(let j=0;j<3;j++)colors.push(c.r,c.g,c.b)});
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
function create(scene,slot,target,technique){
 const root=new T.Group();root.name='konan-paper-'+technique;scene.add(root);
 const geometry=paperGeometry(technique===0),scrapGeometry=paperGeometry();
 const mat=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,opacity:1,depthWrite:false});
 const victims=technique===0?[target]:(slot.targets||[target]),perWave=Math.max(4,victims.length),count=technique===0?5:technique===1?perWave*3:36,papers=[],bursts=[];
 for(let i=0;i<count;i++){const mesh=new T.Mesh(geometry,mat);root.add(mesh);papers.push(mesh)}
 for(let i=0;i<(technique===2?victims.length:count);i++){const bits=[];for(let j=0;j<3;j++){const m=new T.Mesh(scrapGeometry,mat);root.add(m);bits.push(m)}bursts.push(bits)}
 let disposed=false,hit=false,elapsedMs=0;
 function update(ms,ground){
 if(disposed)return false;elapsedMs=ms;
 if(ms>=impactTimes[technique]&&!hit){hit=true;const apply=slot.onImpact;slot.onImpact=null;apply?.();}
 if(ms>=durations[technique]){dispose();return false;}
 if(technique===2){
 const direction=target.home.x>slot.home.x?1:-1;
 for(let i=0;i<count;i++){
 const m=papers[i],v=victims[i%victims.length],band=Math.floor(i/victims.length);
 const launch=650+band*35,arrival=1400+band*45,travel=(ms-launch)/(arrival-launch);
 // A narrow, open helix behind the wings: no opaque sphere over the face.
 const angle=i*2.399+ms*.006,radius=.48+(i%4)*.09;
 const orbit=slot.home.clone().add(V(-direction*(.20+.16*Math.cos(angle)),ground+1.0+Math.sin(angle)*.44,Math.cos(angle)*radius));
 const releaseAngle=i*2.399+launch*.006;
 const start=slot.home.clone().add(V(-direction*(.20+.16*Math.cos(releaseAngle)),ground+1.0+Math.sin(releaseAngle)*.44,Math.cos(releaseAngle)*radius));
 const end=v.home.clone().setY(ground+.94+(band%3-1)*.13);
 m.visible=ms>=i*8&&ms<arrival+260;
 if(travel<0)m.position.copy(orbit);
 else if(travel<1){m.position.copy(start).lerp(end,travel);m.position.y+=Math.sin(Math.PI*travel)*.20;}
 else {const age=(ms-arrival)/260;m.position.copy(end).add(V(direction*age*.40,Math.sin(i*3)*age*.20,Math.cos(i*2)*age*.24));}
 const fade=1-ease(ms,arrival,arrival+260);
 m.scale.setScalar((.55+(i%5)*.07)*ease(ms,i*8,i*8+180)*fade);
 m.rotation.set(.25*Math.sin(ms*.007+i),.38*Math.cos(ms*.009+i),travel<0?angle:-direction*Math.PI/2+.22*Math.sin(ms*.015+i));
 }
 for(let i=0;i<victims.length;i++){
 const v=victims[i],age=(ms-1400)/270,end=v.home.clone().setY(ground+1.05);
 for(let j=0;j<3;j++){const b=bursts[i][j];b.visible=age>=0&&age<1;b.position.copy(end).add(V(direction*age*.25,(j-1)*age*.28,Math.cos(j*2)*age*.26));b.scale.setScalar(.42*Math.max(0,1-age));b.rotation.set(j+age*4,i,age*5);}
 if(ms>=1400&&ms<1480){v.hitAt=slot.effectAt+1400;v.hitFrom=slot.home.clone();}
 }
 return true;
 }
 if(technique===1){
 for(let i=0;i<count;i++){
 const wave=Math.floor(i/perWave),lane=i%perWave,v=victims[lane%victims.length];
 const launch=460+wave*175,arrival=1050+wave*175,t=(ms-launch)/(arrival-launch),m=papers[i];
 // Two compact rows sit beside the original wings; the sculpt is untouched.
 const side=lane%2?1:-1,rank=Math.floor(lane/2),dir=v.home.x>slot.home.x?1:-1;
 const start=slot.home.clone().add(V(-dir*.15,ground+1.15+rank*.18,side*(.32+rank*.16)));
 const end=v.home.clone().setY(ground+1.05);
 m.visible=ms>=80+wave*55&&t<1;m.position.copy(start).lerp(end,Math.max(0,t));
 m.position.y+=Math.sin(Math.PI*Math.max(0,t))*.16;
 m.rotation.set(.15*Math.sin(ms*.008+i),0,-dir*Math.PI/2+.08*Math.sin(ms*.012+i));
 m.scale.setScalar((.75+wave*.08)*ease(ms,80+wave*55,330+wave*55));
 const age=(ms-arrival)/200;
 for(let j=0;j<3;j++){const b=bursts[i][j];b.visible=age>=0&&age<1;b.position.copy(end).add(V(dir*age*.18,(j-1)*age*.22,Math.sin(j*2+i)*age*.26));b.scale.setScalar(.28*Math.max(0,1-age));b.rotation.set(j+age*4,i,age*3)}
 if(ms>=arrival&&ms<arrival+80){v.hitAt=slot.effectAt+arrival;v.hitFrom=slot.home.clone();}
 }
 return true;
 }
 const from=slot.home.clone().setY(ground+1.03),to=target.home.clone().setY(ground+1.02),dir=to.clone().sub(from).normalize();from.addScaledVector(dir,.38);
 for(let i=0;i<count;i++){
 const launch=330+i*95,arrival=770+i*95,t=(ms-launch)/(arrival-launch),m=papers[i];
 const start=from.clone().add(V(0,(i-2)*.14,(i-2)*.075));
 m.visible=ms>=60+i*25&&t<1;m.position.copy(start).lerp(to,Math.max(0,t));
 m.position.y+=Math.max(0,Math.sin(Math.PI*Math.max(0,t)))*.13;
 m.rotation.set(.18,0,ms*.016+i);m.scale.setScalar(ease(ms,60+i*25,220+i*15));
 const age=(ms-arrival)/210;
 for(let j=0;j<3;j++){const b=bursts[i][j];b.visible=age>=0&&age<1;b.position.copy(to).add(V((j-1)*age*.24,Math.sin(j*2+1)*age*.25,Math.cos(j*2)*age*.24));b.scale.setScalar(.30*Math.max(0,1-age));b.rotation.set(j+age*3,age*2,j);}
 if(ms>=arrival&&ms<arrival+80){target.hitAt=slot.effectAt+arrival;target.hitFrom=slot.home.clone();}
 }
 return true;
 }
 function dispose(){if(disposed)return;disposed=true;slot.onImpact=null;scene.remove(root);geometry.dispose();scrapGeometry.dispose();mat.dispose();}
 return {update,dispose,inspect:()=>({id:'konan',technique,kind:['paper-shuriken','wing-blades','paper-storm'][technique],count,victims:victims.length,elapsedMs,hit,disposed})};
}
window.KonanCombat={durations,impactTimes,pose,create};
})();
