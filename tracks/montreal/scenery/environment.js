import * as T from '../../../vendor/three.module.js';

// Geography is mapped; race-weekend furniture is a visual reconstruction.
// Kept separate from the immutable lap geometry and telemetry.
export async function buildEnvironment({scene,renderer,map,path,normals,pitSamples,project,mats,mobile}){
  let seed=20260927;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const root=new T.Group();root.name='Montreal race-weekend environment';scene.add(root);
  const count=path.length,world=new T.Vector3(),dummy=new T.Object3D(),color=new T.Color();
  const stats={trees:0,spectators:0,wallSegments:0,grandstands:0};
  const at=(u,offset=0)=>{const i=((Math.floor(u*count)%count)+count)%count;return path[i].clone().addScaledVector(normals[i],offset);};
  const heading=u=>{const i=((Math.floor(u*count)%count)+count)%count;return Math.atan2(normals[i].z,-normals[i].x);};
  const inside=(p,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)yes=!yes;}return yes;};
  const water=map.layers.water.filter(w=>w.closed).map(w=>w.coords.map(project));
  const buildings=map.layers.buildings.filter(w=>w.closed).map(w=>w.coords.map(project));
  // Spatial index keeps tree exclusion independent of total circuit length.
  const cells=new Map(),cellSize=32;
  const key=(x,z)=>`${x},${z}`;
  const put=(p,radius)=>{const x=Math.floor(p.x/cellSize),z=Math.floor(p.z/cellSize),k=key(x,z);if(!cells.has(k))cells.set(k,[]);cells.get(k).push({p,radius});};
  for(let i=0;i<count;i+=8)put(path[i],21);
  for(const p of pitSamples)put(p,16);
  const clear=p=>{const x=Math.floor(p.x/cellSize),z=Math.floor(p.z/cellSize);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const q of cells.get(key(x+a,z+b))||[])if(p.distanceToSquared(q.p)<q.radius*q.radius)return false;return !water.some(w=>inside(p,w))&&!buildings.some(w=>inside(p,w));};
  const material=(c,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color:c,roughness,metalness});
  const steel=material('#8b969b',.55,.55),white=material('#e1e0d9'),black=material('#182126'),concrete=material('#a9aaa4'),red=material('#d6423c'),seat=material('#8998a5'),wood=material('#64513b'),glass=material('#597480',.22,.45);
  const boxGeometry=new T.BoxGeometry(1,1,1),batches=new Map();
  function box(w,h,d,x,y,z,mat,rotation=0,tint){
    if(!batches.has(mat))batches.set(mat,[]);
    batches.get(mat).push({x,y,z,w,h,d,rotation,tint});
  }
  function line(points,mat,height,width){
    for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],l=a.distanceTo(b);if(l<.01)continue;box(width,height,l,(a.x+b.x)/2,height/2,(a.z+b.z)/2,mat,Math.atan2(b.x-a.x,b.z-a.z));}
  }
  const textureLoader=new T.TextureLoader(),anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  async function texture(name,data=false){try{const t=await textureLoader.loadAsync(new URL(`../../../assets/environment/${name}.jpg`,import.meta.url).href);if(!data)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=anisotropy;return t;}catch{return null;}}
  const [asphalt,grass,cement]=await Promise.all(['asphalt','grass','concrete'].map(texture));
  if(asphalt){mats.asphalt.map=asphalt;mats.asphalt.color.set('#a6a6a6');}
  if(grass){mats.grass.map=grass;mats.darkGrass.map=grass;mats.grass.color.set('#909676');mats.darkGrass.color.set('#64724d');}
  if(cement){mats.concrete.map=cement;concrete.map=cement;mats.concrete.color.set('#c4c1b7');}
  const [asphaltNormal,concreteNormal]=await Promise.all([texture('asphalt-normal',true),texture('concrete-normal',true)]);
  if(asphaltNormal){mats.asphalt.normalMap=asphaltNormal;mats.asphalt.normalScale.set(.26,.26);}
  if(concreteNormal){mats.concrete.normalMap=concreteNormal;mats.concrete.normalScale.set(.2,.2);}
  scene.updateMatrixWorld(true);
  scene.traverse(mesh=>{
    if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;
    if(![mats.asphalt,mats.grass,mats.darkGrass,mats.concrete,mats.water].includes(mesh.material))return;
    const p=mesh.geometry.attributes.position,uv=new Float32Array(p.count*2),size=mesh.material===mats.asphalt?9:mesh.material===mats.concrete?5:25;
    for(let i=0;i<p.count;i++){world.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);uv[i*2]=world.x/size;uv[i*2+1]=world.z/size;}
    mesh.geometry.setAttribute('uv',new T.BufferAttribute(uv,2));mesh.material.needsUpdate=true;
  });
  // A soft blue horizon, overhead sky and directional daylight replace the
  // flat green background. Sky follows the camera without moving the circuit.
  const sky=new T.Mesh(new T.SphereGeometry(5800,24,12),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{zenith:{value:new T.Color('#78abd5')},horizon:{value:new T.Color('#dce6e8')}},vertexShader:'varying vec3 vDir; void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 zenith;uniform vec3 horizon;varying vec3 vDir;void main(){float h=max(normalize(vDir).y,0.0);vec3 c=mix(horizon,zenith,pow(h,0.38));gl_FragColor=vec4(c,1.0); #include <tonemapping_fragment>\n #include <colorspace_fragment>\n}'}));
  // Shader includes need their own lines for Three's preprocessor.
  sky.material.fragmentShader=sky.material.fragmentShader.replace('; #include',';\n#include');sky.frustumCulled=false;sky.renderOrder=-100;root.add(sky);
  scene.background=new T.Color('#dce6e8');scene.fog=new T.FogExp2('#c7d7de',.00034);
  const skyEnvironment=new T.Scene();skyEnvironment.background=new T.Color('#a9c4d9');
  if(renderer.isWebGLRenderer){const pmrem=new T.PMREMGenerator(renderer);const reflection=pmrem.fromScene(skyEnvironment,0);scene.environment=reflection.texture;pmrem.dispose();}
  mats.water.color.set('#668e96');mats.water.roughness=.27;mats.water.metalness=.35;
  mats.water.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor=0.25;');};

  // Narrow grass verges and variable setback make this feel like a temporary
  // island circuit. Keep every wall well outside the racing envelope.
  const smooth=(a,b,u)=>{const t=Math.max(0,Math.min(1,(u-a)/(b-a)));return t*t*(3-2*t);};
  const wallOffset=u=>{let d=10.5+1.8*Math.sin(u*Math.PI*10)**2;const hairpin=smooth(.563,.58,u)*(1-smooth(.642,.66,u)),chicane=smooth(.85,.868,u)*(1-smooth(.922,.94,u));d+=(19-d)*hairpin;d+=(13.5-d)*chicane;return u<.036||u>.945?11.8:d;};
  const fencePositions=[],fenceUV=[],fenceIndices=[];
  function fence(a,b,side,base=1.15){
    const n=fencePositions.length/3,length=a.distanceTo(b),dx=(b.z-a.z)/length*side*.55,dz=-(b.x-a.x)/length*side*.55;
    fencePositions.push(a.x,base,a.z,b.x,base,b.z,a.x,base+2.5,a.z,b.x,base+2.5,b.z,a.x+dx,base+3.05,a.z+dz,b.x+dx,base+3.05,b.z+dz);
    fenceUV.push(0,0,length/2,0,0,.82,length/2,.82,0,1,length/2,1);fenceIndices.push(n,n+1,n+2,n+1,n+3,n+2,n+2,n+3,n+4,n+3,n+5,n+4);
  }
  const fenceCanvas=document.createElement('canvas');fenceCanvas.width=128;fenceCanvas.height=256;
  const fc=fenceCanvas.getContext('2d');fc.strokeStyle='rgba(93,104,108,.66)';fc.lineWidth=1.2;
  for(let x=0;x<=128;x+=8){fc.beginPath();fc.moveTo(x,0);fc.lineTo(x,256);fc.stroke();}for(let y=0;y<=256;y+=10){fc.beginPath();fc.moveTo(0,y);fc.lineTo(128,y);fc.stroke();}
  const fenceMap=new T.CanvasTexture(fenceCanvas);fenceMap.wrapS=fenceMap.wrapT=T.RepeatWrapping;fenceMap.anisotropy=anisotropy;
  // White track-edge lines; thin geometry avoids changing the driving surface.
  function ribbon(offset,width,mat,y){const v=[],ix=[];for(let i=0;i<=count;i+=8){const j=i%count,p=path[j],n=normals[j];for(const d of [offset-width/2,offset+width/2])v.push(p.x+n.x*d,y,p.z+n.z*d);if(i){const q=v.length/3-2;ix.push(q-2,q-1,q,q-1,q+1,q);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();const m=new T.Mesh(g,mat);m.receiveShadow=true;root.add(m);}
  for(const side of [-1,1]){
    ribbon(side*6.95,.14,white,.043);
    for(let i=0;i<count;i+=10){const j=(i+10)%count,u=i/count;
      // Open the pit entry/exit corridor on the pit side.
      if(side===-1&&(u>.932||u<.027))continue;
      const a=at(u,side*wallOffset(u)),b=at(j/count,side*wallOffset(j/count));
      const angle=Math.atan2(b.x-a.x,b.z-a.z),len=a.distanceTo(b);
      box(.48,1.15,len+.04,(a.x+b.x)/2,.58,(a.z+b.z)/2,concrete,angle);stats.wallSegments++;
      if(i%10===0){box(.08,3.7,.08,a.x,1.9,a.z,steel);box(.1,.09,len,(a.x+b.x)/2,3.65,(a.z+b.z)/2,steel,angle);}
      fence(a,b,side);
    }
  }
  const fg=new T.BufferGeometry();fg.setAttribute('position',new T.Float32BufferAttribute(fencePositions,3));fg.setAttribute('uv',new T.Float32BufferAttribute(fenceUV,2));fg.setIndex(fenceIndices);fg.computeVertexNormals();
  root.add(new T.Mesh(fg,new T.MeshStandardMaterial({map:fenceMap,color:'#b5bec0',transparent:true,opacity:.65,alphaTest:.12,depthWrite:false,side:T.DoubleSide,roughness:.65})));

  // Race-weekend signs are real geometry, visible from both onboard cameras.
  const signTextures=new Map();
  function signTexture(text,bg,fg){const key=text+bg+fg;if(signTextures.has(key))return signTextures.get(key);const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,1024,256);x.fillStyle=fg;x.font='bold 96px Arial, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,512,132,960);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=anisotropy;const m=new T.MeshStandardMaterial({map:t,roughness:.76,side:T.DoubleSide});signTextures.set(key,m);return m;}
  function panel(text,u,side,width=10,height=1,bg='#07543e',fg='#f4e7a6',distance){const p=at(u,side*(distance||wallOffset(u)+.28)),g=new T.PlaneGeometry(width,height),m=new T.Mesh(g,signTexture(text,bg,fg));m.position.copy(p);m.position.y=height/2+.14;m.rotation.y=heading(u)+(side>0?Math.PI/2:-Math.PI/2);root.add(m);}
  const sponsors=[['aramco','#037e79','#ffffff'],['PIRELLI','#efce29','#c72c27'],['DHL','#f2cf20','#c82826'],['MSC CRUISES','#182b46','#ffffff'],['Lenovo','#d72d31','#ffffff']];
  for(let k=0;k<95;k++){const u=(k*.0103+.007)%1,s=sponsors[Math.floor(u*12)%sponsors.length];panel(s[0],u,k%2?1:-1,12,1.04,s[1],s[2]);}
  for(const entry of [.041,.149,.269,.446,.599,.879])for(const [meters,uDelta]of [[150,.034],[100,.023],[50,.011]]){const u=entry-uDelta,p=at(u,-wallOffset(u)-.6),m=new T.Mesh(new T.PlaneGeometry(1.35,1.55),signTexture(String(meters),'#f3f3ed','#15242b'));m.position.copy(p);m.position.y=2.7;m.rotation.y=heading(u)+Math.PI;root.add(m);box(.08,2.4,.08,p.x,1.2,p.z,steel);}
  function gantry(u,text,bg='#c82c30'){const p=at(u),rotation=heading(u),g=new T.Group();g.position.copy(p);g.rotation.y=rotation;const cross=new T.Mesh(new T.BoxGeometry(25,.55,1.3),steel);cross.position.y=6.9;g.add(cross);for(const side of [-1,1]){const leg=new T.Mesh(new T.BoxGeometry(.5,7,.5),steel);leg.position.set(side*12,3.5,0);g.add(leg);}const banner=new T.Mesh(new T.PlaneGeometry(23,1.8),signTexture(text,bg,'#ffffff'));banner.position.set(0,6.5,-.7);banner.rotation.y=Math.PI;g.add(banner);root.add(g);}
  gantry(.973,'FORMULA 1  ·  CANADA');gantry(.433,'aramco','#007f74');gantry(.82,'PIRELLI','#cb312c');
  panel('BIENVENUE AU QUÉBEC',.914,1,23,1.1,'#ededdf','#163d71');
  panel('CIRCUIT GILLES-VILLENEUVE',.925,1,20,1.1,'#e8e7df','#263537');

  // Grandstands: tiered decks, supports, stairs and thousands of small seated
  // spectators. Repeated geometry is instanced, including the crowd.
  const crowdRows=[],standPolys=[];
  function grandstand(p,rotation,width=60,rows=12){
    const s=Math.sin(rotation),c=Math.cos(rotation),point=(x,z)=>new T.Vector3(p.x+c*x+s*z,0,p.z-s*x+c*z);
    const corners=[point(-width/2,-1),point(width/2,-1),point(width/2,rows*1.05+2),point(-width/2,rows*1.05+2)];
    standPolys.push(corners);stats.grandstands++;
    for(let row=0;row<rows;row++){const q=point(0,row*1.05);box(width,.21,1.1,q.x,1+row*.48,q.z,seat,rotation);const rail=point(0,row*1.05+.37);box(width,.13,.12,rail.x,1.38+row*.48,rail.z,steel,rotation);
      const step=mobile?1.35:.88;for(let x=-width/2+1;x<width/2-1;x+=step){if(Math.abs(x%12)<1||random()<.13)continue;const q=point(x,row*1.05);crowdRows.push({p:q,y:1.48+row*.48,rotation,tint:['#c64336','#dcddd7','#303d58','#1f252c','#ccb77d','#5383a0'][Math.floor(random()*6)]});}
    }
    for(let x=-width/2;x<=width/2;x+=6){const q=point(x,rows*.53);box(.15,rows*.48,rows*.96,q.x,rows*.24,q.z,steel,rotation);}
    const back=point(0,rows*1.05);box(width,1.1,.17,back.x,rows*.48+1,back.z,white,rotation);
    for(const x of [-width/2,width/2]){const q=point(x,rows*.52);box(.12,1,rows*1.06,q.x,rows*.24+2,q.z,steel,rotation);}
  }
  // Mapped footprints establish permanent spectator areas.
  for(const way of map.layers.stands){const points=way.coords.map(project),p=new T.Box3().setFromPoints(points).getCenter(new T.Vector3());let closest=0,d=Infinity;for(let i=0;i<count;i+=8){const n=p.distanceToSquared(path[i]);if(n<d){d=n;closest=i;}}const toward=path[closest].clone().sub(p);const rotation=Math.atan2(-toward.x,-toward.z);let width=0;for(let i=1;i<points.length;i++)width=Math.max(width,points[i].distanceTo(points[i-1]));grandstand(p,rotation,Math.min(105,Math.max(35,width)),12);}
  // Temporary race grandstands around Senna and the hairpin, reconstructed
  // from the event layout rather than claimed as surveyed geometry.
  for(const [u,side,width,rows]of [[.033,-1,72,14],[.074,-1,66,13],[.594,-1,76,15],[.621,-1,64,16],[.642,-1,55,12],[.966,1,96,14]]){const p=at(u,side*(wallOffset(u)+16)),n=normals[Math.floor(u*count)];grandstand(p,Math.atan2(n.x*side,n.z*side),width,rows);}
  stats.spectators=crowdRows.length;
  for(const q of crowdRows){box(.38,.48,.28,q.p.x,q.y,q.p.z,white,q.rotation,q.tint);box(.22,.22,.22,q.p.x,q.y+.36,q.p.z,wood,q.rotation,['#ce9b76','#a97857','#ddbd98','#755441'][Math.floor(random()*4)]);}

  // Woodland polygons are filled with varied trees; the old map held only
  // individually tagged trees, leaving almost all forest visually empty.
  const treeRows=[];
  function addTree(p){if(treeRows.length>=(mobile?2400:4200)||!clear(p)||standPolys.some(poly=>inside(p,poly)))return;const h=8+random()*9;treeRows.push({p,h,r:2.8+random()*2.8,rotation:random()*Math.PI});}
  for(const p of map.layers.trees.map(project))addTree(p);
  for(const way of map.layers.woods){const poly=way.coords.map(project);if(poly.length<3)continue;const b=new T.Box3().setFromPoints(poly),area=(b.max.x-b.min.x)*(b.max.z-b.min.z),attempts=Math.min(1600,Math.floor(area/(mobile?85:58)));
    for(let i=0;i<attempts;i++){const p=new T.Vector3(b.min.x+random()*(b.max.x-b.min.x),0,b.min.z+random()*(b.max.z-b.min.z));if(inside(p,poly))addTree(p);}}
  // Extra verge planting is limited to mapped woodland, preserving water and
  // open spectator areas while supplying the canopy seen from an onboard.
  stats.trees=treeRows.length;
  const treeMaps=await Promise.all(['tree02','tree04','tree05'].map(async name=>{try{const t=await textureLoader.loadAsync(new URL(`../../../assets/environment/${name}.png`,import.meta.url).href);t.colorSpace=T.SRGBColorSpace;t.anisotropy=anisotropy;return t;}catch{return null;}}));
  const treeMaterials=treeMaps.map(t=>t?new T.MeshStandardMaterial({map:t,alphaTest:.48,side:T.DoubleSide,color:'#d5ddc6',roughness:1}):null);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const sc=shadowCanvas.getContext('2d'),gradient=sc.createRadialGradient(32,32,2,32,32,31);gradient.addColorStop(0,'rgba(10,21,12,.48)');gradient.addColorStop(.5,'rgba(10,21,12,.24)');gradient.addColorStop(1,'rgba(10,21,12,0)');sc.fillStyle=gradient;sc.fillRect(0,0,64,64);
  const shadowMaterial=new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,opacity:.6,polygonOffset:true,polygonOffsetFactor:-1}),shadowPlane=new T.PlaneGeometry(1,1);
  const treePlane=new T.PlaneGeometry(1,1),canopies=[],trunkGeo=new T.CylinderGeometry(.12,.24,1,5),leafGeo=new T.IcosahedronGeometry(1,1),trunkMat=material('#716654'),leafMat=material('#739655');
  const treeCells=new Map();for(const row of treeRows){const k=key(Math.floor(row.p.x/220),Math.floor(row.p.z/220));if(!treeCells.has(k))treeCells.set(k,[]);treeCells.get(k).push(row);}
  for(const rows of treeCells.values()){
    const trunks=new T.InstancedMesh(trunkGeo,trunkMat,rows.length),leaves=new T.InstancedMesh(leafGeo,leafMat,rows.length*4),shadows=new T.InstancedMesh(shadowPlane,shadowMaterial,rows.length);
    rows.forEach((q,i)=>{dummy.position.set(q.p.x,q.h*.28,q.p.z);dummy.scale.set(1,q.h*.56,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
      for(let j=0;j<4;j++){const a=j*Math.PI*2/3;dummy.position.set(q.p.x+(j?Math.cos(a)*q.r*.5:0),q.h*(j?.63:.82),q.p.z+(j?Math.sin(a)*q.r*.5:0));dummy.scale.set(q.r*(j?.83:.7),q.h*.24,q.r*(j?.9:.74));dummy.rotation.set(random()*.3,q.rotation,random()*.2);dummy.updateMatrix();leaves.setMatrixAt(i*4+j,dummy.matrix);color.setHSL(.23+random()*.055,.24+random()*.15,.21+random()*.12);leaves.setColorAt(i*4+j,color);}
    });rows.forEach((q,i)=>{dummy.position.set(q.p.x,-.13,q.p.z);dummy.scale.set(q.r*3,q.r*3,1);dummy.rotation.set(-Math.PI/2,0,0);dummy.updateMatrix();shadows.setMatrixAt(i,dummy.matrix);});shadows.computeBoundingSphere();trunks.receiveShadow=leaves.receiveShadow=true;leaves.castShadow=!mobile;root.add(trunks,leaves,shadows);canopies.push(leaves);
    for(let type=0;type<3;type++){if(!treeMaterials[type])continue;const selected=rows.filter((_,i)=>i%3===type);if(!selected.length)continue;const cards=new T.InstancedMesh(treePlane,treeMaterials[type],selected.length*2);selected.forEach((q,i)=>{for(let j=0;j<2;j++){dummy.position.set(q.p.x,q.h/2,q.p.z);dummy.scale.set(q.h*[.595,1.026,.509][type],q.h,1);dummy.rotation.set(0,q.rotation+j*Math.PI/2,0);dummy.updateMatrix();cards.setMatrixAt(i*2+j,dummy.matrix);}});cards.receiveShadow=true;cards.castShadow=false;cards.computeBoundingSphere();root.add(cards);}
  }

  // Paddock hospitality: glazing, upper galleries and roof fins along mapped
  // pit-lane stations, aligned exactly like the existing garage frontage.
  if(pitSamples.length>230)for(let i=100;i<225;i+=8){const p=pitSamples[i],t=pitSamples[i+2].clone().sub(pitSamples[i-2]).normalize(),n=new T.Vector3(-t.z,0,t.x),angle=Math.atan2(t.x,t.z),q=p.clone().addScaledVector(n,-10);
    box(10.6,.28,15,q.x,5,q.z,white,angle);box(9.8,3.2,14.4,q.x,6.7,q.z,glass,angle);box(11.5,.4,15,q.x,8.5,q.z,white,angle);
    for(const d of [-6,-3,0,3,6]){const a=q.clone().addScaledVector(t,d);box(10.8,.15,.15,a.x,7.3,a.z,white,angle);}
  }
  // Windows and roof trim follow the actual building footprints instead of
  // placing unrelated blocks around the circuit.
  map.layers.buildings.filter(w=>w.name!=='Biosphère').forEach((way,index)=>{if(way.name==='Paddocks')return;const points=way.coords.map(project),height=3.5+(index%4);for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=a.distanceTo(b);if(length<2)continue;const angle=Math.atan2(b.x-a.x,b.z-a.z);box(.14,.26,length,(a.x+b.x)/2,height+.08,(a.z+b.z)/2,white,angle);box(.15,height*.34,length*.85,(a.x+b.x)/2,height*.6,(a.z+b.z)/2,glass,angle);}});
  // Biosphere landmark at its mapped location; geodesic steel rather than a
  // solid rectangular extrusion.
  const bio=map.layers.buildings.find(w=>w.name==='Biosphère');if(bio){const p=new T.Box3().setFromPoints(bio.coords.map(project)).getCenter(new T.Vector3()),g=new T.IcosahedronGeometry(36,3),dome=new T.LineSegments(new T.WireframeGeometry(g),new T.LineBasicMaterial({color:'#c6ced1',transparent:true,opacity:.66}));dome.position.set(p.x,32,p.z);root.add(dome);box(30,9,25,p.x,4.5,p.z,white);}
  // Marshal posts, extinguishers and service equipment break up the verge.
  const orange=material('#dc6335'),blue=material('#2b6084');
  for(const u of [.085,.19,.31,.49,.65,.925]){const p=at(u,wallOffset(u)+3);box(2.6,2.4,2.4,p.x,1.2,p.z,white,heading(u));box(3,.2,2.8,p.x,2.5,p.z,blue,heading(u));box(.38,1.3,.3,p.x+1.6,.65,p.z,orange);}
  // Batches are split into geographic cells for camera-frustum culling.
  for(const [mat,items]of batches){const chunks=new Map();for(const q of items){const k=key(Math.floor(q.x/180),Math.floor(q.z/180));if(!chunks.has(k))chunks.set(k,[]);chunks.get(k).push(q);}for(const chunk of chunks.values()){const mesh=new T.InstancedMesh(boxGeometry,mat,chunk.length);chunk.forEach((q,i)=>{dummy.position.set(q.x,q.y,q.z);dummy.rotation.set(0,q.rotation,0);dummy.scale.set(q.w,q.h,q.d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,color.set(q.tint||'#ffffff'));});mesh.receiveShadow=true;mesh.castShadow=!mobile;mesh.computeBoundingSphere();root.add(mesh);}}
  root.userData.stats=stats;
  const viewDirection=new T.Vector3();
  return {root,stats,update(camera){sky.position.copy(camera.position);camera.getWorldDirection(viewDirection);const overhead=viewDirection.y<-.6||treeMaps.some(t=>!t);for(const canopy of canopies)canopy.visible=overhead;}};
}
