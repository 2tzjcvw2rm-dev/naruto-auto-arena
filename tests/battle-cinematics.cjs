const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
class El{constructor(){this.children=[];this.style={setProperty(k,v){this[k]=v}};this.dataset={};this.classList={add(){},remove(){}}}
 appendChild(x){x.parentNode=this;this.children.push(x);return x}
 remove(){this.parentNode=null}
 setAttribute(k,v){this[k]=v}}
const arena=new El(),doc={querySelector:k=>k==='.arena'?arena:null,createElement:()=>new El()};
const c={document:doc,console};c.window=c;vm.createContext(c);
for(const n of ['battle-pose.js','battle-cinematics.js'])
 vm.runInContext(fs.readFileSync(path.join(root,'test-3d',n),'utf8'),c);
for(const p of ['index.html','test-3d/index.html']){
 const h=fs.readFileSync(path.join(root,p),'utf8');
 for(const n of ['battle-pose.js','battle-cinematics.js','battle-cinematics.css'])assert(h.includes(n),p+': '+n);
}
assert(c.BattleCinematics.start({id:'itachi',label:'Цукуёми',now:10,duration:1400}));
assert.equal(arena.children[0].children[2].children[1].textContent,'Цукуёми');
c.BattleCinematics.update(520);assert.equal(c.BattleCinematics.inspect().phase,'focus');
c.BattleCinematics.update(1410);assert.equal(c.BattleCinematics.inspect(),null);
c.BattleCinematics.start({id:'madara',now:1500,duration:2300});
assert.equal(arena.children.length,1,'overlay is reusable');
c.BattleCinematics.clear();
class R{constructor(){this.x=this.y=this.z=0}clone(){return Object.assign(new R(),this)}copy(a){Object.assign(this,a);return this}}
const bones=['RightArm','RightForeArm','LeftArm','LeftForeArm','RightUpLeg','RightLeg','LeftUpLeg','LeftLeg'].map(name=>({name,isBone:true,rotation:new R()}));
const pose=c.BattlePose.mount({traverse:f=>bones.forEach(f)},'itachi');
assert.equal(pose.inspect().rigged,true);
const samples=[];
for(const action of [0,1,2]){pose.update(.49,action,1000);samples.push(bones[0].rotation.x)}
assert.equal(new Set(samples.map(n=>n.toFixed(4))).size,3,'three techniques use different hand poses');
pose.update(.24,0,1000);assert.notEqual(bones[4].rotation.x,0,'legs move on approach');
pose.dispose();assert(bones.every(x=>x.rotation.x===0&&x.rotation.z===0),'rest skeleton restored');
const staticPose=c.BattlePose.mount({traverse:f=>f({name:'Body',isBone:false})},'madara');
assert.equal(staticPose.inspect().rigged,false);staticPose.update(.48,2,500);staticPose.dispose();
console.log('PASS: cinematic clock, effect reuse, individual arm/leg technique poses, unrigged safety and both game entrypoints.');
