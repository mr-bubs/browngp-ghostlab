import * as T from '../../vendor/three.module.js';
import {loadComparison} from './catalog.js';
import {createTrackGeometry} from '../renderer/track.js';
import {createCircuitScene} from '../renderer/circuit-scene.js';
import {createCars} from '../renderer/cars.js';
import {createTelemetrySampler} from './telemetry.js';
import {createRacingRoutes} from './routes.js';
import {populateSessionUI} from '../ui/session.js';
const $=id=>document.getElementById(id),MOBILE=matchMedia('(max-width: 800px)').matches;
let playing=false,time=0,rate=1.5,mode='follow',zoom=55,ready=false,cameraPrimed=false,lastFrame=performance.now();
const fmt=t=>Math.floor(t/60)+':'+(t%60).toFixed(3).padStart(6,'0'),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,f)=>a+(b-a)*f,smoothstep=(a,b,v)=>{const x=clamp((v-a)/(b-a),0,1);return x*x*(3-2*x)};
const dampAngle=(a,b,n)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*n;

async function boot(){
const {catalog,entry,lapData,trackConfig,map,lineData,registry,assetURL,environmentBuilder}=await loadComparison();
const drivers=lapData.drivers,MAX_TIME=Math.max(...drivers.map(d=>d.duration));
populateSessionUI({catalog,entry,lapData,trackConfig});
const {path,tangents,normals,pitSamples,project,PATH_COUNT}=createTrackGeometry(map,trackConfig);
const scene=new T.Scene();scene.background=new T.Color('#78908a');scene.fog=new T.FogExp2('#81928a',.00052);const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance',stencil:true});renderer.setPixelRatio(Math.min(devicePixelRatio,MOBILE?1.15:1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;$('scene').appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(42,1,.9,7000);scene.add(new T.HemisphereLight(0xe8f5ff,0x59634b,1.65));const sun=new T.DirectionalLight(0xfff1dc,2.8);sun.position.set(-100,190,70);sun.castShadow=true;sun.shadow.mapSize.set(MOBILE?1024:2048,MOBILE?1024:2048);Object.assign(sun.shadow.camera,{left:-150,right:150,top:150,bottom:-150,near:1,far:500});sun.shadow.bias=-.0002;scene.add(sun,sun.target);
const material=(color,roughness=.86,extras={})=>new T.MeshStandardMaterial({color,roughness,...extras}),mats={grass:material('#6b8054'),darkGrass:material('#526e48'),asphalt:material('#202426',.97),service:material('#777a74'),concrete:material('#aaa9a0'),white:material('#e9e7de'),red:material('#a72e2b'),yellow:material('#f1c40f',.56),water:material('#416b73',.36,{metalness:.05}),barrier:material('#c7c8c3',.55,{metalness:.35}),building:material('#72777a'),garage:material('#555b5e',.7),roof:material('#a3a5a3',.65),glass:material('#3e5963',.18,{metalness:.25}),black:material('#0b1012',.48),carbon:material('#171c1f',.38,{metalness:.34})};
const addBox=(w,h,d,x,y,z,mat,parent=scene,shadows=!MOBILE)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=shadows;mesh.receiveShadow=shadows;parent.add(mesh);return mesh};
const environment=await createCircuitScene({scene,renderer,map,path,tangents,normals,pitSamples,project,mats,addBox,mobile:MOBILE,environmentBuilder});
const cars=await createCars({scene,renderer,drivers,registry,assetURL}),traces=[0,1].map(k=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(241*3),3));g.setAttribute('color',new T.BufferAttribute(new Float32Array(241*3),3));const line=new T.Line(g,new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:k?.88:.98}));line.frustumCulled=false;scene.add(line);return line});
// Measured speed controls motion *within* each position interval. Cubic
// Hermite interpolation preserves both timestamped distance anchors and lap
// duration; monotone slope limiting prevents reversing at sparse samples.
const trackLength=path.reduce((sum,p,i)=>sum+p.distanceTo(path[(i+1)%PATH_COUNT]),0);
const {sampleState,timeAtDistance,inputAtDistance,lateralAtDistance}=createTelemetrySampler(trackLength);
const {raceLines,offsets,sampleRaceInto,steeringAt}=createRacingRoutes({path,normals,drivers,lineData,trackConfig,lateralAtDistance,mobile:MOBILE});
const cornerZones=trackConfig.cornerZones;
const minimumSpeed=(driver,zone)=>{let min=Infinity;for(const sample of driver.samples)if(sample[1]>=zone.start&&sample[1]<=zone.end)min=Math.min(min,sample[2]);return Number.isFinite(min)?Math.round(min):0};
const cornerStats=cornerZones.map(zone=>({...zone,speeds:drivers.map(driver=>minimumSpeed(driver,zone))}));
const cornerAt=u=>{const active=cornerStats.find(c=>u>=c.start&&u<=c.end);if(active)return{corner:active,active:true};return{corner:cornerStats.find(c=>c.start>u)||cornerStats[0],active:false}};
const states=[{position:new T.Vector3(),tangent:new T.Vector3()},{position:new T.Vector3(),tangent:new T.Vector3()}],telemetryStates=[{},{}],beforeStates=[{},{}],afterStates=[{},{}],trailInputs=[{},{}],us=new Float64Array(2),steeringValues=new Float32Array(2),lastGears=[null,null],shiftUntil=[0,0],shiftDirections=['',''];
const bounds=new T.Box3().setFromPoints(path),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),mini=$('mini').getContext('2d'),miniScale=150/Math.max(size.x,size.z),miniYScale=190/Math.max(size.x,size.z),miniTrack=new Path2D(),currentFocus=new T.Vector3(),currentUp=new T.Vector3(0,1,0),desiredCamera=new T.Vector3(),focus=new T.Vector3(),cameraTangent=new T.Vector3(),desiredUp=new T.Vector3(),desiredFocus=new T.Vector3(),labelPoint=new T.Vector3();
const onboardLook=new T.Vector3(),onboardTangent=new T.Vector3(),onboardNormal=new T.Vector3();
for(let i=0;i<path.length;i+=14){const x=90+(path[i].x-center.x)*miniScale,y=110+(path[i].z-center.z)*miniYScale;i?miniTrack.lineTo(x,y):miniTrack.moveTo(x,y)}miniTrack.closePath();
function resize(){const el=$('scene');renderer.setSize(el.clientWidth,el.clientHeight,false);camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();if(ready)render(0,true)}new ResizeObserver(resize).observe($('scene'));resize();
let lastHud=-1;
function render(dt=0,snap=false){
  for(let k=0;k<2;k++){
    const telemetry=sampleState(drivers[k],time,telemetryStates[k]);us[k]=telemetry.u;sampleRaceInto(k,Math.min(us[k],.999999),states[k].position,states[k].tangent);steeringValues[k]=steeringAt(k,us[k]);
    const before=sampleState(drivers[k],Math.max(0,time-.14),beforeStates[k]),after=sampleState(drivers[k],Math.min(drivers[k].duration,time+.14),afterStates[k]),acceleration=(after.speed-before.speed)/.28,car=cars[k],target=Math.atan2(states[k].tangent.x,states[k].tangent.z),loadAmount=snap?1:1-Math.exp(-dt*9),pitchTarget=clamp(-acceleration*.00048,-.03,.045)+(telemetry.brake?.007:0),rollTarget=clamp(-steeringValues[k]/210*.024,-.024,.024);
    car.group.position.copy(states[k].position);car.group.position.y=.1-clamp(Math.abs(acceleration)*.00008,0,.016);car.group.rotation.y=snap?target:dampAngle(car.group.rotation.y,target,1-Math.exp(-dt*18));car.group.rotation.x=lerp(car.group.rotation.x,pitchTarget,loadAmount);car.group.rotation.z=lerp(car.group.rotation.z,rollTarget,loadAmount);
    if(lastGears[k]!==null&&telemetry.gear!==lastGears[k]&&playing&&!snap){shiftDirections[k]=telemetry.gear>lastGears[k]?'↑':'↓';shiftUntil[k]=performance.now()+260}lastGears[k]=telemetry.gear;
    const positionAttribute=traces[k].geometry.attributes.position,colorAttribute=traces[k].geometry.attributes.color,line=raceLines[k];
    for(let j=0;j<241;j++){const u=Math.max(0,us[k]-(240-j)*.00017),index=Math.min(PATH_COUNT-1,Math.floor(u*PATH_COUNT))*3,input=inputAtDistance(drivers[k],u,trailInputs[k]);positionAttribute.setXYZ(j,line[index],.2,line[index+2]);let r,g,b;if(input.brake){r=1;g=.17;b=.27}else{const power=clamp(input.throttle/100,0,1);r=lerp(1,.2,power);g=lerp(.67,.96,power);b=lerp(.16,.58,power)}const brightness=k?.88:1;colorAttribute.setXYZ(j,r*brightness,g*brightness,b*brightness)}
    positionAttribute.needsUpdate=colorAttribute.needsUpdate=true;traces[k].visible=$('trails').checked;
  }
  focus.copy(states[0].position).lerp(states[1].position,.5);cameraTangent.copy(states[0].tangent).lerp(states[1].tangent,.5).normalize();desiredUp.set(0,1,0);desiredFocus.copy(focus);
  const cockpitMode=mode==='helmet'||mode==='onboard';
  if(mode==='helmet'){sampleRaceInto(1,Math.min(us[1]+.0065,.999999),onboardLook,onboardTangent);desiredCamera.copy(states[1].position).addScaledVector(states[1].tangent,-.55);desiredCamera.y+=1.34;desiredFocus.copy(onboardLook);desiredFocus.y=.62-cars[1].group.rotation.x*5;onboardNormal.set(-states[1].tangent.z,0,states[1].tangent.x);desiredUp.set(onboardNormal.x*-cars[1].group.rotation.z,1,onboardNormal.z*-cars[1].group.rotation.z).normalize()}
  else if(mode==='onboard'){// Mount the T-cam above the model's airbox and rear wing. The former 2.18 m position intersected car geometry when it pitched or turned.
    sampleRaceInto(1,Math.min(us[1]+.0055,.999999),onboardLook,onboardTangent);desiredCamera.copy(states[1].position).addScaledVector(states[1].tangent,-.82);desiredCamera.y+=3.05;desiredFocus.copy(onboardLook);desiredFocus.y=desiredCamera.y-.034*desiredCamera.distanceTo(onboardLook)-cars[1].group.rotation.x*3.5;onboardNormal.set(-states[1].tangent.z,0,states[1].tangent.x);desiredUp.set(onboardNormal.x*-cars[1].group.rotation.z*.58,1,onboardNormal.z*-cars[1].group.rotation.z*.58).normalize()}
  else if(mode==='overhead'){desiredCamera.copy(focus);desiredCamera.y+=zoom*75/55;desiredUp.set(cameraTangent.x,0,cameraTangent.z)}
  else{desiredCamera.copy(focus).addScaledVector(cameraTangent,-zoom*.5);desiredCamera.x+=zoom*.13;desiredCamera.y+=zoom*.88;desiredFocus.addScaledVector(cameraTangent,zoom*.15)}
  const amount=cockpitMode||snap||!cameraPrimed?1:1-Math.exp(-dt*(mode==='follow'?5.8:7.5));camera.position.lerp(desiredCamera,amount);currentFocus.lerp(desiredFocus,amount);currentUp.lerp(desiredUp,amount).normalize();camera.up.copy(currentUp);camera.lookAt(currentFocus);cameraPrimed=true;sun.position.set(focus.x-100,focus.y+190,focus.z+70);sun.target.position.copy(focus);environment.update(camera);
  // Nearby overlapping laps put P1's ghost almost on top of the P2 camera.
  // Keep its silhouette visible without filling the road with ghost bodywork.
  if(cockpitMode&&$('ghost').checked){const gap=states[0].position.distanceTo(states[1].position),opacity=lerp(.08,.48,smoothstep(10,30,gap));cars[0].materials.forEach(m=>m.opacity=opacity)}
  renderer.render(scene,camera);
  for(let k=0;k<2;k++){labelPoint.copy(states[k].position);labelPoint.y+=2.2;labelPoint.project(camera);const el=$(k?'tagB':'tagA'),x=(labelPoint.x*.5+.5)*$('scene').clientWidth+9,y=(-labelPoint.y*.5+.5)*$('scene').clientHeight+10;el.style.transform=`translate(${x}px,${y}px)`;el.style.display=cockpitMode?'none':'block'}
  mini.clearRect(0,0,180,220);mini.strokeStyle='#b5c4bd';mini.lineWidth=3;mini.stroke(miniTrack);for(let k=0;k<2;k++){const x=90+(states[k].position.x-center.x)*miniScale,y=110+(states[k].position.z-center.z)*miniYScale;mini.fillStyle=drivers[k].color;mini.beginPath();mini.arc(x,y,5,0,7);mini.fill()}
  if(snap||Math.abs(time-lastHud)>.035){lastHud=time;$('elapsed').textContent=fmt(time);$('seek').value=time;$('progress').textContent=Math.round(time/MAX_TIME*100)+'% / FINISH';const u=Math.min(us[0],us[1]),gap=timeAtDistance(drivers[1],u)-timeAtDistance(drivers[0],u);$('delta').innerHTML=(gap>=0?'+':'−')+Math.abs(gap).toFixed(3)+' <small>s</small>';$('leader').textContent=time===0?'Laps start together':Math.abs(gap)<.0005?'Dead even · measured':drivers[gap>=0?0:1].surname+' ahead · measured';
    for(let k=0;k<2;k++){const suffix=k?'B':'A',telemetry=telemetryStates[k],throttle=Math.round(clamp(telemetry.throttle,0,100)),braking=Boolean(telemetry.brake),wheel=steeringValues[k],gearBox=$('gearBox'+suffix),shifting=performance.now()<shiftUntil[k];$('speed'+suffix).textContent=Math.round(telemetry.speed);$('gear'+suffix).textContent=telemetry.gear;$('rpm'+suffix).textContent=telemetry.rpm.toLocaleString();$('throttle'+suffix).style.width=throttle+'%';$('brake'+suffix).style.width=braking?'100%':'0%';$('throttlePct'+suffix).textContent=throttle+'%';$('brakePct'+suffix).textContent=braking?'ON':'OFF';$('rev'+suffix).style.width=clamp((telemetry.rpm-7000)/55,0,100)+'%';$('wheel'+suffix).style.transform=`rotate(${wheel}deg)`;$('steer'+suffix).textContent=Math.abs(wheel)<2?'CENTRE':Math.round(Math.abs(wheel))+'° '+(wheel>0?'R':'L');gearBox.classList.toggle('shift-up',shifting&&shiftDirections[k]==='↑');gearBox.classList.toggle('shift-down',shifting&&shiftDirections[k]==='↓');$('shift'+suffix).textContent=shifting?shiftDirections[k]:''}
    const ant=telemetryStates[1];$('onboardSpeed').textContent=Math.round(ant.speed);$('onboardGear').textContent=ant.gear;$('onboardWheel').style.transform=`scale(.8) rotate(${steeringValues[1]}deg)`;$('onboardThrottle').style.width=clamp(ant.throttle,0,100)+'%';$('onboardBrake').style.width=ant.brake?'100%':'0%';const current=cornerAt(us[0]),corner=current.corner,difference=corner.speeds[0]-corner.speeds[1];$('cornerState').textContent=current.active?'CURRENT CORNER':'NEXT CORNER';$('cornerName').textContent=corner.id+' · '+corner.name;$('cornerSpeedA').textContent=corner.speeds[0]||'—';$('cornerSpeedB').textContent=corner.speeds[1]||'—';$('cornerDelta').textContent=!difference?'Equal minimum speed':drivers[difference>0?0:1].surname+' +'+Math.abs(difference)+' km/h at minimum speed'}
}
function setPlay(value){playing=value;$('play').textContent=value?'Ⅱ':'▶';$('play').setAttribute('aria-label',value?'Pause replay':'Play replay')}
function applyGhost(){
  const cockpitMode=mode==='helmet'||mode==='onboard',ghostEnabled=$('ghost').checked;
  cars.forEach((car,k)=>{
    const ghosted=ghostEnabled&&(cockpitMode?k===0:k===1),hostMask=cockpitMode&&k===1,cockpitGhost=cockpitMode&&k===0;
    car.group.traverse(node=>{if(node.isMesh)node.renderOrder=hostMask?-10:cockpitGhost?10:0});
    car.materials.forEach(m=>{
      m.transparent=ghosted;m.opacity=ghosted?(cockpitMode?.48:.76):1;m.depthWrite=!ghosted;
      // In either cockpit view, P2 writes a screen-space silhouette into the
      // stencil buffer. P1 may draw only outside that silhouette, matching the
      // broadcast ghost-lap composite instead of visibly penetrating P2.
      m.stencilWrite=hostMask||cockpitGhost;
      m.stencilRef=1;
      m.stencilWriteMask=hostMask?0xff:0x00;
      m.stencilFunc=hostMask?T.AlwaysStencilFunc:cockpitGhost?T.NotEqualStencilFunc:T.AlwaysStencilFunc;
      m.stencilFail=T.KeepStencilOp;m.stencilZFail=T.KeepStencilOp;m.stencilZPass=hostMask?T.ReplaceStencilOp:T.KeepStencilOp;
      m.needsUpdate=true;
    });
  });
}
function setCameraMode(next){mode=next;cameraPrimed=false;const cockpitMode=mode==='helmet'||mode==='onboard';camera.fov=mode==='helmet'?68:mode==='onboard'?58:42;camera.near=cockpitMode ? .08 : .9;camera.updateProjectionMatrix();$('cockpitHud').classList.toggle('visible',cockpitMode);document.querySelectorAll('[data-camera]').forEach(x=>x.classList.toggle('selected',x.dataset.camera===mode));applyGhost();render(0,true)}
$('play').onclick=()=>{if(time>=MAX_TIME)time=0;setPlay(!playing)};$('restart').onclick=()=>{time=0;setPlay(false);lastGears.fill(null);render(0,true)};$('seek').max=MAX_TIME;$('seek').oninput=e=>{time=Number(e.target.value);setPlay(false);lastGears.fill(null);render(0,true)};$('speed').onchange=e=>rate=Number(e.target.value);$('zoom').oninput=e=>{zoom=Number(e.target.value);cameraPrimed=false;render(0,true)};$('trails').onchange=()=>render(0,true);$('ghost').onchange=()=>{applyGhost();render(0,true)};document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>setCameraMode(b.dataset.camera));
const replayShell=$('replayShell'),fullscreenButton=$('fullscreen');if(!replayShell.requestFullscreen)fullscreenButton.hidden=true;fullscreenButton.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await replayShell.requestFullscreen({navigationUI:'hide'})}catch{fullscreenButton.title='Fullscreen is unavailable in this browser'}};document.addEventListener('fullscreenchange',()=>{const active=document.fullscreenElement===replayShell;fullscreenButton.textContent=active?'×':'⛶';fullscreenButton.setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');setTimeout(resize,50)});document.addEventListener('visibilitychange',()=>{if(document.hidden)setPlay(false)});
function frame(now){const dt=Math.max(0,(now-lastFrame)/1000);lastFrame=now;if(playing){time=Math.min(MAX_TIME,time+dt*rate);if(time>=MAX_TIME)setPlay(false);render(Math.min(dt,.25))}requestAnimationFrame(frame)}ready=true;$('loading').hidden=true;render(0,true);requestAnimationFrame(frame);
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'set_replay_time',title:'Seek Q3 ghost replay',description:'Seek the selected Canadian GP Q3 comparison to elapsed seconds.',inputSchema:{type:'object',properties:{seconds:{type:'number',minimum:0,maximum:MAX_TIME}},required:['seconds'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:({seconds})=>{if(!Number.isFinite(seconds)||seconds<0||seconds>MAX_TIME)throw Error('Seconds must be between 0 and '+MAX_TIME);setPlay(false);time=seconds;render(0,true);return{seconds:time,measuredTelemetry:true}}})).catch(()=>{})}catch{}}
}
boot().catch(error=>{$('loading').textContent='Unable to start the 3D replay. Check that WebGL is enabled, then reload. '+error.message;console.error(error)});
