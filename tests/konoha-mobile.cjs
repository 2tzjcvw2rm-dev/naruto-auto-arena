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
    page.on('pageerror',error=>{errors.push(error.message);console.error('PAGE ERROR',error.message)});
    page.on('console',msg=>{if(msg.type()==='error')console.error('BROWSER CONSOLE:',msg.text())});
    await page.goto('http://127.0.0.1:'+port+'/test-3d/',{waitUntil:'load',timeout:60000});
    // Use the game's own 5v5 demo to dismiss the welcome overlay and start combat.
    await page.locator('#pairDemo').click();
    await page.waitForTimeout(6500);
    const diag=await page.evaluate(()=>{
      let inspection=null,inspectionError=null;
      try{inspection=typeof arena3d!=='undefined'&&arena3d?arena3d.inspect():null}catch(e){inspectionError=e.message}
      return {three:typeof THREE,arena:typeof arena3d,unavailable:typeof arenaUnavailable!=='undefined'?arenaUnavailable:null,slots:inspection?.slots?.length,slotIds:inspection?.slots?.map(x=>x.id),cachedModels:typeof modelCache!=='undefined'?Object.keys(modelCache):[],environment:inspection?.environment?.name,inspectionError,canvas:!!document.querySelector('#battle3d canvas'),team:typeof allies!=='undefined'?allies.map(x=>x.id):null,foes:typeof foes!=='undefined'?foes.map(x=>x.id):null};
    });
    console.log('WEBKIT DIAG',JSON.stringify(diag),'PAGE ERRORS',JSON.stringify(errors));
    fs.mkdirSync('artifacts',{recursive:true});
    await page.locator('.arena').screenshot({path:'artifacts/konoha-iphone-debug.png'});
    await page.waitForFunction(()=>typeof arena3d!=='undefined'&&arena3d&&arena3d.inspect().slots.length===10,null,{timeout:20000});
    await page.waitForTimeout(1600);
    const state=await page.evaluate(()=>{
      const x=arena3d.inspect(),canvas=document.querySelector('#battle3d canvas');
      return {env:x.environment,slots:x.slots.length,canvas:!!canvas,webgl:!!canvas&&!!canvas.getContext('webgl'),size:x.size,positions:x.slots.map(p=>({side:p.side,home:p.home,position:p.position,yaw:p.yaw}))};
    });
    assert.equal(state.env.name,'konoha-training-overlook');
    assert.equal(state.slots,10);
    assert(state.canvas,'WebGL canvas is missing');
    assert(state.size[0]>100&&state.size[1]>100,'Battle canvas has no dimensions');
    assert(state.positions.every(p=>Math.abs(p.position[0]-p.home[0])<.01&&Math.abs(p.position[2]-p.home[2])<.01),'Formation drift');
    assert.equal(errors.length,0,'Page errors: '+errors.join('; '));
    fs.mkdirSync('artifacts',{recursive:true});
    await page.locator('.arena').screenshot({path:'artifacts/konoha-iphone-webkit.png'});
    console.log('PASS: WebKit iPhone-size battlefield; '+state.slots+' models; Konoha ambience; '+state.size.join('x')+'; no page errors.');
    await ctx.close();
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
