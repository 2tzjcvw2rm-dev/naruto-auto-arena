/* Manual 1x / 2x / 3x battle tempo, independent of character speed stats.
 * One logical clock is shared by the between-turn delays and by the WebGL arena.
 * Changing tempo re-arms pending timers with their unelapsed GAME time. */
(function(global){
  'use strict';
  const KEY='naruto-auto-arena-tempo-v1',valid=[1,2,3];
  let speed=1;
  try{const value=Number(localStorage.getItem(KEY));if(valid.includes(value))speed=value;}catch(e){}
  const pending=new Map();
  const now=()=>performance.now();
  function arm(task){
    task.started=now();
    task.rate=speed;
    task.id=setTimeout(()=>{
      if(pending.get(task.name)!==task)return;
      pending.delete(task.name);
      task.callback();
    },Math.max(0,task.remaining/speed));
    return task.id;
  }
  function cancel(name){
    const task=pending.get(name);
    if(task){clearTimeout(task.id);pending.delete(name);}
  }
  function after(name,duration,callback){
    cancel(name);
    if(typeof callback!=='function')throw new TypeError('BattleTempo.after expects callback');
    const task={name,remaining:Math.max(0,Number(duration)||0),callback};
    pending.set(name,task);
    return arm(task);
  }
  function updateControls(){
    document.documentElement.style.setProperty('--battle-speed',String(speed));
    // Use pre-computed CSS time values. Safari supports custom-property durations
    // even on versions without CSS Values 4 duration division.
    const ms={
      '--battle-jutsu-melee':620,'--battle-jutsu-cast':660,
      '--battle-jutsu-ultimate':800,'--battle-jutsu-heal':850,
      '--battle-jutsu-hurt':380,'--battle-fx':650,
      '--battle-fx-area':850,'--battle-fx-support':950,
      '--battle-damage':900
    };
    for(const [name,milliseconds] of Object.entries(ms)){
      document.documentElement.style.setProperty(name,(milliseconds/speed)+'ms');
    }
    const row=document.getElementById('battleSpeedControls');
    if(!row)return;
    row.querySelectorAll('[data-battle-speed]').forEach(button=>{
      const active=Number(button.dataset.battleSpeed)===speed;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    row.dataset.currentSpeed=String(speed);
  }
  function setSpeed(value){
    const next=Number(value);
    if(!valid.includes(next))return speed;
    if(next!==speed){
      const timestamp=now();
      for(const task of pending.values()){
        clearTimeout(task.id);
        task.remaining=Math.max(0,task.remaining-(timestamp-task.started)*task.rate);
      }
      speed=next;
      for(const task of pending.values())arm(task);
      try{localStorage.setItem(KEY,String(speed));}catch(e){}
    }
    updateControls();
    return speed;
  }
  const api={
    get speed(){return speed;},
    after,cancel,setSpeed,init:updateControls,
    pending:()=>Array.from(pending.keys())
  };
  global.BattleTempo=api;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',updateControls);
  else updateControls();
})(window);