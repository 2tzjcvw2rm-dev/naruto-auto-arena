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
    await page.evaluate(()=>{s.team=['naruto','sasuke','sakura','kakashi','hinata'];s.formationSlots=[...s.team];ensureFormation();});
    await page.locator('#startButton').click();
    await page.evaluate(()=>{BattleTempo.cancel('round');BattleTempo.cancel('action');});
    await page.waitForFunction(()=>arena3d?.inspect().slots.length===10,null,{timeout:30000});
    await page.evaluate(()=>{BattleTempo.cancel('round');BattleTempo.cancel('action');roundInProgress=false;arena3d.bind();});
    fs.mkdirSync('artifacts',{recursive:true});
    for(const speed of [1,2,3])for(const action of [0,1,2]){
      await page.evaluate(({speed,action})=>{
        BattleTempo.cancel('round');BattleTempo.cancel('action');paused=false;battleRoundNumber=3;
        BattleTempo.setSpeed(speed);
        [...allies,...foes].forEach(u=>{u.curHp=u.maxHp=10000;u.kamuiUntilRound=0;});
        renderTeams();const k=allies.find(u=>u.id==='kakashi');k.rage=action*50;
        battleAction(k,allies,foes);
      },{speed,action});
      await page.waitForFunction(action=>arena3d.effects().some(f=>f.id==='kakashi'&&f.technique===action&&f.elapsedMs>=(action===0?1100:action===1?1450:1800)),action,{timeout:12000});
      await page.evaluate(()=>paused=true);
      const state=await page.evaluate(()=>({fx:arena3d.effects(),hp:foes.map(u=>u.curHp),scene:arena3d.inspect()}));
      const fx=state.fx.find(f=>f.id==='kakashi');assert.equal(fx.technique,action);assert(state.scene.slots.every(s=>s.position.every(Number.isFinite)));
      if(action===0){assert(fx.clone&&fx.rig.rigged);assert.equal(fx.victims,5);}
      if(action===1)assert.equal(fx.bodyRings,40);
      if(speed===1)await page.locator('.arena').screenshot({path:'artifacts/kakashi-'+['double-chidori','water-dragon','kamui'][action]+'-webkit.png'});
      await page.evaluate(()=>paused=false);
      await page.waitForFunction(()=>!arena3d.effects().some(f=>f.id==='kakashi'),null,{timeout:12000});
      const after=await page.evaluate(()=>({hp:foes.map(u=>u.curHp),away:foes.filter(u=>u.kamuiUntilRound).length,slots:arena3d.inspect().slots}));
      if(action<2)assert.equal(after.hp.filter(h=>h<10000).length,action===0?5:1);
      else{
        assert.equal(after.away,1);assert(after.hp.every(h=>h===10000));
        assert.equal(after.slots.filter(x=>x.side==='foeTeam'&&!x.visible).length,1);
        assert.equal(await page.locator('.kamui-status').count(),1);
        await page.evaluate(()=>{battleRoundNumber=4;finishKamuiRound();});
        assert.equal(await page.evaluate(()=>foes.filter(u=>u.kamuiUntilRound).length),1);
        await page.evaluate(()=>{battleRoundNumber=5;finishKamuiRound();});
        assert.equal(await page.evaluate(()=>foes.filter(u=>u.curHp===6000).length),1);
        assert.equal(await page.locator('.kamui-status').count(),0);
        await page.waitForFunction(()=>arena3d.inspect().slots.every(x=>x.visible));
      }
      console.log('PASS WebKit Kakashi',JSON.stringify({speed,action,hp:after.hp,away:after.away}));
    }
    assert.deepEqual(errors,[],'JavaScript runtime errors');
    console.log('PASS: all three Kakashi skills in 5v5 at x1/x2/x3, 2-round Kamui, exact 40% max HP, visible return and no JS errors');
    await ctx.close();
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
