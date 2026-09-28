import {sampleRacingOffset} from './racing-line.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,f)=>a+(b-a)*f;
export function createRacingRoutes({path,normals,drivers,lineData,trackConfig,lateralAtDistance,mobile}){
const PATH_COUNT=path.length,MOBILE=mobile;
// Optimised in track space: hold an outside approach, cross toward the apex,
// and open the exit. The former zero-curvature offset at each apex inherited
// the kerb's tight radius; this route instead minimises geometric curvature
// across complete linked corners, with a separate late-apex hairpin target.
if(lineData.formatVersion!==1||lineData.pathSamples!==PATH_COUNT||lineData.trackPhase!==trackConfig.trackPhase||!Array.isArray(lineData.offsets)||lineData.offsets.length<4||!lineData.offsets.every(Number.isFinite))throw Error('Racing line does not match this circuit');
const baseOffsetAt=u=>sampleRacingOffset(lineData.offsets,u);
// Keep the measured difference between Russell and Antonelli, but only after a
// long spatial filter. This preserves distinct lines without reintroducing the
// sparse GPS kinks that the corner spline is designed to remove.
const driverDelta=[new Float32Array(PATH_COUNT),new Float32Array(PATH_COUNT)];
for(let i=0;i<PATH_COUNT;i++){const u=i/PATH_COUNT,a=lateralAtDistance(drivers[0],u),b=lateralAtDistance(drivers[1],u),half=clamp((a-b)*.5,-1.25,1.25);driverDelta[0][i]=half;driverDelta[1][i]=-half}
for(let k=0;k<2;k++)for(let pass=0;pass<8;pass++){const source=driverDelta[k].slice();for(let i=0;i<PATH_COUNT;i++){let total=0,weight=0;for(let d=-16;d<=16;d+=4){const w=17-Math.abs(d);total+=source[(i+d+PATH_COUNT)%PATH_COUNT]*w;weight+=w}driverDelta[k][i]=total/weight}}
const offsets=[new Float32Array(PATH_COUNT),new Float32Array(PATH_COUNT)];
for(let i=0;i<PATH_COUNT;i++){const base=baseOffsetAt(i/PATH_COUNT);for(let k=0;k<2;k++)offsets[k][i]=clamp(base+driverDelta[k][i]*.42,-5.3,5.3)}
const raceLines=[new Float32Array(PATH_COUNT*3),new Float32Array(PATH_COUNT*3)];
for(let k=0;k<2;k++)for(let i=0;i<PATH_COUNT;i++){const p=path[i],n=normals[i],offset=offsets[k][i],j=i*3;raceLines[k][j]=p.x+n.x*offset;raceLines[k][j+1]=.1;raceLines[k][j+2]=p.z+n.z*offset}
// Lateral offsets shorten the inside of corners. Centreline-spaced indices
// therefore moved cars at half speed at some apexes. Re-space the finished
// racing routes by their own arc length, including the closing segment.
// Cars, camera, steering and trails all consume this same distance table.
for(const line of raceLines){
  const source=line.slice(),distance=new Float64Array(PATH_COUNT+1);
  for(let i=0;i<PATH_COUNT;i++){const j=(i+1)%PATH_COUNT;distance[i+1]=distance[i]+Math.hypot(source[j*3]-source[i*3],source[j*3+2]-source[i*3+2]);}
  const step=distance[PATH_COUNT]/PATH_COUNT;let segment=0;
  for(let i=0;i<PATH_COUNT;i++){const target=i*step;while(segment<PATH_COUNT-1&&distance[segment+1]<target)segment++;const next=(segment+1)%PATH_COUNT,f=(target-distance[segment])/(distance[segment+1]-distance[segment]||1);for(let axis=0;axis<3;axis++)line[i*3+axis]=lerp(source[segment*3+axis],source[next*3+axis],f);}
}
const sampleRaceInto=(k,u,position,tangent)=>{const scaled=((u%1)+1)%1*PATH_COUNT,i=Math.floor(scaled)%PATH_COUNT,j=(i+1)%PATH_COUNT,f=scaled-Math.floor(scaled),line=raceLines[k],ia=i*3,ja=j*3;position.set(lerp(line[ia],line[ja],f),0,lerp(line[ia+2],line[ja+2],f));const look=MOBILE?18:14,behind=(i-look+PATH_COUNT)%PATH_COUNT*3,ahead=(i+look)%PATH_COUNT*3;tangent.set(line[ahead]-line[behind],0,line[ahead+2]-line[behind+2]).normalize()};
const pathStep=path[0].distanceTo(path[1]),steeringAt=(k,u)=>{const i=Math.floor(((u%1)+1)%1*PATH_COUNT),look=18,line=raceLines[k],before=(i-look+PATH_COUNT)%PATH_COUNT*3,mid=i*3,after=(i+look)%PATH_COUNT*3,ax=line[mid]-line[before],az=line[mid+2]-line[before+2],bx=line[after]-line[mid],bz=line[after+2]-line[mid+2],al=Math.hypot(ax,az)||1,bl=Math.hypot(bx,bz)||1,cross=(ax/al)*(bz/bl)-(az/al)*(bx/bl),dot=clamp((ax*bx+az*bz)/(al*bl),-1,1),curvature=Math.atan2(cross,dot)/(look*2*pathStep),roadAngle=Math.atan(3.6*curvature);return clamp(roadAngle*12*180/Math.PI,-210,210)};

return {raceLines,offsets,sampleRaceInto,steeringAt};
}
