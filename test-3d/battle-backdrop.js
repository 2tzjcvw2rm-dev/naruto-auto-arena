/* Calm 5v5 waterfall: keep the exact approved landscape but replace 9-frame
 * full-screen GIF flicker with a still first frame and a faint animated overlay.
 * The canvas and combat formation remain untouched, including on mobile Safari. */
(function(){
'use strict';
function calmBackground(){
  const host=document.getElementById('battle3d');
  if(!host)return;
  const script=document.querySelector('script[src*="battle-backdrop.js"]');
  const asset=script?new URL('assets/waterfall-battle.gif',script.src).href:
    new URL('./test-3d/assets/waterfall-battle.gif',location.href).href;
  const image=new Image();
  image.decoding='async';
  image.onload=()=>{
    try{
      const limit=1152,ratio=Math.min(1,limit/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));
      canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
      const ctx=canvas.getContext('2d',{alpha:false});
      if(!ctx)throw new Error('Canvas 2D unavailable');
      ctx.drawImage(image,0,0,canvas.width,canvas.height);
      const still=canvas.toDataURL('image/jpeg',.88);
      if(!still.startsWith('data:image/'))throw new Error('Background still not decoded');
      host.style.setProperty('--waterfall-still','url("'+still+'")');
      host.classList.add('waterfall-calm');
      host.dataset.backgroundMotion='subtle';
      canvas.width=canvas.height=1;
    }catch(err){
      // Keep the original background rather than blanking combat if unsupported.
      console.warn('Waterfall still-image fallback',err);
    }
  };
  image.src=asset;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',calmBackground);
else calmBackground();
})();