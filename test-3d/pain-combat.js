/* Tendo. All phases use elapsed battle milliseconds, including victim motion. */
(function () {
'use strict';
const durations = [2000, 2200, 4800], impactTimes = [1160, 1040, 3780];
function ease(t, a, b) {
  const u = Math.max(0, Math.min(1, (t-a)/(b-a)));
  return u*u*(3-2*u);
}
function hold(t,a,b,c,d) { return ease(t,a,b)*(1-ease(t,c,d)); }

// Aim each joint from its authored rest orientation in fighter space.
function pose(fighter) {
  const T = THREE, joints = {};
  for (const name of ['Spine','Head','RightArm','RightForeArm','LeftArm','LeftForeArm']) {
    const bone = fighter.getObjectByName(name);
    if (bone?.isBone) joints[name] = {bone, rest:bone.quaternion.clone()};
  }
  const dir = new T.Vector3(), axis = new T.Vector3(), parentQ = new T.Quaternion();
  const worldQ = new T.Quaternion(), delta = new T.Quaternion();
  function aim(name, x,y,z, weight) {
    const joint = joints[name];
    if (!joint || !weight) return;
    const {bone,rest} = joint;
    fighter.getWorldQuaternion(worldQ);
    bone.parent.getWorldQuaternion(parentQ);
    dir.set(x,y,z).normalize().applyQuaternion(worldQ).applyQuaternion(parentQ.invert());
    axis.set(0,1,0).applyQuaternion(rest);
    delta.setFromUnitVectors(axis,dir).multiply(rest);
    bone.quaternion.slerp(delta,weight);
  }
  function update(p,k) {
    for (const {bone,rest} of Object.values(joints)) bone.quaternion.copy(rest);
    if (p<0) return;
    const t=p*durations[k];
    const cast=k===0?hold(t,70,350,1290,1890):k===1?hold(t,0,840,1250,2110):hold(t,0,680,3810,4680);
    const thrust=k===0?hold(t,960,1160,1240,1510):0;
    const release=k===2?ease(t,790,1360):0;
    if(joints.Spine) joints.Spine.bone.rotateX(-.12*cast+.29*thrust);
    if(joints.Head) joints.Head.bone.rotateX((k===1?.22:.08)*cast-.28*release*cast);
    if(k===0) {
      aim('RightArm',-.16,-.18+thrust*.42,1,cast);
      aim('RightForeArm',.12,.27-thrust*.22,1,cast);
    } else for(const [side,sign] of [['Right',-1],['Left',1]]) {
      aim(side+'Arm',sign*(k===1?.90:.45),k===1?.22:-.58+1.35*release,.66,cast);
      aim(side+'ForeArm',sign*(k===1?.50:-.90),k===1?.72:.60+release,.55,cast);
    }
  }
  return {update,dispose:()=>update(-1,0),inspect:()=>({rigged:!!joints.RightArm,joints:Object.keys(joints)})};
}
function create(scene,slot,target,k) {
  const T=THREE, v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  const root=new T.Group(); root.name=['bansho-tenin','shinra-tensei','chibaku-tensei'][k]; scene.add(root);
  const victims=k===0?[target]:slot.targets;
  const source=slot.home, center=v();
  for(const victim of victims) center.add(victim.home);
  center.divideScalar(victims.length||1);
  const toward=target.home.clone().sub(source).normalize();
  const contact=source.clone().addScaledVector(toward,1.25);
  const reach=Math.max(1,...victims.map(u=>u.home.distanceTo(source)));
  const temp=v(), hand=v(), left=v(), up=v(0,1,0), dummy=new T.Object3D();
  const rightBone=slot.fighter?.getObjectByName('RightHand'), leftBone=slot.fighter?.getObjectByName('LeftHand');
  const owned=new Set();
  function mesh(geo,mat,parent=root) {
    owned.add(geo);owned.add(mat);
    const obj=new T.Mesh(geo,mat);parent.add(obj);return obj;
  }
  const solid=color=>new T.MeshStandardMaterial({color,roughness:.72,flatShading:true});
  const tint=(color,opacity)=>new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false});
  function pressure(count) {
    const group=new T.Group();root.add(group);
    const skin=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{alpha:{value:1}},
      vertexShader:'varying float rim; varying float lat; void main(){vec4 eye=modelViewMatrix*vec4(position,1.); rim=1.-abs(dot(normalize(normalMatrix*normal),normalize(-eye.xyz)));lat=position.y; gl_Position=projectionMatrix*eye;}',
      fragmentShader:'varying float rim;varying float lat;uniform float alpha;void main(){float band=pow(.5+.5*cos(22.*lat),6.);gl_FragColor=vec4(.73,.82,1.,alpha*(.03+.75*pow(rim,2.4)+.06*band));}'});
    mesh(new T.SphereBufferGeometry(1,32,20),skin,group);
    const line=tint(0xd1dcff,.5),torus=new T.TorusBufferGeometry(1,.008,5,64);
    for(let i=0;i<count;i++){const ring=mesh(torus,line,group);ring.rotation.set(.5+i*.83,i*.64,.28*i);}
    return (position,radius,opacity)=>{
      group.visible=opacity>.002;group.position.copy(position);group.scale.setScalar(Math.max(.001,radius));
      skin.uniforms.alpha.value=opacity;line.opacity=.58*opacity;
    };
  }
  const field=pressure(k===1?3:2);
  let rod,dust,core,rocks,burst;
  const shards=[];
  if(k===0) rod=mesh(new T.CylinderBufferGeometry(.013,.032,.84,8),solid(0x161321));
  if(k===1) {
    dust=mesh(new T.RingBufferGeometry(.94,1,80),tint(0xe0cdb6,.3));
    dust.rotation.x=-Math.PI/2;
  }
  if(k===2) {
    core=mesh(new T.IcosahedronBufferGeometry(1,2),solid(0x100d19));
    const geometry=new T.IcosahedronBufferGeometry(1,0),material=solid(0xffffff);
    owned.add(geometry);owned.add(material);
    rocks=new T.InstancedMesh(geometry,material,32);rocks.frustumCulled=false;root.add(rocks);
    for(let i=0;i<32;i++){
      const a=i*2.399963, y=1-2*(i+.5)/32, r=Math.sqrt(1-y*y);
      shards.push({a, end:v(r*Math.cos(a),y,r*Math.sin(a)), span:1.15+(i%7)*.22,size:.40+(i%5)*.060});
      rocks.setColorAt(i,new T.Color([0x58493d,0x7d6857,0x433b3b,0x6a5b50,0x8d8070][i%5]));
    }
    burst=pressure(3);
  }
  let hit=false,disposed=false,elapsedMs=0;
  function motion(victim,t,out) {
    out.set(0,0,0);
    if(victim===slot && k===2)out.y=.52*hold(t,0,820,4000,4730);
    if(!victims.includes(victim))return;
    if(k===0){
      const pull=hold(t,370,990,1160,1690);
      out.subVectors(contact,victim.home).multiplyScalar(pull);
      out.y+=.19*pull+.19*hold(t,1160,1280,1410,1690);
    }else if(k===1){
      out.subVectors(victim.home,source).normalize().multiplyScalar(.63*hold(t,1040,1240,1330,1920));
      out.y=.19*hold(t,1040,1240,1330,1690);
    }
  }
  function update(t,ground){
    if(disposed)return false;
    elapsedMs=t;
    if(!hit&&t>=impactTimes[k]){hit=true;const impact=slot.onImpact;slot.onImpact=null;impact?.();}
    if(t>=durations[k]){dispose();return false;}
    hand.copy(source).addScaledVector(toward,.38);hand.y=ground+1.10;
    if(rightBone)rightBone.getWorldPosition(hand);
    if(k===0){
      const length=hold(t,720,940,1330,1510);
      rod.visible=length>.001;rod.scale.y=length;
      rod.quaternion.setFromUnitVectors(up,toward);
      rod.position.copy(hand).addScaledVector(toward,.42*length);
      motion(target,t,temp);temp.add(target.home);temp.y+=ground+.98;
      const pulse=ease(t,1160,1410);
      field(temp,t<1160?.58-.29*ease(t,390,1000):.19+.89*pulse,
        t<1160?hold(t,150,320,760,1020):1-pulse);
    }else if(k===1){
      const expansion=ease(t,850,1040),fade=1-ease(t,1040,1480);
      temp.copy(source);temp.y=ground+.95;
      const radius=.50+.12*ease(t,0,820)+reach*expansion+1.4*ease(t,1040,1480);
      field(temp,radius,ease(t,80,540)*fade);
      dust.position.set(source.x,ground+.035,source.z);dust.scale.setScalar(radius);
      dust.material.opacity=.4*hold(t,850,995,1100,1640);
    }else{
      if(leftBone)hand.lerp(leftBone.getWorldPosition(left),.5);
      const fly=ease(t,820,1600),compress=ease(t,3470,3780),blast=ease(t,3780,4440);
      const impulse=1-Math.pow(1-Math.min(1,Math.max(0,(t-3780)/660)),2.8);
      temp.copy(center);temp.y=ground+4.65;
      core.position.copy(hand).lerp(temp,fly);core.visible=t<3780;
      core.scale.setScalar(.155*ease(t,140,620)+.64*ease(t,2060,3270)-.48*compress);
      field(core.position,.20+.20*fly,hold(t,140,480,2100,2660));
      rocks.visible=t>=1410&&t<4450;
      for(let i=0;rocks.visible&&i<shards.length;i++){
        const {a,end,span,size}=shards[i], rise=ease(t,1410+(i%8)*76,2810+(i%8)*78);
        const angle=a+rise*2.75, radius=span*(1-rise);
        dummy.position.copy(temp).addScaledVector(end,1.08*(1-.47*compress)+impulse*span*1.55);
        dummy.position.x+=Math.cos(angle)*radius;dummy.position.z+=Math.sin(angle)*radius;
        dummy.position.y=ground+(dummy.position.y-ground)*rise-.85*blast*blast;
        dummy.rotation.set(a+.9*rise+blast*2,a*2+rise,a*.5);
        const scale=size*ease(t,1410+(i%8)*76,1650+(i%8)*76)*(1-.36*compress)*(1-blast);
        dummy.scale.set(scale*1.27,scale,scale*.88);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
      }
      rocks.instanceMatrix.needsUpdate=true;
      burst(temp,.35+impulse*(reach*.52+2.2),t>=3780?1-blast:0);
    }
    return true;
  }
  function dispose(){if(disposed)return;disposed=true;scene.remove(root);rocks?.dispose?.();for(const res of owned)res.dispose();slot.onImpact=null;}
  return {motion,update,dispose,inspect:()=>({id:'pain',kind:root.name,ultimate:k===2?root.name:undefined,technique:k,elapsedMs,hit,victims:victims.length})};
}
let fallback=null;
function cancelFallback(){fallback?.();fallback=null;}
function playFallback(unit,action,source,target,impact){
  cancelFallback();
  const ring=document.createElement('span');
  ring.style.cssText='position:absolute;left:50%;top:45%;width:32px;height:32px;margin:-16px;border:2px solid #ccd8ff;border-radius:50%;box-shadow:0 0 8px #aebaf2;pointer-events:none;z-index:4';
  (action===1?source:target).appendChild(ring);
  let elapsed=0,last=performance.now(),hit=false,frame;
  fallback=()=>{cancelAnimationFrame(frame);ring.remove();};
  function tick(now){
    if(!source.isConnected||unit.curHp<=0||unit.kamuiUntilRound){cancelFallback();return;}
    if(!paused&&!document.hidden&&!document.querySelector('#profileModal.open,#teamModal.open,#bagModal.open'))
      elapsed+=Math.min(100,now-last)*BattleTempo.speed;
    last=now;
    const progress=ease(elapsed,0,impactTimes[action]),after=ease(elapsed,impactTimes[action],durations[action]);
    ring.style.transform='scale('+(action===1?.2+4*progress:1.45-progress+after*3)+')';
    ring.style.opacity=String(1-after);
    if(!hit&&elapsed>=impactTimes[action]){hit=true;impact();}
    if(elapsed>=durations[action])cancelFallback();else frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
}
window.PainCombat={durations,impactTimes,create,pose,playFallback,cancelFallback,get busy(){return !!fallback;}};
})();
