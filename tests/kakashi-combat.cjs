// Sasuke real battle handler and Three.js VFX: both published HTML entrypoints.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
process.chdir(path.resolve(__dirname,'..'));
for(const page of ['index.html','test-3d/index.html']){
 const c={console};c.window=c;vm.createContext(c);
 const run=source=>vm.runInContext(source,c);
 run(fs.readFileSync('test-3d/vendor/three.min.js','utf8'));
 run(fs.readFileSync('test-3d/battle-pose.js','utf8'));
 run(fs.readFileSync('test-3d/kakashi-combat.js','utf8'));
 run('function instantiateHero(o){return o.clone(true)}');
 const html=fs.readFileSync(page,'utf8');
 assert(html.includes('kakashi-combat.js?v=20261112-double1'),page+': missing module');
 run(html.slice(html.indexOf('const skills='),html.indexOf('const jutsuVisuals=')));
 run(html.slice(html.indexOf('function battleAction('),html.indexOf('function finishBattle(')));
 run([
 "const s={formation:{},damage:0,critChance:0,critDamage:150};",
 "const document={querySelectorAll:()=>[]};function el(){return {classList:{add(){},toggle(){}},textContent:''}};",
 "function renderTeams(){};function log(){};function showDamage(){};",
 "let allies=[{id:'kakashi',name:'Саске',atk:20,curHp:1000,rage:0,buff:0}];",
 "let foes=Array.from({length:5},(_,i)=>({id:'foe'+i,name:'Enemy'+i,curHp:100000,maxHp:100000}));",
 "let fx=null,actions=[],scene=new THREE.Scene();",
 "const slot={id:'kakashi',side:'allyTeam',actor:new THREE.Group(),fighter:new THREE.Group(),home:new THREE.Vector3(-2,0,0),effectAt:0,onImpact:null};",
 "slot.actor.position.set(-2,0,0);",
 "const targets=foes.map((u,i)=>{const actor=new THREE.Group();actor.position.set(2,0,i-2);return {id:u.id,home:new THREE.Vector3(2,0,i-2),actor}});",
 "function playJutsu(unit,side,si,ts,ti,action,support,impact){slot.targets=action===1?[targets[ti]]:targets;slot.onImpact=impact;fx=KakashiCombat.create(scene,slot,targets[ti],action);actions.push(action);}"
 ].join('\n'));

 for(const speed of [1,2,3]){
  run('allies[0].rage=0;foes.forEach(v=>v.curHp=100000);battleAction(allies[0],allies,foes)');
  assert.equal(run('fx.inspect().victims'),5);
  c.ms=1749;run('fx.update(ms,-2.65)');assert.equal(run('foes[0].curHp'),100000);
  for(let ms=1750;ms<2801;ms+=17*speed){c.ms=ms;run('fx.update(ms,-2.65);scene.updateMatrixWorld(true);scene.traverse(o=>{if(!o.matrixWorld.elements.every(Number.isFinite))throw Error("Nonfinite transform")})');}
  run('fx.update(2801,-2.65)');assert.equal(run('foes.filter(v=>v.curHp===99989).length'),5);assert.equal(run('scene.children.length'),0);
 }
}
console.log('PASS Kakashi double Chidori: two pages, 5 targets, 55% damage, impact timing, x1/x2/x3, cleanup');
