/* Madara uses the shared articulated chakra warrior. */
function createMadaraSusanoo(THREE,scene,slot,target){return MadaraSusanoo.cast(scene,slot,target);}

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
    trigger(side,index,technique,targetSide,targetIndex,onImpact){
      const active=slots.find(x=>x.side===side&&x.index===index);
      if(!active)return false;
      const target=slots.find(x=>x.side===targetSide&&x.index===targetIndex);
      if(!target)return false; // Keep original 2D fallback during GLB loading.
      if((active.id==='konan'||active.id==='itachi'||active.id==='naruto'||active.id==='sasuke'||active.id==='kakashi'||active.id==='madara')&&active.effect)return true;
      active.effect?.dispose();active.effect=null;
      active.attackAt=effectClock;active.effectAt=effectClock;
      active.technique=technique;active.target=target;active.onImpact=onImpact;active.impactMs=technique===2?1817:868;
      active.targets=(active.id==='konan'&&technique===2||active.id==='madara'||active.id==='kakashi'&&technique===0||active.id==='itachi'&&technique===2||active.id==='sasuke'&&technique!==1)?slots.filter(x=>x.side===targetSide&&!x.unit.classList.contains('down')&&!x.combatant?.kamuiUntilRound):[target];
      if(active.id==='madara'&&technique===0)active.targets=slots.filter(x=>x.side===targetSide&&!x.unit.classList.contains('down')&&!x.combatant?.kamuiUntilRound);
      const susanoo=active.id==='madara'&&technique===2;
      const duration=active.id==='konan'?KonanCombat.durations[technique]:active.id==='madara'?MadaraCombat.durations[technique]:active.id==='kakashi'?KakashiCombat.durations[technique]:active.id==='naruto'?NarutoCombat.durations[technique]:active.id==='sasuke'?SasukeCombat.durations[technique]:susanoo||(active.id==='itachi'&&technique===2)?2300:1400;
      if(technique===2&&active.id!=='konan')window.BattleCinematics?.start({
        id:active.id,side,label:(skills[active.id]||[])[2],now:effectClock,duration
      });
      const visual=(jutsuVisuals[active.id]||jutsuVisuals.naruto)[technique];
      active.effect=(active.id==='konan'?KonanCombat.create(scene,active,target,technique):active.id==='madara'&&technique<2?MadaraCombat.create(scene,active,target,technique):active.id==='kakashi'?KakashiCombat.create(scene,active,target,technique):active.id==='naruto'?NarutoCombat.create(scene,active,target,technique):active.id==='sasuke'?SasukeCombat.create(scene,active,target,technique):null)|| (susanoo?createMadaraSusanoo(THREE,scene,active,target):
        (window.createArenaTechniqueFX?.(THREE,scene,active,target,technique,visual[0],visual[1])||null));
      if(target.side!==side){
        target.hitAt=(active.id==='konan'||active.id==='madara'||active.id==='naruto'||active.id==='sasuke'||active.id==='kakashi')?Infinity:effectClock+(active.id==='itachi'?active.impactMs:susanoo?1817:760);
        target.hitFrom=active.home.clone();
        // Battle HP updates immediately. Preserve a knocked-out model until
        // the impact reaches it, then honor the normal 'down' state.
        target.downGraceUntil=Math.max(target.downGraceUntil||0,effectClock+(active.id==='naruto'||active.id==='sasuke'?duration:susanoo?2120:1090));
        if(active.id==='konan'||active.id==='sasuke'&&technique!==1)for(const other of active.targets)
          other.downGraceUntil=Math.max(other.downGraceUntil||0,effectClock+duration);
      }
      return true;
    },
    isItachiBusy(){return slots.some(a=>(a.id==='konan'||a.id==='itachi'||a.id==='naruto'||a.id==='sasuke'||a.id==='kakashi'||a.id==='madara')&&a.effect)},
    returnKamui(side,index){const slot=slots.find(x=>x.side===side&&x.index===index);if(!slot)return;slot.kamuiWarp=1;slot.returnAt=effectClock;slot.returnEffect?.dispose();slot.returnEffect=KakashiCombat.portal(scene,slot,true);},
    effects(){return slots.filter(a=>a.effect).map(a=>a.effect.inspect())},
    point(side,index){const slot=slots.find(x=>x.side===side&&x.index===index);return slot?slotPoint(slot,1):null},
    bind(){
      const currentBind=++bindSerial;
      for(const slot of slots){slot.returnEffect?.dispose();slot.effect?.dispose();slot.motion?.dispose?.();slot.pose?.dispose?.();scene.remove(slot.actor,slot.shadow)}
      window.BattleCinematics?.clear();
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
          const motion=u.id==='konan'?null:combat?CombatProfile.mount(u.id,fighter,{renderer,scene,camera,battle:true}):(u.id==='naruto'?NarutoCombat.mount(fighter):u.id==='sasuke'?makeSasukeProfileMotion(fighter,true):makeHeroMotion(u.id,fighter));
          const pose=window.BattlePose?.mount(fighter,u.id)||null;
          const posedMeshes=bodyMeshes.map(mesh=>mesh.parent?mesh:model.getObjectByName(mesh.name)).filter(Boolean);
          slots.push({id:u.id,combatant:u,unit,model,bodyMeshes:posedMeshes,actor,fighter,shadow,home,side,index:i,motion,pose,attackAt:null,technique:0,target:null,phase:'idle',downGraceUntil:0});unit.classList.add('has-model');
        });
      });
    },
    // Read-only diagnostics for responsive framing and animation verification.
    inspect(){return {size:[width,height],effects:slots.filter(a=>a.effect).map(a=>a.effect.inspect()),memory:{...renderer.info?.memory},visualGroundY,environment:environment.inspect(),slots:slots.map(a=>({id:(a.side==='allyTeam'?allies:foes)[a.index].id,side:a.side,position:a.actor.position.toArray(),home:a.home.toArray(),yaw:a.actor.rotation.y,visible:a.actor.visible,phase:a.phase,rig:a.pose?.inspect?.()||null,box:(()=>{bodyBounds(a);const corners=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(screenPoint(new THREE.Vector3(x,y,z)));return {min:bounds.min.toArray(),max:bounds.max.toArray(),corners}})(),foot:screenPoint(new THREE.Vector3(a.actor.position.x,visualGroundY,a.actor.position.z))}))}}
  };
  function draw(time){
    requestAnimationFrame(draw);
    if(document.hidden||time-last<24)return;
    const wallDt=last?Math.min(1,(time-last)/1000):.04;
    const dt=Math.min(.08,wallDt);last=time;
    const suspended=paused||!!document.querySelector('#profileModal.open,#teamModal.open,#bagModal.open');
    const tempo=window.BattleTempo?.speed||1;
    if(!suspended){clock+=dt*tempo*1000;effectClock+=wallDt*tempo*1000;}
    environment.update(suspended?0:dt*tempo,clock/1000);
    window.BattleCinematics?.update(effectClock);
    const rect=host.getBoundingClientRect();if(!rect.width||!rect.height)return;
    if(width!==rect.width||height!==rect.height){width=rect.width;height=rect.height;renderer.setSize(width,height);fit()}
    // Preserve the exact x/z lanes, yaw, scale and camera. Only visually
    // place the existing fighters and their contact shadows on the GIF grass.
    visualGroundY=height>=width?-2.65:-1.1;
    for(const slot of slots){
      const {unit,actor,shadow,side,home,motion}=slot;
      if(slot.returnEffect&&!slot.returnEffect.update(effectClock-slot.returnAt,visualGroundY))slot.returnEffect=null;
      actor.scale.setScalar(1.65*(slot.kamuiWarp===undefined?1:slot.kamuiWarp));
      actor.visible=!slot.combatant?.kamuiUntilRound&&(!unit.classList.contains('down')||effectClock<(slot.downGraceUntil||0));
      shadow.visible=actor.visible;
      if((slot.id==='konan'||slot.id==='itachi'||slot.id==='naruto'||slot.id==='sasuke'||slot.id==='kakashi'||slot.id==='madara')&&unit.classList.contains('down')){slot.effect?.dispose();slot.effect=null;slot.onImpact=null;slot.attackAt=null;}
      if(!actor.visible){const label=screenPoint(new THREE.Vector3(home.x,visualGroundY+1.98,home.z));unit.style.setProperty('left',label.x+'px','important');unit.style.setProperty('top',label.y+'px','important');slot.effect?.dispose();slot.effect=null;slot.onImpact=null;continue}
      const susanoo=slot.id==='madara'&&slot.technique===2;
      const duration=slot.id==='konan'?KonanCombat.durations[slot.technique]:slot.id==='madara'?MadaraCombat.durations[slot.technique]:slot.id==='kakashi'?KakashiCombat.durations[slot.technique]:slot.id==='naruto'?NarutoCombat.durations[slot.technique]:slot.id==='sasuke'?SasukeCombat.durations[slot.technique]:susanoo||(slot.id==='itachi'&&slot.technique===2)?2300:1400;
      const elapsed=slot.attackAt===null?-1:effectClock-slot.effectAt;
      const p=elapsed>=0&&elapsed<duration?elapsed/duration:-1;
      const direction=side==='allyTeam'?1:-1,target=slot.target;
      const enemyTarget=target&&target.side!==side;
      const kind=(jutsuVisuals[slot.id]||jutsuVisuals.naruto)[slot.technique][0];
      const melee=enemyTarget&&slot.id!=='konan'&&slot.id!=='itachi'&&(slot.id==='sasuke'?slot.technique===1:slot.technique===0||kind==='melee'||slot.id==='naruto'&&slot.technique===1);
      // Distinct readable phases: anticipate, approach, plant, strike, retreat.
      const ease=(t,a,b)=>THREE.MathUtils.smoothstep(t,a,b);
      const advance=p<0?0:slot.id==='sasuke'&&slot.technique===1?ease(p,.24,.51)*(1-ease(p,.73,.98)):slot.id==='naruto'&&slot.technique<2?ease(p,slot.technique===1?.28:.22,slot.technique===1?.55:.43)*(1-ease(p,.77,.98)):ease(p,.10,.31)*(1-ease(p,.60,.93));
      const impact=p<0?0:ease(p,.42,.52)*(1-ease(p,.59,.73));
      slot.phase=p<0?'idle':p<.10?'anticipate':p<.31?'approach':p<.43?'windup':p<.62?'strike':p<.93?'retreat':'recover';
      actor.position.copy(home);
      let yaw=direction*Math.PI/2;
      if(enemyTarget&&p>=0){
        const dx=target.home.x-home.x,dz=target.home.z-home.z,distance=Math.max(.01,Math.hypot(dx,dz));
        yaw=Math.atan2(dx,dz);
        const travel=slot.id==='konan'||slot.id==='madara'||slot.id==='kakashi'||susanoo||slot.id==='naruto'&&slot.technique===2||slot.id==='sasuke'&&slot.technique!==1?0:melee?Math.max(0,distance-((slot.id==='naruto'||slot.id==='sasuke'||slot.id==='kakashi')?0.70:1.2)):.16;
        actor.position.x+=dx/distance*travel*advance;
        actor.position.z+=dz/distance*travel*advance;
      }
      const hitAge=slot.hitAt===undefined?-1:effectClock-slot.hitAt;
      if(hitAge>=0&&hitAge<420&&slot.hitFrom){
        const recoil=new THREE.Vector3().subVectors(home,slot.hitFrom);recoil.y=0;
        if(recoil.lengthSq()>.0001){
          recoil.normalize();actor.position.addScaledVector(recoil,.26*Math.sin(Math.PI*hitAge/420));
        }
      }
      const delta=Math.atan2(Math.sin(yaw-actor.rotation.y),Math.cos(yaw-actor.rotation.y));
      actor.rotation.y+=delta*Math.min(1,dt*tempo*10);
      // Slight full-body response also works for the unrigged user GLBs.
      actor.rotation.z=(p>=0?-.045*direction*impact:0)
        +(hitAge>=0&&hitAge<420?-.035*direction*Math.sin(Math.PI*hitAge/420):0);
      if(motion)motion(suspended?0:dt*tempo,clock,p>=0,p,slot.technique);
      slot.pose?.update(p,slot.technique,clock);
      if(susanoo&&p>=0){
        slot.fighter.rotation.z=0;
        slot.fighter.rotation.x=-.07*Math.sin(Math.PI*p)+.08*ease(p,.60,.72)*(1-ease(p,.76,1));
      }else if(slot.id==='madara')slot.fighter.rotation.x=0;
      // Recompute footing after all rotations; shadows remain on the GIF grass.
      actor.position.y=0;bodyBounds(slot);actor.position.y=visualGroundY-bounds.min.y;
      shadow.position.set(actor.position.x,visualGroundY+.012,actor.position.z);
      if(slot.effect&&!slot.effect.update(elapsed,visualGroundY))slot.effect=null;
      shadow.position.set(actor.position.x,visualGroundY+.012,actor.position.z);
      if(slot.onImpact&&!(slot.id==='konan')&&slot.id!=='naruto'&&slot.id!=='sasuke'&&!(slot.id==='kakashi'||slot.id==='madara')&&elapsed>=slot.impactMs){const impact=slot.onImpact;slot.onImpact=null;impact();}
      const label=slotPoint(slot,1.98);
      unit.style.setProperty('left',label.x+'px','important');unit.style.setProperty('top',label.y+'px','important');
    }
    const focus=slots.find(x=>x.id==='kakashi'&&x.technique===2&&x.effect);
    const focusAge=focus?(effectClock-focus.effectAt)/KakashiCombat.durations[2]:-1;
    camera.zoom=focusAge>=0?1+.10*THREE.MathUtils.smoothstep(focusAge,.04,.16)*(1-THREE.MathUtils.smoothstep(focusAge,.26,.40)):1;
    const ocean=slots.find(x=>x.id==='konan'&&x.technique===2&&x.effect);
    if(ocean){const ms=effectClock-ocean.effectAt;camera.zoom=1-.13*THREE.MathUtils.smoothstep(ms,650,1450)*(1-THREE.MathUtils.smoothstep(ms,2850,3550));
      camera.zoom+=Math.sin(ms*.09)*.003*THREE.MathUtils.smoothstep(ms,2630,2660)*(1-THREE.MathUtils.smoothstep(ms,2700,2860));}
    // Temporarily widen the camera only for Madara's real 3D Susanoo.
    // Tiny shake around impact (under 350 ms); no change to normal side view.
    const realSusanoo = slots.find(x => x.id === 'madara' && x.technique === 2 && x.effect);
    if (realSusanoo) {
      const m = effectClock - realSusanoo.effectAt;
      const easing = THREE.MathUtils.smoothstep;
      camera.zoom *= 1 - .18 * easing(m, 180, 800) * (1 - easing(m, 3550, 4140));
      camera.zoom += Math.sin(m * .13) * .0035 * easing(m, 3270, 3320) * (1 - easing(m, 3390, 3510));
    }
    camera.updateProjectionMatrix();
    renderer.setRenderTarget(null);renderer.setViewport(0,0,width,height);renderer.render(scene,camera);
  }
  arena3d.bind();requestAnimationFrame(draw);
}
