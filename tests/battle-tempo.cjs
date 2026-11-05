// Deterministic 1x/2x/3x timing tests and checks for both published entrypoints.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),jobs=new Map(),stored=new Map();
let current=0,nextId=1;
const controls={
  querySelectorAll:()=>[1,2,3].map(n=>({
    dataset:{battleSpeed:String(n)},classList:{toggle(){}},setAttribute(){}
  })),
  dataset:{}
};
const document={
  readyState:'loading',addEventListener(){},
  getElementById:id=>id==='battleSpeedControls'?controls:null,
  documentElement:{style:{setProperty(){}}}
};
const context={
  console,document,performance:{now:()=>current},
  localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)},
  setTimeout:(cb,ms)=>{const id=nextId++;jobs.set(id,{cb,due:current+ms});return id;},
  clearTimeout:id=>jobs.delete(id)
};
context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'test-3d/battle-speed.js'),'utf8'),context);
const B=context.BattleTempo;
function advance(ms){
  const until=current+ms;
  for(;;){
    let chosenId=null,chosenTime=Infinity,callback=null;
    for(const [id,t] of jobs){if(t.due<=until&&t.due<chosenTime){chosenId=id;chosenTime=t.due;callback=t.cb;}}
    if(chosenId===null)break;
    current=chosenTime;jobs.delete(chosenId);callback();
  }
  current=until;
}
assert.equal(B.speed,1,'Default manual speed must be 1x');
let executed=0;
B.after('action',2450,()=>executed++);
advance(1000);
assert.equal(executed,0);
B.setSpeed(2);
assert.equal(B.speed,2);
advance(724);assert.equal(executed,0,'Pending 1x turn cannot fire too early');
advance(1);assert.equal(executed,1,'Pending turn preserves time when changed to 2x');
B.after('round',2200,()=>executed++);
advance(500);
B.setSpeed(3);
advance(565);assert.equal(executed,1);
advance(3);assert.equal(executed,2,'Pending round changes speed immediately');
B.after('action',2450,()=>executed++);
B.cancel('action');
advance(3000);assert.equal(executed,2,'Cancelled actions never fire');
B.setSpeed(1);assert.equal(B.speed,1,'1x button restores default speed');
assert.equal(stored.get('naruto-auto-arena-tempo-v1'),'1');
for(const p of ['index.html','test-3d/index.html']){
  const html=fs.readFileSync(path.join(root,p),'utf8');
  for(const n of [1,2,3])assert(html.includes('data-battle-speed="'+n+'"'),p+' is missing '+n+'x control');
  assert(html.includes("BattleTempo.after('action',2450"),p+' must speed up actions');
  assert(html.includes("BattleTempo.after('round',2200"),p+' must speed up rounds');
  assert(html.includes('battle-backdrop.js?v=20261105-calm1'),p+' needs stable scenery');
}
const arena=fs.readFileSync(path.join(root,'test-3d/battle-scene.js'),'utf8');
assert(arena.includes('window.BattleTempo?.speed||1'),'WebGL 3D effects must follow battle tempo');
const backdrop=fs.readFileSync(path.join(root,'test-3d/battle-backdrop.js'),'utf8');
assert(backdrop.includes("canvas.toDataURL('image/jpeg'"),'Backdrop must freeze full-scene flicker');
console.log('PASS: 1x, 2x, 3x, live pending timer rescheduling, cancellation, both entrypoints and calm scenery.');