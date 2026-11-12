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
    await page.clock.install();
    page.on('pageerror',error=>{errors.push(error.message);console.error('PAGE ERROR',error.message)});
    page.on('console',msg=>{if(msg.type()==='error')console.error('BROWSER CONSOLE:',msg.text())});
    await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'load',timeout:60000});
    // Use the game's own 5v5 demo to dismiss the welcome overlay and start combat.
    await page.evaluate(()=>{s.team=['naruto','sasuke','sakura','kakashi','hinata'];s.formationSlots=[...s.team];ensureFormation();});
    await page.locator('#startButton').click();
    await page.waitForTimeout(6500);
    // Check actual on-screen controls, not just a detached speed variable.
    for(const value of [2,3,1]){
      const button=page.locator('#battleSpeedControls [data-battle-speed="'+value+'"]');
      await button.click();
      assert.equal(await page.evaluate(()=>BattleTempo.speed),value,'Manual '+value+'x button must change game speed');
      assert.equal(await button.getAttribute('aria-pressed'),'true','Selected speed button must be highlighted');
    }
    // GIF's nine-frame full-screen shaking must be replaced by a stable
    // painted frame with only a very faint moving waterfall overlay.
    await page.waitForFunction(
      ()=>document.getElementById('battle3d')?.classList.contains('waterfall-calm'),
      null,{timeout:12000});
    assert.equal(await page.evaluate(()=>document.getElementById('battle3d')?.dataset.backgroundMotion),'subtle');
    const diag=await page.evaluate(()=>{
      let inspection=null,inspectionError=null;
      try{inspection=typeof arena3d!=='undefined'&&arena3d?arena3d.inspect():null}catch(e){inspectionError=e.message}
      return {three:typeof THREE,arena:typeof arena3d,unavailable:typeof arenaUnavailable!=='undefined'?arenaUnavailable:null,slots:inspection?.slots?.length,slotIds:inspection?.slots?.map(x=>x.id),cachedModels:typeof modelCache!=='undefined'?Object.keys(modelCache):[],environment:inspection?.environment?.name,inspectionError,canvas:!!document.querySelector('#battle3d canvas'),team:typeof allies!=='undefined'?allies.map(x=>x.id):null,foes:typeof foes!=='undefined'?foes.map(x=>x.id):null};
    });
    console.log('WEBKIT DIAG',JSON.stringify(diag),'PAGE ERRORS',JSON.stringify(errors));
    assert.deepEqual(diag.foes,['itachi','pain','konan','madara','obito'],'Active enemy lineup must be five supported GLBs');
    assert.equal(diag.foes.length,5,'Autobattle must retain five opponents');
    assert(!diag.team.some(id=>['shikamaru','gaara','kisame','deidara'].includes(id)),'Unavailable fighters cannot appear in a saved team');

    fs.mkdirSync('artifacts',{recursive:true});
    await page.locator('.arena').screenshot({path:'artifacts/konoha-iphone-debug.png'});
    await page.waitForFunction(()=>typeof arena3d!=='undefined'&&arena3d&&arena3d.inspect().slots.length===10,null,{timeout:20000});
    await page.waitForTimeout(1600);
    const state=await page.evaluate(()=>{
      const x=arena3d.inspect(),canvas=document.querySelector('#battle3d canvas');
      return {env:x.environment,slots:x.slots.length,canvas:!!canvas,webgl:!!canvas&&!!canvas.getContext('webgl'),size:x.size,rigs:x.slots.map(p=>({id:p.id,bones:p.rig?.bones||0,rigged:!!p.rig?.rigged})),positions:x.slots.map(p=>({side:p.side,home:p.home,position:p.position,yaw:p.yaw}))};
    });
    assert.equal(state.env.name,'konoha-training-overlook');
    assert.equal(state.slots,10);
    console.log('WEBKIT JOINTS',JSON.stringify(state.rigs));
    assert(state.canvas,'WebGL canvas is missing');
    assert(state.size[0]>100&&state.size[1]>100,'Battle canvas has no dimensions');
    assert(state.positions.every(p=>p.position.every(Number.isFinite)&&p.home.every(Number.isFinite)),'Non-finite fighter position');
    // Attacking fighters may be lunging toward a target at the screenshot instant.
    assert.equal(errors.length,0,'Page errors: '+errors.join('; '));
    fs.mkdirSync('artifacts',{recursive:true});
    await page.locator('.arena').screenshot({path:'artifacts/konoha-iphone-webkit.png'});
    console.log('PASS: WebKit iPhone-size battlefield; '+state.slots+' models; Konoha ambience; '+state.size.join('x')+'; no page errors.');
    // Exercise the production battleAction path, including automatic rage selection.
    await page.evaluate(()=>{BattleTempo.cancel('round');BattleTempo.cancel('action');clearTimeout(timer);clearTimeout(actionTimer);roundInProgress=false;paused=false;document.querySelectorAll('.jutsu-fx').forEach(node=>node.remove());});
    await page.clock.pauseAt(new Date(Date.now()+1000));
    async function advance(ms){for(let left=ms;left>0;left-=100)await page.clock.fastForward(Math.min(100,left));}
    // Kakashi: real rig, independent clone, exact delayed AoE and all speed modes.
    for(const speed of [1,2,3]){
      await page.evaluate(speed=>{BattleTempo.setSpeed(speed);allies.forEach(u=>{u.curHp=u.maxHp=10000;});foes.forEach(u=>{u.curHp=u.maxHp=10000;});const k=allies.find(u=>u.id==='kakashi');k.rage=0;renderTeams();battleAction(k,allies,foes);},speed);
      await advance(1350/speed);
      const fx=await page.evaluate(()=>arena3d.effects().find(x=>x.id==='kakashi'));
      assert(fx&&fx.clone&&fx.rig.rigged&&fx.victims===5,'Real rigged Kakashi clone must connect all five targets');
      if(speed===1)await page.locator('.arena').screenshot({path:'artifacts/kakashi-double-chidori-webkit.png'});
      assert(await page.evaluate(()=>foes.every(u=>u.curHp===10000)),'Kakashi hit too early');
      await advance(1800/speed);
      assert(await page.evaluate(()=>foes.every(u=>u.curHp<10000)),'Kakashi must hit five enemies');
      assert.equal(await page.evaluate(()=>arena3d.effects().length),0,'Kakashi effect leaked');
    }
    console.log('PASS Kakashi: mobile WebKit independent rigged clone, all-target damage, x1/x2/x3, cleanup');
    // Itachi: two natural cycles through the production 5v5 action handler.
    for(const speed of [1,2,3]){
      await page.evaluate(speed=>{BattleTempo.setSpeed(speed);foes.find(u=>u.id==='itachi').rage=0;},speed);
      for(let turn=0;turn<6;turn++){
        const action=turn%3;
        const before=await page.evaluate(()=>{
          allies.forEach(u=>u.curHp=u.maxHp=100000);
          const itachi=foes.find(u=>u.id==='itachi');itachi.curHp=itachi.maxHp;
          renderTeams();battleAction(itachi,foes,allies);
          return allies.map(u=>u.curHp);
        });
        assert(before.every(h=>h===100000),'Itachi damage must wait for impact');
        await advance((action===2?1500:600)/speed);
        assert((await page.evaluate(()=>allies.map(u=>u.curHp))).every(h=>h===100000),'No early Itachi damage');
        if(speed===1&&turn<3)await page.locator('.arena').screenshot({path:'artifacts/itachi-technique-'+action+'.png'});
        await advance(450/speed);
        const hits=await page.evaluate(()=>allies.filter(u=>u.curHp<100000).length);
        assert.equal(hits,action===2?5:1,'Itachi impact target count');
        await advance(1100/speed);
        assert.equal(await page.evaluate(()=>arena3d.effects().length),0,'No lingering Itachi effects');
      }
    }
    await page.evaluate(()=>BattleTempo.setSpeed(1));
    async function cast(){
      await page.evaluate(()=>{
        paused=false;
        const madara=foes.find(u=>u.id==='madara');madara.rage=100;
        allies.forEach(u=>{u.curHp=u.maxHp=100000;});
        battleAction(madara,foes,allies);
      });
    }
    // Exercise the real combat handler, not an isolated simulation:
    // each fighter's own first and second turns charge the THIRD-turn ultimate.
    const naturalCycle=await page.evaluate(()=>{
      const madara=foes.find(u=>u.id==='madara');
      madara.rage=0;
      allies.forEach(u=>{u.curHp=u.maxHp=100000;});
      const values=[];
      for(let n=0;n<3;n++){
        battleAction(madara,foes,allies);
        values.push({rage:madara.rage,caption:document.getElementById('battleFeed').textContent,
          susanoo:arena3d.effects().length});
      }
      document.querySelectorAll('.jutsu-fx').forEach(node=>node.remove());
      return values;
    });
    assert.deepEqual(naturalCycle.map(x=>x.rage),[50,100,0],
      'Madara charges 50%, then 100%, then auto-casts and resets on the third action');
    assert(naturalCycle[0].caption.includes('АТАКА'));
    assert(naturalCycle[1].caption.includes('ТЕХНИКА'));
    assert(naturalCycle[2].caption.includes('УЛЬТА')&&naturalCycle[2].caption.includes('Сусаноо'));
    assert.equal(naturalCycle[2].susanoo,1,'Third turn must create the 3D Susanoo');
    console.log('PASS: real Madara third-turn ultimate with 0/50/100% cycle in mobile WebKit.');
    // Continue existing Susanoo frame-by-frame rendering and disposal checks.
    await cast();
    await advance(1200);await page.evaluate(()=>{paused=true;});
    let fx=await page.evaluate(()=>arena3d.inspect());console.log('SUSANOO',JSON.stringify(fx.effects));
    assert.equal(fx.effects.length,1,'Automatic Madara ultimate must create a 3D effect');
    assert.equal(fx.effects[0].phase,'windup','Full skeleton must form before strike');
    const cinema=await page.evaluate(()=>({state:BattleCinematics.inspect(),
      title:document.querySelector('.arena-cinematic-heading')?.textContent}));
    assert.equal(cinema.state?.id,'madara','Madara ultimate should activate cinematic title');
    assert(cinema.title.includes('Сусаноо'),'Correct skill name should be visible in WebKit');
    assert.equal(await page.locator('.jutsu-fx').count(),0,'No emoji overlay for Susanoo');
    await page.locator('.arena').screenshot({path:'artifacts/susanoo-forming-webkit.png'});
    await page.evaluate(()=>{paused=false;});await advance(400);await page.evaluate(()=>{paused=true;});
    assert.equal(await page.evaluate(()=>arena3d.effects()[0]?.phase),'strike');
    await page.locator('.arena').screenshot({path:'artifacts/susanoo-strike-webkit.png'});
    await page.evaluate(()=>{paused=false;});await advance(2600);
    fx=await page.evaluate(()=>arena3d.inspect());assert.equal(fx.effects.length,0,'Effect must expire');
    assert.equal(await page.evaluate(()=>BattleCinematics.inspect()),null,'Ultimate caption must expire with the effect');
    const baseline=fx.memory.geometries;
    for(let i=0;i<8;i++){await cast();await advance(2600);}
    fx=await page.evaluate(()=>arena3d.inspect());
    assert.equal(fx.effects.length,0,'Repeated effects must expire');
    assert(fx.memory.geometries<=baseline+1,'Geometry leak: '+JSON.stringify({baseline,after:fx.memory}));
    const madara=fx.slots.find(u=>u.id==='madara');
    assert(Math.abs(madara.position[0]-madara.home[0])<.001&&Math.abs(madara.position[2]-madara.home[2])<.001,'Madara must return home');
    await cast();await page.evaluate(()=>arena3d.bind());await page.waitForTimeout(500);
    assert.equal(await page.evaluate(()=>arena3d.effects().length),0,'Rebinding must dispose effects');
    assert.equal(errors.length,0,'Susanoo page errors: '+errors.join('; '));
    console.log('PASS: automatic Susanoo, mobile WebKit formation/strike screenshots, 9 casts, geometry cleanup and rebind.');
    // Profile visual smoke: Susanoo must appear immediately without casting.
    // Earlier battle tests intentionally freeze Playwright's clock; resume it
    // so renderProfile's asynchronous GLB mount can run.
    await page.clock.resume();
    await page.evaluate(()=>openCharacter('madara'));
    await page.waitForFunction(
      ()=>!!document.querySelector('#hero3d[data-susanoo="active"] canvas'),
      null,{timeout:25000});
    await page.waitForTimeout(700);
    const profile=await page.evaluate(()=>{
      const host=document.getElementById('hero3d'),canvas=host.querySelector('canvas');
      return {hero:host.dataset.hero,active:host.dataset.susanoo,
        width:canvas.width,height:canvas.height};
    });
    assert.equal(profile.hero,'madara');
    assert.equal(profile.active,'active');
    assert(profile.width>100&&profile.height>100,'Madara must have a working profile WebGL canvas');
    await page.locator('#hero3d').screenshot({path:'artifacts/madara-profile-susanoo-webkit.png'});
    await page.evaluate(()=>closeProfile());
    assert.equal(errors.length,0,'Madara profile page errors: '+errors.join('; '));
    console.log('PASS: Madara profile has always-on 3D skeletal Susanoo in mobile WebKit.');
    await ctx.close();
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
