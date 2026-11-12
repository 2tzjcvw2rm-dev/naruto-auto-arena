/* Turntable preview of Madara's full articulated blue Susanoo. */
(function(){
'use strict';
window.createMadaraProfileSusanoo=function(T,parent){
 const avatar=MadaraSusanoo.build(true),root=avatar.root;root.name='madara-profile-skeletal-susanoo';parent.add(root);
 root.position.set(0,-.5,-.12);root.scale.setScalar(.65);let disposed=false,start=null;
 const update=(dt,now)=>{if(disposed)return;if(start===null)start=now;const p=Math.min(.50,(now-start)/4500);avatar.update(p,now,.70);};
 update.inspect=()=>({...avatar.inspect(),name:root.name,disposed});
 update.dispose=()=>{if(disposed)return;disposed=true;parent.remove(root);avatar.dispose();};return update;
};
})();
