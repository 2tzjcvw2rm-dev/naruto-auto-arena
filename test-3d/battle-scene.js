/* Shared battlefield only. Profiles, GLBs and saved combat state stay independent. */
function initArena3d(){
  if(arena3d)return;
  if(!window.THREE){arenaUnavailable=true;bindBattleImages();return}
  const host=el('battle3d');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:false,antialias:true,powerPreference:'low-power'})}
  catch(error){arenaUnavailable=true;bindBattleImages();return}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.outputEncoding=THREE.sRGBEncoding;
  host.appendChild(renderer.domElement);host.parentElement.classList.add('three-active','side-battle');
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xa9c5ce);
  scene.fog=new THREE.Fog(0xa9c5ce,22,65);
  scene.add(new THREE.HemisphereLight(0xfff5df,0x788b9b,1.15));
  const light=new THREE.DirectionalLight(0xffedcf,.85);light.position.set(-4,9,6);scene.add(light);
  const camera=new THREE.PerspectiveCamera(32,1,.1,100);
  const stone=new THREE.MeshLambertMaterial({color:0xa7a293});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(180,180),stone);
  floor.rotation.x=-Math.PI/2;floor.position.y=-.025;scene.add(floor);
  // Training courtyard, with real perspective and subdued paving seams.
  const lines=[];
  for(let i=-12;i<=12;i+=2){lines.push(i,0,-12,i,0,12,-12,0,i,12,0,i)}
  const grid=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(lines,3)),new THREE.LineBasicMaterial({color:0x7f8075,transparent:true,opacity:.3}));scene.add(grid);
  function block(x,y,z,w,h,d,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color}));m.position.set(x,y,z);scene.add(m)}
  block(0,.5,-6,26,1,.45,0x777e73);block(0,1.05,-6,26,.15,.65,0xc8bd9f);
  for(let x=-12;x<=12;x+=3){block(x,1.7,-6,.15,1.3,.15,0x596b63);block(x,2.35,-6,3,.12,.15,0x596b63)}
  for(const x of [-9,9]){block(x,1,-4,.3,2,.3,0x82654b);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.8,1),new THREE.MeshLambertMaterial({color:0x4c735b}));crown.position.set(x,3.2,-4);scene.add(crown)}
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
  const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,2,32,32,32);
  gradient.addColorStop(0,'rgba(22,30,27,.48)');gradient.addColorStop(1,'rgba(22,30,27,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const shadowMap=new THREE.CanvasTexture(shadowCanvas),shadowGeometry=new THREE.PlaneGeometry(1.5,1.1);
  const shadowMaterial=new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false});
  let slots=[],width=0,height=0,last=0,clock=0,bindSerial=0;
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
  function slotPoint(slot,y){return screenPoint(new THREE.Vector3(slot.actor.position.x,y,slot.actor.position.z))}
  arena3d={
    trigger(side,index,technique,targetSide,targetIndex){
      const active=slots.find(x=>x.side===side&&x.index===index);
      if(active){active.attackAt=clock;active.technique=technique;active.target=slots.find(x=>x.side===targetSide&&x.index===targetIndex);}
    },
    point(side,index){const slot=slots.find(x=>x.side===side&&x.index===index);return slot?slotPoint(slot,1):null},
    bind(){
      const currentBind=++bindSerial;
      for(const slot of slots){slot.motion?.dispose?.();scene.remove(slot.actor,slot.shadow)}
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
          slots.push({unit,model,bodyMeshes,actor,fighter,shadow,home,side,index:i,motion,attackAt:null,technique:0,target:null});unit.classList.add('has-model');
        });
      });
    },
    // Read-only diagnostics for responsive framing and animation verification.
    inspect(){return {size:[width,height],slots:slots.map(a=>({id:(a.side==='allyTeam'?allies:foes)[a.index].id,side:a.side,position:a.actor.position.toArray(),home:a.home.toArray(),yaw:a.actor.rotation.y,visible:a.actor.visible,box:(()=>{a.model.updateWorldMatrix(true,true);bounds.setFromObject(a.model);return {min:bounds.min.toArray(),max:bounds.max.toArray()}})()}))}}
  };
  function draw(time){
    requestAnimationFrame(draw);
    if(document.hidden||time-last<40)return;
    const dt=last?Math.min(.08,(time-last)/1000):.04;last=time;
    const suspended=paused||!!document.querySelector('#profileModal.open,#teamModal.open,#bagModal.open');
    if(!suspended)clock+=dt*1000;
    const rect=host.getBoundingClientRect();if(!rect.width||!rect.height)return;
    if(width!==rect.width||height!==rect.height){width=rect.width;height=rect.height;renderer.setSize(width,height);fit()}
    for(const slot of slots){
      const {unit,actor,model,shadow,side,home,motion}=slot;
      actor.visible=!unit.classList.contains('down');shadow.visible=actor.visible;
      if(!actor.visible)continue;
      const elapsed=slot.attackAt===null?-1:clock-slot.attackAt,p=elapsed>=0&&elapsed<1400?elapsed/1400:-1;
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
        const travel=melee?Math.max(0,distance-1.15):.18;
        actor.position.x+=dx/distance*travel*blend;actor.position.z+=dz/distance*travel*blend;
      }
      const delta=Math.atan2(Math.sin(yaw-actor.rotation.y),Math.cos(yaw-actor.rotation.y));actor.rotation.y+=delta*Math.min(1,dt*14);
      if(motion)motion(suspended?0:dt,clock,p>=0,p,slot.technique);
      // Ground the actual animated model, excluding chakra and overhead HUD.
      actor.position.y=0;actor.updateMatrixWorld(true);bounds.makeEmpty();for(const mesh of slot.bodyMeshes){if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));}actor.position.y=-bounds.min.y;
      shadow.position.set(actor.position.x,.012,actor.position.z);
      const label=slotPoint(slot,1.98);
      unit.style.setProperty('left',label.x+'px','important');unit.style.setProperty('top',label.y+'px','important');
    }
    renderer.setRenderTarget(null);renderer.setViewport(0,0,width,height);renderer.render(scene,camera);
  }
  arena3d.bind();requestAnimationFrame(draw);
}
