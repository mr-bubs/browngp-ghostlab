import {createProjectedPaint} from '../projected-paint.js';
// Alpine A526 launch-reference paint, on the shared chassis. Numbers are runtime inputs.
const CARBON='#10151c',WHITE='#ffffff',BLUE='#008ed5',PINK='#f58dbe',NAVY='#072b57';
function surface(w,h,x0,x1,y0,y1){
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const c=canvas.getContext('2d');c.fillStyle=CARBON;c.fillRect(0,0,w,h);
  c.scale(w/(x1-x0),h/(y1-y0));c.translate(-x0,-y0);return {canvas,c};
}
function path(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
function polygon(c,points,color){path(c,points);c.fillStyle=color;c.fill();}
function badge(c,x,y,angle,draw){
  c.save();c.translate(x,y);c.rotate(angle);
  // Same corrected projection parity as Ferrari and McLaren. Apply it once
  // to the complete logo, not separately to its symbol and lettering.
  if(c.mirror)c.scale(c.mirror,-1);draw(c);c.restore();
}
function text(c,value,x,y,size,color=WHITE,angle=0,width,outline=false,italic=false){
  badge(c,x,y,angle,s=>{
    s.scale(1/64,1/64);s.font=`${italic?'italic ':''}800 ${size*64}px Arial, sans-serif`;
    s.textAlign='center';s.textBaseline='middle';s.fillStyle=color;
    if(outline){s.strokeStyle=WHITE;s.lineJoin='round';s.lineWidth=size*64*.105;if(width)s.strokeText(String(value),0,0,width*64);else s.strokeText(String(value),0,0);}
    if(width)s.fillText(String(value),0,0,width*64);else s.fillText(String(value),0,0);
  });
}

function alpine(c,x,y,size,angle=0){badge(c,x,y,angle,s=>{
 s.scale(size,size);s.strokeStyle=WHITE;s.lineWidth=.15;s.lineJoin='miter';s.beginPath();s.moveTo(-.7,.65);s.lineTo(.25,-.7);s.lineTo(.62,.65);s.moveTo(-.38,.25);s.lineTo(.85,.25);s.stroke();
});}
function bwt(c,x,y,size,angle=0,width){text(c,'BWT',x,y,size,NAVY,angle,width,true);}
const reflect=(p,sign)=>p.map(([x,y])=>[x,y*sign]);
export function makeLiveryCanvases(driverNumber){
 const top=surface(2048,1024,-24,24,-9,9),c=top.c;
 polygon(c,[[-16,-1],[-12,-2.25],[-6,-2.8],[3,-2.5],[9,-1.6],[21.8,-.5],[22.2,0],[21.8,.5],[9,1.6],[3,2.5],[-6,2.8],[-12,2.25],[-16,1]],BLUE);
 polygon(c,[[3,-1.9],[10,-1.3],[19.8,-.57],[20.1,0],[19.8,.57],[10,1.3],[3,1.9]],PINK);
 polygon(c,[[-15,-.6],[-12,-1.7],[-8,-2.15],[-8,2.15],[-12,1.7],[-15,.6]],PINK);
 for(const sign of[-1,1]){
  polygon(c,reflect([[-16,1.5],[-12,3.25],[-6,5.35],[-1.5,5.8],[2,5],[5,2.75],[2.5,2.1],[-5,3],[-11.5,2]],sign),BLUE);
  polygon(c,reflect([[-13,2.4],[-7,4.65],[-1,5.25],[2,4.6],[.7,4.2],[-7,4.1]],sign),PINK);
  polygon(c,reflect([[-4.7,2.1],[-4.7,2.65],[1.8,2.65],[3.1,1.7],[2.6,1.45],[1.5,2.12]],sign),PINK);
  polygon(c,reflect([[18,1.25],[22,1.4],[22,5.7],[18.3,5.5]],sign),PINK);
  bwt(c,20.1,sign*3.55,1.42,-Math.PI/2,4.3);
 }
 polygon(c,[[-21.4,-5],[-18.1,-5],[-18.1,5],[-21.4,5]],PINK);
 bwt(c,-19.65,0,1.8,-Math.PI/2,7.7);
 alpine(c,-11.2,0,1.5,-Math.PI/2);
 text(c,'eni',-6.3,0,1.1,WHITE,-Math.PI/2,2.6);
 text(c,'ALPINE',4.1,0,.52,NAVY,-Math.PI/2,2.55);
 text(c,driverNumber,7.7,0,1.6,WHITE,-Math.PI/2,2.2);
 bwt(c,10.2,0,.95,-Math.PI/2,2.1);
 for(const [label,x,size]of[['ARCTIC WOLF',12,.27],['PIRELLI',13,.32],['MSC',14,.45],['eni',15.4,.6]])text(c,label,x,0,size,NAVY,-Math.PI/2,1.6);
 alpine(c,21,0,.48,-Math.PI/2);
 const sides=[1,-1].map(parity=>{
  const side=surface(2048,512,-24,24,0,10),s=side.c;s.mirror=-parity;
  polygon(s,[[-16,2.8],[-13,4.45],[-10,6.75],[-6.5,8.92],[-3.9,8.9],[-1.9,7],[3,6.1],[7.7,4.7],[17,3.25],[21.9,2.6],[21.9,1.95],[14,2.32],[5.5,3.25],[-1,3.05],[-8,2.46]],BLUE);
  polygon(s,[[-15,4.3],[-13.5,6.2],[-10.2,7.2],[-8.2,7.9],[-8,5.25],[-11.7,4.5]],PINK);
  polygon(s,[[-14,1.7],[-7,1.65],[1.4,2.3],[4.4,3.35],[1.8,3.8],[-5.7,3.6],[-11.7,3]],CARBON);
  polygon(s,[[4,4.7],[12,3.7],[20,2.75],[20,3.04],[12,4.12],[4,5.12]],PINK);
  polygon(s,[[-4.8,6.15],[2.6,6.1],[3.3,5.8],[3.3,5.48],[-4.8,5.65]],PINK);
  text(s,'BWT',-6.1,3.2,1.53,PINK,0,8.4);
  text(s,'MSC',1.55,3.66,.92,WHITE,0,3.3);
  text(s,'eni',-5.9,8.0,1.2,WHITE,0,3.25);
  alpine(s,-11.9,5.9,1.06);
  text(s,'MODO CASINO',-2.6,5.08,.37,WHITE,0,4.1);
  text(s,'Avature',-7,4.54,.35,WHITE,0,3.1);
  text(s,'CASTORE',.45,5.18,.25,WHITE,0,2.35);
  text(s,'businesssolver',-.4,5.89,.26,NAVY,0,4.8);
  text(s,'eToro',11.9,3.22,.58,WHITE,0,3.8);
  text(s,'DELPHI',-6.5,1.73,.3,WHITE,0,3);
  text(s,'CATO',2.7,4.6,.26,WHITE,0,1.5);
  text(s,driverNumber,-14.0,4.26,1.0,WHITE,0,1.8);
  text(s,'MSC',-19.6,6.12,.82,WHITE,0,3.8);
  text(s,'EURODATACAR',-19.6,5.28,.28,WHITE,0,3.6);
  polygon(s,[[18.1,1.3],[22,1.2],[21.7,3.35],[18.45,3.35]],PINK);
  bwt(s,20.1,2.35,.8,0,3.1);
  const flipped=document.createElement('canvas');flipped.width=2048;flipped.height=512;
  const f=flipped.getContext('2d');f.translate(0,512);f.scale(1,-1);f.drawImage(side.canvas,0,0);return flipped;
 });
 return {top:top.canvas,side:sides[0],opposite:sides[1]};
}
export function createPaint(driverNumber,anisotropy=4){return createProjectedPaint(makeLiveryCanvases(driverNumber),anisotropy);}
