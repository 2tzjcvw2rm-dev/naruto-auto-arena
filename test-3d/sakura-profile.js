// Sakura profile controller: keeps the artist's high-detail Sketchfab model,
// improves mobile framing and shows the approved art until the viewer is ready.
// The Sketchfab source stays embedded; no unauthorized asset is copied.
(function () {
  'use strict';
  const UID='6409fbcec6864a72b1011856a068fd52';
  const MODEL_LINK='https://sketchfab.com/3d-models/sakura-'+UID;
  const DIRECT='https://sketchfab.com/models/'+UID+'/embed?autostart=1&camera=0&ui_hint=0&ui_infos=0&ui_controls=0&scrollwheel=0&transparent=1&max_texture_size=2048';
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
  function fitSakura(api){
    if(typeof api.getCameraLookAt!=='function')return;
    api.getCameraLookAt((err,camera)=>{
      if(err||!camera||!camera.position||!camera.target)return;
      // 23% farther than the original model view: feet and hair fit the iPhone stage.
      const target=camera.target;
      const position=camera.position.map((v,i)=>target[i]+(v-target[i])*1.23);
      api.setCameraLookAt(position,target,0);
    });
  }
  function playSakuraCombatIdle(api){
    if(typeof api.getAnimations!=='function')return;
    api.getAnimations((err,animations)=>{
      if(err||!Array.isArray(animations)||!animations.length)return;
      const pose=animations.find(a=>/combat|battle|fight|guard|stance|idle|stand|ready/i.test(String(a[1])));
      if(!pose)return; // Don't start an unrelated run/walk animation.
      api.setCurrentAnimationByUID(pose[0],e=>{
        if(e)return;
        if(api.setCycleMode)api.setCycleMode('loopOne');
        if(api.play)api.play();
      });
    });
  }
  window.mountSakuraViewer=function mountSakuraViewer(host){
    let disposed=false,api=null,readyTimer=null,usingDirect=false;
    host.innerHTML='';
    host.setAttribute('aria-label','3D-модель Сакуры. Поверните пальцем.');
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
    iframe.style.transition='opacity 260ms ease-in-out';
    host.appendChild(iframe);
    const credit=document.createElement('span');
    credit.className='sakura-embed-credit';
    const link=document.createElement('a');
    link.href=MODEL_LINK;
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.textContent='3D · danigamer495channel · CC BY';
    credit.appendChild(link);
    host.appendChild(credit);
    // Soft cherry petals over the 3D stage, not baked into Sakura's model.
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
      usingDirect=true;
      iframe.src=DIRECT;
      iframe.onload=()=>{if(!disposed){clearTimeout(readyTimer);readyTimer=setTimeout(reveal,850)}};
    }
    viewerSDK().then(()=>{
      if(disposed)return;
      try{
        const client=new window.Sketchfab('1.12.1',iframe);
        client.init(UID,{
          autostart:1,camera:0,scrollwheel:0,transparent:1,
          ui_hint:0,ui_infos:0,ui_controls:0,max_texture_size:2048,
          success:viewer=>{
            if(disposed)return;
            api=viewer;
            viewer.addEventListener('viewerready',()=>{
              if(disposed)return;
              fitSakura(viewer);
              playSakuraCombatIdle(viewer);
              reveal();
            });
            viewer.start();
          },
          error:()=>useDirect()
        });
      }catch(e){console.warn('Sakura viewer fallback',e);useDirect()}
    }).catch(useDirect);
    // The art remains visible if the external site never loads.
    return ()=>{
      disposed=true;
      clearTimeout(readyTimer);
      if(api&&typeof api.stop==='function'){try{api.stop()}catch(e){}}
      iframe.remove();
      petals.remove();
      poster.remove();
      credit.remove();
    };
  };
})();
