// Each fighter: attack -> technique -> ultimate -> repeat. Test actual HTML rules.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
for(const page of ['index.html','test-3d/index.html']){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  const select=html.match(/const ult=unit\.rage>=100,secondary=!ult&&unit\.rage>=50;\s*const action=ult\?2:secondary\?1:0,skill=\(skills\[unit\.id\]\|\|\['Удар','Техника','Ульта'\]\)\[action\];/);
  const charge=html.match(/if\(ult\)unit\.rage=0;else unit\.rage=Math\.min\(100,\(unit\.rage\|\|0\)\+50\);/);
  assert(select&&charge,page+' must use the same per-fighter ultimate timing');
  const act=vm.runInNewContext('(unit,skills)=>{'+select[0]+charge[0]+'return {action,skill,rage:unit.rage};}');
  const fighters=[
    {id:'madara',rage:0}, // opponents
    {id:'naruto',rage:0}, // player team
    {id:'sakura',rage:0} // support ultimate is a heal
  ];
  const skills={
    madara:['Удар Учиха','Огненный шар','Сусаноо'],
    naruto:['Удар','Клоны','Расенган'],
    sakura:['Удар','Усиление команды','Великое исцеление']
  };
  for(const hero of fighters){
    const observed=[];
    for(let turn=0;turn<9;turn++)observed.push(act(hero,skills));
    assert.deepEqual(observed.map(x=>x.action),[0,1,2,0,1,2,0,1,2],page+': '+hero.id+' must ult on turns 3,6,9');
    assert.deepEqual(observed.map(x=>x.rage),[50,100,0,50,100,0,50,100,0],page+': rage meter should reset each cycle');
    assert.equal(observed[2].skill,skills[hero.id][2]);
  }
  // Units in new wave/game have fresh rage independently.
  assert(/allies=s\.team\.map[\s\S]{0,400}rage:0,buff:0/.test(html),page+' must reset ally charge on wave start');
  assert(/foes=enemies\.map[\s\S]{0,250}rage:0,buff:0/.test(html),page+' must reset enemy charge on wave start');
  const fresh={id:'madara',rage:0};
  assert.equal(act(fresh,skills).action,0,'New wave must begin with a normal attack');
  // Existing automated WebKit test manually sets rage=100 to exercise Susanoo.
  assert.equal(act({id:'madara',rage:100},skills).action,2,'Fully charged ultimate still fires');
}
console.log('PASS: all active fighters ult every 3rd own action (3,6,9), normal/skill/ult order, rage UI and wave resets in both pages.');