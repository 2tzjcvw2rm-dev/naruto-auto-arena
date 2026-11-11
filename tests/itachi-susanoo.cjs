// CPU geometry/lifecycle check; WebKit workflow separately verifies actual rendering.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),context={console};context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'test-3d/vendor/three.min.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'test-3d/itachi-susanoo.js'),'utf8'),context);
const T=context.THREE,scene=new T.Scene(),actor=new T.Group(),target={actor:new T.Group()};
actor.position.set(2.9,0,1.6);actor.rotation.y=-Math.PI/2;target.actor.position.set(-4.45,0,-1.6);
const slot={actor};let disposed=0;
for(let cast=0;cast<10;cast++){
  const fx=context.createItachiSusanoo(T,scene,slot,target),geometries=new Set(),materials=new Set();
  scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material)});
  for(const resource of [...geometries,...materials])resource.addEventListener('dispose',()=>disposed++);
  const before=disposed;
  for(const t of [0,400,800,1200,1600,1800,2200]){
    assert(fx.update(t,-2.65));scene.updateMatrixWorld(true);
    scene.traverse(o=>{assert(o.matrixWorld.elements.every(Number.isFinite),'Nonfinite geometry transform');});
    const skeleton=scene.getObjectByName('itachi-red-susanoo');assert(skeleton);assert.equal(skeleton.position.x,actor.position.x);assert.equal(skeleton.position.y,-2.65);assert(skeleton.quaternion.angleTo(actor.quaternion)<1e-6);
  }
  assert.equal(fx.update(2301,-2.65),false);assert.equal(scene.children.length,0);
  assert.equal(disposed-before,geometries.size+materials.size,'Every unique GPU resource must be disposed exactly once');
  fx.dispose();assert.equal(disposed-before,geometries.size+materials.size,'Cleanup must be idempotent');
}
console.log('PASS: 10 Itachi Susanoo casts, actor yaw/anchor, finite 3D transforms, full resource disposal.');
