import * as T from '../../vendor/three.module.js';
export async function createCircuitScene({scene,renderer,map,path,tangents,normals,pitSamples,project,mats,addBox,mobile,environmentBuilder}){
const PATH_COUNT=path.length;
const ground=new T.Mesh(new T.PlaneGeometry(5000,5000),mats.grass);ground.rotation.x=-Math.PI/2;ground.position.y=-.22;ground.receiveShadow=true;scene.add(ground);
function strip(points,width,mat,y=0,closed=false){if(points.length<2)return null;const verts=[],indices=[],count=points.length;for(let i=0;i<count;i++){const previous=points[(i-1+count)%count],next=points[(i+1)%count],tangent=(i===0&&!closed?next.clone().sub(points[i]):i===count-1&&!closed?points[i].clone().sub(previous):next.clone().sub(previous)).normalize(),normal=new T.Vector3(-tangent.z,0,tangent.x),half=(typeof width==='function'?width(i):width)/2;verts.push(points[i].x-normal.x*half,y,points[i].z-normal.z*half,points[i].x+normal.x*half,y,points[i].z+normal.z*half);if(i>0){const j=i*2;indices.push(j-2,j-1,j,j-1,j+1,j)}}if(closed){const j=count*2;verts.push(...verts.slice(0,6));indices.push(j-2,j-1,j,j-1,j+1,j)}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(verts,3));geometry.setIndex(indices);geometry.computeVertexNormals();const mesh=new T.Mesh(geometry,mat);mesh.receiveShadow=true;scene.add(mesh);return mesh}
const wayPoints=way=>way.coords.map(project);
function shapeWay(way,mat,height=0,y=-.1){if(!way.closed||way.coords.length<4)return null;const pts=wayPoints(way),shape=new T.Shape();shape.moveTo(pts[0].x,-pts[0].z);for(let i=1;i<pts.length;i++)shape.lineTo(pts[i].x,-pts[i].z);const geometry=height>0?new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false}):new T.ShapeGeometry(shape),mesh=new T.Mesh(geometry,mat);mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.receiveShadow=true;mesh.castShadow=height>0&&!mobile;scene.add(mesh);return mesh}
map.layers.water.forEach(w=>shapeWay(w,mats.water,0,-.12));map.layers.woods.forEach(w=>shapeWay(w,mats.darkGrass,0,-.16));map.layers.roads.filter(w=>w.name&&/Avenue|Autoroute|Chemin Macdonald|Pont/.test(w.name)).forEach(w=>strip(wayPoints(w),/Avenue|Autoroute/.test(w.name)?8:4.5,mats.service,-.07,w.closed));
strip(path,16.8,mats.concrete,-.025,true);strip(path,14.2,mats.asphalt,.015,true);
const finishLine=addBox(13.8,.035,.62,path[0].x,.075,path[0].z,mats.white,scene,false);finishLine.rotation.y=Math.atan2(tangents[0].x,tangents[0].z);
const kerbGeometry=new T.BoxGeometry(1.45,.12,2.2);for(let i=16;i<PATH_COUNT-16;i+=16){const a=tangents[(i-14+PATH_COUNT)%PATH_COUNT],b=tangents[(i+14)%PATH_COUNT],turn=a.x*b.z-a.z*b.x,severity=1-a.dot(b);if(severity<.0055)continue;const side=turn>0?1:-1;for(let k=-2;k<=2;k++){const index=(i+k*9+PATH_COUNT)%PATH_COUNT,mesh=new T.Mesh(kerbGeometry,(k&1)?mats.white:mats.red);mesh.position.copy(path[index]).addScaledVector(normals[index],side*7.15);mesh.position.y=.1;mesh.rotation.y=Math.atan2(tangents[index].x,tangents[index].z);mesh.receiveShadow=true;scene.add(mesh)}}

if(pitSamples.length){
// Keep the apron clear of the racing asphalt where the pit lane merges and
// runs alongside the circuit. Overlapping surfaces flashed in Follow view.
const pitClearance=pitSamples.map(p=>{let nearest=Infinity;for(let j=0;j<PATH_COUNT;j+=4)nearest=Math.min(nearest,p.distanceToSquared(path[j]));return Math.sqrt(nearest)});
strip(pitSamples,i=>Math.min(8.2,Math.max(.02,2*(pitClearance[i]-7.38))),mats.concrete,-.005);
strip(pitSamples,i=>Math.min(6.8,Math.max(.02,2*(pitClearance[i]-7.13))),mats.asphalt,.045);
for(let i=98;i<225;i+=11){const p=pitSamples[i],t=pitSamples[i+2].clone().sub(pitSamples[i-2]).normalize(),n=new T.Vector3(-t.z,0,t.x),box=addBox(3.1,.04,.13,p.x-n.x*1.65,.095,p.z-n.z*1.65,mats.white,scene,false);box.rotation.y=Math.atan2(t.x,t.z)}for(let i=94;i<230;i+=2){const p=pitSamples[i],t=pitSamples[i+2].clone().sub(pitSamples[i-2]).normalize(),n=new T.Vector3(-t.z,0,t.x),wall=addBox(.34,1.05,4.7,p.x+n.x*4.12,.56,p.z+n.z*4.12,mats.yellow);wall.rotation.y=Math.atan2(t.x,t.z)}for(let i=98;i<222;i+=5){const p=pitSamples[i],t=pitSamples[i+2].clone().sub(pitSamples[i-2]).normalize(),n=new T.Vector3(-t.z,0,t.x),rotation=Math.atan2(t.x,t.z),garage=addBox(10.2,4.6,10.4,p.x-n.x*9.7,2.3,p.z-n.z*9.7,mats.garage),door=addBox(.28,3.25,8.4,p.x-n.x*4.48,1.65,p.z-n.z*4.48,mats.black,scene,false),roof=addBox(10.8,.35,10.8,p.x-n.x*9.7,4.72,p.z-n.z*9.7,mats.roof);garage.rotation.y=door.rotation.y=roof.rotation.y=rotation}const gp=path[0],gt=tangents[0],gantry=new T.Group();addBox(21,.5,.5,0,5.4,0,mats.black,gantry);addBox(.45,5.4,.45,-9.4,2.7,0,mats.black,gantry);addBox(.45,5.4,.45,9.4,2.7,0,mats.black,gantry);gantry.position.copy(gp);gantry.rotation.y=Math.atan2(gt.x,gt.z);scene.add(gantry)}
map.layers.buildings.filter(w=>w.name!=='Biosphère').forEach((w,i)=>shapeWay(w,i%5===0?mats.glass:mats.building,w.name==='Paddocks'?8:3.5+(i%4),0));

const environment=await environmentBuilder({scene,renderer,map,path,normals,pitSamples,project,mats,mobile});


return environment;
}
