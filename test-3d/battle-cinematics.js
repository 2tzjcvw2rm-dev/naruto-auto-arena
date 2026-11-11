/* Mobile-friendly cinematic ultimate titles. Rendered over the *existing*
   5v5 camera, without image assets, cloned GLBs or duplicate render loops. */
(function(){
'use strict';
const accents={
  naruto:'#54cfff',sasuke:'#7bc2ff',sakura:'#85ffb7',kakashi:'#74ceff',
  hinata:'#8faeff',itachi:'#fa7d4d',pain:'#bd93ff',konan:'#d9b9ff',
  madara:'#bb77ff',obito:'#a48cff'
};
let root=null,veil=null,flash=null,tag=null,heading=null,accent=null,active=null;
function node(className,parent){
  const el=document.createElement('div');el.className=className;parent.appendChild(el);return el;
}
function ensure(){
  if(typeof document==='undefined')return false;
  const arena=document.querySelector('.arena');
  if(!arena)return false;
  if(root&&root.parentNode!==arena){root.remove();root=null}
  if(root)return true;
  root=node('arena-cinematic',arena);root.setAttribute('aria-hidden','true');
  veil=node('arena-cinematic-veil',root);
  flash=node('arena-cinematic-flash',root);
  const banner=node('arena-cinematic-banner',root);
  tag=node('arena-cinematic-tag',banner);
  heading=node('arena-cinematic-heading',banner);
  accent=node('arena-cinematic-rule',banner);
  return true;
}
const smooth=(x,a,b)=>{
  const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
  return t*t*(3-2*t);
};
window.BattleCinematics={
  start(info){
    if(!ensure())return false;
    const id=String(info.id||'ninja'),duration=Math.max(700,Number(info.duration)||1400);
    active={id,started:Number(info.now)||0,duration,side:info.side||'allyTeam',phase:'intro'};
    root.classList.add('active');
    root.dataset.ninja=id;
    root.style.setProperty('--cinema-accent',accents[id]||info.color||'#aed4ff');
    tag.textContent=active.side==='allyTeam'?'ТЕХНИКА НИНДЗЯ':'ТЕХНИКА ПРОТИВНИКА';
    heading.textContent=String(info.label||'Ультимативная техника');
    return true;
  },
  update(now){
    if(!root||!active)return;
    const p=Math.max(0,(now-active.started)/active.duration);
    if(p>=1){this.clear();return}
    const entrance=smooth(p,0,.16),departure=1-smooth(p,.78,1);
    const vis=entrance*departure;
    active.phase=p<.18?'intro':p<.48?'focus':p<.74?'impact':'outro';
    veil.style.opacity=String((active.id==='naruto'?.22:.68)*vis);
    flash.style.opacity=String(active.id==='naruto'?(smooth(p,.90,.92)-smooth(p,.94,.98))*.22:(smooth(p,.49,.56)-smooth(p,.61,.75))*.36);
    flash.style.transform='scale('+(0.85+smooth(p,.48,.72)*.35)+')';
    root.style.opacity=String(departure);
    heading.parentNode.style.transform='translate3d('+
      ((1-entrance)*(active.side==='allyTeam'?-24:24))+'px,'+
      ((1-entrance)*12)+'px,0)';
    heading.parentNode.style.opacity=String(entrance);
    accent.style.transform='scaleX('+(smooth(p,.12,.50)) +')';
  },
  inspect(){return active?{...active}:null},
  clear(){
    active=null;if(!root)return;
    root.classList.remove('active');
    root.style.opacity='0';
  }
};
})();
