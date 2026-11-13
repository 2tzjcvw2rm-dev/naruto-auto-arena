const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
for(const page of ['index.html','test-3d/index.html']){
 const c={console};c.window=c;vm.createContext(c);const run=s=>vm.runInContext(s,c);
 run(fs.readFileSync('test-3d/vendor/three.min.js','utf8'));run(fs.readFileSync('test-3d/konan-combat.js','utf8'));
 const h=fs.readFileSync(page,'utf8');assert(h.includes('konan-combat.js'));
 run(h.slice(h.indexOf('const skills='),h.indexOf('const jutsuVisuals=')));
 run(h.slice(h.indexOf('function battleAction('),h.indexOf('function finishBattle(')));
 run(`const s={formation:{},damage:0,critChance:0,critDamage:150};const document={querySelectorAll:()=>[]};function el(){return {classList:{add(){},toggle(){}},textContent:''}};function log(){}function renderTeams(){}function showDamage(){}
 let allies=[{id:'konan',name:'Konan',atk:20,curHp:1000,rage:0,buff:0}];let foes=Array.from({length:5},(_,i)=>({id:'f'+i,curHp:10000}));let fx;const scene=new THREE.Scene();const slot={id:'konan',home:new THREE.Vector3(-3,0,0),effectAt:0};const targets=foes.map((u,i)=>({id:u.id,home:new THREE.Vector3(2+i*.3,0,i*.6-1.2)}));function playJutsu(u,s,si,ts,ti,a,support,impact){slot.targets=targets;slot.onImpact=impact;fx=KonanCombat.create(scene,slot,targets[ti],a);}`);
 for(const speed of [1,2,3])for(let action=0;action<Number(process.env.KONAN_STAGES||1);action++){
 c.action=action;run('allies[0].rage=action*50;foes.forEach(x=>x.curHp=10000);battleAction(allies[0],allies,foes)');
 c.ms=run('KonanCombat.impactTimes[action]')-1;run('fx.update(ms,-2.65)');assert(run('foes.every(x=>x.curHp===10000)'));
 const duration=run('KonanCombat.durations[action]');
 for(let t=0;t<=duration+50;t+=17*speed){c.ms=t;run('fx.update(ms,-2.65);scene.updateMatrixWorld(true);scene.traverse(o=>{if(!o.matrixWorld.elements.every(Number.isFinite))throw Error("transform");if(o.isMesh&&o.visible&&o.position.y < -2.65)throw Error("below ground")})');}
 const amount=[20,19,34][action];assert.equal(run(`foes.filter(x=>x.curHp===10000-${amount}).length`),action===0?1:5);
 assert.equal(run('scene.children.length'),0);
 run('fx.update(10000,-2.65)');assert.equal(run(`foes.filter(x=>x.curHp===10000-${amount}).length`),action===0?1:5);
 }
 run('allies[0].rage=0;battleAction(allies[0],allies,foes);fx.dispose()');assert.equal(run('scene.children.length'),0);
}
console.log('PASS Konan: both handlers, damage timing/count, x1/x2/x3, finite transforms, ground, cleanup');
