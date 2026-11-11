/* Naruto's original unskinned mesh: baked articulated poses, shared by clones.
   Eight position targets fit the existing Three.js WebGL1 morph budget.
   No texture/source geometry changes; no per-vertex work during a frame. */
(function(){
'use strict';
const T=window.THREE, V=(x,y,z)=>new T.Vector3(x,y,z), smooth=T.MathUtils.smoothstep;
const names=['guard','seal','runA','runB','punch','kick','hold','throw'];
const cache=new WeakMap();
function arm(side,hand){
 const shoulder=V(side*.174,1.473,-.010),elbow=V(side*.369,1.241,-.012),wrist=V(side*.532,1.050,-.008);
 const end=V(...hand),line=end.clone().sub(shoulder),len=line.length();line.normalize();
 const upper=shoulder.distanceTo(elbow),lower=elbow.distanceTo(wrist);
 const along=(len*len+upper*upper-lower*lower)/(2*len);
 const bend=V(side,-.5,-.7);bend.addScaledVector(line,-bend.dot(line)).normalize();
 const joint=shoulder.clone().addScaledVector(line,along).addScaledVector(bend,Math.sqrt(Math.max(0,upper*upper-along*along)));
 const q1=new T.Quaternion().setFromUnitVectors(elbow.clone().sub(shoulder).normalize(),joint.clone().sub(shoulder).normalize());
 const q2=new T.Quaternion().setFromUnitVectors(wrist.clone().sub(elbow).normalize(),end.clone().sub(joint).normalize());
 return {shoulder,elbow,wrist,end,joint,q1,q2};
}
function spec(name){
 let hands=[[-.23,1.29,.32],[.23,1.30,.33]],legs=[.10,-.10],knees=[.15,.15];
 if(name==='seal')hands=[[-.045,1.36,.31],[.045,1.36,.33]];
 if(name==='runA'||name==='runB'){
  const s=name==='runA'?1:-1;hands=[[-.26,1.15,s*.35],[.26,1.15,-s*.35]];legs=[s*.60,-s*.60];knees=[s>0?.8:.18,s>0?.18:.8];
 }
 if(name==='punch')hands=[[-.22,1.30,.22],[.20,1.39,.55]];
 if(name==='kick'){legs=[.05,-1.15];knees=[.18,.12];hands=[[-.35,1.27,.10],[.30,1.32,.26]];}
 if(name==='hold')hands=[[-.20,1.33,.33],[.24,1.22,.46]];
 if(name==='throw')hands=[[-.34,1.21,-.10],[.21,1.65,.46]];
 return {arms:[arm(-1,hands[0]),arm(1,hands[1])],legs,knees};
}
function bake(source){
 if(cache.has(source))return cache.get(source);
 const geo=source.clone(),src=source.attributes.position;
 geo.morphAttributes={position:[]};
 for(const name of names){
  const pose=spec(name),out=new Float32Array(src.count*3),p=V(0,0,0),a=V(0,0,0),b=V(0,0,0);
  for(let i=0;i<src.count;i++){
   p.fromBufferAttribute(src,i);const original=p.clone(),x=Math.abs(p.x),side=p.x<0?-1:1,k=side<0?0:1;
   const weight=smooth(x,.14,.25)*smooth(p.y,.87,1.02)*(1-smooth(p.y,1.49,1.64));
   if(weight>0){const r=pose.arms[k];a.copy(p).sub(r.shoulder).applyQuaternion(r.q1).add(r.shoulder);
    b.copy(p).sub(r.elbow).applyQuaternion(r.q2).add(r.joint);
    a.lerp(b,smooth(x,.31,.41));p.lerp(a,weight);}
   const leg=(1-smooth(original.y,.83,1.01))*smooth(x,.035,.10);
   if(leg>0){a.copy(original);const hip=V(side*.12,.96,0),knee=V(side*.14,.52,.01);
    if(original.y<.57){b.copy(a).sub(knee).applyAxisAngle(V(1,0,0),pose.knees[k]).add(knee);a.lerp(b,1-smooth(original.y,.47,.59));}
    a.sub(hip).applyAxisAngle(V(1,0,0),pose.legs[k]).add(hip);p.lerp(a,leg);}
   out.set([p.x,p.y,p.z],i*3);
  }
  geo.morphAttributes.position.push(new T.Float32BufferAttribute(out,3));
 }
 geo.morphTargetsRelative=false;geo.computeBoundingBox();geo.computeBoundingSphere();cache.set(source,geo);return geo;
}
function mount(figure){
 const meshes=[];figure.traverse(m=>{if(!m.isMesh||!m.geometry.attributes.position)return;
  m.geometry=bake(m.geometry);m.updateMorphTargets();m.frustumCulled=false;meshes.push(m);});
 const scale=figure.scale.y;
 function blend(a,b,t){for(const m of meshes){m.morphTargetInfluences.fill(0);m.morphTargetInfluences[names.indexOf(a)]=1-t;m.morphTargetInfluences[names.indexOf(b)]+=t;}}
 const motion=function(dt,now,active,p=-1,technique=0){
  blend('guard','guard',0);
  figure.scale.y=scale*(1+.004*Math.sin(now*.002));figure.rotation.x=.012*Math.sin(now*.0014);figure.rotation.y=.018*Math.sin(now*.0011);
 };
 motion.blend=blend;motion.dispose=()=>{};motion.inspect=()=>({id:'naruto',articulated:true,poses:names});
 return motion;
}
window.NarutoCombat={mount,names};
})();
