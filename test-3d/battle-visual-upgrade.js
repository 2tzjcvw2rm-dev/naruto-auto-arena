/* Original 3D jutsu for the shared mobile battlefield.
 * Small GPU footprint; no imported art, GLB mutation, or extra render loop.
 * Timed entirely by the battle clock so manual 1x/2x/3x affects every phase. */
(function(){
'use strict';

/* Itachi-only 3D battle choreography. This module is battle-clock driven,
   keeps the GLB unmodified and owns/disposes its effect geometries. */
function createItachiBattleFX(THREE,scene,slot,target,technique){
  const root=new THREE.Group();root.name=technique===1?'itachi-fireball':'itachi-crows';scene.add(root);
  const resources=new Set(),flames=[],birds=[],feathers=[];
  function mat(color,opacity=1,additive=true){
    const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,
      blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,side:THREE.DoubleSide});
    resources.add(m);return m;
  }
  function add(geometry,material,parent=root){
    resources.add(geometry);const m=new THREE.Mesh(geometry,material);parent.add(m);return m;
  }
  const hot=mat(0xff6a14,.92),white=mat(0xffef91,.92),black=mat(0x17121e,.98,false);
  const purple=mat(0x9d43dd,.77),shade=mat(0x402049,.9,false);
  const smooth=(v,a,b)=>THREE.MathUtils.smoothstep(v,a,b);
  const origin=new THREE.Vector3(),destination=new THREE.Vector3();
  let orb=null,core=null;
  if(technique===1){
    orb=add(new THREE.SphereGeometry(.37,18,12),hot);
    core=add(new THREE.SphereGeometry(.25,12,10),white);
    for(let i=0;i<16;i++)flames.push(add(new THREE.ConeGeometry(.12,.53,6),i%4?hot:white));
  }else{
    const wing=new THREE.BufferGeometry();
    wing.setAttribute('position',new THREE.Float32BufferAttribute([
      0,0,0,-.21,.10,-.10,-.52,.025,-.34,
      0,0,0,-.52,.025,-.34,-.15,-.08,-.18],3));
    wing.computeVertexNormals();resources.add(wing);
    for(let i=0;i<12;i++){
      const bird=new THREE.Group();root.add(bird);
      const body=add(new THREE.SphereGeometry(.12,8,6),black,bird);body.scale.set(.7,.55,1.55);
      const head=add(new THREE.SphereGeometry(.075,7,5),black,bird);head.position.set(0,.055,.15);
      const beak=add(new THREE.ConeGeometry(.033,.12,5),black,bird);beak.rotation.x=Math.PI/2;beak.position.set(0,.045,.24);
      const tail=add(new THREE.ConeGeometry(.08,.23,5),black,bird);tail.rotation.x=-Math.PI/2;tail.position.z=-.23;
      const left=new THREE.Group(),right=new THREE.Group();
      left.position.x=-.055;right.position.x=.055;right.scale.x=-1;
      bird.add(left,right);
      add(wing,shade,left);add(wing,shade,right);
      birds.push({bird,left,right});
    }
    for(let i=0;i<20;i++){const feather=add(new THREE.SphereGeometry(1,5,4),i%5?black:shade);feather.scale.set(.025,.12,.009);feathers.push(feather);}
  }
  const ring=add(new THREE.TorusGeometry(1,.055,6,38),technique===1?hot:purple);
  ring.rotation.x=-Math.PI/2;
  const blast=add(new THREE.SphereGeometry(.35,12,8),technique===1?white:purple);
  let disposed=false,elapsedMs=0,phase='charge';
  return {
    update(ms,ground){
      if(disposed)return false;
      elapsedMs=ms;const p=Math.max(0,ms/1400);
      if(p>=1){this.dispose();return false;}
      phase=p<.28?'charge':p<.53?'release':p<.77?'impact':'fade';
      origin.set(slot.actor.position.x,ground+1.38,slot.actor.position.z);
      destination.set(target.actor.position.x,ground+1.12,target.actor.position.z);
      const toward=destination.clone().sub(origin);toward.y=0;
      if(toward.lengthSq()>.0001)origin.addScaledVector(toward.normalize(),.37);
      const head=slot.fighter.getObjectByName('Head');
      if(head){head.getWorldPosition(origin);origin.addScaledVector(toward,.13);}
      const hit=smooth(p,.62,.72)*(1-smooth(p,.82,1));
      ring.visible=hit>.015;ring.position.set(destination.x,ground+.12,destination.z);
      ring.scale.setScalar(.03+hit*(technique===1?1.2:1.5));
      blast.visible=hit>.015;blast.position.copy(destination);
      blast.scale.setScalar(.02+hit*(technique===1?2.2:1.6));
      if(technique===1){
        const power=smooth(p,.23,.33)*(1-smooth(p,.61,.62));
        const pos=origin.clone().lerp(destination,smooth(p,.33,.62));
        const swell=(.26+.28*power)*(1+.09*Math.sin(ms*.035));
        orb.position.copy(pos);core.position.copy(pos);
        orb.scale.setScalar(swell/.37);core.scale.setScalar(swell/.29);
        orb.visible=core.visible=power>.02;
        for(let i=0;i<flames.length;i++){
          const f=flames[i],angle=i*2.39996+ms*.014;
          f.position.set(pos.x+Math.cos(angle)*swell*.75,
            pos.y+Math.sin(angle)*swell*.75,pos.z-.13-(i%4)*.09);
          f.rotation.set(angle*.17,angle*.23,Math.cos(angle)*.32);
          f.scale.setScalar((.55+power*.7)*(1+.13*Math.sin(angle)));
          f.visible=power>.02;
        }
      }else{
        const flight=smooth(p,.21,.62),fade=smooth(p,.1,.25)*(1-smooth(p,.84,1));
        const face=Math.atan2(destination.x-origin.x,destination.z-origin.z);
        for(let i=0;i<birds.length;i++){
          const o=birds[i],a=i*2.39996+ms*.007;
          o.bird.position.copy(origin).lerp(destination,flight);
          o.bird.position.x+=Math.cos(a)*(.2+.48*(1-flight));
          o.bird.position.y+=Math.sin(a*1.3)*(.14+(i%4)*.075);
          o.bird.position.z+=Math.sin(a)*(.2+.36*(1-flight));
          o.bird.rotation.set(Math.sin(a)*.19,face+Math.sin(a)*.24,Math.cos(a)*.18);
          o.bird.position.addScaledVector(new THREE.Vector3(Math.cos(a),.3,Math.sin(a)),smooth(p,.78,1)*1.6);
          o.bird.scale.setScalar((.85+(i%4)*.11)*fade);
          o.bird.visible=fade>.02;
          const flap=Math.sin(ms*.038+i*.82)*.76;
          o.left.rotation.z=flap;o.right.rotation.z=flap;
        }
        for(let i=0;i<feathers.length;i++){
          const f=feathers[i],a=i*2.39996+ms*.003;
          f.position.set(destination.x+Math.cos(a)*(.16+(i%4)*.1),
            ground+.27+Math.abs(Math.sin(ms*.013+i))*.16,
            destination.z+Math.sin(a)*(.16+(i%4)*.1));
          f.rotation.z=.26*Math.sin(ms*.012+i);
          f.position.lerp(origin,1-flight);f.position.y+=.5+Math.sin(a)*.55;
          f.rotation.set(a,a*.4,a*.7);f.scale.set(.025*fade,.12*fade,.009*fade);
          f.visible=fade>.015;
        }
      }
      return true;
    },
    inspect(){return {kind:technique===1?'itachi-fireball':'itachi-crows',
      technique,phase,elapsedMs,disposed,objects:root.children.length};},
    dispose(){if(disposed)return;disposed=true;scene.remove(root);
      for(const resource of resources)resource.dispose();resources.clear();}
  };
}
window.createArenaTechniqueFX=function(THREE,scene,slot,target,technique,kind,color){
  if(slot.id==='itachi'&&technique===2)return createItachiSusanoo(THREE,scene,slot,target);
  if(slot.id==='itachi')
    return createItachiBattleFX(THREE,scene,slot,target,technique===0?1:2);
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
