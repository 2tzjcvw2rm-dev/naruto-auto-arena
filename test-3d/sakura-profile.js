// Sakura high-detail profile viewer. The Sketchfab source stays embedded under
// the original artist's attribution; no viewer assets are extracted or copied.
// Camera / materials / post-processing are tuned for a sharp mobile RPG portrait.
(function () {
  'use strict';
  const UID='6409fbcec6864a72b1011856a068fd52';
  const MODEL_LINK='https://sketchfab.com/3d-models/sakura-'+UID;
  const MAX_TEXTURE=4096;
  const DIRECT='https://sketchfab.com/models/'+UID+
    '/embed?autostart=1&camera=0&ui_hint=0&ui_infos=0&ui_controls=0'+
    '&scrollwheel=0&transparent=1&max_texture_size='+MAX_TEXTURE;
  let sdkPromise=null;
  function viewerSDK(){
    if(window.Sketchfab)return Promise.resolve();
    if(sdkPromise)return sdkPromise;
    sdkPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
      script.async=true;
      script.onload=()=>window.Sketchfab?resolve():reject(new Error('Sketchfab SDK unavailable'));
      script.onerror=()=>reject(new Error('Sketchfab SDK blocked'));
      document.head.appendChild(script);
    });
    return sdkPromise;
  }
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function fitSakura(api){
    if(typeof api.getCameraLookAt!=='function')return;
    api.getCameraLookAt((err,camera)=>{
      if(err||!camera||!Array.isArray(camera.position)||!Array.isArray(camera.target))return;
      // Extra breathing room around Sakura's arms and hair on narrow iPhone screens.
      const target=camera.target,position=camera.position.map((v,i)=>target[i]+(v-target[i])*1.19);
      api.setCameraLookAt(position,target,0);
    });
  }
  function improveSakuraMaterials(api){
    if(typeof api.getMaterialList!=='function'||typeof api.setMaterial!=='function')return;
    api.getMaterialList((err,materials)=>{
      if(err||!Array.isArray(materials))return;
      for(const material of materials){
        if(!material||!material.channels||!material.stateSetID)continue;
        const name=String(material.name||'').toLowerCase();
        // Keep naturally wet eyes and metallic accessories untouched.
        if(/eye|iris|pupil|metal|jewel|glass/.test(name))continue;
        const changed={...material,channels:{...material.channels}};
        let updated=false;
        for(const [channel,limit] of [['RoughnessPBR',.65],['ClearCoat',.13],['MetalnessPBR',.06]]){
          const src=material.channels[channel];
          if(!src||typeof src.factor!=='number'||!Number.isFinite(src.factor))continue;
          const factor=channel==='RoughnessPBR'?Math.max(limit,src.factor):Math.min(limit,src.factor);
          if(Math.abs(factor-src.factor)>.01){
            changed.channels[channel]={...src,factor};
            updated=true;
          }
        }
        if(updated)api.setMaterial(changed);
      }
    });
  }
  function improveSakuraLighting(api){
    // Remove bloom / depth-of-field, which soften the mesh and blow out white areas.
    if(typeof api.getPostProcessing==='function'&&typeof api.setPostProcessing==='function'){
      api.getPostProcessing(settings=>{
        if(!settings||typeof settings!=='object')return;
        api.setPostProcessing({
          ...settings,enable:true,
          bloomEnable:false,dofEnable:false,
          ssrEnable:false,grainEnable:false,chromaticAberrationEnable:false,
          sharpenEnable:true,sharpenFactor:.23
        });
      });
    }
    if(typeof api.setTextureQuality==='function')api.setTextureQuality('hd');
    if(typeof api.getEnvironment==='function'&&typeof api.setEnvironment==='function'){
      api.getEnvironment((err,env)=>{
        if(err||!env||!env.enabled)return;
        api.setEnvironment({
          ...env,
          exposure:clamp((Number(env.exposure)||1)*.84,.36,1.5),
          lightIntensity:clamp((Number(env.lightIntensity)||.9)*.8,.2,1.0)
        });
      });
    }
    if(typeof api.getLight==='function'&&typeof api.setLight==='function'){
      for(let lightId=0;lightId<3;lightId++){
        api.getLight(lightId,(err,light)=>{
          if(err||!light||!light.enabled||typeof light.intensity!=='number')return;
          api.setLight(lightId,{intensity:clamp(light.intensity*.82,.18,.76)});
        });
      }
    }
    improveSakuraMaterials(api);
  }
  // The approved art has Sakura's elbows bent with the fists held in a forward
  // taijutsu guard. Repose separate arm bones if the source exposes them.
  // It may expose only a fused mesh: never rotate that mesh or fake a 2D arm.
  function poseIfRigged(api){
    if(typeof api.getNodeMap!=='function'||typeof api.getMatrix!=='function'||
       typeof api.setMatrix!=='function')return;
    api.getNodeMap((err,nodes)=>{
      if(err||!Array.isArray(nodes))return;
      const found={};
      for(const node of nodes){
        if(!node||node.instanceID===undefined)continue;
        const name=String(node.name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
        const side=/left|(^|rig)larm|lupperarm/.test(name)?'left':
          /right|(^|rig)rarm|rupperarm/.test(name)?'right':null;
        if(!side)continue;
        // Don't modify a body mesh or an arbitrary named accessory.
        const category=/forearm|lowerarm|elbow/.test(name)?'forearm':
          /upperarm|shoulder|arm/.test(name)?'upperarm':null;
        if(!category||/mesh|geometry|lod|weapon|sleeve/.test(name))continue;
        found[side+category]=found[side+category]||node;
      }
      if(!found.leftupperarm||!found.rightupperarm||
         !found.leftforearm||!found.rightforearm){
        console.info('Sakura model does not expose a full editable arm rig; preserving her original pose');
        return;
      }
      // A small local-space pose preserves the original bind offsets and
      // avoids extreme shoulder and wrist deformation.
      const rotations=[
        [found.leftupperarm,-.22, .20],
        [found.leftforearm,.34,-.08],
        [found.rightupperarm,-.35,-.23],
        [found.rightforearm,.47,.07]
      ];
      // Matrix transforms must be adjusted from the original node matrix.
      const multiply=(a,b)=>{
        const c=new Array(16).fill(0);
        for(let col=0;col<4;col++)for(let row=0;row<4;row++)
          for(let k=0;k<4;k++)c[col*4+row]+=a[k*4+row]*b[col*4+k];
        return c;
      };
      const xRotation=a=>[1,0,0,0,0,Math.cos(a),Math.sin(a),0,0,-Math.sin(a),Math.cos(a),0,0,0,0,1];
      const zRotation=a=>[Math.cos(a),Math.sin(a),0,0,-Math.sin(a),Math.cos(a),0,0,0,0,1,0,0,0,0,1];
      rotations.forEach(([node,rx,rz])=>{
        api.getMatrix(node.instanceID,(e,matrix)=>{
          if(e||!Array.isArray(matrix)||matrix.length!==16)return;
          const p=multiply(multiply(matrix,zRotation(rz)),xRotation(rx));
          api.setMatrix(node.instanceID,p);
        });
      });
    });
  }
  function playSakuraCombatIdle(api){
    if(typeof api.getAnimations!=='function')return;
    api.getAnimations((err,animations)=>{
      if(err||!Array.isArray(animations)||!animations.length){
        poseIfRigged(api);
        return;
      }
      const pose=animations.find(a=>/combat|battle|fight|guard|stance/i.test(String(a[1])));
      if(pose){
        api.setCurrentAnimationByUID(pose[0],e=>{
          if(e)return;
          if(api.setCycleMode)api.setCycleMode('loopOne');
          if(api.play)api.play();
        });
      }else{
        // Idle clips often animate hands out of a desired fighting pose.
        // Pause them before trying a more accurate static guard.
        if(typeof api.pause==='function')api.pause();
        poseIfRigged(api);
      }
    });
  }
  window.mountSakuraViewer=function mountSakuraViewer(host){
    let disposed=false,api=null,readyTimer=null,usingDirect=false;
    host.innerHTML='';
    host.setAttribute('aria-label','Чёткая 3D-модель Сакуры. Поверните пальцем.');
    const poster=document.createElement('div');
    poster.className='sakura-loading-art';
    poster.setAttribute('aria-hidden','true');
    host.appendChild(poster);
    const iframe=document.createElement('iframe');
    iframe.className='sakura-sketchfab-iframe';
    iframe.title='Sakura 3D by danigamer495channel';
    iframe.setAttribute('allow','autoplay; fullscreen; xr-spatial-tracking');
    iframe.setAttribute('allowfullscreen','');
    iframe.setAttribute('loading','eager');
    iframe.style.opacity='0';
    iframe.style.transition='opacity 220ms ease-in-out';
    host.appendChild(iframe);
    const credit=document.createElement('span');
    credit.className='sakura-embed-credit';
    const link=document.createElement('a');
    link.href=MODEL_LINK;link.target='_blank';link.rel='noopener noreferrer';
    link.textContent='3D · danigamer495channel · CC BY';
    credit.appendChild(link);host.appendChild(credit);
    const petals=document.createElement('div');
    petals.className='sakura-ambient-petals';
    petals.setAttribute('aria-hidden','true');
    for(let i=0;i<7;i++){const petal=document.createElement('i');petal.style.setProperty('--petal',String(i));petals.appendChild(petal)}
    host.appendChild(petals);
    function reveal(){
      if(disposed||!host.isConnected)return;
      iframe.style.opacity='1';
      poster.classList.add('is-hidden');
    }
    function useDirect(){
      if(disposed||usingDirect)return;
      usingDirect=true;iframe.src=DIRECT;
      iframe.onload=()=>{if(!disposed){clearTimeout(readyTimer);readyTimer=setTimeout(reveal,850)}};
    }
    viewerSDK().then(()=>{
      if(disposed)return;
      try{
        const client=new window.Sketchfab('1.12.1',iframe);
        client.init(UID,{
          autostart:1,camera:0,scrollwheel:0,transparent:1,
          ui_hint:0,ui_infos:0,ui_controls:0,max_texture_size:MAX_TEXTURE,
          success:viewer=>{
            if(disposed)return;
            api=viewer;
            viewer.addEventListener('viewerready',()=>{
              if(disposed)return;
              fitSakura(viewer);
              improveSakuraLighting(viewer);
              playSakuraCombatIdle(viewer);
              reveal();
            });
            viewer.start();
          },
          error:()=>useDirect()
        });
      }catch(e){console.warn('Sakura viewer fallback',e);useDirect()}
    }).catch(useDirect);
    // Keep poster while loading instead of showing a blurry half-loaded mesh.
    return ()=>{
      disposed=true;clearTimeout(readyTimer);
      if(api&&typeof api.stop==='function'){try{api.stop()}catch(e){}}
      iframe.remove();petals.remove();poster.remove();credit.remove();
    };
  };
})();
