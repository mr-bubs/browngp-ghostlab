// Import a reviewed session specification. Raw provider responses stay in the
// ignored cache; normalized laps use the same eight columns as the checkpoint.
// Usage: node tools/import-openf1.mjs tools/sessions/canada-2025-q3.json [cache]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createTrackGeometry} from '../src/renderer/track.js';
import {validateLap} from '../src/player/catalog.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const spec=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const cache=path.resolve(process.argv[3]||path.join(root,'.cache/openf1',String(spec.session_key)));fs.mkdirSync(cache,{recursive:true});
const trackConfig=JSON.parse(fs.readFileSync(path.join(root,spec.track),'utf8'));
const map=JSON.parse(fs.readFileSync(path.join(root,path.dirname(spec.track),trackConfig.map),'utf8'));
const {path:points,normals,PATH_COUNT}=createTrackGeometry(map,trackConfig);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const interpolate=(rows,t,key)=>{if(t<=rows[0].t)return rows[0][key];if(t>=rows[rows.length-1].t)return rows[rows.length-1][key];let lo=0,hi=rows.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(rows[mid].t<=t)lo=mid;else hi=mid;}const f=(t-rows[lo].t)/(rows[hi].t-rows[lo].t);return rows[lo][key]+(rows[hi][key]-rows[lo][key])*f;};
async function get(endpoint,driver,start,end){
  const file=path.join(cache,`${endpoint}-${driver}.json`);
  if(fs.existsSync(file))return JSON.parse(fs.readFileSync(file,'utf8'));
  const url=new URL('https://api.openf1.org/v1/'+endpoint);url.search=new URLSearchParams({session_key:spec.session_key,driver_number:driver,'date>':new Date(start-1000).toISOString(),'date<':new Date(end+1000).toISOString()});
  const response=await fetch(url);if(!response.ok)throw Error('OpenF1 returned '+response.status);
  const rows=await response.json();fs.writeFileSync(file,JSON.stringify(rows));return rows;
}
const lapPaths=[];
for(const driver of spec.drivers){
  const start=Date.parse(driver.start),end=start+driver.duration*1000;
  const raw=await get('car_data',driver.driver_number,start,end);
  const locations=await get('location',driver.driver_number,start,end);
  const source=raw.map(r=>({t:(Date.parse(r.date)-start)/1000,speed:r.speed,throttle:r.throttle,brake:r.brake,gear:r.n_gear,rpm:r.rpm})).sort((a,b)=>a.t-b.t).filter((r,i,a)=>!i||r.t>a[i-1].t);
  if(source.length<100||source[0].t>0.5||source[source.length-1].t<driver.duration-.5)throw Error('Insufficient telemetry coverage');
  const boundary=t=>{const row={t};for(const key of ['speed','throttle','rpm'])row[key]=interpolate(source,t,key);const nearest=source.reduce((a,b)=>Math.abs(a.t-t)<Math.abs(b.t-t)?a:b);row.brake=nearest.brake;row.gear=nearest.gear;return row;};
  const rows=[boundary(0),...source.filter(r=>r.t>0&&r.t<driver.duration),boundary(driver.duration)];
  let distance=0;rows[0].u=0;
  for(let i=1;i<rows.length;i++){distance+=(rows[i-1].speed+rows[i].speed)/7.2*(rows[i].t-rows[i-1].t);rows[i].u=distance;}
  for(const row of rows)row.u/=distance;
  const loc=locations.map(r=>({x:r.x,y:r.y,t:(Date.parse(r.date)-start)/1000})).filter(r=>r.t>=0&&r.t<=driver.duration);
  if(loc.length<100)throw Error('Insufficient location coverage');
  function fit(flip){
    const pairs=loc.map(r=>{const u=interpolate(rows,r.t,'u'),i=Math.min(PATH_COUNT-1,Math.floor(u*PATH_COUNT));return {...r,u,i,sx:r.x,sy:r.y*flip,tx:points[i].x,ty:points[i].z};});
    const n=pairs.length,avg=key=>pairs.reduce((s,p)=>s+p[key],0)/n,mx=avg('sx'),my=avg('sy'),tx=avg('tx'),ty=avg('ty');
    let re=0,im=0,den=0;for(const p of pairs){const sx=p.sx-mx,sy=p.sy-my;re+=(p.tx-tx)*sx+(p.ty-ty)*sy;im+=(p.ty-ty)*sx-(p.tx-tx)*sy;den+=sx*sx+sy*sy;}
    const ar=re/den,ai=im/den,ox=tx-ar*mx+ai*my,oy=ty-ai*mx-ar*my;let sse=0;
    const trace=pairs.map(p=>{const dx=ar*p.sx-ai*p.sy+ox-p.tx,dy=ai*p.sx+ar*p.sy+oy-p.ty;sse+=dx*dx+dy*dy;return{t:p.t,lateral:dx*normals[p.i].x+dy*normals[p.i].z};});
    return {rmse:Math.sqrt(sse/n),trace};
  }
  const alignment=[fit(1),fit(-1)].sort((a,b)=>a.rmse-b.rmse)[0];
  const smoothed=alignment.trace.map((r,i,a)=>{const near=a.slice(Math.max(0,i-4),i+5);return {t:r.t,lateral:clamp(near.reduce((s,v)=>s+v.lateral,0)/near.length,-4.6,4.6)};});
  const lap={...driver,track_phase:trackConfig.trackPhase,track_direction:1,alignment_rmse_m:+alignment.rmse.toFixed(2),integrated_distance_m:+distance.toFixed(2),position_quality:'Derived: speed-integrated distance and circuit-aligned location, not measured tyre positions.',samples:rows.map(r=>[+r.t.toFixed(3),+r.u.toFixed(6),+r.speed.toFixed(3),+clamp(r.throttle,0,100).toFixed(3),r.brake,r.gear,Math.round(r.rpm),+interpolate(smoothed,r.t,'lateral').toFixed(3)])};
  validateLap(lap);const name='laps/'+driver.code.toLowerCase()+'.json';const out=path.join(root,spec.output,name);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(lap)+'\n');lapPaths.push(name);
  console.log(`${driver.code}: ${rows.length} samples, ${driver.duration}s, ${distance.toFixed(1)}m integrated, ${alignment.rmse.toFixed(1)}m alignment RMSE`);
}
const {drivers,track,output,...session}=spec;
session.laps=lapPaths;session.sample_schema=['seconds','lap_fraction','speed_kph','throttle_pct','brake','gear','rpm','lateral_m'];
fs.writeFileSync(path.join(root,output,'session.json'),JSON.stringify(session,null,2)+'\n');
