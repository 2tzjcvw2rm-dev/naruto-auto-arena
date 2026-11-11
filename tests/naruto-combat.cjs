// Battle-clock events, exact damage budget, temporary clone ownership, pose blending.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
process.chdir(require('node:path').resolve(__dirname,'..'));
for(const file of ['index.html','test-3d/index.html']){
 const c={console};c.window=c;vm.createContext(c);const run=s=>vm.runInContext(s,c);
 for(const p of ['test-3d/vendor/three.min.js','test-3d/naruto-combat.js'])run(fs.readFileSync(p,'utf8'));
 const html=fs.readFileSync(file,'utf8');
 run(html.slice(html.indexOf('const skills='),html.indexOf('const jutsuVisuals=')));
 run(html.slice(html.indexOf('function battleAction('),html.indexOf('function finishBattle(')));
 run(`const s={formation:{},critChance:0,damage:0,critDamage:150};const document={querySelectorAll:()=>[]};
 function el(){return {classList:{add(){},toggle(){}},textContent:''}};function renderTeams(){};function log(){};function showDamage(){};
 let allies=[{id:'naruto',name:'Наруто',curHp:1000,atk:17,rage:0}],foes=[{id:'target',name:'Target',curHp:10000}];
 const scene=new THREE.Scene(),figure=new THREE.Group();figure.add(new THREE.Mesh(new THREE.BoxBufferGeometry(.6,1.8,.2),new THREE.MeshBasicMaterial()));
 const motion=NarutoCombat.mount(figure),slot={id:'naruto',actor:new THREE.Group(),fighter:figure,home:new THREE.Vector3(-2,0,0),effectAt:0};slot.actor.add(figure);
 const target={actor:new THREE.Group(),home:new THREE.Vector3(2,0,0)};let fx;
 function playJutsu(u,side,i,ts,ti,action,support,impact){slot.onImpact=impact;fx=NarutoCombat.create(scene,slot,target,action);}
 `);
 for(const speed of [1,2,3]){
  run('allies[0].rage=0;battleAction(allies[0],allies,foes)');const before=run('foes[0].curHp');
  run('fx.update(1000,0)');assert.equal(run('foes[0].curHp'),before);
  for(let wall=0;wall<2500/speed;wall+=17){c.ms=wall*speed;run('fx.update(ms,0)');}
  run('fx.update(2500,0)');assert.equal(before-run('foes[0].curHp'),17);assert.equal(run('scene.children.length'),0);
 }
 run('allies[0].rage=0;battleAction(allies[0],allies,foes)');const hp=run('foes[0].curHp');run('fx.update(2500,0)');assert.equal(hp-run('foes[0].curHp'),17,'Skipped frames consume exactly three hits');
 run('allies[0].rage=0;battleAction(allies[0],allies,foes);allies[0].curHp=0');const dead=run('foes[0].curHp');run('fx.update(2500,0)');assert.equal(run('foes[0].curHp'),dead);
 run('motion(0,100,false,-1,0)');assert.equal(run('figure.children[0].morphTargetInfluences[0]'),1);
 run('motion(0,800,true,.32,0)');assert(run('figure.children[0].morphTargetInfluences[2]+figure.children[0].morphTargetInfluences[3]')>.99);
}
console.log('PASS Naruto: both pages, clone hit-time HP, exact total at 1x/2x/3x and skipped frames, death cancellation, disposal and articulated running.');
