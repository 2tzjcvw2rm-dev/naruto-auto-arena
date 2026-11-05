/* Looping 3D skeletal Susanoo for Madara's character profile.
   It surrounds the original GLB and does not change combat or save data. */
(function(){
'use strict';
window.createMadaraProfileSusanoo=function(T,parent){
  const root=new T.Group();root.name='madara-profile-skeletal-susanoo';parent.add(root);
  const owned=new Set(),use=x=>{owned.add(x);return x;};
  const material=(color,opacity,additive=false)=>use(new T.MeshBasicMaterial({
    color,transparent:true,opacity,depthWrite:false,
    blending:additive?T.AdditiveBlending:T.NormalBlending
  }));
  const violet=material(0x8647d8,.78),bright=material(0xe6b7ff,.84,true),
        haze=material(0x723bc1,.05),eyes=material(0xff4b98,.8,true);
  const mesh=(geo,mat,parentNode=root)=>{
    const m=new T.Mesh(use(geo),mat);parentNode.add(m);return m;
  };
  const tube=(points,radius,mat,parentNode=root)=>{
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    return mesh(new T.TubeGeometry(curve,12,radius,6,false),mat,parentNode);
  };
  const ribs=[];
  for(let i=0;i<6;i++){
    const pair=new T.Group();root.add(pair);ribs.push(pair);
    const y=-.19+i*.075,w=.27+.075*Math.sin(i*Math.PI/5);
    for(const side of [-1,1]){
      const arc=[[0,y+.02,-.22],[side*w*.8,y+.05,-.15],
        [side*w,y+.01,.01],[side*w*.75,y-.035,.19],[side*.11,y-.04,.23]];
      tube(arc,.023,violet,pair);tube(arc,.008,bright,pair);
    }
  }
  tube([[0,-.32,-.20],[0,-.11,-.23],[0,.12,-.22],[0,.35,-.15]],.035,violet);
  tube([[0,-.3,-.19],[0,.11,-.22],[0,.36,-.15]],.012,bright);
  for(const side of [-1,1]){
    tube([[0,.32,-.16],[side*.18,.36,-.12],[side*.37,.32,-.02]],.035,violet);
    tube([[side*.18,.36,-.12],[side*.37,.32,-.02]],.011,bright);
  }
  const arms=[];
  for(const side of [-1,1]){
    const arm=new T.Group();root.add(arm);arm.position.set(side*.37,.32,-.02);
    tube([[0,0,0],[side*.08,-.12,.08],[side*.11,-.23,.17]],.036,violet,arm);
    tube([[side*.11,-.23,.17],[side*.08,-.30,.25],[side*.035,-.35,.32]],.038,violet,arm);
    tube([[side*.10,-.22,.17],[side*.035,-.35,.32]],.013,bright,arm);
    const fist=mesh(new T.IcosahedronGeometry(.07,1),bright,arm);
    fist.position.set(side*.035,-.35,.32);
    arms.push({side,arm,fist});
  }
  const veil=mesh(new T.SphereGeometry(1,12,10),haze);
  veil.position.y=.015;veil.scale.set(.39,.47,.3);
  for(const side of [-1,1]){
    const eye=mesh(new T.SphereGeometry(.018,8,6),eyes);
    eye.position.set(side*.075,.4,.18);
  }
  const count=40,points=new Float32Array(count*3),geometry=use(new T.BufferGeometry());
  geometry.setAttribute('position',new T.BufferAttribute(points,3));
  const dust=use(new T.PointsMaterial({
    color:0xd4b0ff,size:.018,transparent:true,opacity:.77,
    depthWrite:false,blending:T.AdditiveBlending
  }));
  root.add(new T.Points(geometry,dust));
  let disposed=false;
  const update=(dt,now)=>{
    if(disposed)return;
    const t=now*.001,pulse=1+.04*Math.sin(t*2.3);
    violet.opacity=.71+.09*Math.sin(t*2.1);
    bright.opacity=.72+.12*Math.sin(t*3.5);
    haze.opacity=.05+.013*Math.sin(t*1.7);
    veil.scale.set(.39*pulse,.47,.3*pulse);
    ribs.forEach((rib,i)=>{rib.scale.x=1+.022*Math.sin(t*2.2-i*.35);});
    arms.forEach(({side,arm,fist},i)=>{
      arm.rotation.z=side*.07*Math.sin(t*1.8+i*1.2);
      arm.rotation.x=.07*Math.sin(t*2.1+i);
      fist.scale.setScalar(1+.09*Math.sin(t*3+i));
    });
    for(let i=0;i<count;i++){
      const a=i*2.39996+t*.55,r=.29+(i%7)*.033;
      points[3*i]=Math.cos(a)*r;
      points[3*i+1]=((i*.117+t*.13)%1)-.5;
      points[3*i+2]=Math.sin(a)*r*.8;
    }
    geometry.attributes.position.needsUpdate=true;
  };
  update.inspect=()=>({name:root.name,ribs:ribs.length,arms:arms.length,disposed});
  update.dispose=()=>{
    if(disposed)return;
    disposed=true;parent.remove(root);
    for(const item of owned)item.dispose();
    owned.clear();
  };
  return update;
};
})();