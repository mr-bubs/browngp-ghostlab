import * as T from '../../vendor/three.module.js';
import {createCars} from '../renderer/cars.js';
import {assetURL} from '../player/catalog.js';

const stage=document.getElementById('stage'),status=document.getElementById('status');
const scene=new T.Scene();scene.background=null;
const camera=new T.PerspectiveCamera(36,1,.1,160);
const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,matchMedia('(max-width: 820px)').matches?1.25:1.75));
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);
scene.add(new T.HemisphereLight(0xd9edf5,0x333338,2.5));
for(const [color,power,x,y,z] of [[0xffffff,3.3,8,13,12],[0xffffff,2,-10,10,-12],[0xee344b,1.4,-10,5,7]]){
  const lamp=new T.DirectionalLight(color,power);lamp.position.set(x,y,z);scene.add(lamp);
}
const floor=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshStandardMaterial({color:'#1a2022',roughness:.95}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.12;scene.add(floor);
try{
const registry=await fetch(assetURL('cars/registry.json')).then(r=>{if(!r.ok)throw Error('Car registry unavailable');return r.json()});
// The studio displays one solid car at a time. Ghost opacity belongs to the
// two-driver replay, never to the second number option in this preview.
const cars=await createCars({scene,renderer,registry,assetURL,comparisonIndex:null,drivers:[16,44].map(driver_number=>({carId:'ferrari-2026',driver_number}))});
cars[1].group.visible=false;status.hidden=true;
const box=new T.Box3().setFromObject(cars[0].group),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());
const target=new T.Vector3(center.x,Math.max(.8,center.y),center.z);
let azimuth=.82,elevation=.38,radius=Math.max(size.x,size.z)*1.65,pointer=null;
function drawCamera(){const h=Math.cos(elevation);camera.position.set(target.x+radius*Math.cos(azimuth)*h,target.y+radius*Math.sin(elevation),target.z+radius*Math.sin(azimuth)*h);camera.lookAt(target);}
function resize(){renderer.setSize(stage.clientWidth,stage.clientHeight,false);camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();drawCamera();
function setAngle(name){
  if(name==='top'){azimuth=.82;elevation=1.48;radius=Math.max(size.x,size.z)*1.36;}
  if(name==='side'){azimuth=1.57;elevation=.12;radius=Math.max(size.x,size.z)*1.48;}
  if(name==='threequarter'){azimuth=.82;elevation=.38;radius=Math.max(size.x,size.z)*1.65;}
  document.querySelectorAll('[data-angle]').forEach(b=>{const active=b.dataset.angle===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});drawCamera();
}
document.querySelectorAll('[data-angle]').forEach(b=>b.addEventListener('click',()=>setAngle(b.dataset.angle)));
document.querySelectorAll('[data-number]').forEach(b=>b.addEventListener('click',()=>{
  cars.forEach((car,i)=>car.group.visible=[16,44][i]===Number(b.dataset.number));
  document.querySelectorAll('[data-number]').forEach(option=>{const active=option===b;option.classList.toggle('active',active);option.setAttribute('aria-pressed',String(active));});
}));
stage.addEventListener('pointerdown',e=>{pointer={id:e.pointerId,x:e.clientX,y:e.clientY};stage.setPointerCapture(e.pointerId);});
stage.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;azimuth+=(e.clientX-pointer.x)*.006;elevation=T.MathUtils.clamp(elevation+(e.clientY-pointer.y)*.005,-.14,1.5);pointer.x=e.clientX;pointer.y=e.clientY;drawCamera();});
stage.addEventListener('pointerup',()=>{pointer=null;});stage.addEventListener('pointercancel',()=>{pointer=null;});
stage.addEventListener('wheel',e=>{e.preventDefault();radius=T.MathUtils.clamp(radius*Math.exp(e.deltaY*.001),size.x*.85,size.x*3);drawCamera();},{passive:false});
function frame(){requestAnimationFrame(frame);renderer.render(scene,camera);}frame();
}catch(error){status.textContent=`Could not load the preview: ${error.message}`;console.error(error);}
