// Sasuke real battle handler and Three.js VFX: both published HTML entrypoints.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
process.chdir(path.resolve(__dirname,'..'));
for(const page of ['index.html','test-3d/index.html']){
 const c={console};c.window=c;vm.createContext(c);
 const run=source=>vm.runInContext(source,c);
 run(fs.readFileSync('test-3d/vendor/three.min.js','utf8'));
 run(fs.readFileSync('test-3d/sasuke-combat.js','utf8'));
 const html=fs.readFileSync(page,'utf8');
 assert(html.includes('sasuke-combat.js?v=20261111-sasuke1'),page+': missing module');
 run(html.slice(html.indexOf('const skills='),html.indexOf('const jutsuVisuals=')));
 run(html.slice(html.indexOf('function battleAction('),html.indexOf('function finishBattle(')));
 run([
 "const s={formation:{},damage:0,critChance:0,critDamage:150};",
 "const document={querySelectorAll:()=>[]};function el(){return {classList:{add(){},toggle(){}},textContent:''}};",
 "function renderTeams(){};function log(){};function showDamage(){};",
 "let allies=[{id:'sasuke',name:'Саске',atk:20,curHp:1000,rage:0,buff:0}];",
 "let foes=Array.from({length:5},(_,i)=>({id:'foe'+i,name:'Enemy'+i,curHp:100000,maxHp:100000}));",
 "let fx=null,actions=[],scene=new THREE.Scene();",
 "const slot={id:'sasuke',side:'allyTeam',actor:new THREE.Group(),fighter:new THREE.Group(),home:new THREE.Vector3(-2,0,0),effectAt:0,onImpact:null};",
 "slot.actor.position.set(-2,0,0);",
 "const targets=foes.map((u,i)=>{const actor=new THREE.Group();actor.position.set(2,0,i-2);return {id:u.id,home:new THREE.Vector3(2,0,i-2),actor}});",
 "function playJutsu(unit,side,si,ts,ti,action,support,impact){slot.targets=action===1?[targets[ti]]:targets;slot.onImpact=impact;fx=SasukeCombat.create(scene,slot,targets[ti],action);actions.push(action);}"
 ].join('\n'));
 const expected=[6,31,28],impacts=[1281,1495,2516],durations=[2100,2300,3400];
 for(const speed of [1,2,3]){
  run('allies[0].rage=0;allies[0].curHp=1000;foes.forEach(v=>v.curHp=100000);actions=[]');
  for(let turn=0;turn<6;turn++){
   const action=turn%3,before=Array.from(run('foes.map(x=>x.curHp)'));
   run('battleAction(allies[0],allies,foes)');
   assert.deepEqual(Array.from(run('foes.map(x=>x.curHp)')),before,'HP must wait for visual impact');
   assert.equal(run('fx.inspect().technique'),action);
   assert.equal(run('fx.inspect().victims'),action===1?1:5);
   c.ms=impacts[action]-1;run('fx.update(ms,-2.65)');
   assert.deepEqual(Array.from(run('foes.map(x=>x.curHp)')),before,'No early damage');
   for(let wall=impacts[action]/speed;wall<durations[action]/speed;wall+=17){
    c.ms=wall*speed;
    run('fx.update(ms,-2.65);scene.updateMatrixWorld(true);scene.traverse(o=>{if(!o.matrixWorld.elements.every(Number.isFinite))throw Error("Nonfinite transform")})');
   }
   c.ms=durations[action]+1;run('fx.update(ms,-2.65)');
   const after=Array.from(run('foes.map(x=>x.curHp)'));
   assert.equal(after.filter((v,i)=>v===before[i]-expected[action]).length,action===1?1:5,'Incorrect damage or target count');
   assert.equal(run('scene.children.length'),0,'Temporary effects leaked');
  }
  assert.deepEqual(Array.from(run('actions')),[0,1,2,0,1,2]);
 }
 run('allies[0].rage=0;battleAction(allies[0],allies,foes)');
 const hp=Array.from(run('foes.map(x=>x.curHp)'));
 run('fx.update(2101,-2.65);fx.update(4000,-2.65)');
 assert(Array.from(run('foes.map(x=>x.curHp)')).every((v,i)=>v===hp[i]-6),'Skipped frames must hit exactly once');
 assert.equal(run('scene.children.length'),0);
 run('allies[0].rage=50;battleAction(allies[0],allies,foes);allies[0].curHp=0');
 const dead=Array.from(run('foes.map(x=>x.curHp)'));run('fx.update(2301,-2.65)');
 assert.deepEqual(Array.from(run('foes.map(x=>x.curHp)')),dead);
 run('allies[0].curHp=1000;allies[0].rage=100;battleAction(allies[0],allies,foes);allies=[]');
 const changed=Array.from(run('foes.map(x=>x.curHp)'));run('fx.update(3401,-2.65)');
 assert.deepEqual(Array.from(run('foes.map(x=>x.curHp)')),changed);
 assert.equal(run('scene.children.length'),0);
}
console.log('PASS Sasuke: two pages, AoE 30%, Chidori, Kirin 45%, x1/x2/x3, impact timing, death/reset, disposal');
