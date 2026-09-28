import {createProjectedPaint} from '../projected-paint.js';

// Paint coordinates belong to the existing C42 mesh, before its scene rotation:
// +X is the nose, Y is across the car, -Z is up. Projection keeps the livery
// attached to the body through pitch/roll without extra floating decal meshes.
const BLACK='#101719', SILVER='#c9d0d0', TEAL='#00b9ad', WHITE='#f2f5f3';
function surface(width,height,x0,x1,y0,y1){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const c=canvas.getContext('2d');c.fillStyle=BLACK;c.fillRect(0,0,width,height);
  c.scale(width/(x1-x0),height/(y1-y0));c.translate(-x0,-y0);
  return {canvas,c};
}
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function label(c,text,x,y,size,color=WHITE,angle=0,maxWidth){
  c.save();c.translate(x,y);c.rotate(angle);if(c.liveryMirror)c.scale(c.liveryMirror,-1);c.scale(1/64,1/64);c.font=`700 ${size*64}px Arial, "DejaVu Sans", sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;
  if(maxWidth)c.fillText(text,0,0,maxWidth*64);else c.fillText(text,0,0);c.restore();
}
function star(c,x,y,r,color=WHITE,ring=false){
  c.save();c.translate(x,y);c.fillStyle=color;
  for(let i=0;i<3;i++){c.rotate(Math.PI*2/3);polygon(c,[[0,-r],[r*.12,0],[0,r*.13],[-r*.12,0]],color);}
  if(ring){c.strokeStyle=color;c.lineWidth=r*.085;c.beginPath();c.arc(0,0,r*1.05,0,Math.PI*2);c.stroke();}c.restore();
}
function microsoft(c,x,y,s){const colors=['#f35325','#81bc06','#05a6f0','#ffba08'];colors.forEach((color,i)=>{c.fillStyle=color;c.fillRect(x+(i%2)*s*.54,y+Math.floor(i/2)*s*.54,s*.46,s*.46);});}
function number(c,value,x,y,size,angle=0,color=TEAL){c.save();c.translate(x,y);c.rotate(angle);if(c.liveryMirror)c.scale(c.liveryMirror,-1);c.scale(1/64,1/64);c.font=`900 ${size*64}px Arial, "DejaVu Sans", sans-serif`;c.textAlign='center';c.textBaseline='middle';c.lineWidth=size*64*.032;c.strokeStyle=color;c.strokeText(String(value),0,0);c.restore();}

export function makeLiveryCanvases(driverNumber){
  const top=surface(2048,1024,-24,24,-9,9),c=top.c;
  // Silver nose with thin Petronas edging; carbon front wing remains exposed.
  polygon(c,[[4.8,-2.6],[9,-1.55],[21.8,-.55],[22.3,0],[21.8,.55],[9,1.55],[4.8,2.6]],TEAL);
  polygon(c,[[5,-2.3],[9,-1.31],[21.6,-.38],[22,0],[21.6,.38],[9,1.31],[5,2.3]],SILVER);
  for(const side of [-1,1]){
    // Swept silver sidepod graphics, separated by the exposed black body.
    const p=points=>points.map(([x,y])=>[x,y*side]);
    polygon(c,p([[-14,2],[-10,4.3],[-4,5.9],[2.5,5.6],[4.7,3.2],[3.3,3],[-3,5.15],[-9.5,3.7]]),TEAL);
    for(let i=0;i<5;i++){const x=-10+i*2.45;polygon(c,p([[x,2.35],[x+1.15,2.55],[x+3,5.25],[x+1.15,5.25]]),SILVER);}
    label(c,'PETRONAS',-3,side*5.48,.77,WHITE,side<0?0:Math.PI,11);
    for(let row=0;row<3;row++)for(let col=0;col<4;col++)star(c,-12+col*1.85+row*.5,side*(.6+row*.56),.31,'#aeb8b9');
    // Wing tips, mirror caps and halo trim.
    polygon(c,p([[18.8,6.3],[21.4,6.4],[22,5.95],[19,5.82]]),TEAL);
    polygon(c,p([[-22,4.45],[-18.6,4.45],[-18.6,4.8],[-22,4.8]]),TEAL);
    polygon(c,p([[-4.7,2.55],[1.8,2.55],[3.1,1.7],[3.4,1.95],[1.9,2.87],[-4.7,2.87]]),TEAL);
    label(c,'TeamViewer',-1.7,side*3.25,.44,WHITE,side<0?0:Math.PI,5.6);
    label(c,'PETRONAS',20.7,side*3.7,.65,WHITE,Math.PI/2,4.7);
    label(c,'Syntium',19.65,side*3.7,.53,WHITE,Math.PI/2,4.4);
    label(c,'CROWDSTRIKE',.5,side*2.37,.38,WHITE,side<0?0:Math.PI,4.3);
  }
  label(c,'PETRONAS',-20.45,0,1.33,WHITE,Math.PI/2,8.2);
  number(c,driverNumber,11.1,0,1.9,Math.PI/2,'#182226');
  star(c,20.5,0,.4,'#243336',true);
  label(c,'INEOS',17.4,0,.45,'#263235',Math.PI/2,1.15);
  label(c,'PETRONAS',7.1,0,.58,'#263235',Math.PI/2,2.2);
  label(c,'Syntium',7.85,0,.52,'#263235',Math.PI/2,2.2);
  // Coloured T-camera identifies the two drivers without recolouring the car.
  c.fillStyle=driverNumber===12?'#d7ef32':'#171d20';c.fillRect(-4.8,-.6,1.2,1.2);
  label(c,'Microsoft',-6.3,0,.6,WHITE,Math.PI/2,2.5);

  const sides=[1,-1].map(mirror=>{
  const side=surface(2048,512,-24,24,0,10),s=side.c;s.liveryMirror=mirror;
  polygon(s,[[-15,3],[-9,4.1],[-4,4.1],[2,3.55],[4,3.9],[5.5,4.8],[8,4.75],[5.5,3.7],[3,2.9],[-4,3.6],[-9,3.6]],TEAL);
  for(let i=0;i<5;i++){const x=-10+i*2.35;polygon(s,[[x,4.15],[x+1.2,4.15],[x+3,5.9],[x+1.6,6.1]],SILVER);}
  polygon(s,[[5,4.8],[9,3.9],[21.9,2.4],[21.9,3.3],[9,5.2],[5,6.3]],SILVER);
  label(s,'PETRONAS',-3.5,2.9,1.18,WHITE,0,12.5);
  label(s,'TeamViewer',-.4,6.3,.65,WHITE,0,6.2);
  label(s,'Microsoft',-4.5,7.55,.72,WHITE,0,5.7);microsoft(s,-8.4,7.15,.78);
  label(s,'SOLERA',-7,6.65,.52,WHITE,0,4);
  number(s,driverNumber,-12,6.6,1.8);
  for(let row=0;row<3;row++)for(let col=0;col<5;col++)star(s,-13.6+col*1.5+row*.35,4.3+row*.58,.25,'#aeb8b9');
  label(s,'AMG',12,4.05,.6,'#243336',0,2.9);
  label(s,'INEOS',18,3.15,.52,'#243336',0,2.8);
  label(s,'Snapdragon',-20.1,6.2,.68,WHITE,0,4.7);
  label(s,'CROWDSTRIKE',-20.1,5.15,.4,WHITE,0,4.7);
  label(s,'IWC',21.2,2,.68,WHITE,0,2.6);
  // Canvas coordinates increase upward on this side map; invert the complete
  // drawing once so text is upright when sampled in model height coordinates.
  const flipped=document.createElement('canvas');flipped.width=2048;flipped.height=512;
  const f=flipped.getContext('2d');f.translate(0,512);f.scale(1,-1);f.drawImage(side.canvas,0,0);
  return flipped;
  });
  return {top:top.canvas,side:sides[0],opposite:sides[1]};
}

export function createPaint(driverNumber,anisotropy=4){return createProjectedPaint(makeLiveryCanvases(driverNumber),anisotropy);}
