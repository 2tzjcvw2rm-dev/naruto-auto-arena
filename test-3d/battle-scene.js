/* Skeletal Susanoo: world-space geometry, bounded lifetime, no model mutation. */
function createMadaraSusanoo(THREE,scene,slot,target){
  const root=new THREE.Group();root.name='madara-skeletal-susanoo';scene.add(root);
  const resources=new Set(),materials=[];
  const material=(color,opacity)=>{const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending});m.userData.alpha=opacity;materials.push(m);resources.add(m);return m};
  const bone=material(0x7438d9,.72),core=material(0xe3b6ff,.8),veil=material(0x7128db,.09),red=material(0xff285f,.7);
  bone.blending=THREE.NormalBlending;veil.blending=THREE.NormalBlending;
  const parts=[];
  const mesh=(geo,mat,parent=root)=>{resources.add(geo);const m=new THREE.Mesh(geo,mat);parent.add(m);return m};
  const tube=(points,radius,mat,parent=root)=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,radius,6,false),mat,parent);
  const reveal=(object,start)=>{parts.push({object,start});return object};
  // Front is local +Z, matching each actor's yaw. Open ribs keep Madara visible.
  const spine=reveal(new THREE.Group(),.12);root.add(spine);
  tube([[0,.42,-.36],[0,1.3,-.56],[0,2.35,-.53],[0,3.45,-.33]],.09,core,spine);
  const jointGeo=new THREE.IcosahedronGeometry(.13,1);resources.add(jointGeo);
  for(let i=0;i<10;i++){const v=mesh(jointGeo,bone,spine);v.position.set(0,.64+i*.28,-.51);v.scale.set(1.35,.65,1)}
  for(let i=0;i<6;i++){
    const pair=reveal(new THREE.Group(),.16+i*.035);root.add(pair);
    const y=1.02+i*.31,w=.62+Math.sin(i/5*Math.PI)*.26;
    for(const sign of [-1,1]){
      const path=[[0,y+.1,-.5],[sign*w*.8,y+.18,-.35],[sign*w,y,.18],[sign*w*.76,y-.16,.58],[sign*.17,y-.19,.69]];
      tube(path,.065,bone,pair);tube(path,.024,core,pair);
    }
  }
  tube([[0,1,.67],[0,1.6,.72],[0,2.4,.62],[0,2.78,.35]],.07,core);
  const shoulders=reveal(new THREE.Group(),.34);root.add(shoulders);
  for(const sign of [-1,1]){
    tube([[0,2.95,-.4],[sign*.55,3.03,-.3],[sign*1.02,2.85,0]],.11,bone,shoulders);
    const cap=mesh(new THREE.IcosahedronGeometry(.29,1),bone,shoulders);cap.position.set(sign*1.03,2.86,0);
  }
  // Articulated humerus / forearm / five knuckles; one side punches, the other guards.
  const cylinder=new THREE.CylinderGeometry(1,1,1,7);resources.add(cylinder);
  function limb(a,b,r,parent){const m=mesh(cylinder,bone,parent);setLimb(m,a,b,r);return m}
  const up=new THREE.Vector3(0,1,0);
  function setLimb(m,a,b,r){m.position.copy(a).add(b).multiplyScalar(.5);const d=b.clone().sub(a);m.scale.set(r,d.length(),r);m.quaternion.setFromUnitVectors(up,d.normalize())}
  const arms=[];
  for(const sign of [-1,1]){
    const group=reveal(new THREE.Group(),.39);root.add(group);
    const shoulder=new THREE.Vector3(sign*1.03,2.85,0),elbow=new THREE.Vector3(sign*1.3,2.13,.12),hand=new THREE.Vector3(sign*.95,1.83,.66);
    const upper=limb(shoulder,elbow,.12,group),fore=limb(elbow,hand,.15,group);
    const fist=mesh(new THREE.IcosahedronGeometry(.25,1),core,group);fist.scale.set(1,1.1,1.35);
    for(let k=0;k<4;k++){const knuckle=mesh(jointGeo,bone,fist);knuckle.scale.set(.6,1,1.2);knuckle.position.set((k-1.5)*.12,.03,.2)}
    arms.push({sign,shoulder,elbow,hand,upper,fore,fist,group});
  }
  const shell=mesh(new THREE.SphereGeometry(1,12,10),veil);shell.position.y=1.8;shell.scale.set(.98,1.68,.83);
  const aura=mesh(new THREE.SphereGeometry(1,12,8),red);aura.position.y=.86;aura.scale.set(.34,.83,.28);
  // Eyes sit in front of the source head, inside the aura, not on a screen overlay.
  const eyes=new THREE.Group();root.add(eyes);
  for(const x of [-.065,.065]){const e=mesh(new THREE.SphereGeometry(.025,6,4),red,eyes);e.position.set(x,1.48,.18)}
  const count=72,positions=new Float32Array(count*3),particleGeo=new THREE.BufferGeometry();particleGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));resources.add(particleGeo);
  const particleMat=new THREE.PointsMaterial({color:0xbb87ff,size:.055,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending});resources.add(particleMat);
  const particles=new THREE.Points(particleGeo,particleMat);root.add(particles);
  const boltGeo=new THREE.BufferGeometry(),boltPositions=new Float32Array(8*3*2);boltGeo.setAttribute('position',new THREE.BufferAttribute(boltPositions,3));resources.add(boltGeo);
  const boltMat=new THREE.LineBasicMaterial({color:0xe4baff,transparent:true,opacity:.65,depthWrite:false});resources.add(boltMat);root.add(new THREE.LineSegments(boltGeo,boltMat));
  const wave=new THREE.Group();scene.add(wave);
  const ring=mesh(new THREE.TorusGeometry(1,.04,6,40),core,wave);ring.rotation.x=-Math.PI/2;
  const burst=mesh(new THREE.SphereGeometry(1,12,8),veil,wave);burst.scale.set(1,.45,1);
  let disposed=false,phase='charge',elapsedMs=0;
  const smooth=(x,a,b)=>THREE.MathUtils.smoothstep(x,a,b),aim=new THREE.Vector3(),end=new THREE.Vector3(),elbow=new THREE.Vector3();
  return {
    update(ms,ground){
      if(disposed)return false;
      elapsedMs=ms;const p=ms/2300;if(p>=1){this.dispose();return false}
      phase=p<.16?'charge':p<.48?'forming':p<.62?'windup':p<.76?'strike':'dissolve';
      root.position.set(slot.actor.position.x,ground,slot.actor.position.z);root.quaternion.copy(slot.actor.quaternion);root.updateMatrixWorld(true);
      const fade=smooth(p,0,.12)*(1-smooth(p,.79,1)),pulse=1+.035*Math.sin(ms*.016);
      for(const m of materials)m.opacity=m.userData.alpha*fade*(m===bone?pulse:1);
      for(const item of parts){const amount=smooth(p,item.start,item.start+.12);item.object.visible=amount>0;item.object.scale.setScalar(Math.max(.001,amount))}
      aura.scale.set(.34*pulse,.83,.28*pulse);red.opacity*=1-smooth(p,.45,.7)*.65;
      const wind=smooth(p,.46,.59)*(1-smooth(p,.62,.7)),strike=smooth(p,.60,.73)*(1-smooth(p,.78,.96));
      aim.set(target?target.actor.position.x:slot.actor.position.x+2,ground+1.05,target?target.actor.position.z:slot.actor.position.z);root.worldToLocal(aim);
      // Bound the arm's reach; the pressure wave covers long-range targets.
      const reach=aim.clone().sub(arms[1].shoulder);if(reach.length()>2.6)aim.copy(arms[1].shoulder).add(reach.setLength(2.6));
      for(const a of arms){
        end.copy(a.hand);elbow.copy(a.elbow);
        if(a.sign===1){end.z-=wind*.9;end.y+=wind*.65;end.lerp(aim,strike);elbow.lerp(a.shoulder.clone().lerp(end,.53).add(new THREE.Vector3(.32,.12,0)),strike);}
        else {end.y+=smooth(p,.38,.52)*.55;end.z+=.2;}
        setLimb(a.upper,a.shoulder,elbow,.12);setLimb(a.fore,elbow,end,.15);a.fist.position.copy(end);a.fist.rotation.x=-wind*.7+strike*1.3;
      }
      for(let i=0;i<count;i++){const t=i*2.39996+ms*.0016,r=.55+(i%7)/12;positions[i*3]=Math.cos(t)*r;positions[i*3+1]=((i/count*3.5+ms*.0012)%3.5);positions[i*3+2]=Math.sin(t)*r*.8}
      particleGeo.attributes.position.needsUpdate=true;particleMat.opacity=fade*.75;
      for(let i=0;i<16;i++){const t=i*.9+Math.floor(ms/90)*.8;boltPositions[i*3]=Math.cos(t)*(.8+(i%2)*.16);boltPositions[i*3+1]=.7+(i/16)*2.3;boltPositions[i*3+2]=Math.sin(t)*.65}
      boltGeo.attributes.position.needsUpdate=true;boltMat.opacity=fade*(.3+.25*Math.sin(ms*.09));
      const impact=smooth(p,.71,.94);wave.visible=p>=.71;wave.position.copy(arms[1].fist.position);root.localToWorld(wave.position);
      wave.position.lerp(new THREE.Vector3(target?target.actor.position.x:root.position.x,ground+.12,target?target.actor.position.z:root.position.z),smooth(p,.71,.79));wave.scale.setScalar(.12+impact*1.4);
      return true;
    },
    inspect(){return {phase,elapsedMs,disposed,objects:root.children.length,height:3.65}},
    dispose(){if(disposed)return;disposed=true;scene.remove(root,wave);for(const r of resources)r.dispose();resources.clear()}
  };
}

/* Shared battlefield only. Profiles, GLBs and saved combat state stay independent. */
function initArena3d(){
  if(arena3d)return;
  if(!window.THREE){arenaUnavailable=true;bindBattleImages();return}
  const host=el('battle3d');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'})}
  catch(error){arenaUnavailable=true;bindBattleImages();return}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  // The approved waterfall GIF is the battle backdrop; keep WebGL translucent.
  if(renderer.setClearColor)renderer.setClearColor(0x000000,0);
  renderer.outputEncoding=THREE.sRGBEncoding;
  host.appendChild(renderer.domElement);host.parentElement.classList.add('three-active','side-battle');
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(32,1,.1,100);
  // Environmental decoration is deliberately independent of camera/formation logic.
  const environment=createKonohaOverlook(scene);
  // Retain lighting and diagnostics, but hide the old 3D landscape geometry.
  // This must happen before fighters, shadows and jutsu effects are mounted.
  scene.children.forEach(node=>{if(!node.isLight)node.visible=false});
  scene.background=null;scene.fog=null;
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
  const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,2,32,32,32);
  gradient.addColorStop(0,'rgba(22,30,27,.48)');gradient.addColorStop(1,'rgba(22,30,27,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const shadowMap=new THREE.CanvasTexture(shadowCanvas),shadowGeometry=new THREE.PlaneGeometry(1.5,1.1);
  const shadowMaterial=new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false});
  let slots=[],width=0,height=0,last=0,clock=0,bindSerial=0,effectClock=0;
  // Waterfall GIF is a 2D backdrop. Its turf begins below the original
  // 3D ground plane: shift VISUAL grounding only (no formation/camera change).
  // Portrait needs more downward adjustment; landscape has less vertical space.
  let visualGroundY=0;
  const bounds=new THREE.Box3(),projected=new THREE.Vector3();
  function formationPosition(side,units,index){
    const rowFor=(u,i)=>side==='allyTeam'?(s.formation[u.id]||'front'):(i<2?'front':i<4?'middle':'back');
    const row=rowFor(units[index],index),members=units.map((u,i)=>rowFor(u,i)===row?i:-1).filter(i=>i>=0);
    const lane=members.indexOf(index),z=members.length===1?0:(lane/(members.length-1)-.5)*3.2;
    const direction=side==='allyTeam'?1:-1;
    return new THREE.Vector3(-direction*({front:1.35,middle:2.9,back:4.45}[row]+(z>0?.24:0)),0,z);
  }
  function fit(){
    camera.aspect=width/height;
    const center=new THREE.Vector3(0,.85,0),view=new THREE.Vector3(0,.62,1).normalize();
    camera.position.copy(center).addScaledVector(view,25);camera.lookAt(center);camera.updateMatrixWorld(true);
    const inverse=camera.quaternion.clone().invert(),tan=Math.tan(camera.fov*Math.PI/360);
    let distance=1;
    // Include body width, overhead HP, rear/front lanes and effect clearance.
    for(const x of [-5.5,5.5])for(const y of [0,2.65])for(const z of [-2.35,2.35]){
      const p=new THREE.Vector3(x,y,z).sub(center).applyQuaternion(inverse);
      distance=Math.max(distance,p.z+Math.abs(p.x)/(tan*camera.aspect)*1.06,p.z+Math.abs(p.y)/tan*1.12);
    }
    camera.position.copy(center).addScaledVector(view,distance);camera.lookAt(center);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  }
  function screenPoint(position){projected.copy(position).project(camera);return {x:(projected.x+1)*width/2,y:(1-projected.y)*height/2}}
  function bodyBounds(slot){
    slot.actor.updateMatrixWorld(true);bounds.makeEmpty();
    for(const mesh of slot.bodyMeshes){if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));}
    return bounds;
  }
  function slotPoint(slot,y){return screenPoint(new THREE.Vector3(slot.actor.position.x,y+visualGroundY,slot.actor.position.z))}
  arena3d={
    trigger(side,index,technique,targetSide,targetIndex){
      const active=slots.find(x=>x.side===side&&x.index===index);
      if(active){
        active.effect?.dispose();active.effect=null;
        active.attackAt=clock;active.effectAt=effectClock;active.technique=technique;active.target=slots.find(x=>x.side===targetSide&&x.index===targetIndex);
        if(active.id==='madara'&&technique===2){active.effect=createMadaraSusanoo(THREE,scene,active,active.target);
          if(active.target){active.target.hitAt=effectClock+1817;active.target.hitFrom=active.home.clone()}return true}
      }
      return false;
    },
    point(side,index){const slot=slots.find(x=>x.side===side&&x.index===index);return slot?slotPoint(slot,1):null},
    bind(){
      const currentBind=++bindSerial;
      for(const slot of slots){slot.effect?.dispose();slot.motion?.dispose?.();scene.remove(slot.actor,slot.shadow)}
      slots=[];
      for(const [side,units] of [['allyTeam',allies],['foeTeam',foes]])units.forEach((u,i)=>{
        const unit=el(side+i);if(!unit||!upgradedFighters.has(u.id))return;
        const home=formationPosition(side,units,i),combat=CombatProfile.has(u.id);
        fetchHeroModel(combat?CombatProfile.modelKey(u.id,remoteHeroModels):u.id,model=>{
          if(currentBind!==bindSerial||!unit.isConnected)return;
          if(!model){showBattleImage(unit,u.id,side);return}
          const fighter=normalizedFighter(model);if(!fighter){showBattleImage(unit,u.id,side);return}
          const bodyMeshes=[];model.traverse(o=>{if(o.isMesh)bodyMeshes.push(o)});
          const actor=new THREE.Group();actor.add(fighter);actor.scale.setScalar(1.65);actor.position.copy(home);actor.rotation.y=side==='allyTeam'?Math.PI/2:-Math.PI/2;scene.add(actor);
          const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.copy(home);shadow.position.y=.012;scene.add(shadow);
          const motion=combat?CombatProfile.mount(u.id,fighter,{renderer,scene,camera,battle:true}):(u.id==='sasuke'?makeSasukeProfileMotion(fighter,true):makeHeroMotion(u.id,fighter));
          const posedMeshes=bodyMeshes.map(mesh=>mesh.parent?mesh:model.getObjectByName(mesh.name)).filter(Boolean);
          slots.push({id:u.id,unit,model,bodyMeshes:posedMeshes,actor,fighter,shadow,home,side,index:i,motion,attackAt:null,technique:0,target:null});unit.classList.add('has-model');
        });
      });
    },
    // Read-only diagnostics for responsive framing and animation verification.
    inspect(){return {size:[width,height],effects:slots.filter(a=>a.effect).map(a=>a.effect.inspect()),memory:{...renderer.info?.memory},visualGroundY,environment:environment.inspect(),slots:slots.map(a=>({id:(a.side==='allyTeam'?allies:foes)[a.index].id,side:a.side,position:a.actor.position.toArray(),home:a.home.toArray(),yaw:a.actor.rotation.y,visible:a.actor.visible,box:(()=>{bodyBounds(a);const corners=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(screenPoint(new THREE.Vector3(x,y,z)));return {min:bounds.min.toArray(),max:bounds.max.toArray(),corners}})(),foot:screenPoint(new THREE.Vector3(a.actor.position.x,visualGroundY,a.actor.position.z))}))}}
  };
  function draw(time){
    requestAnimationFrame(draw);
    if(document.hidden||time-last<40)return;
    const wallDt=last?Math.min(1,(time-last)/1000):.04;
    const dt=Math.min(.08,wallDt);last=time;
    const suspended=paused||!!document.querySelector('#profileModal.open,#teamModal.open,#bagModal.open');
    if(!suspended){clock+=dt*1000;effectClock+=wallDt*1000;}
    environment.update(suspended?0:dt,clock/1000);
    const rect=host.getBoundingClientRect();if(!rect.width||!rect.height)return;
    if(width!==rect.width||height!==rect.height){width=rect.width;height=rect.height;renderer.setSize(width,height);fit()}
    // Preserve the exact x/z lanes, yaw, scale and camera. Only visually
    // place the existing fighters and their contact shadows on the GIF grass.
    visualGroundY=height>=width?-2.65:-1.1;
    for(const slot of slots){
      const {unit,actor,model,shadow,side,home,motion}=slot;
      actor.visible=!unit.classList.contains('down');shadow.visible=actor.visible;
      if(!actor.visible){slot.effect?.dispose();slot.effect=null;continue}
      const susanoo=slot.id==='madara'&&slot.technique===2;
      const duration=susanoo?2300:1400;
      const elapsed=slot.attackAt===null?-1:susanoo?effectClock-slot.effectAt:clock-slot.attackAt,p=elapsed>=0&&elapsed<duration?elapsed/duration:-1;
      const direction=side==='allyTeam'?1:-1;
      const target=slot.target,enemyTarget=target&&target.side!==side;
      const kind=(jutsuVisuals[(side==='allyTeam'?allies:foes)[slot.index].id]||jutsuVisuals.naruto)[slot.technique][0];
      const melee=enemyTarget&&(slot.technique===0||kind==='melee');
      const blend=p<0?0:p<.34?THREE.MathUtils.smoothstep(p,0,.34):p<.58?1:1-THREE.MathUtils.smoothstep(p,.58,1);
      actor.position.copy(home);
      let yaw=direction*Math.PI/2;
      if(enemyTarget&&p>=0){
        const dx=target.home.x-home.x,dz=target.home.z-home.z,distance=Math.hypot(dx,dz);
        yaw=Math.atan2(dx,dz);
        const travel=susanoo?0:melee?Math.max(0,distance-1.15):.18;
        actor.position.x+=dx/distance*travel*blend;actor.position.z+=dz/distance*travel*blend;
      }
      const hitAge=slot.hitAt===undefined?-1:effectClock-slot.hitAt;
      if(hitAge>=0&&hitAge<380&&slot.hitFrom){
        const recoil=new THREE.Vector3().subVectors(home,slot.hitFrom);recoil.y=0;recoil.normalize();
        actor.position.addScaledVector(recoil,.2*Math.sin(Math.PI*hitAge/380));
      }
      const delta=Math.atan2(Math.sin(yaw-actor.rotation.y),Math.cos(yaw-actor.rotation.y));actor.rotation.y+=delta*Math.min(1,dt*14);
      if(motion)motion(suspended?0:dt,clock,p>=0,p,slot.technique);
      if(susanoo&&p>=0){
        // The supplied Madara GLB has no skeleton. Keep its mesh intact;
        // ground a controlled full-body brace while the spectral arm articulates.
        slot.fighter.rotation.z=0;
        slot.fighter.rotation.x=-.07*Math.sin(Math.PI*p)+.08*THREE.MathUtils.smoothstep(p,.60,.72)*(1-THREE.MathUtils.smoothstep(p,.76,1));
      }else if(slot.id==='madara')slot.fighter.rotation.x=0;
      // Ground the actual animated model, excluding chakra and overhead HUD.
      actor.position.y=0;bodyBounds(slot);actor.position.y=visualGroundY-bounds.min.y;
      shadow.position.set(actor.position.x,visualGroundY+.012,actor.position.z);
      if(slot.effect&&!slot.effect.update(elapsed,visualGroundY))slot.effect=null;
      const label=slotPoint(slot,1.98);
      unit.style.setProperty('left',label.x+'px','important');unit.style.setProperty('top',label.y+'px','important');
    }
    renderer.setRenderTarget(null);renderer.setViewport(0,0,width,height);renderer.render(scene,camera);
  }
  arena3d.bind();requestAnimationFrame(draw);
}
