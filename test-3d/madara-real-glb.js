/* User-selected GLB, CC BY 4.0: Madara Perfect Susano Sktech, cgpixel3d.
   https://sketchfab.com/3d-models/madara-perfect-susano-sktech-04f78e93ac864f7fb33608305b6e7840
   Only override the ultimate: keep MadaraSusanoo.build(false) for skill 2/profile. */
(function(){
'use strict';
const T=window.THREE, S=window.MadaraSusanoo, E=T?.MathUtils?.smoothstep;
if(!T||!T.GLTFLoader||!S){console.error('[Madara GLB] Loader missing');return;}
const url=new URL('models/madara_perfect_susano_sktech.glb?v=20261113-original',document.currentScript.src).href;
let gltf=null,state='loading',error=null;const listeners=new Set();
new T.GLTFLoader().load(url,x=>{gltf=x;state='ready';for(const cb of listeners)cb();listeners.clear();},undefined,e=>{error=String(e?.message||e);state='error';listeners.clear();console.error('[Madara GLB] Missing original asset, no procedural replacement',url,error);});
S.cast=function(scene,slot,target){
 const root=new T.Group();root.name='madara-user-susanoo-glb';scene.add(root);
 const fx=new T.Group();scene.add(fx);const owned=[];
 const dir=slot.side==='foeTeam'?-1:1;
 const victims=(slot.targets||[target]).filter(Boolean);
 const center=victims.reduce((p,v)=>p.add(v.home||v.actor.position),new T.Vector3()).multiplyScalar(1/Math.max(1,victims.length));
 const material=(color,opacity)=>{let m=new T.MeshBasicMaterial({color,opacity,transparent:true,depthWrite:false,side:T.DoubleSide});owned.push(m);return m;};
 const make=(g,m)=>{const o=new T.Mesh(g,m);fx.add(o);owned.push(g);return o;};
 const haloMat=material(0x63c8ff,.34),halo=make(new T.TorusGeometry(1,.023,6,44),haloMat),halo2=make(new T.TorusGeometry(1,.015,6,44),haloMat);
 halo.rotation.x=halo2.rotation.x=Math.PI/2;
 const slashMat=material(0xabefff,.85),slash=make(new T.TorusGeometry(1.3,.075,8,60,Math.PI*1.35),slashMat);
 const waveMat=material(0x5bc6ff,.40),wave=make(new T.RingGeometry(.90,1.1,52),waveMat);
 const hitMat=material(0xe1faff,.84),hitGeo=new T.TorusGeometry(.35,.038,6,28);owned.push(hitGeo);
 const rings=victims.map(v=>{let o=new T.Mesh(hitGeo,hitMat);fx.add(o);return {v,o};});
 // Broad layered sword crescents (the sword stays inside the ORIGINAL GLB).
 const bladeBackMat=material(0x2186ff,.72),bladeFrontMat=material(0xe5faff,.88);
 const bladeBack=make(new T.TorusGeometry(1.65,.16,8,56,Math.PI*1.30),bladeBackMat);
 const bladeFront=make(new T.TorusGeometry(1.86,.038,6,64,Math.PI*1.32),bladeFrontMat);
 const quake=new T.Group();fx.add(quake);quake.name='madara-susanoo-destruction';
 // Ground fissures converge on the enemy team's center: geometry is effect only.
 const paths=[];
 for(let a=0;a<14;a++){
   const theta=a*Math.PI*2/14;let px=0,pz=0;
   for(let n=1;n<=4;n++){
     const radius=n/4*(1.6+(a%4)*.20),bend=.12*Math.sin(a*3.3+n*2.1);
     const x=Math.cos(theta+bend)*radius,z=Math.sin(theta+bend)*radius;
     paths.push(px,.014,pz,x,.014,z);
     if(n===3&&a%2===0){
       const side=theta+(a%4===0?.66:-.66);
       paths.push(x,.014,z,x+.50*Math.cos(side),.014,z+.50*Math.sin(side));
     }
     px=x;pz=z;
   }
 }
 const crackGeo=new T.BufferGeometry();crackGeo.setAttribute('position',new T.Float32BufferAttribute(paths,3));owned.push(crackGeo);
 const crackMat=material(0x8cceff,.0),cracks=new T.LineSegments(crackGeo,crackMat);quake.add(cracks);
 const ringGeo=new T.TorusGeometry(1,.065,6,48),ringMat=material(0xb4ecff,.0);
 const craterRing=new T.Mesh(ringGeo,ringMat);craterRing.rotation.x=Math.PI/2;quake.add(craterRing);owned.push(ringGeo);
 const lowRingGeo=new T.RingGeometry(.78,1.23,48),lowRingMat=material(0x56a7fa,0);
 const dustRing=new T.Mesh(lowRingGeo,lowRingMat);dustRing.rotation.x=-Math.PI/2;quake.add(dustRing);owned.push(lowRingGeo);
 // One GPU draw for all 22 pieces of shattered ground (mobile-friendly).
 const fragmentGeo=new T.TetrahedronGeometry(.14,0),fragmentMat=material(0x8fabbc,.78);
 const fragments=new T.InstancedMesh(fragmentGeo,fragmentMat,22);fragments.frustumCulled=false;quake.add(fragments);owned.push(fragmentGeo);
 const dummy=new T.Object3D();
 const cloudGeo=new T.IcosahedronGeometry(.5,1),cloudMat=material(0x8d9cad,.0),clouds=[];
 owned.push(cloudGeo);
 for(let i=0;i<7;i++){const c=new T.Mesh(cloudGeo,cloudMat);quake.add(c);clouds.push(c);}
 const light=new T.PointLight(0x74c9ff,1.9,9,2);fx.add(light);
 let model=null,mixer=null,clonedMats=[],hit=false,disposed=false,elapsedMs=0;
 function attach(){
  if(disposed||model||!gltf?.scene)return;
  model=gltf.scene.clone(true);model.name='madara_perfect_susano_sktech.glb';
  model.traverse(o=>{if(!o.isMesh)return;const current=Array.isArray(o.material)?o.material:[o.material];
    const copies=current.map(m=>{const x=m.clone();x.transparent=true;x.depthWrite=false;clonedMats.push([x,m.opacity??1]);return x;});
    o.material=Array.isArray(o.material)?copies:copies[0];o.frustumCulled=false;
  });
  const box=new T.Box3().setFromObject(model),ctr=box.getCenter(new T.Vector3()),sz=box.getSize(new T.Vector3());
  if(sz.y<.01){console.error('[Madara GLB] Invalid model bounds');return;}
  // 46% taller than previous release; preserve exact original GLB meshes and textures.
  const scale=4.60/sz.y;model.scale.multiplyScalar(scale);model.position.set(-ctr.x*scale,-box.min.y*scale,-ctr.z*scale);root.add(model);
  if(gltf.animations?.length){mixer=new T.AnimationMixer(model);mixer.clipAction(gltf.animations[0]).play();}
 }
 if(gltf)attach();else if(state==='loading')listeners.add(attach);
 if(state==='error')console.error('[Madara GLB] No replacement model used',error);
 function update(ms,ground){
  if(disposed)return false;elapsedMs=ms;const p=Math.max(0,Math.min(1,ms/5000));
  if(ms>=3318&&!hit){hit=true;for(const v of victims){v.hitAt=slot.effectAt+3318;v.hitFrom=slot.actor.position.clone();}const cb=slot.onImpact;slot.onImpact=null;cb?.();}
  if(p>=1){dispose();return false;}
  // Reach the exact unchanged damage frame (3318ms) at the sword strike's apex.
  const summon=E(p,.05,.26),wind=E(p,.37,.50),cut=E(p,.51,.666),recover=E(p,.666,.82);
  root.position.copy(slot.actor.position).setY(ground);root.position.x+=-dir*.58+dir*.78*cut*(1-recover);root.position.z-=.18;
  root.scale.setScalar(.07+.93*summon);
  root.rotation.y=(dir>0?Math.PI/2:-Math.PI/2)-dir*.42*wind*(1-cut)+dir*.66*cut*(1-recover);
  root.rotation.z=dir*(.085*wind*(1-cut)-.15*cut*(1-recover));
  if(model){let alpha=E(p,.07,.22)*(1-E(p,.86,.995));for(const [m,a] of clonedMats)m.opacity=a*alpha;if(mixer)mixer.setTime(ms*.001);}
  fx.position.copy(slot.actor.position).setY(ground);
  const chakra=E(p,0,.16)*(1-E(p,.30,.54));haloMat.opacity=.34*chakra;
  for(const [i,r] of [halo,halo2].entries()){let q=(p*3+i*.5)%1;r.position.set(-dir*.48,.13+q*.5,-.18);r.scale.setScalar(.7+q*2.1);}
  light.position.set(-dir*.45,1.6,-.2);light.intensity=.7+2.1*chakra+.95*cut*(1-recover);
  // Three coherent crescents track the original figure's sword-swing direction.
  const slice=E(p,.515,.575)*(1-E(p,.69,.79)),travel=E(p,.56,.67);
  for(const [i,arc] of [slash,bladeBack,bladeFront].entries()){
    arc.visible=slice>.002;
    arc.position.set(-dir*.55+dir*(1.25+ i*.12)*travel,2.12+i*.08,.05+i*.05);
    arc.scale.set(1.25+.47*travel+i*.10,1.05+.26*travel+i*.05,1);
    arc.rotation.z=dir*(-.35+1.95*E(p,.52,.67))+i*.04;
  }
  slashMat.opacity=.76*slice;bladeBackMat.opacity=.60*slice;bladeFrontMat.opacity=.94*slice;
  // Wide traveling pressure wall reaches the whole enemy formation.
  wave.visible=p>.55&&p<.82;
  wave.position.set((center.x-slot.actor.position.x)*travel,1.48,center.z-slot.actor.position.z);
  wave.scale.set(1.2+3.5*travel,1.0+1.2*travel,1.3);
  wave.rotation.y=dir>0?Math.PI/2:-Math.PI/2;
  waveMat.opacity=.60*E(p,.55,.63)*(1-E(p,.70,.82));
  // The aftermath starts ON impact; no random bursts before the sword lands.
  const age=ms-3318,after=Math.max(0,age/1650),rise=E(age,0,310),fade=1-E(age,850,1670);
  hitMat.opacity=.93*(1-E(age,0,590));
  for(const {v,o} of rings){
    o.visible=age>=0&&age<650;
    const point=v.home||v.actor.position;
    o.position.set(point.x-slot.actor.position.x,1,point.z-slot.actor.position.z);
    o.scale.setScalar(.4+2.8*E(age,0,650));
  }
  quake.visible=age>=0;
  quake.position.set(center.x-slot.actor.position.x,.05,center.z-slot.actor.position.z);
  const quakeScale=.06+2.0*E(age,0,1050);
  cracks.scale.set(quakeScale,1,quakeScale);crackMat.opacity=.80*rise*fade;
  craterRing.scale.setScalar(.1+3.3*E(age,0,1150));ringMat.opacity=.83*rise*(1-E(age,500,1350));
  dustRing.scale.setScalar(.20+2.65*E(age,0,980));lowRingMat.opacity=.31*rise*fade;
  fragments.visible=age>=0&&age<1690;fragmentMat.opacity=.9*fade;
  for(let i=0;i<22;i++){
    const a=i*2.399963+Math.sin(i*4.1)*.12;
    const dist=(.65+(i%5)*.34)*E(age,0,950);
    const up=Math.max(0,1.9*(.7+(i%4)*.20)*Math.sin(Math.PI*Math.min(1,after)));
    dummy.position.set(Math.cos(a)*dist,.07+up,Math.sin(a)*dist);
    dummy.rotation.set(i*.9+age*.0016,i*1.3+age*.002,i*.2+age*.002);
    dummy.scale.setScalar(.64+(i%4)*.23);
    dummy.updateMatrix();fragments.setMatrixAt(i,dummy.matrix);
  }
  if(fragments.visible)fragments.instanceMatrix.needsUpdate=true;
  cloudMat.opacity=.28*rise*(1-E(age,780,1670));
  for(let i=0;i<clouds.length;i++){
    const a=i*2.399963,drift=E(age,0,1480)*(.55+(i%3)*.24),c=clouds[i];
    c.visible=age>=0&&age<1700;
    c.position.set(Math.cos(a)*drift,.24+drift*.36,Math.sin(a)*drift);
    c.scale.set(.55+drift*.65,.26+drift*.36,.55+drift*.65);
  }
  light.intensity+=age>=0?1.5*rise*(1-E(age,100,650)):0;
  return true;
 }
 function dispose(){if(disposed)return;disposed=true;listeners.delete(attach);slot.onImpact=null;
  mixer?.stopAllAction();scene.remove(root,fx);for(const [m] of clonedMats)m.dispose();for(const obj of owned)obj.dispose();
  /* Original shared GLB geometry/material are cached and never disposed per cast. */
 }
 return {update,dispose,inspect:()=>({id:'madara',technique:2,kind:'original-glb',file:url,loaded:!!model,status:state,error,animations:gltf?.animations?.length||0,hit,elapsedMs,disposed,victims:victims.length})};
};
window.MadaraRealSusanoo={get status(){return state},get url(){return url},inspect(){return {status:state,error,animations:gltf?.animations?.length||0,model:'madara_perfect_susano_sktech.glb'}}};
})();