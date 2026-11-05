/* Konoha training overlook. Visuals only: no combat, camera, models or save state. */
function createKonohaOverlook(scene){
  const T=THREE;
  const material=(color,extra={})=>new T.MeshLambertMaterial({color,...extra});
  const basic=(color,extra={})=>new T.MeshBasicMaterial({color,...extra});
  const stone=material(0x958472), stoneEdge=material(0x777569), moss=material(0x6e9470);
  scene.fog=new T.Fog(0xaac6be,66,112);
  // Painted distant panorama is fixed to the sky, while foreground props have real depth.
  const sky=document.createElement('canvas');sky.width=1024;sky.height=512;
  const c=sky.getContext('2d');
  if(c&&typeof c.createLinearGradient==='function'){
    const g=c.createLinearGradient(0,0,0,512);
    g.addColorStop(0,'#4f8fcb');g.addColorStop(.42,'#85bed3');g.addColorStop(.76,'#eed0a3');g.addColorStop(1,'#d3b594');
    c.fillStyle=g;c.fillRect(0,0,1024,512);
    const glow=c.createRadialGradient(768,126,5,768,126,225);
    glow.addColorStop(0,'rgba(255,250,208,.77)');glow.addColorStop(.35,'rgba(255,238,188,.28)');glow.addColorStop(1,'rgba(255,237,191,0)');
    c.fillStyle=glow;c.fillRect(510,0,514,430);
    c.beginPath();c.arc(768,126,37,0,Math.PI*2);c.fillStyle='rgba(255,247,207,.65)';c.fill();
    function layer(points,color){c.beginPath();c.moveTo(0,512);for(const [x,y] of points)c.lineTo(x,y);c.lineTo(1024,512);c.closePath();c.fillStyle=color;c.fill()}
    layer([[0,322],[72,275],[142,313],[211,262],[278,302],[355,244],[421,286],[482,251],[556,297],[644,242],[737,285],[821,229],[914,302],[1024,254]],'#89a9a5');
    layer([[0,374],[75,343],[164,360],[258,318],[342,361],[442,337],[538,367],[634,316],[727,354],[836,319],[919,350],[1024,322]],'#6f9994');
    // Hokage rock overlooking the Leaf Village: subdued carved stone profiles.
    c.beginPath();c.moveTo(610,377);c.lineTo(634,266);c.lineTo(691,233);c.lineTo(735,248);c.lineTo(777,218);c.lineTo(840,250);c.lineTo(898,229);c.lineTo(967,278);c.lineTo(1018,380);c.closePath();
    c.fillStyle='#b8a18b';c.fill();c.strokeStyle='#8e837c';c.lineWidth=6;c.stroke();
    for(let i=0;i<4;i++){
      const x=674+i*77,y=279+(i%2)*5;
      c.fillStyle='#c6b19a';c.beginPath();c.ellipse(x,y,25,34,-.08,0,Math.PI*2);c.fill();
      c.strokeStyle='rgba(96,84,80,.56)';c.lineWidth=3;
      c.beginPath();c.moveTo(x-16,y-6);c.lineTo(x-5,y-9);c.moveTo(x+5,y-9);c.lineTo(x+16,y-6);c.moveTo(x,y-3);c.lineTo(x-2,y+12);c.lineTo(x+6,y+14);c.moveTo(x-9,y+22);c.quadraticCurveTo(x,y+26,x+11,y+21);c.stroke();
    }
    layer([[0,408],[80,384],[168,398],[249,372],[321,392],[425,365],[527,394],[638,363],[734,397],[835,377],[923,393],[1024,365]],'#527e73');
    // Several rows of tiny traditional Konoha roofs in the far distance.
    for(let row=0;row<3;row++)for(let i=0;i<30;i++){
      const x=i*40+(row%2)*18-8,y=408+row*30+(i*7%14),w=19+(i*11%16),h=17+(i*5%17);
      c.fillStyle=row===0?'#c6bda4':row===1?'#bba88b':'#ad957b';c.fillRect(x,y,w,h);
      c.beginPath();c.moveTo(x-5,y+2);c.lineTo(x+w*.5,y-10);c.lineTo(x+w+5,y+2);c.closePath();
      c.fillStyle=['#ac584f','#ae7559','#667f74','#c0825a'][i%4];c.fill();
      c.fillStyle='rgba(55,72,70,.5)';c.fillRect(x+6,y+7,4,5);
    }
    scene.background=new T.CanvasTexture(sky);
    scene.background.encoding=T.sRGBEncoding;
    const panorama=new T.Mesh(new T.PlaneGeometry(145,44),new T.MeshBasicMaterial({map:scene.background,fog:false,depthWrite:false}));
    panorama.position.set(0,3,-57);scene.add(panorama);
  }else scene.background=new T.Color(0x9ec9d2);
  scene.add(new T.HemisphereLight(0xfff0d7,0x657e7b,1.01));
  const sun=new T.DirectionalLight(0xffe1ab,.76);sun.position.set(-8,14,8);scene.add(sun);
  function block(x,y,z,w,h,d,mat){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);scene.add(mesh);return mesh}
  // Broad sandstone training court; the model feet and their real shadows stay at y=0.
  const floor=new T.Mesh(new T.PlaneGeometry(54,19),stone);
  floor.rotation.x=-Math.PI/2;floor.position.set(0,-.045,1);scene.add(floor);
  // Worn training-circle markings on the empty front half of the court.
  const sigilMat=new T.MeshBasicMaterial({color:0x8a6355,transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false});
  for(const [inside,outside] of [[2.88,3.04],[3.45,3.56]]){
    const circle=new T.Mesh(new T.RingGeometry(inside,outside,72),sigilMat);
    circle.rotation.x=-Math.PI/2;circle.position.set(0,.014,5);scene.add(circle);
  }
  const swirl=[];
  for(let j=0;j<72;j++){
    const t=j/72*Math.PI*3.65,next=(j+1)/72*Math.PI*3.65;
    const radius=.24+j/72*2.2,radiusNext=.24+(j+1)/72*2.2;
    swirl.push(Math.cos(t)*radius,.016,5+Math.sin(t)*radius,Math.cos(next)*radiusNext,.016,5+Math.sin(next)*radiusNext);
  }
  const crest=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(swirl,3)),new T.LineBasicMaterial({color:0x8a6355,transparent:true,opacity:.33,depthWrite:false}));
  scene.add(crest);
  const seams=[];
  for(let x=-26;x<=26;x+=2.7)seams.push(x,.004,-8.3,x,.004,10.3);
  for(let z=-8.3;z<=10.3;z+=2.7)seams.push(-26,.004,z,26,.004,z);
  const grout=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(seams,3)),new T.LineBasicMaterial({color:0x917c65,transparent:true,opacity:.24,depthWrite:false}));scene.add(grout);
  block(0,-.3,-8.55,55,.6,.85,stoneEdge);
  block(0,-.08,-8.5,55,.15,.82,material(0xdfc9a2));
  for(const x of [-25,-20,-15,-10,10,15,20,25]){
    const p=new T.Mesh(new T.CylinderGeometry(.16,.2,1.15,6),stoneEdge);
    p.position.set(x,.42,-8.8);scene.add(p);
  }
  // An elevated rock shelf drops into the landscape below the court.
  block(0,-2.4,-9.25,55,4.3,.9,material(0x776e65));
  const hillside=new T.Mesh(new T.PlaneGeometry(100,60),material(0x709578));
  hillside.rotation.x=-Math.PI/2;hillside.position.set(0,-5.1,-37);scene.add(hillside);
  // Layered mountain silhouettes are geometric and parallax naturally with the fixed camera.
  function ridge(z,base,heights,color){
    const verts=[];const width=120,dx=width/(heights.length-1);
    for(let i=0;i<heights.length-1;i++){
      const x=-width/2+i*dx,X=x+dx;
      verts.push(x,base,z,x,heights[i],z,X,heights[i+1],z,x,base,z,X,heights[i+1],z,X,base,z);
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.computeVertexNormals();
    const mesh=new T.Mesh(geo,basic(color,{side:T.DoubleSide}));scene.add(mesh);
  }
  ridge(-69,-7,[5,7,12,7,9,15,11,7,14,10,13,6,8],0x89aca3);
  ridge(-51,-6,[2,4,7,5,9,6,8,4,10,6,8,4,5],0x71978a);
  // Roofs/stone houses: shared geometry + instancing saves GPU draw calls on iPhone.
  const count=36,houseGeo=new T.BoxGeometry(1,1,1),roofGeo=new T.ConeGeometry(.82,.7,4);
  roofGeo.rotateY(Math.PI/4);
  const houses=new T.InstancedMesh(houseGeo,material(0xd9c7a7),count);
  const roofs=new T.InstancedMesh(roofGeo,material(0xd98568,{side:T.DoubleSide}),count);
  const dummy=new T.Object3D();
  for(let i=0;i<count;i++){
    const row=Math.floor(i/12),col=i%12,scale=.87+(i*13%7)*.13;
    const x=(col-5.5)*5.2+(row%2)*2.3,z=-19-row*6.2-(i%3)*.35;
    const y=-6.15,h=1.4*scale;
    dummy.position.set(x,y+h/2,z);dummy.scale.set(1.9*scale,h,1.8*scale);dummy.rotation.set(0,0,0);dummy.updateMatrix();houses.setMatrixAt(i,dummy.matrix);
    dummy.position.y=y+h+.3*scale;dummy.scale.set(1.75*scale,scale,1.65*scale);dummy.rotation.y=0;dummy.updateMatrix();roofs.setMatrixAt(i,dummy.matrix);
    if(houses.setColorAt){houses.setColorAt(i,new T.Color(['#d5c0a0','#cdb998','#e0c8ab'][i%3]));roofs.setColorAt(i,new T.Color(['#b65c4b','#bd7756','#d09260','#738c7f'][i%4]));}
  }
  houses.instanceMatrix.needsUpdate=true;roofs.instanceMatrix.needsUpdate=true;
  scene.add(houses,roofs);
  // Recognisable red-roofed village landmark, behind all fighters.
  const towerBase=material(0xd7b48d),red=material(0xb9544c),accent=material(0xf1d8ac);
  const tower=new T.Mesh(new T.CylinderGeometry(2.1,2.35,4.8,12),towerBase);
  tower.position.set(1,-1.9,-29);scene.add(tower);
  const roof=new T.Mesh(new T.ConeGeometry(3.4,1.7,12),red);roof.position.set(1,1.4,-29);scene.add(roof);
  const towerBand=new T.Mesh(new T.CylinderGeometry(2.2,2.2,.28,12),accent);towerBand.position.set(1,.65,-29);scene.add(towerBand);
  // Tree silhouettes frame the battle rather than obscuring the ten models.
  const trunkMat=material(0x725747),leafMats=[material(0x548b62),material(0x6e9b69),material(0x87a36b)];
  const treeCrownGeometry=new T.IcosahedronGeometry(1,1),treeTrunkGeometry=new T.CylinderGeometry(.25,.42,1,7);
  const swaying=[];
  for(const [i,x,z,scale] of [[0,-21,-7.8,1],[1,21,-7.8,1.05],[2,-16.4,-10.3,.8],[3,16.4,-10.3,.83]]){
    const trunk=new T.Mesh(treeTrunkGeometry,trunkMat);trunk.scale.set(scale,3.8*scale,scale);trunk.position.set(x,1.7*scale,z);scene.add(trunk);
    const crown=new T.Group();crown.position.set(x,3.6*scale,z);scene.add(crown);
    for(let j=0;j<4;j++){
      const puff=new T.Mesh(treeCrownGeometry,leafMats[(i+j)%3]);
      puff.position.set((j%2?-.8:.8)*scale,(j===3?1:.15)*scale,(j>1?-.5:.2)*scale);
      puff.scale.set((1.55+(j%2)*.15)*scale,1.35*scale,1.25*scale);crown.add(puff);
    }
    swaying.push({node:crown,phase:i});
  }
  // Carved lanterns give the courtyard warm points of interest.
  const lanternStone=material(0x6c7068),lanternLight=basic(0xffd7a0);
  for(const x of [-13.5,13.5]){
    block(x,.82,-7.2,.28,1.7,.28,lanternStone);
    block(x,1.65,-7.2,.75,.12,.75,lanternStone);
    block(x,2.01,-7.2,.58,.52,.58,lanternLight);
    block(x,2.35,-7.2,.85,.16,.85,lanternStone);
  }
  // Subtle animated clouds float in world space, not on top of the UI.
  const clouds=[],cloudMat=basic(0xfff8e8,{transparent:true,opacity:.58,depthWrite:false});
  const cloudGeo=new T.SphereGeometry(1,9,6);
  for(let i=0;i<5;i++){
    const group=new T.Group();group.position.set(-27+i*13,10+(i%3)*2.6,-41-i%2*7);
    for(let j=0;j<3;j++){
      const puff=new T.Mesh(cloudGeo,cloudMat);puff.position.set((j-1)*2.25,j===1?.38:0,0);
      puff.scale.set(2.3+(j===1?.7:0),.48+j*.05,.7);group.add(puff);
    }
    scene.add(group);clouds.push({node:group,x:group.position.x,phase:i*1.7});
  }
  // Falling leaves are instanced, leaving attack lanes unobstructed.
  const leafCount=24,leafGeo=new T.PlaneGeometry(.17,.32),leafMat=basic(0xd5a85e,{side:T.DoubleSide,transparent:true,opacity:.7,depthWrite:false});
  const leaves=new T.InstancedMesh(leafGeo,leafMat,leafCount),leafDummy=new T.Object3D();
  leaves.frustumCulled=false;scene.add(leaves);
  for(let i=0;i<leafCount;i++){leafDummy.position.set(0,-100,0);leafDummy.scale.setScalar(.8);leafDummy.updateMatrix();leaves.setMatrixAt(i,leafDummy.matrix)}
  leaves.instanceMatrix.needsUpdate=true;
  const seed=i=>{const v=Math.sin(i*127.1+78.233)*43758.5453;return v-Math.floor(v)};
  function update(dt,seconds){
    for(const item of clouds)item.node.position.x=item.x+Math.sin(seconds*.16+item.phase)*2.3;
    for(const item of swaying)item.node.rotation.z=Math.sin(seconds*.65+item.phase)*.018;
    for(let i=0;i<leafCount;i++){
      const age=(seconds*(.14+seed(i+90)*.09)+seed(i+30))%1;
      const side=i%2?-1:1;
      leafDummy.position.set(i%6===0?(seed(i+23)-.5)*9+Math.sin(seconds*.65+i)*.55:side*(6.8+seed(i)*11)+Math.sin(seconds*.8+i)*.5,i%6===0?2.6-age*3.1:4.4-age*5.1,i%6===0?4.5:-6.7-seed(i+12)*2.8);
      leafDummy.rotation.set(seconds*.75+i,seconds*.45+i*.3,Math.sin(seconds+i)*.5);
      const scale=.65+seed(i+17)*.55;leafDummy.scale.setScalar(scale);leafDummy.updateMatrix();leaves.setMatrixAt(i,leafDummy.matrix);
    }
    leaves.instanceMatrix.needsUpdate=true;
  }
  update(0,0);
  return {update,inspect(){return {name:'konoha-training-overlook',houses:count,clouds:clouds.length,leaves:leafCount,courtY:0,visualOnly:true}}};
}
