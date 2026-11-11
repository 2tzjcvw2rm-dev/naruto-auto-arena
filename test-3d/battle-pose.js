/* Bone-aware combat poses. No modification of GLB geometry or textures.
   Rigged fighters move limbs; unrigged GLBs keep their original sculpt.
   The existing mesh/morph animation still runs first, then these additive poses. */
(function(){
'use strict';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const ease=(p,a,b)=>{const t=clamp((p-a)/(b-a),0,1);return t*t*(3-2*t)};
function group(name){
  const raw=String(name).toLowerCase().replace(/([a-z])([0-9])/g,'$1$2');
  const n=raw.replace(/[^a-z0-9]/g,'');
  let side= /right/.test(n)?'right':/left/.test(n)?'left':null;
  if(!side){
    const tokens=raw.split(/[^a-z0-9]+/g);
    if(tokens.includes('r')||/^r(arm|forearm|hand|leg|foot|thigh|calf)/.test(n))side='right';
    if(tokens.includes('l')||/^l(arm|forearm|hand|leg|foot|thigh|calf)/.test(n))side='left';
  }
  if(/head/.test(n))return 'head';
  if(!side)return null;
  let limb=null;
  if(/forearm|lowerarm|elbow/.test(n))limb='forearm';
  else if(/upperarm|uparm|shoulder|arm/.test(n)&&!/finger|twist|end/.test(n))limb='arm';
  else if(/upperleg|upleg|thigh/.test(n))limb='thigh';
  else if(/lowerleg|calf|shin|leg/.test(n)&&!/finger|twist|foot|toe|end/.test(n))limb='calf';
  else if(/foot|ankle/.test(n)&&!/toe/.test(n))limb='foot';
  else if(/hand|wrist/.test(n)&&!/finger|thumb/.test(n))limb='hand';
  return limb?side+'-'+limb:null;
}
const specs={
  naruto:{strike:.62,cast:.70,ultimate:.82},sasuke:{strike:.78,cast:.45,ultimate:1},
  sakura:{strike:1,cast:.65,ultimate:.55},kakashi:{strike:.85,cast:.8,ultimate:1},
  hinata:{strike:.8,cast:1,ultimate:.85},itachi:{strike:.72,cast:.92,ultimate:1},
  pain:{strike:.68,cast:.98,ultimate:1},konan:{strike:.72,cast:.9,ultimate:.95},
  madara:{strike:1,cast:.95,ultimate:1},obito:{strike:.82,cast:.85,ultimate:.88}
};
window.BattlePose={
  mount(fighter,id){
    const joints=new Map(),all=[];
    fighter.traverse(node=>{
      if(!node.isBone)return;
      const key=group(node.name);
      if(key&&!joints.has(key))joints.set(key,node);
    });
    for(const [name,bone] of joints)all.push({name,bone,rest:bone.rotation.clone()});
    const preset=specs[id]||{strike:.75,cast:.7,ultimate:.8};
    const rigged=all.some(a=>a.name.endsWith('arm'))&&all.some(a=>a.name.endsWith('thigh')||a.name.endsWith('calf'));
    let phase='idle';
    function frame(progress,technique,now){
      const p=progress<0?-1:clamp(progress,0,1),idle=p<0;
      const step=p<0?0:ease(p,.09,.16)*(1-ease(p,.24,.43));
      const punch=p<0?0:ease(p,.32,.47)*(1-ease(p,.55,.75));
      const brace=p<0?0:ease(p,.13,.29)*(1-ease(p,.70,.97));
      const wave=p<0?0:ease(p,.11,.23)*(1-ease(p,.73,.94));
      const breathe=Math.sin(now*.0018)*.012;
      const power=(technique===0?preset.strike:technique===1?preset.cast:preset.ultimate);
      phase=idle?'idle':p<.15?'anticipate':p<.42?'windup':p<.74?'strike':'recover';
      // Body remains planted on the same ground, and movement comes from
      // animated arm and leg bones where present in the supplied GLB.
      for(const joint of all){
        const {name,bone,rest}=joint;
        bone.rotation.copy(rest);
        const right=name.startsWith('right'),arm=name.endsWith('-arm'),
          fore=name.endsWith('-forearm'),thigh=name.endsWith('-thigh'),
          calf=name.endsWith('-calf'),foot=name.endsWith('-foot');
        const sign=right?1:-1;
        if(id==='itachi'&&!idle&&(technique===0||technique===1||technique===2)){
          const seal=technique!==2?ease(p,.06,.22)*(1-ease(p,.39,.58)):0;
          const sweep=technique===2?ease(p,.09,.25)*(1-ease(p,.51,.78)):0;
          if(name==='head'){bone.rotation.x+=.21*seal-.045*sweep;continue;}
          if(arm){bone.rotation.x-=.70*seal+(right?.91:.23)*sweep;
            bone.rotation.z+=sign*(.43*seal+.18*sweep);continue;}
          if(fore){bone.rotation.x-=sign*.72*seal+(right?.40:.08)*sweep;
            bone.rotation.z+=sign*.33*seal;continue;}
          if(name.endsWith('-hand')){bone.rotation.z-=sign*.21*seal;continue;}
        }
        if(arm){
          const thrust=technique===0?punch*.75:technique===1?brace*.36:wave*.88;
          // Lightning users thrust right; Hinata and Pain use both hands.
          const dual=id==='hinata'||id==='pain'||id==='sakura'||id==='konan';
          const weight=right||dual?1:.38;
          bone.rotation.x-=power*weight*thrust;
          bone.rotation.z+=sign*(technique===1?brace*.36:wave*.20)*power;
          bone.rotation.z+=sign*breathe;
        }
        if(fore){
          const curl=technique===0?.32*punch:technique===1?.78*brace:.38*wave;
          bone.rotation.x-=sign*power*curl;
          bone.rotation.z+=sign*.12*brace;
        }
        if(thigh){
          bone.rotation.x+=(right?1:-1)*(.32*step+.08*Math.sin(now*.0015))*power;
          if(technique===2)bone.rotation.x+=.06*wave;
        }
        if(calf){
          bone.rotation.x-=(right?-.26:.26)*step*power;
          if(technique===2)bone.rotation.x-=.13*brace;
        }
        if(foot)bone.rotation.x-=(right?1:-1)*.09*step*power;
      }
    }
    function dispose(){
      for(const {bone,rest} of all)bone.rotation.copy(rest);
    }
    return {update:frame,dispose,inspect:()=>({id,rigged,bones:all.length,phase,
      joints:all.map(a=>a.name)})};
  }
};
})();
