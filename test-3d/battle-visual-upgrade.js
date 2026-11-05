/* Original 3D jutsu for the shared mobile battlefield.
 * Small GPU footprint; no imported art, GLB mutation, or extra render loop.
 * Timed entirely by the battle clock so manual 1x/2x/3x affects every phase. */
(function(){
'use strict';
window.createArenaTechniqueFX=function(THREE,scene,slot,target,technique,kind,color){
  const root=new THREE.Group();root.name='jutsu-'+slot.id+'-'+technique;scene.add(root);
  const resources=new Set(),mats=[];
  const mat=(c,alpha=1)=>{
    const m=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:alpha,
      depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
    m.userData.baseAlpha=alpha;resources.add(m);mats.push(m);return m;
  };
  const primary=mat(color,.9),white=mat('#ffffff',.87),ghost=mat(color,.28);
  const mesh=(geometry,material,parent=root)=>{
    resources.add(geometry);const object=new THREE.Mesh(geometry,material);parent.add(object);return object;
  };
  const heal=kind==='heal'||kind==='support',melee=technique===0||kind==='melee';
  const charge=mesh(new THREE.IcosahedronGeometry(.28,1),primary);
  const center=mesh(new THREE.SphereGeometry(.12,10,8),white);
  const halos=[];
  for(let i=0;i<(kind==='orb'||kind==='lightning'?3:2);i++){
    const h=mesh(new THREE.TorusGeometry(.32+i*.11,.025,5,28),i%2?white:primary);
    h.rotation.set(i*.6,i*.9,0);halos.push(h);
  }
  const impact=new THREE.Group();root.add(impact);
  const ring=mesh(new THREE.TorusGeometry(1,.046,5,32),primary,impact);
  const flash=mesh(new THREE.TorusGeometry(1,.026,5,32),white,impact);
  const floor=mesh(new THREE.TorusGeometry(1,.03,5,32),ghost,impact);floor.rotation.x=-Math.PI/2;
  const sparkCount=18,particlePositions=new Float32Array(sparkCount*3);
  const sparkGeo=new THREE.BufferGeometry();
  sparkGeo.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));resources.add(sparkGeo);
  const sparkMat=new THREE.PointsMaterial({color,size:.09,transparent:true,opacity:.85,
    depthWrite:false,blending:THREE.AdditiveBlending});resources.add(sparkMat);
  root.add(new THREE.Points(sparkGeo,sparkMat));
  const extras=[];
  const paper=slot.id==='konan';
  if(kind==='fire'||kind==='bomb'){
    for(let i=0;i<6;i++)extras.push(mesh(new THREE.ConeGeometry(.12,.5,6),i%3?primary:white));
  }else if(paper||kind==='clones'){
    for(let i=0;i<9;i++)extras.push(mesh(paper?new THREE.PlaneGeometry(.22,.33):new THREE.OctahedronGeometry(.17,0),
      i%3?ghost:white));
  }else if(kind==='shadow'){
    for(let i=0;i<3;i++){
      const e=mesh(new THREE.TorusGeometry(.3+i*.19,.024,5,28),ghost);
      e.rotation.x=-Math.PI/2;extras.push(e);
    }
  }
  let bolts=null,boltPositions=null;
  if(kind==='lightning'){
    boltPositions=new Float32Array(12*6);
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(boltPositions,3));resources.add(geometry);
    const m=new THREE.LineBasicMaterial({color:'#c8f2ff',transparent:true,opacity:.9,depthWrite:false});
    resources.add(m);bolts=new THREE.LineSegments(geometry,m);root.add(bolts);
  }
  const start=new THREE.Vector3(),end=new THREE.Vector3();
  const ease=(v,a,b)=>THREE.MathUtils.smoothstep(v,a,b);
  let disposed=false,elapsedMs=0,phase='charge';
  return {
    update(ms,ground){
      if(disposed)return false;
      elapsedMs=ms;
      const p=ms/1400;
      if(p>=1){this.dispose();return false}
      phase=p<.36?'charge':p<.54?'projectile':p<.77?'impact':'fade';
      start.set(slot.actor.position.x,ground+1.08,slot.actor.position.z);
      end.set(target.actor.position.x,ground+(heal?.93:1.08),target.actor.position.z);
      root.position.copy(start).lerp(end,heal?1:melee?ease(p,.42,.53):ease(p,.34,.60));
      const power=ease(p,.09,.30)*(1-ease(p,.68,.9));
      const hit=ease(p,.52,.61)*(1-ease(p,.79,.99));
      charge.visible=center.visible=power>.025;
      charge.scale.setScalar((technique===2?1.8:1)*(.6+power*.8));
      center.scale.setScalar(.65+power);
      for(let i=0;i<halos.length;i++){
        const h=halos[i];h.rotation.x+=.085+i*.02;h.rotation.y-=.07+i*.014;
        h.scale.setScalar(.65+power*.55);h.visible=power>.03;
      }
      impact.position.copy(end).sub(root.position);
      ring.visible=flash.visible=floor.visible=p>=.51;
      ring.scale.setScalar(.05+hit*(technique===2?1.25:.76));
      flash.scale.setScalar(.04+hit*(technique===2?.83:.53));
      floor.scale.setScalar(.04+hit*(technique===2?1.65:1.08));
      floor.position.y=ground+.09-end.y;
      for(let i=0;i<sparkCount;i++){
        const a=i*2.39996+ms*.004,r=.15+(i%5)*.08;
        particlePositions[i*3]=Math.cos(a)*r*(1+hit*2.3);
        particlePositions[i*3+1]=Math.sin(a*1.7)*.19+hit*(i%4)*.11;
        particlePositions[i*3+2]=Math.sin(a)*r*(1+hit*2.3);
      }
      sparkGeo.attributes.position.needsUpdate=true;
      sparkMat.opacity=power*(1-ease(p,.87,1));
      for(let i=0;i<extras.length;i++){
        const e=extras[i],a=i*2.39996+ms*.0028,r=.25+(i%3)*.15;
        e.position.set(Math.cos(a)*r,Math.sin(a*1.3)*.19,Math.sin(a)*r);
        if(kind==='fire'||kind==='bomb')e.position.y+=.23+power*.22*(i%3);
        if(kind==='shadow')e.position.y=-.68;
        e.rotation.set(a*.7,a,a*.45);
        e.scale.setScalar(.65+power*.65);e.visible=power>.05;
      }
      if(bolts){
        for(let i=0;i<12;i++){
          const a=i*2.39996+Math.floor(ms/80)*.85,r=.14+(i%3)*.11,k=i*6;
          boltPositions[k]=Math.cos(a)*r;boltPositions[k+1]=Math.sin(a)*r;boltPositions[k+2]=Math.sin(a*1.6)*r;
          boltPositions[k+3]=Math.cos(a+1.2)*(r+.32);
          boltPositions[k+4]=Math.sin(a+1.2)*(r+.32);
          boltPositions[k+5]=Math.sin(a*1.6+1)*(r+.32);
        }
        bolts.geometry.attributes.position.needsUpdate=true;
        bolts.visible=power>.05;
      }
      const fade=1-ease(p,.87,1);
      for(const m of mats)m.opacity=m.userData.baseAlpha*fade;
      return true;
    },
    inspect(){return {kind,technique,phase,elapsedMs,disposed,objects:root.children.length}},
    dispose(){
      if(disposed)return;disposed=true;scene.remove(root);
      for(const r of resources)r.dispose();
      resources.clear();
    }
  };
};
})();
