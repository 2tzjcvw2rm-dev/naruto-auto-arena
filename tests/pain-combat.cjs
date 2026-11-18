const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

for (const page of ['index.html', 'test-3d/index.html']) {
  const ctx = vm.createContext({console});
  ctx.window = ctx;
  const run = code => vm.runInContext(code, ctx);
  const html = fs.readFileSync(page, 'utf8');
  for (const file of ['vendor/three.min.js', 'pain-combat.js']) run(fs.readFileSync('test-3d/' + file, 'utf8'));
  run(html.slice(html.indexOf('const skills='), html.indexOf('const jutsuVisuals=')));
  run(html.slice(html.indexOf('function battleAction('), html.indexOf('function finishBattle(')));
  run(`
    const s={damage:40,formation:{},critChance:80,critDamage:175};
    Math.random=()=>0;
    const document={querySelectorAll:()=>[],querySelector:()=>null};
    function el(){return {classList:{add(){},toggle(){}}};}
    function renderTeams(){} function showDamage(){} function log(){}
    let allies,foes,fx,caster,victims,slot,targets;
    const scene=new THREE.Scene(), delta=new THREE.Vector3();
    function setup(n,reverse,row){
      caster={id:'pain',name:'Пейн',atk:28,bonusCrit:20,bonusCritDamage:25,curHp:900,rage:0,buff:3};
      victims=Array.from({length:n},(_,i)=>({id:'unit'+i,curHp:10000}));
      allies=reverse?victims:[caster]; foes=reverse?[caster]:victims;
      const direction=reverse?-1:1;
      slot={home:new THREE.Vector3(-direction*row,0,.4)};
      targets=victims.map((_,i)=>({home:new THREE.Vector3(direction*(1.35+i%3*1.55),0,i%2?1.6:-1.6)}));
    }
    function playJutsu(u,side,i,op,j,k,_,impact){
      slot.targets=k?targets:[targets[j]];
      slot.onImpact=impact;
      fx=PainCombat.create(scene,slot,targets[j],k);
    }
    function cast(){battleAction(caster,allies.includes(caster)?allies:foes,victims);}
  `);
  for(const reverse of [false,true]) for(const row of [1.35,4.45]) for(let n=1;n<=5;n++) for(const speed of [1,2,3]) {
    run(`setup(${n},${reverse},${row})`);
    for(let k=0;k<3;k++){
      run('victims.forEach(v=>v.curHp=10000);cast()');
      assert.equal(run('fx.inspect().technique'),k);
      const impact=run(`PainCombat.impactTimes[${k}]`);
      for(let t=0;t<impact;t+=80*speed) run(`fx.update(${t},-2.65)`);
      run(`fx.update(${impact-1},-2.65)`);
      assert(run('victims.every(v=>v.curHp===10000)'));
      run(`fx.update(${impact},-2.65);fx.update(${impact},-2.65)`);
      const amount=Math.round(Math.round((reverse?28:38)*[1,1.55,3.1][k]*1.25*(reverse?1.5:2))*[1,.55,.45][k]);
      assert.equal(run(`victims.filter(v=>v.curHp===10000-${amount}).length`),k?n:1);
      assert.equal(run('caster.curHp'),900);
      run('fx.update(10000,-2.65);fx.update(10000,-2.65);');
      assert(run('targets.every(v=>{fx.motion(v,10000,delta);return delta.length()===0;})'));
      assert.equal(run('scene.children.length'),0);
    }
  }
  for(const interruption of ['caster.curHp=0','caster.kamuiUntilRound=4','fx.dispose()','allies=[]','victims.forEach(v=>v.kamuiUntilRound=4)']){
    run(`setup(5,false,3);caster.rage=100;cast();${interruption};fx.update(5000,0)`);
    assert(run('victims.every(v=>v.curHp===10000)'));
  }
  // The 2D path must work independently of Three.js and freeze on pause.
  run(`let paused=false,now=0,queued=null,hits=0;
    const performance={now:()=>now},BattleTempo={speed:1};
    function requestAnimationFrame(fn){queued=fn;return 1;}
    function cancelAnimationFrame(){queued=null;}
    document.createElement=()=>({style:{},remove(){}});
    const node={isConnected:true,appendChild(){}};
    function advance(ms){for(let i=0;i<ms;i+=20){now+=20;queued?.(now);}}
    for (let k=0;k<3;k++) {
      BattleTempo.speed=k+1;hits=0;PainCombat.playFallback({curHp:10},k,node,node,()=>hits++);
      paused=true;advance(5200);if(hits)throw Error('paused hit');
      paused=false;advance(Math.floor((PainCombat.impactTimes[k]-60)/BattleTempo.speed));
      if(hits)throw Error('early fallback hit');advance(5100);
      if(hits!==1||PainCombat.busy)throw Error('fallback resolution');
    }`);
}
console.log('PASS Pain: both pages, cycle, damage matrix, cancellation, formation offsets and 2D pause');
