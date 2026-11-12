const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
process.chdir(require('node:path').resolve(__dirname,'..'));
const c={console,TextDecoder,TextEncoder,ArrayBuffer,Uint8Array,Float32Array,setTimeout,clearTimeout,performance,URL,Blob};c.window=c;c.self=c;vm.createContext(c);
const run=s=>vm.runInContext(s,c),load=p=>run(fs.readFileSync(p,'utf8'));
load('test-3d/vendor/three.min.js');load('test-3d/vendor/GLTFLoader.js');load('test-3d/madara-combat.js');
async function parse(name){const b=fs.readFileSync('test-3d/models/'+name+'.glb'),n=b.readUInt32LE(12),json=JSON.parse(b.subarray(20,20+n).toString()),start=20+n,bin=b.subarray(start+8,start+8+b.readUInt32LE(start));delete json.images;delete json.textures;delete json.samplers;delete json.materials;for(const m of json.meshes||[])for(const p of m.primitives)delete p.material;const j=Buffer.from(JSON.stringify(json)),pad=(4-j.length%4)%4,jp=Buffer.concat([j,Buffer.alloc(pad,32)]),out=Buffer.alloc(12+8+jp.length+8+bin.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(jp.length,12);out.writeUInt32LE(0x4e4f534a,16);jp.copy(out,20);let off=20+jp.length;out.writeUInt32LE(bin.length,off);out.writeUInt32LE(0x004e4942,off+4);bin.copy(out,off+8);return new Promise((resolve,reject)=>new c.THREE.GLTFLoader().parse(out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength),'',resolve,reject));}
(async()=>{
 c.model=(await parse('madara-combat')).scene;
 for(const page of ['index.html','test-3d/index.html']){
 const html=fs.readFileSync(page,'utf8');
 // Each page has its own lexical game state.
 const d={...c};d.window=d;vm.createContext(d);const evalCode=s=>vm.runInContext(s,d);
 evalCode(html.slice(html.indexOf('function instantiateHero('),html.indexOf('function fetchHeroModel(')));
 evalCode(html.slice(html.indexOf('const skills='),html.indexOf('const jutsuVisuals=')));
 evalCode(html.slice(html.indexOf('function battleAction('),html.indexOf('function finishBattle(')));
 evalCode(`const s={formation:{},damage:0,critChance:0,critDamage:150};const document={querySelectorAll:()=>[]};function el(){return {classList:{add(){},toggle(){}}}};function log(){};function renderTeams(){};function showDamage(){};
 let allies=[{id:'madara',name:'Madara',atk:100,curHp:1000,rage:0,buff:0}],foes=Array.from({length:5},(_,i)=>({id:'enemy'+i,name:'Enemy',curHp:10000}));
 const scene=new THREE.Scene(),actor=instantiateHero(model),fighter=actor,home=new THREE.Vector3(-2,0,0),pose=MadaraCombat.pose(actor);
 const slot={id:'madara',side:'allyTeam',actor,fighter,home,effectAt:0};
 const targets=foes.map((u,i)=>({home:new THREE.Vector3(2,0,i-2),actor:new THREE.Group(),index:i}));let fx;
 function playJutsu(u,s,si,ts,ti,action,support,impact){slot.onImpact=impact;slot.targets=[targets[ti],...targets.filter(v=>v.index!==ti).sort((a,b)=>Math.abs(a.index-ti)-Math.abs(b.index-ti)).slice(0,2)];fx=MadaraCombat.create(scene,slot,targets[ti],action);}
 `);
 assert(evalCode('pose.inspect().rigged'));
 for(const speed of [1,2,3]){
 evalCode('allies[0].rage=0;foes.forEach(v=>v.curHp=10000);battleAction(allies[0],allies,foes);fx.update(1007,0)');
 assert.equal(evalCode('foes.filter(v=>v.curHp<10000).length'),0);
 for(let ms=1008;ms<3600;ms+=17*speed){d.ms=ms;evalCode('pose.update(ms/3600,0,ms);fx.update(ms,0);actor.updateMatrixWorld(true);actor.traverse(o=>{if(!o.matrixWorld.elements.every(Number.isFinite))throw Error("Invalid transform")})');}
 evalCode('fx.update(3601,0)');assert.equal(evalCode('foes.filter(v=>v.curHp===9900).length'),1);assert.equal(evalCode('foes.filter(v=>v.curHp===9965).length'),2);assert.equal(evalCode('scene.children.length'),0);
 assert(evalCode('actor.position.x===home.x&&actor.position.z===home.z'));
 }
 // Genuine skin deformation on the original mesh and independent clone joints.
 evalCode('pose.update(-1,0,0);actor.updateMatrixWorld(true);let skin;actor.traverse(o=>{if(o.isSkinnedMesh&&o.name.startsWith("Top"))skin=o});skin.skeleton.update();let rest=[];for(let i=0;i<skin.geometry.attributes.position.count;i++)rest.push(skin.boneTransform(i,new THREE.Vector3().fromBufferAttribute(skin.geometry.attributes.position,i)).clone());pose.update(.28,0,1008);actor.updateMatrixWorld(true);skin.skeleton.update();let moved=0;for(let i=0;i<rest.length;i++)if(skin.boneTransform(i,new THREE.Vector3().fromBufferAttribute(skin.geometry.attributes.position,i)).distanceTo(rest[i])>.01)moved++;');
 assert(evalCode('moved>100'));
 evalCode('const copy=instantiateHero(actor);copy.getObjectByName("RightArm").rotation.x=2;');assert(evalCode('copy.getObjectByName("RightArm")!==actor.getObjectByName("RightArm")'));
 }
 console.log('PASS Madara: real skin deformation, independent joints, four timed impacts, primary/neighbor damage, both pages, x1/x2/x3, return and disposal');
})().catch(e=>{console.error(e);process.exitCode=1});
