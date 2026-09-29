import * as T from '../../vendor/three.module.js';
import {createCars} from '../renderer/cars.js';
import {assetURL} from '../player/catalog.js';

const stage=document.getElementById('stage'),status=document.getElementById('status');
const selectedCar=new URL(location.href).searchParams.get('car')||'ferrari-2026';
const studies={
  'alpine-2026':{team:'Alpine',name:'BWT ALPINE F1 TEAM',model:'A526',numbers:[10,43],accent:'#ee75b6'},
  'red-bull-2026':{team:'Red Bull Racing',name:'ORACLE RED BULL RACING',model:'Red Bull 2026',numbers:[3,6],accent:'#315bdc'},
  'ferrari-2026':{team:'Ferrari',name:'SCUDERIA FERRARI',model:'SF-26',numbers:[16,44],accent:'#ee344b'},
  'mclaren-2026':{team:'McLaren',name:'McLAREN',model:'MCL40',numbers:[1,81],accent:'#ff8700'}
};
const study=studies[selectedCar]||studies['ferrari-2026'];
const carId=studies[selectedCar]?selectedCar:'ferrari-2026';
document.title=`${study.team} ${study.model} paint study | Brown GP Ghost Lab`;
document.documentElement.style.setProperty('--studio-accent',study.accent);
document.querySelector('.title p').textContent=`2026 · ${study.team.toUpperCase()}`;
document.querySelector('h1').textContent=`${study.model} paint study.`;
document.querySelector('.corner-id').replaceChildren(document.createTextNode(study.name),document.createElement('br'),Object.assign(document.createElement('small'),{textContent:'2026 · SHARED CAR MODEL'}));
document.querySelector('.viewer').setAttribute('aria-label',`Rotatable ${study.team} 2026 car preview`);
stage.setAttribute('aria-label',`Three-dimensional ${study.team} livery recreation on the Ghost Lab car model`);
document.querySelector('.note').textContent=`Paint reconstructed from the supplied ${study.model} photos. The shape remains Ghost Lab’s shared open-wheel model, so sponsor placement and ${study.team}-specific bodywork are approximate. The number is applied from driver data during playback.`;
document.querySelectorAll('[data-number]').forEach((b,i)=>{b.dataset.number=String(study.numbers[i]);b.textContent=String(study.numbers[i]);});
const scene=new T.Scene();scene.background=null;
const camera=new T.PerspectiveCamera(36,1,.1,160);
let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}
catch(error){status.textContent='3D preview unavailable: this browser could not enable WebGL.';throw error;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio,matchMedia('(max-width: 820px)').matches?1.25:1.75));
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);
scene.add(new T.HemisphereLight(0xd9edf5,0x333338,2.5));
for(const [color,power,x,y,z] of [[0xffffff,3.3,8,13,12],[0xffffff,2,-10,10,-12],[study.accent,1.4,-10,5,7]]){
  const lamp=new T.DirectionalLight(color,power);lamp.position.set(x,y,z);scene.add(lamp);
}
const floor=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshStandardMaterial({color:'#1a2022',roughness:.95}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.12;scene.add(floor);
try{
const registry=await fetch(assetURL('cars/registry.json')).then(r=>{if(!r.ok)throw Error('Car registry unavailable');return r.json()});
// The studio displays one solid car at a time. Ghost opacity belongs to the
// two-driver replay, never to the second number option in this preview.
const cars=await createCars({scene,renderer,registry,assetURL,comparisonIndex:null,drivers:study.numbers.map(driver_number=>({carId,driver_number}))});
// Catch the earlier second-driver transparency regression in every study.
for(const car of cars)for(const material of car.materials){if(material.transparent||material.opacity!==1||!material.depthWrite)throw Error('Showroom body materials must be opaque');}
cars[1].group.visible=false;status.hidden=true;
const box=new T.Box3().setFromObject(cars[0].group),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());
const target=new T.Vector3(center.x,Math.max(.8,center.y),center.z);
let azimuth=.82,elevation=.38,radius=Math.max(size.x,size.z)*1.65;
function drawCamera(){const h=Math.cos(elevation);camera.position.set(target.x+radius*Math.cos(azimuth)*h,target.y+radius*Math.sin(elevation),target.z+radius*Math.sin(azimuth)*h);camera.lookAt(target);}
function resize(){renderer.setSize(stage.clientWidth,stage.clientHeight,false);camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();drawCamera();
function setAngle(name){
  if(name==='top'){azimuth=Math.PI/2;elevation=1.56;radius=Math.max(size.x,size.z)*1.36;}
  if(name==='side'){azimuth=0;elevation=.12;radius=Math.max(size.x,size.z)*1.48;}
  if(name==='opposite'){azimuth=Math.PI;elevation=.12;radius=Math.max(size.x,size.z)*1.48;}
  if(name==='threequarter'){azimuth=.82;elevation=.38;radius=Math.max(size.x,size.z)*1.65;}
  document.querySelectorAll('[data-angle]').forEach(b=>{const active=b.dataset.angle===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});drawCamera();
}
document.querySelectorAll('[data-angle]').forEach(b=>b.addEventListener('click',()=>setAngle(b.dataset.angle)));
document.querySelectorAll('[data-number]').forEach(b=>b.addEventListener('click',()=>{
  cars.forEach((car,i)=>car.group.visible=study.numbers[i]===Number(b.dataset.number));
  document.querySelectorAll('[data-number]').forEach(option=>{const active=option===b;option.classList.toggle('active',active);option.setAttribute('aria-pressed',String(active));});
}));
const pointers=new Map();
const carLength=Math.max(size.x,size.z);
function zoom(factor){radius=T.MathUtils.clamp(radius*factor,carLength*.32,carLength*3);drawCamera();}
function span(){const [a,b]=[...pointers.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;}
stage.addEventListener('pointerdown',e=>{e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});stage.setPointerCapture(e.pointerId);});
stage.addEventListener('pointermove',e=>{
 const previous=pointers.get(e.pointerId);if(!previous)return;
 e.preventDefault();const before=span(),dx=e.clientX-previous.x,dy=e.clientY-previous.y;
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size>=2){const after=span();if(before>0&&after>0)zoom(before/after);}
 else{azimuth+=dx*.006;elevation=T.MathUtils.clamp(elevation+dy*.005,-.14,1.56);drawCamera();}
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(type,e=>pointers.delete(e.pointerId));
stage.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(e.deltaY*.001));},{passive:false});
document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{
 if(button.dataset.zoom==='reset'){radius=carLength*1.65;drawCamera();}
 else zoom(button.dataset.zoom==='in'?.8:1.25);
}));
function frame(){requestAnimationFrame(frame);renderer.render(scene,camera);}frame();
}catch(error){status.textContent=`Could not load the preview: ${error.message}`;console.error(error);}
