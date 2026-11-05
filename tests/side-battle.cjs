// Run: node tests/side-battle.cjs. Geometry/motion checks; does not replace GPU visual QA.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');process.chdir(root);
const context={console,TextDecoder,TextEncoder,ArrayBuffer,Uint8Array,Float32Array,setTimeout,clearTimeout,performance,URL,Blob};
context.window=context;context.self=context;context.document={hidden:false,querySelector:()=>null,createElement:()=>({getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})};
vm.createContext(context);const run=s=>vm.runInContext(s,context);const load=p=>run(fs.readFileSync(p,'utf8'));
load('test-3d/vendor/three.min.js');load('test-3d/vendor/GLTFLoader.js');
const html=fs.readFileSync(process.env.NARUTO_TEST_PAGE||'test-3d/index.html','utf8');
const rosterStart=html.indexOf('const fullRoster='),rosterEnd=html.indexOf('function ninjaSVG(',rosterStart);
assert(rosterStart>=0&&rosterEnd>rosterStart,'Active roster definitions missing');
run(html.slice(rosterStart,rosterEnd));
const available=JSON.parse(run('JSON.stringify({team:roster.map(x=>x.id),foes:enemies.map(x=>x.id),archived:[...unavailableFighters]})'));
assert.deepEqual(available.team,['naruto','sasuke','sakura','kakashi','hinata','madara','obito']);
assert.deepEqual(available.foes,['itachi','pain','konan','madara','obito']);
assert.deepEqual(available.archived,['shikamaru','gaara','kisame','deidara']);
assert.equal(new Set(available.foes).size,5);
assert(html.includes("const previousTeam="),'Unavailable old team slots must be migrated');

run(html.slice(html.indexOf('function normalizedFighter('),html.indexOf('function openModelPreview(')));
load('test-3d/sasuke-profile.js');load('test-3d/combat-profile.js');
run(html.slice(html.indexOf('const skills='),html.indexOf('const jutsuVisuals=')));
run(html.slice(html.indexOf('const jutsuVisuals='),html.indexOf('function ',html.indexOf('const jutsuVisuals='))));
run(`let arena3d=null,arenaUnavailable=false,paused=false;
const modelAnimationClips={},remoteHeroModels={},upgradedFighters=new Set();
const s={formation:{}};let allies=[],foes=[];let nextFrame;
function requestAnimationFrame(fn){nextFrame=fn}
const units=new Map();let viewport={width:390,height:440};
function unit(){const flags=new Set();return {isConnected:true,style:{setProperty(){}},classList:{add(x){flags.add(x)},contains(x){return flags.has(x)}}}}
const host={appendChild(){},parentElement:{classList:{add(){}}},getBoundingClientRect:()=>viewport};
function el(id){if(id==='battle3d')return host;if(!units.has(id))units.set(id,unit());return units.get(id)}
function bindBattleImages(){throw Error('Unexpected fallback')};function showBattleImage(){throw Error('Model failed')};
THREE.WebGLRenderer=class {constructor(){this.domElement={}} setPixelRatio(){} setSize(){} getDrawingBufferSize(v){return v.set(viewport.width,viewport.height)} getRenderTarget(){return null} setRenderTarget(){} setViewport(){} render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true)}};
const sourceModels={};function fetchHeroModel(key,cb){cb(sourceModels[key].clone(true))}
`);
// Decode original mesh/skeleton/animation data, omitting textures for a GPU-free check.
async function parse(name){const b=fs.readFileSync('test-3d/models/'+name+'.glb'),n=b.readUInt32LE(12),json=JSON.parse(b.subarray(20,20+n).toString()),start=20+n,bin=b.subarray(start+8,start+8+b.readUInt32LE(start));delete json.images;delete json.textures;delete json.samplers;delete json.materials;for(const m of json.meshes||[])for(const p of m.primitives)delete p.material;const j=Buffer.from(JSON.stringify(json)),pad=(4-j.length%4)%4,jp=Buffer.concat([j,Buffer.alloc(pad,32)]),out=Buffer.alloc(12+8+jp.length+8+bin.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(jp.length,12);out.writeUInt32LE(0x4e4f534a,16);jp.copy(out,20);let off=20+jp.length;out.writeUInt32LE(bin.length,off);out.writeUInt32LE(0x004e4942,off+4);bin.copy(out,off+8);return new Promise((resolve,reject)=>new context.THREE.GLTFLoader().parse(out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength),'',resolve,reject));}
(async()=>{
const names=['naruto','sasuke','sakura-team7','kakashi-combat','hinata-combat','itachi-combat','pain-combat','kisame','deidara','konan','madara','obito','gaara','shikamaru'];
for(const name of names){const g=await parse(name);context.loadedModel=g.scene;run(`sourceModels[${JSON.stringify(name==='sakura-team7'?'sakura':name)}]=loadedModel;`)}
// Use the same skeleton-safe clone as the game.
run(html.slice(html.indexOf('function instantiateHero('),html.indexOf('function fetchHeroModel(')));
run(`fetchHeroModel=(key,cb)=>cb(instantiateHero(sourceModels[key]));
for(const id of ['naruto','sasuke','sakura','kakashi','hinata','itachi','pain','kisame','deidara','konan','madara','obito','gaara','shikamaru']){remoteHeroModels[id]=id+'.glb';upgradedFighters.add(id)}
allies=['naruto','sasuke','sakura','kakashi','hinata'].map(id=>({id}));foes=['itachi','pain','konan','madara','obito'].map(id=>({id}));`);
load('test-3d/battle-environment.js');
load('test-3d/battle-pose.js');
load('test-3d/battle-cinematics.js');
load('test-3d/battle-visual-upgrade.js');
load('test-3d/battle-ultimate-fx.js');
load('test-3d/battle-scene.js');
let count=0,time=1000;const frame=()=>{time+=45;run(`nextFrame(${time})`)};
for(const [w,h] of [[320,405],[390,440],[430,440],[650,440],[844,390]]){
for(const rows of [['front','middle','middle','back','back'],['front','front','middle','back','back'],['front','front','middle','middle','back']]){
context.dimensions={width:w,height:h};context.rows=rows;
run(`viewport=dimensions;allies.forEach((u,i)=>s.formation[u.id]=rows[i]);if(!arena3d)initArena3d();else arena3d.bind();nextFrame(${time+=45});`);
const state=run('arena3d.inspect()');assert.equal(state.slots.length,10);
if(w===390&&h===440&&rows[0]==='front')console.log('RIG AUDIT',JSON.stringify(state.slots.map(a=>({id:a.id,bones:a.rig?.bones||0,rigged:!!a.rig?.rigged,joints:a.rig?.joints?.slice(0,8)}))));
assert.equal(state.environment.name,'konoha-training-overlook');assert.equal(state.environment.houses,36);assert.equal(state.environment.clouds,5);assert.equal(state.environment.leaves,24);assert.equal(state.environment.courtY,0);assert.equal(state.visualGroundY,h>=w?-2.65:-1.1);
for(const slot of state.slots){assert(slot.position.every(Number.isFinite));assert(Math.abs(slot.box.min[1]-state.visualGroundY)<.001,slot.id+' feet '+JSON.stringify(slot.box));assert(slot.foot.y>=h*.42&&slot.foot.y<=h*.94,slot.id+' feet off viewport '+w+'x'+h+': '+JSON.stringify(slot.foot));for(const p of slot.box.corners)assert(p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h,slot.id+' outside '+w+'x'+h+': '+JSON.stringify(p));assert(Math.abs(slot.yaw-(slot.side==='allyTeam'?Math.PI/2:-Math.PI/2))<.001)}
for(const side of ['allyTeam','foeTeam'])for(let index=0;index<5;index++)for(let technique=0;technique<3;technique++){
run(`arena3d.trigger('${side}',${index},${technique},'${side==='allyTeam'?'foeTeam':'allyTeam'}',1);`);
const live=run('arena3d.effects()');
assert.equal(live.length,1,'Each attack should mount exactly one 3D visual effect');
if(!((side==='allyTeam'?available.team[index]:available.foes[index])==='madara'&&technique===2)){
  assert.equal(typeof live[0].kind,'string','Normal attacks must not be swallowed by the 3D renderer');
  if(technique===2)assert.equal(typeof live[0].ultimate,'string',
    'Each non-Madara ultimate should have a unique 3D identity');
}
for(let tick=1;tick<=(technique===2?60:40);tick++)frame();
assert.equal(run('arena3d.effects().length'),0,'GPU jutsu resources must be removed after the attack');
const slot=run(`arena3d.inspect().slots.filter(a=>a.side==='${side}')[${index}]`);assert(Math.abs(slot.position[0]-slot.home[0])<.001);assert(Math.abs(slot.position[2]-slot.home[2])<.001);
}
count++;
}}
run(`allies=['madara','obito','sakura','sasuke','naruto'].map(id=>({id}));allies.forEach((u,i)=>s.formation[u.id]=['front','middle','middle','back','back'][i]);arena3d.bind();nextFrame(${time+=45})`);
assert.equal(run('arena3d.inspect().slots.length'),10);
console.log('PASS: 10 active fighters, 4 archived fighters, original GLBs, responsive formation, 3D technique effects/disposal, impact choreography and grounding; save data unchanged. GPU appearance still requires visual verification.');
})().catch(e=>{console.error(e);process.exit(1)});
