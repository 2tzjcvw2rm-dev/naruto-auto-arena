// Execute the real combat handler and actual Three.js effects, without a GPU.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
process.chdir(path.resolve(__dirname,'..'));
for(const file of ['index.html','test-3d/index.html']){
 const html=fs.readFileSync(file,'utf8'),c={console};
 // Inline startup precedes deferred battle-speed.js.
 const startup={window:{},s:{team:[],wave:1},enemies:[],renderTeams(){}};vm.createContext(startup);
 vm.runInContext(html.slice(html.indexOf('function initTeams(){'),html.indexOf("let renderedLayout=''"))+';initTeams();',startup);c.window=c;vm.createContext(c);
 const run=s=>vm.runInContext(s,c),load=p=>run(fs.readFileSync(p,'utf8'));
 load('test-3d/vendor/three.min.js');load('test-3d/combat-profile.js');
 run(`{const holder=new THREE.Group(),fighter=new THREE.Group();holder.add(fighter);const idle=CombatProfile.mount('itachi',fighter,{battle:true});for(let ms=0;ms<10000;ms+=100)idle(.1,ms);let meshes=0;holder.traverse(o=>{if(o.isMesh||o.isPoints)meshes++});if(meshes)throw Error('Idle emitted attack effects');idle.dispose();}`);load('test-3d/itachi-susanoo.js');load('test-3d/battle-visual-upgrade.js');load('test-3d/battle-ultimate-fx.js');
 run(html.slice(html.indexOf('const skills='),html.indexOf('const jutsuVisuals=')));
 run(html.slice(html.indexOf('function battleAction('),html.indexOf('function finishBattle(')));
 run(`const s={formation:{},critChance:0,damage:0,critDamage:150};
 const document={querySelectorAll:()=>[]};function el(){return {classList:{add(){},toggle(){}},textContent:''}};
 function renderTeams(){};function log(){};function showDamage(){};
 let allies=Array.from({length:5},(_,i)=>({id:'target'+i,curHp:100000,maxHp:100000}));
 let foes=Array.from({length:5},(_,i)=>({id:i?'other'+i:'itachi',name:'Итачи',curHp:100000,maxHp:100000,atk:16,rage:0,buff:0}));
 const scene=new THREE.Scene(),slot={id:'itachi',actor:new THREE.Group(),fighter:new THREE.Group()};
 const targets=allies.map((u,i)=>{const actor=new THREE.Group();actor.position.set(-3,0,i-2);return {actor}});
 let pending=null,fx=null,actions=[];
 function playJutsu(u,side,index,ts,ti,action,support,impact){actions.push(action);pending=impact;slot.targets=action===2?targets:[targets[ti]];fx=createArenaTechniqueFX(THREE,scene,slot,targets[ti],action,'fire','#ff3300');}
 `);
 for(const speed of [1,2,3]){
  run('foes[0].rage=0;actions=[];');
  for(let turn=0;turn<6;turn++){
   const before=run('allies.map(u=>u.curHp)');run('battleAction(foes[0],foes,allies)');
   assert.deepEqual(run('allies.map(u=>u.curHp)'),before,'HP must not change on activation');
   const action=turn%3,impact=action===2?1817:868,duration=action===2?2300:1400;
   for(let wall=0;wall<duration/speed;wall+=16){c.ms=wall*speed;run('fx.update(ms,-2.65);scene.updateMatrixWorld(true);');
    if(wall*speed>=impact&&run('!!pending'))run('pending();pending=null;');
   }
   const after=run('allies.map(u=>u.curHp)');assert.equal(after.filter((hp,i)=>hp<before[i]).length,action===2?5:1);
   c.duration=duration;run('fx.update(duration+1,-2.65);');assert.equal(run('scene.children.length'),0);
  }
  assert.deepEqual(Array.from(run('actions')),[0,1,2,0,1,2]);
 }
 // Death or replacement of the source invalidates a queued hit.
 run('foes[0].rage=0;battleAction(foes[0],foes,allies);foes[0].curHp=0;');const before=run('allies.map(u=>u.curHp)');run('pending();fx.dispose()');assert.deepEqual(run('allies.map(u=>u.curHp)'),before);
 run('foes[0].curHp=100;battleAction(foes[0],foes,allies);foes=[];');run('pending();fx.dispose()');assert.deepEqual(run('allies.map(u=>u.curHp)'),before);
 // Short fight: lethal first hit, no new effects against a defeated team.
 run('foes=[{id:"itachi",name:"Итачи",curHp:100,atk:9999,rage:0}];allies=[{id:"last",curHp:1}];battleAction(foes[0],foes,allies);pending();fx.dispose();');
 assert.equal(run('allies[0].curHp'),0);const n=run('actions.length');run('battleAction(foes[0],foes,allies)');assert.equal(run('actions.length'),n);
}
console.log('PASS: both entrypoints, 5v5, two full Itachi cycles at 1x/2x/3x, hit-time HP, AoE, death/reset cancellation, short fight, effect disposal. GPU/Safari appearance not covered.');
