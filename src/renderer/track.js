import * as T from '../../vendor/three.module.js';
export function createTrackGeometry(map,config){
const trackWay=map.layers.track[0];
const origin=trackWay.coords[0],project=p=>new T.Vector3((p[0]-origin[0])*config.projection.longitudeScale,0,-(p[1]-origin[1])*config.projection.latitudeScale);let controls=trackWay.coords.map(project);if(controls[0].distanceTo(controls[controls.length-1])<1)controls.pop();
const rawCurve=new T.CatmullRomCurve3(controls,true,'centripetal',.35),PATH_COUNT=config.pathSamples;
// Three.js otherwise estimates the entire lap from only 200 arc-length samples.
// That makes equal time steps cover uneven distances around tight corners.
rawCurve.arcLengthDivisions=PATH_COUNT*16;rawCurve.updateArcLengths();
let path=rawCurve.getSpacedPoints(PATH_COUNT);path.pop();
const pitWay=map.layers.pit[0],pitPoints=pitWay?pitWay.coords.map(project):[],pitCurve=pitPoints.length>1?new T.CatmullRomCurve3(pitPoints,false,'centripetal'):null,pitSamples=pitCurve?pitCurve.getSpacedPoints(320):[];
// OSM ways begin at arbitrary nodes. Anchor lap zero to the real start/finish
// position beside the middle of the pit complex instead.
if(pitSamples.length){const startTarget=pitSamples[config.pitStartAnchor];let startIndex=0,startDistance=Infinity;for(let i=0;i<path.length;i++){const distance=path[i].distanceToSquared(startTarget);if(distance<startDistance){startDistance=distance;startIndex=i}}path=path.slice(startIndex).concat(path.slice(0,startIndex))}
// OpenF1's lap timestamp pins the real start/finish 2.2% beyond the old
// pit-complex estimate. Rotate the immutable equal-distance table once so lap
// zero, the painted line and both measured traces share the same origin.
const phaseIndex=Math.round(config.trackPhase*PATH_COUNT);if(phaseIndex)path=path.slice(phaseIndex).concat(path.slice(0,phaseIndex));
const tangents=path.map((p,i)=>path[(i+3)%PATH_COUNT].clone().sub(path[(i-3+PATH_COUNT)%PATH_COUNT]).normalize()),normals=tangents.map(t=>new T.Vector3(-t.z,0,t.x));
// Every consumer reads the same immutable equal-distance table. The hot loop writes
// into reused vectors, preventing the garbage-collection pauses seen in V2.
const sampleInto=(u,lateral,position,tangent)=>{const scaled=((u%1)+1)%1*PATH_COUNT,i=Math.floor(scaled)%PATH_COUNT,j=(i+1)%PATH_COUNT,f=scaled-Math.floor(scaled);position.copy(path[i]).lerp(path[j],f);tangent.copy(tangents[i]).lerp(tangents[j],f).normalize();position.x+=-tangent.z*lateral;position.z+=tangent.x*lateral};


return {path,tangents,normals,pitSamples,project,PATH_COUNT,sampleInto};
}
