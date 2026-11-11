// Individual 3D ultimate silhouettes. No screenshots, sprites or GLB edits.
(function(){
'use strict';
const original=window.createArenaTechniqueFX;if(!original)return;
window.createArenaTechniqueFX=function(THREE,scene,slot,target,tech,kind,color){
  const base=original(THREE,scene,slot,target,tech,kind,color);
  if(tech!==2||slot.id==='itachi')return base;
  const id=slot.id,root=new THREE.Group(),resources=new Set(),items=[];
  root.name='unique-ultimate-'+id;scene.add(root);
  const shade=(c,opacity=.8)=>{
    const m=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity,depthWrite:false,
      side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
    m.userData.base=opacity;resources.add(m);return m;
  };
  const color1=shade(color),color2=shade('#efffff'),black=shade('#201127',.92);
  const add=(geo,mat=color1)=>{
    const obj=new THREE.Mesh(geo,mat);root.add(obj);items.push(obj);resources.add(geo);return obj;
  };
  const torus=(r,mat=color1)=>add(new THREE.TorusGeometry(r,.028,5,34),mat);
  const count=id==='itachi'?9:id==='konan'?12:id==='pain'?4:id==='obito'?7:6;
  for(let i=0;i<count;i++){
    const alt=i%3===0?color2:color1;
    if(id==='itachi')add(new THREE.ConeGeometry(.13,.65,6),i%2?black:shade('#a71e42',.75));
    else if(id==='pain')torus(.3+i*.24,alt);
    else if(id==='obito')torus(.19+i*.11,i%2?black:alt);
    else if(id==='konan')add(i===0?new THREE.ConeGeometry(.18,1.3,5):new THREE.PlaneGeometry(.22,.32),alt);
    else if(id==='hinata')torus(.32+i*.09,alt);
    else if(id==='sakura')add(new THREE.OctahedronGeometry(.14),alt);
    else if(id==='sasuke'||id==='kakashi')add(new THREE.ConeGeometry(.035,1.1,4),alt);
    else if(id==='naruto')torus(.23+i*.055,alt);
    else add(new THREE.OctahedronGeometry(.12),alt);
  }
  let disposed=false,phase='charge';
  const smooth=(v,a,b)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
  return {
    update(ms,ground){
      if(disposed)return false;
      if(!base.update(ms,ground)){this.dispose();return false}
      const p=Math.min(1,ms/1400),hit=smooth(p,.32,.63),fade=1-smooth(p,.79,1);
      phase=p<.33?'charge':p<.70?'impact':'fade';
      const start=slot.actor.position,end=target.actor.position;
      const blend=smooth(p,.30,.55);
      root.position.set(start.x+(end.x-start.x)*blend,ground+1.08,start.z+(end.z-start.z)*blend);
      for(let i=0;i<items.length;i++){
        const o=items[i],angle=i*2.39996+ms*.0025,r=.26+(i%4)*.13;
        o.rotation.set(angle*.3,angle*.53,angle*.4);
        o.position.set(Math.cos(angle)*r,Math.sin(angle*1.4)*.2,Math.sin(angle)*r);
        if(id==='itachi'){o.position.y+=.34+hit*.28;o.scale.set(.8,1+.5*Math.sin(ms*.013+i),.8)}
        if(id==='pain'){o.rotation.x=Math.PI/2;o.position.set(0,0,0);o.scale.setScalar(1+hit*1.7)}
        if(id==='obito'){o.position.set(0,0,0);o.scale.setScalar(1.2-hit*.55)}
        if(id==='hinata'){o.rotation.x=Math.PI/2;o.position.y=-.48;o.scale.setScalar(1+hit*.23)}
        if(id==='konan'&&i===0){o.position.set(0,0,0);o.rotation.z=-Math.PI/2;o.scale.setScalar(1+hit*.5)}
      }
      for(const resource of resources)if(resource.isMaterial)resource.opacity=resource.userData.base*fade;
      return true;
    },
    inspect(){return {...base.inspect(),ultimate:id,phase,uniqueObjects:items.length}},
    dispose(){
      if(disposed)return;disposed=true;base.dispose();scene.remove(root);
      for(const resource of resources)resource.dispose();resources.clear();
    }
  };
};
})();
