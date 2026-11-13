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
  const scale=3.15/sz.y;model.scale.multiplyScalar(scale);model.position.set(-ctr.x*scale,-box.min.y*scale,-ctr.z*scale);root.add(model);
  if(gltf.animations?.length){mixer=new T.AnimationMixer(model);mixer.clipAction(gltf.animations[0]).play();}
 }
 if(gltf)attach();else if(state==='loading')listeners.add(attach);
 if(state==='error')console.error('[Madara GLB] No replacement model used',error);
 function update(ms,ground){
  if(disposed)return false;elapsedMs=ms;const p=Math.max(0,Math.min(1,ms/4200));
  if(ms>=3318&&!hit){hit=true;for(const v of victims){v.hitAt=slot.effectAt+3318;v.hitFrom=slot.actor.position.clone();}const cb=slot.onImpact;slot.onImpact=null;cb?.();}
  if(p>=1){dispose();return false;}
  const summon=E(p,.08,.30),wind=E(p,.43,.59),cut=E(p,.60,.79),recover=E(p,.79,.93);
  root.position.copy(slot.actor.position).setY(ground);root.position.x+=-dir*.48+dir*.42*cut*(1-recover);root.position.z-=.18;
  root.scale.setScalar(.07+.93*summon);root.rotation.y=(dir>0?Math.PI/2:-Math.PI/2)-dir*.28*wind*(1-cut)+dir*.44*cut*(1-recover);
  root.rotation.z=dir*(.055*wind*(1-cut)-.095*cut*(1-recover));
  if(model){let alpha=E(p,.09,.23)*(1-E(p,.86,.99));for(const [m,a] of clonedMats)m.opacity=a*alpha;if(mixer)mixer.setTime(ms*.001);}
  fx.position.copy(slot.actor.position).setY(ground);
  const chakra=E(p,0,.16)*(1-E(p,.30,.54));haloMat.opacity=.34*chakra;
  for(const [i,r] of [halo,halo2].entries()){let q=(p*3+i*.5)%1;r.position.set(-dir*.48,.13+q*.5,-.18);r.scale.setScalar(.7+q*2.1);}
  light.position.set(-dir*.45,1.6,-.2);light.intensity=.7+2.1*chakra+.95*cut*(1-recover);
  let slice=E(p,.64,.76)*(1-E(p,.79,.86));slash.visible=slice>.002;
  slash.position.set(-dir*.2+dir*E(p,.63,.79),1.70,.14);
  slash.scale.set(1+.6*E(p,.64,.78),.80+.45*E(p,.64,.78),1);
  slash.rotation.z=(dir>0?-.35:.35)+dir*1.5*E(p,.62,.80);slashMat.opacity=.85*slice;
  let travel=E(p,.68,.80);wave.visible=p>.66&&p<.91;
  wave.position.set((center.x-slot.actor.position.x)*travel,1.15,center.z-slot.actor.position.z);
  wave.scale.set(1+1.9*travel,1.4+.8*travel,1);wave.rotation.y=dir>0?0:Math.PI;
  waveMat.opacity=.40*(1-E(p,.81,.91));
  let age=(ms-3318)/520;hitMat.opacity=.84*(1-Math.min(1,Math.max(0,age)));
  for(const {v,o} of rings){o.visible=age>=0&&age<1;const point=v.home||v.actor.position;o.position.set(point.x-slot.actor.position.x,1,point.z-slot.actor.position.z);o.scale.setScalar(.3+2.2*Math.max(0,age));}
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