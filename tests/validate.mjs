import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {validateLap} from '../src/player/catalog.js';
import {createTrackGeometry} from '../src/renderer/track.js';
import {createTelemetrySampler} from '../src/player/telemetry.js';
import {createRacingRoutes} from '../src/player/routes.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=read('catalog.json'),registry=read(catalog.cars);
for(const [id,car] of Object.entries(registry.cars)){
 const [team,year]=id.split(/-(?=20\d\d$)/);
 assert.match(car.livery,new RegExp(`/liveries/${year}/${team}\\.js$`));
 assert(fs.existsSync(car.livery));assert(fs.existsSync(car.model));
}
assert.equal(registry.cars['ferrari-2026'].team,'Ferrari');
for(const entry of catalog.sessions){
 const session=read(entry.manifest),trackPath=catalog.tracks[session.trackId],config=read(trackPath),dir=path.dirname(trackPath);
 const map=read(path.join(dir,config.map)),lineData=read(path.join(dir,config.racingLine));
 const drivers=session.laps.map(p=>read(path.join(path.dirname(entry.manifest),p)));
 for(const d of drivers){validateLap(d);const car=registry.cars[d.carId];assert(car);assert(fs.existsSync(car.model));assert(fs.existsSync(car.livery));}
 const geometry=createTrackGeometry(map,config),trackLength=geometry.path.reduce((s,p,i)=>s+p.distanceTo(geometry.path[(i+1)%geometry.PATH_COUNT]),0);
 const sampler=createTelemetrySampler(trackLength),routes=createRacingRoutes({...geometry,drivers,lineData,trackConfig:config,lateralAtDistance:sampler.lateralAtDistance,mobile:false});
 for(const d of drivers){let previous=-1;for(let t=0;t<d.duration;t+=.02){const state=sampler.sampleState(d,t);assert(state.u>=previous-1e-9);assert(state.u>=0&&state.u<=1);assert(Math.abs(sampler.timeAtDistance(d,state.u)-t)<.002);previous=state.u;}assert.equal(sampler.sampleState(d,d.duration).u,1);}
 for(const line of routes.raceLines){assert(line.every(Number.isFinite));let min=Infinity,max=0;for(let i=0;i<config.pathSamples;i++){const j=(i+1)%config.pathSamples;const step=Math.hypot(line[j*3]-line[i*3],line[j*3+2]-line[i*3+2]);min=Math.min(min,step);max=Math.max(max,step);}assert(min/max>.98,'Route spacing must not cause apex crawls');}
 const expected=session.year===2025?[70.899,71.059]:[72.578,72.646];assert.deepEqual(drivers.map(d=>d.duration),expected);
 console.log(`${entry.id}: valid laps, cars, monotonic interpolation, distance/time round trips and uniformly spaced routes`);
}
