const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
for(const page of ['index.html','test-3d/index.html']){
 const c={console};c.window=c;vm.createContext(c);const run=s=>vm.runInContext(s,c);
 run(fs.readFileSync('test-3d/vendor/three.min.js','utf8'));run(fs.readFileSync('test-3d/konan-combat.js','utf8'));
 const h=fs.readFileSync(page,'utf8');assert(h.includes('konan-combat.js'));
 run(h.slice(h.indexOf('const skills='),h.indexOf('const jutsuVisuals=')));
 run(h.slice(h.indexOf('function battleAction('),h.indexOf('function finishBattle(')));
 run(`const s={formation:{},damage:0,critChance:0,critDamage:150};const document={querySelectorAll:()=>[]};function el(){return {classList:{add(){},toggle(){}},textContent:''}};function log(){}function renderTeams(){}function showDamage(){}
 let allies=[{id:'konan',name:'Konan',atk:20,curHp:1000,rage:0,buff:0}];let foes=Array.from({length:5},(_,i)=>({id:'f'+i,curHp:10000}));let fx;const scene=new THREE.Scene();const slot={id:'konan',home:new THREE.Vector3(-3,0,0),effectAt:0};const targets=foes.map((u,i)=>({id:u.id,home:new THREE.Vector3(2+i*.3,0,i*.6-1.2)}));function playJutsu(u,s,si,ts,ti,a,support,impact){slot.targets=targets;slot.onImpact=impact;fx=KonanCombat.create(scene,slot,targets[ti],a);}`);
 for(const speed of [1,2,3])for(let action=0;action<Number(process.env.KONAN_STAGES||3);action++){
 c.action=action;run('allies[0].rage=action*50;foes.forEach(x=>x.curHp=10000);battleAction(allies[0],allies,foes)');
 c.ms=run('KonanCombat.impactTimes[action]')-1;run('fx.update(ms,-2.65)');assert(run('foes.every(x=>x.curHp===10000)'));
 const duration=run('KonanCombat.durations[action]');
 for(let t=0;t<=duration+50;t+=17*speed){c.ms=t;run('fx.update(ms,-2.65);scene.updateMatrixWorld(true);scene.traverse(o=>{if(!o.matrixWorld.elements.every(Number.isFinite))throw Error("transform");})');}
 const amount=[20,31,34][action];assert.equal(run(`foes.filter(x=>x.curHp===10000-${amount}).length`),action===2?5:1);
 assert.equal(run('scene.children.length'),0);
 run('fx.update(10000,-2.65)');assert.equal(run(`foes.filter(x=>x.curHp===10000-${amount}).length`),action===2?5:1);
 }
 for(let action=0;action<3;action++){
 c.action=action;
 run('allies[0].rage=action*50;foes.forEach(x=>x.curHp=10000);battleAction(allies[0],allies,foes);fx.update(10000,-2.65);fx.update(20000,-2.65)');
 assert.equal(run('foes.filter(x=>x.curHp<10000).length'),action===2?5:1,'skipped frame must still hit once');
 run('allies[0].rage=action*50;foes.forEach(x=>x.curHp=10000);battleAction(allies[0],allies,foes);allies[0].curHp=0;fx.update(10000,-2.65)');
 assert(run('foes.every(x=>x.curHp===10000)'),'dead caster must not hit');run('allies[0].curHp=1000');
 run('allies[0].rage=action*50;battleAction(allies[0],allies,foes);fx.dispose();fx.update(10000,-2.65)');assert(run('foes.every(x=>x.curHp===10000)'),'cancel must not hit');
 }
 run('slot.targets=[];fx=KonanCombat.create(scene,slot,null,2);fx.update(3000,0);fx.dispose()');assert.equal(run('scene.children.length'),0);
 // Captured target dying before impact must never redirect single-target damage.
 for(let a=0;a<3;a++){
 c.a=a;run('allies[0].rage=a*50;foes.forEach(x=>x.curHp=10000);battleAction(allies[0],allies,foes);foes.forEach(x=>x.curHp=0);fx.update(10000,0)');assert(run('foes.every(x=>x.curHp===0)'));
 }
 // Equipment, guaranteed crit and buff still use the existing damage formula.
 run('s.damage=40;s.critChance=100;s.critDamage=200;allies[0].buff=2;allies[0].rage=50;foes.forEach(x=>x.curHp=10000);battleAction(allies[0],allies,foes);fx.update(1900,0)');
 assert.equal(run('foes.filter(x=>x.curHp===9884).length'),1);
 run('s.damage=0;s.critChance=0;s.critDamage=150;allies[0].buff=0');
 run('const fighter=new THREE.Group();fighter.rotation.set(.1,.2,.3);const rest=fighter.rotation.clone(),pose=KonanCombat.pose(fighter);for(let a=0;a<3;a++){pose.update(.4,a);pose.update(-1,a);if(!fighter.rotation.equals(rest))throw Error("pose drift")}');
 // Both formation directions, one through five victims; no stale targets or NaNs.
 for(const sign of [-1,1])for(let n=1;n<=5;n++)for(let a=0;a<3;a++){
 c.sign=sign;c.n=n;c.a=a;run('slot.home.x=sign*3;targets.forEach((v,i)=>v.home.set(-sign*(1.4+i*.6),0,i*.7-1.4));slot.targets=targets.slice(0,n);fx=KonanCombat.create(scene,slot,targets[0],a)');
 assert.equal(run('fx.inspect().victims'),a===2?n:1);
 for(let t=0;t<3700;t+=31){c.ms=t;run('fx.update(ms,-1.1);scene.updateMatrixWorld(true);scene.traverse(o=>{if(!o.matrixWorld.elements.every(Number.isFinite))throw Error("invalid transform");})');}
 assert.equal(run('scene.children.length'),0);
 }
 run('allies[0].rage=0;battleAction(allies[0],allies,foes);fx.dispose()');assert.equal(run('scene.children.length'),0);
}
console.log('PASS Konan: both handlers, damage timing/count, x1/x2/x3, finite transforms, cleanup');
