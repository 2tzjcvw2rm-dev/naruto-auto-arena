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
 const motion=NarutoCombat.mount(figure),slot={id:'naruto',actor:new THREE.Group(),fighter:figure,home:new THREE.Vector3(-2,0,0),effectAt:0};slot.actor.add(figure);slot.motion=motion;
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
 for(const speed of [1,2,3]){
 run('allies[0].curHp=1000;allies[0].rage=50;battleAction(allies[0],allies,foes)');const rasHP=run('foes[0].curHp');
 run('fx.update(1400,0)');assert.equal(run('foes[0].curHp'),rasHP);run('fx.update(1430,0)');assert.equal(rasHP-run('foes[0].curHp'),26);run('fx.update(2400,0)');assert.equal(run('scene.children.length'),0);
 }
 for(const speed of [1,2,3]){
  run('allies[0].rage=0;allies[0].curHp=1000;foes[0].curHp=10000');
  for(let turn=0;turn<6;turn++){
   const before=run('foes[0].curHp');run('battleAction(allies[0],allies,foes)');assert.equal(run('foes[0].curHp'),before);
   const action=turn%3,duration=[2400,2300,3600][action],damage=[17,26,53][action];
   if(action===2){assert.equal(run('fx.inspect().blades'),4);assert.equal(run('fx.inspect().ultimate'),'rasenshuriken');}
   for(let wall=0;wall<=duration/speed;wall+=19){c.ms=wall*speed;run('fx.update(ms,0);scene.updateMatrixWorld(true);scene.traverse(o=>{if(!o.matrixWorld.elements.every(Number.isFinite))throw Error("Nonfinite transform")})');}
   c.end=duration+1;run('fx.update(end,0)');assert.equal(before-run('foes[0].curHp'),damage);assert.equal(run('scene.children.length'),0);
  }
 }
 assert.equal(run('figure.children[0].material.morphTargets'),true,'GPU deformation must be enabled');
 run('motion(0,100,false,-1,0)');assert.equal(run('figure.children[0].morphTargetInfluences[0]'),1);
 run('motion(0,800,true,.32,0)');assert(run('figure.children[0].morphTargetInfluences[2]+figure.children[0].morphTargetInfluences[3]')>.99);
}
console.log('PASS Naruto: both pages, all three skills across two cycles at 1x/2x/3x, hit-time HP, exact damage, skipped frames, finite transforms, death cancellation, disposal, GPU morph flag and articulated running.');
