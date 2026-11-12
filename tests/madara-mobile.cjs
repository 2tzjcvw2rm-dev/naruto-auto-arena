/* Mobile WebKit smoke test for the real HTML, models and live WebGL scene. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require('playwright');
const root=path.resolve(__dirname,'..'),mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
  let url;try{url=new URL(req.url,'http://localhost')}catch{return res.writeHead(400).end()}
  const p=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!p.startsWith(root+path.sep))return res.writeHead(403).end();
  const file=fs.existsSync(p)&&fs.statSync(p).isDirectory()?path.join(p,'index.html'):p;
  fs.readFile(file,(err,data)=>{
    if(err)return res.writeHead(404).end();
    res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(data);
  });
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await webkit.launch({headless:true});
  try{
    const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.ARENA_URL||'http://127.0.0.1:'+port+'/',{waitUntil:'load',timeout:60000});
    await page.evaluate(()=>{s.team=['madara','sasuke','sakura','kakashi','hinata'];s.formationSlots=[...s.team];ensureFormation();});
    await page.locator('#startButton').click();
    await page.evaluate(()=>{BattleTempo.cancel('round');BattleTempo.cancel('action');});
    await page.waitForFunction(()=>arena3d?.inspect().slots.length===10,null,{timeout:30000});
    await page.evaluate(()=>{BattleTempo.cancel('round');BattleTempo.cancel('action');roundInProgress=false;arena3d.bind();});
    fs.mkdirSync('artifacts',{recursive:true});
    for(const speed of [1,2,3])for(const action of [0,1,2]){
      await page.evaluate(({speed,action})=>{
        BattleTempo.cancel('round');BattleTempo.cancel('action');paused=false;
        BattleTempo.setSpeed(speed);[...allies,...foes].forEach(u=>{u.curHp=u.maxHp=10000;u.kamuiUntilRound=0;});
        renderTeams();const m=allies.find(u=>u.id==='madara');m.rage=action*50;battleAction(m,allies,foes);
      },{speed,action});
      await page.waitForFunction(()=>arena3d.effects().some(f=>f.id==='madara'&&f.elapsedMs>=MadaraCombat.durations[f.technique]*(f.technique===0?.72:.55)),null,{timeout:15000});
      await page.evaluate(()=>paused=true);
      const state=await page.evaluate(()=>arena3d.inspect());assert(state.slots.every(s=>s.position.every(Number.isFinite)));assert(state.slots.find(s=>s.id==='madara'&&s.side==='allyTeam').rig.rigged);
      if(speed===1)await page.locator('.arena').screenshot({path:'artifacts/madara-'+action+'-webkit.png'});
      await page.evaluate(()=>paused=false);await page.waitForFunction(()=>!arena3d.effects().some(f=>f.id==='madara'),null,{timeout:15000});
      const after=await page.evaluate(()=>({hp:foes.map(u=>u.curHp),slot:arena3d.inspect().slots.find(s=>s.id==='madara'&&s.side==='allyTeam')}));
      assert.equal(after.hp.filter(h=>h<10000).length,5);assert(Math.abs(after.slot.position[0]-after.slot.home[0])<.001);assert(Math.abs(after.slot.position[2]-after.slot.home[2])<.001);
      console.log('PASS Madara WebKit',speed,action,after.hp);
    }
    await page.evaluate(()=>{selectedProfile='madara';openProfile();});
    await page.waitForFunction(()=>document.querySelector('#hero3d[data-hero=madara][data-model-source=local-glb] canvas'),null,{timeout:20000});
    await page.waitForTimeout(2400);
    await page.locator('#hero3d').screenshot({path:'artifacts/madara-profile-webkit.png'});
    assert.deepEqual(errors,[]);await ctx.close();
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
