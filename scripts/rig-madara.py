"""Build a skinned derivative of the supplied Madara; preserve materials/UVs."""
import json,struct,numpy as np
from pathlib import Path
src=Path(__file__).resolve().parents[1]/'test-3d/models/madara.glb'
b=src.read_bytes();n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);data=bytearray(b[28+n:])
def read(i):
 a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];return np.frombuffer(data,dtype='<f4',count=a['count']*3,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,3).copy()
def add(a,typ,component=5126):
 while len(data)%4:data.append(0)
 offset=len(data);data.extend(a.tobytes());vi=len(j['bufferViews']);j['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':a.nbytes})
 ac={'bufferView':vi,'componentType':component,'count':len(a),'type':typ}
 if typ=='VEC3':ac.update(min=a.min(0).tolist(),max=a.max(0).tolist())
 j['accessors'].append(ac);return len(j['accessors'])-1
meshes=[]
def walk(i,m):
 node=j['nodes'][i];m=m@np.array(node.get('matrix',np.eye(4).T.flatten())).reshape(4,4).T
 if 'mesh' in node:
  mesh=j['meshes'][node['mesh']]
  for p in mesh['primitives']:
   a=p['attributes'];v=read(a['POSITION']);v=(m@np.column_stack([v,np.ones(len(v))]).T).T[:,:3];a['POSITION']=add(v.astype('<f4'),'VEC3')
   norm=read(a['NORMAL'])@np.linalg.inv(m[:3,:3]);norm/=np.linalg.norm(norm,axis=1)[:,None];a['NORMAL']=add(norm.astype('<f4'),'VEC3')
  meshes.append((node['mesh'],node['name']))
 for c in node.get('children',[]):walk(c,m)
walk(0,np.eye(4))
# Joint positions in baked model space, with continuous two-joint skin weights.
joints=[('Hips',(0,.79,0),None),('Spine',(0,1.04,0),0),('Head',(0,1.28,0),1)]
for side,s in [('Right',-1),('Left',1)]:
 base=len(joints);joints.extend([(side+'Arm',(s*.18,1.19,0),1),(side+'ForeArm',(s*.34,.96,0),base),(side+'Hand',(s*.435,.79,0),base+1),(side+'UpLeg',(s*.12,.75,0),0),(side+'Leg',(s*.15,.40,0),base+3),(side+'Foot',(s*.16,.09,0),base+4)])
nodes=[{'name':'MadaraRig','children':list(range(1,1+len(meshes)))+[1+len(meshes)]}]
boneOffset=1+len(meshes)
for mi,name in meshes:nodes.append({'name':name,'mesh':mi,'skin':0})
for i,(name,pos,parent) in enumerate(joints):
 p=np.array(pos);local=p-(np.array(joints[parent][1]) if parent is not None else 0)
 nodes.append({'name':name,'translation':local.tolist(),'children':[boneOffset+k for k,x in enumerate(joints) if x[2]==i]})
for mi,name in meshes:
 for p in j['meshes'][mi]['primitives']:
  v=read(p['attributes']['POSITION']);idx=np.zeros((len(v),4),dtype='<u2');w=np.zeros((len(v),4),dtype='<f4')
  for k,(x,y,z) in enumerate(v):
   ax=abs(x);base=3 if x<0 else 9
   if name.startswith('Hrad'):
    a,c,t=1,2,np.clip((y-1.14)/.16,0,1)
   elif name.startswith('Top') and ax>.20 and y>.68:
    if y>.95:a,c,t=1,base,np.clip((ax-.18)/.10,0,1)
    else:a,c,t=base,base+1,np.clip((.99-y)/.13,0,1)
    if y<.83:a,c,t=base+1,base+2,np.clip((.83-y)/.08,0,1)
   elif name.startswith('Top') and y<.83:
    a,c,t=0,base+3,np.clip((.75-y)/.3,0,.65)
   elif y<.77:
    if y>.46:a,c,t=0,base+3,np.clip((.79-y)/.12,0,1)
    elif y>.13:a,c,t=base+3,base+4,np.clip((.48-y)/.15,0,1)
    else:a,c,t=base+4,base+5,np.clip((.16-y)/.07,0,1)
   else:a,c,t=0,1,np.clip((y-.80)/.22,0,1)
   idx[k,:2]=[a,c];w[k,:2]=[1-t,t]
  p['attributes']['JOINTS_0']=add(idx,'VEC4',5123);p['attributes']['WEIGHTS_0']=add(w,'VEC4')
inverse=[]
for _,pos,_ in joints:
 m=np.eye(4,dtype='<f4');m[:3,3]=-np.array(pos);inverse.append(m.T.flatten())
j['skins']=[{'joints':list(range(boneOffset,boneOffset+len(joints))),'skeleton':boneOffset,'inverseBindMatrices':add(np.array(inverse,dtype='<f4'),'MAT4')}]
j['nodes']=nodes;j['scenes']=[{'nodes':[0]}];j['scene']=0;j['buffers']=[{'byteLength':len(data)}]
js=json.dumps(j,separators=(',',':')).encode();js+=b' '*((-len(js))%4);data+=b'\0'*((-len(data))%4)
out=struct.pack('<III',0x46546c67,2,28+len(js)+len(data))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(data),0x004e4942)+data
src.with_name('madara-combat.glb').write_bytes(out)
print('Madara: 15 joints, 4 skinned meshes, original UV/materials retained')
