// CPU lifecycle regression for the profile-only skeletal Susanoo.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),context={console};context.window=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'test-3d/vendor/three.min.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'test-3d/madara-profile.js'),'utf8'),context);
const T=context.THREE,scene=new T.Scene();
assert.equal(typeof context.createMadaraProfileSusanoo,'function');
for(let n=0;n<20;n++){
  const group=new T.Group();scene.add(group);
  const effect=context.createMadaraProfileSusanoo(T,group);
  const status=effect.inspect();
  assert.equal(status.ribs,6);assert.equal(status.arms,2);
  const root=scene.getObjectByName('madara-profile-skeletal-susanoo');
  assert(root,'Madara profile must include visible 3D Susanoo ribs');
  for(const time of [0,100,600,1500,3500,9000]){
    effect(.05,time);scene.updateMatrixWorld(true);
    root.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite),'3D transform contains NaN'));
  }
  const resources=new Set();
  root.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material)resources.add(o.material)});
  let count=0;for(const item of resources)item.addEventListener('dispose',()=>count++);
  effect.dispose();effect.dispose();
  assert.equal(count,resources.size,'Every unique GPU resource must be disposed once');
  assert.equal(group.children.length,0,'The profile effect must be removed');
  scene.remove(group);
}
for(const p of ['index.html','test-3d/index.html']){
  const html=fs.readFileSync(path.join(root,p),'utf8');
  assert(html.includes('madara-profile.js?v=20261105-ribs1'),p+' must load the module');
  assert(html.includes("host.dataset.susanoo='active'"),p+' must mount ribs for Madara');
}
console.log('PASS: 20 looping profile Susanoo mounts, six rib pairs, mobile-safe effects and resource cleanup.');