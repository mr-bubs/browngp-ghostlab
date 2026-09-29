import {createProjectedPaint} from '../projected-paint.js';

// 2026 launch paint study from the five user-supplied SI20260115 photographs.
// Shared chassis, not constructor-specific bodywork. Numbers remain inputs.
const NAVY='#08122f',BLUE='#1247b9',CARBON='#101318',WHITE='#fafaf6',RED='#e20b19',YELLOW='#ffbc08';
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
function bluePanel(c,points,seed=7){
  c.save();path(c,points);c.clip();
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const grad=c.createLinearGradient(x0,y0,x1,y1);grad.addColorStop(0,NAVY);grad.addColorStop(.32,BLUE);grad.addColorStop(.63,'#092667');grad.addColorStop(1,NAVY);
  c.fillStyle=grad;c.fillRect(x0,y0,x1-x0,y1-y0);
  let n=seed>>>0;const rand=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
  // Deterministic small angular navy fragments echo the launch paint texture.
  const count=Math.round((x1-x0)*(y1-y0)*11);
  for(let i=0;i<count;i++){
    const x=x0+rand()*(x1-x0),y=y0+rand()*(y1-y0),a=.035+rand()*.13;
    c.fillStyle=rand()>.22?'rgba(1,8,30,.45)':'rgba(57,109,242,.2)';
    c.save();c.translate(x,y);c.rotate(rand()*.8);c.fillRect(0,0,a,a*(.6+rand()));c.restore();
  }
  c.restore();c.strokeStyle='#3264ce';c.lineWidth=.035;path(c,points);c.stroke();
}
function ford(c,x,y,r,angle=0){badge(c,x,y,angle,s=>{
  s.fillStyle='#074a99';s.strokeStyle=WHITE;s.lineWidth=r*.045;s.beginPath();s.ellipse(0,0,r,r*.44,0,0,Math.PI*2);s.fill();s.stroke();
  s.scale(1/64,1/64);s.font=`italic 700 ${r*43}px Georgia, serif`;s.textAlign='center';s.textBaseline='middle';s.fillStyle=WHITE;s.fillText('Ford',0,0,r*106);
});}
function tag(c,x,y,r,angle=0){badge(c,x,y,angle,s=>{
  polygon(s,[[-r,-r*.7],[r,-r*.7],[r,r*.35],[0,r*.85],[-r,r*.35]],WHITE);
  polygon(s,[[-r*.9,-r*.6],[r*.9,-r*.6],[r*.9,-r*.02],[-r*.9,-r*.02]],'#008943');
  polygon(s,[[-r*.9,r*.03],[r*.9,r*.03],[r*.9,r*.3],[0,r*.73],[-r*.9,r*.3]],RED);
  s.scale(1/64,1/64);s.font=`900 ${r*37}px Arial, sans-serif`;s.textAlign='center';s.textBaseline='middle';s.fillStyle=WHITE;s.fillText('TAG',0,-r*20,r*107);s.font=`900 ${r*29}px Arial, sans-serif`;s.fillText('HEUER',0,r*15,r*112);
});}
function bull(c,x,y,w,h,angle=0,slope=0){badge(c,x,y,angle,s=>{
  if(slope)s.transform(1,-slope*(s.mirror||1),0,1,0,0);
  if(s.mirror===1)s.scale(-1,1);
  s.scale(w/10,h/4);s.fillStyle=RED;s.strokeStyle=WHITE;s.lineWidth=.105;s.lineJoin='round';
  // Charging-bull silhouette. It faces left in decal space on both sides.
  const p=[[-5,-.28],[-4.57,-.49],[-4.28,-.94],[-4.5,-1.28],[-4.18,-1.18],[-3.85,-.85],[-3.33,-1.02],[-3.02,-1.56],[-2.35,-1.7],[-1.3,-1.48],[.45,-.95],[1.82,-.45],[3.2,.04],[4.62,.23],[5,.08],[4.65,.49],[3.73,.5],[2.5,.09],[1.75,-.01],[2.8,.7],[3.9,1.02],[3.68,1.36],[2.5,1.2],[1.5,.73],[.67,.13],[.1,.34],[.12,1.12],[-.48,1.53],[-1.27,1.44],[-1.18,1.1],[-.54,1.06],[-.68,.39],[-1.65,.35],[-2.16,.14],[-2.32,.93],[-3.05,1.39],[-3.77,1.27],[-3.73,.97],[-3.1,.91],[-2.89,.18],[-3.53,.4],[-4.13,.1],[-4.42,.08],[-4.54,.37],[-4.92,.28]];
  path(s,p);s.fill();s.stroke();
  s.lineWidth=.065;s.beginPath();s.moveTo(-3.03,-.65);s.lineTo(-2.63,-.18);s.lineTo(-2.8,.12);s.moveTo(-1.1,-1.14);s.quadraticCurveTo(-1.4,-.42,-.7,-.01);s.moveTo(.65,-.57);s.lineTo(1.65,-.23);s.stroke();
});}
function number(c,value,x,y,size,angle=0,width=2){text(c,value,x,y,size,RED,angle,width,true);}
const reflect=(p,sign)=>p.map(([x,y])=>[x,y*sign]);

export function makeLiveryCanvases(driverNumber){
  const top=surface(2048,1024,-24,24,-9,9),c=top.c;
  bluePanel(c,[[3.2,-2.45],[9,-1.65],[21.7,-.54],[22.2,0],[21.7,.54],[9,1.65],[3.2,2.45]],13);
  bluePanel(c,[[-16,-1],[-12,-2.25],[-6,-2.8],[2,-2.55],[4.5,-1.9],[4.5,1.9],[2,2.55],[-6,2.8],[-12,2.25],[-16,1]],41);
  polygon(c,[[16.2,-.91],[21.9,-.47],[22.2,0],[21.9,.47],[16.2,.91],[15.65,0]],YELLOW);
  polygon(c,[[-8.4,-1.7],[-4.2,-1.85],[-2.6,-.9],[-2.6,.9],[-4.2,1.85],[-8.4,1.7]],YELLOW);
  for(const sign of[-1,1]){
    bluePanel(c,reflect([[-16,1.5],[-12,3.25],[-6,5.35],[-1.5,5.8],[2,5],[5,2.75],[2.5,2.1],[-5,3],[-11.5,2]],sign),39);
    bluePanel(c,reflect([[18.3,6],[22,6.12],[22,6.75],[18.2,6.65]],sign),29);
    const orientation=sign>0?Math.PI:0;
    text(c,'Pepe Jeans',1,sign*4.15,.45,WHITE,orientation,4.1,false,true);
    text(c,'VISA',-.3,sign*1.87,.64,WHITE,orientation,3.3);
    text(c,'Mobil 1',2.2,sign*1.86,.34,WHITE,orientation,2.1);
    text(c,sign<0?'Bull':'Red',20.65,sign*3.45,1.85,RED,-Math.PI/2,5,true);
    text(c,'VISA',18.3,sign*3.65,.88,WHITE,-Math.PI/2,4.45);
    bull(c,16.4,sign*.8,3.3,.64,Math.PI);
  }
  text(c,'Gate',-19.4,0,1.72,WHITE,-Math.PI/2,7.7);
  text(c,'ORACLE',5.8,0,.55,WHITE,-Math.PI/2,2.5);
  tag(c,8.1,0,.91,-Math.PI/2);
  // Nose number is a runtime overlay and remains upright in the top view.
  badge(c,10.55,0,-Math.PI/2,s=>{s.strokeStyle=WHITE;s.lineWidth=.045;s.beginPath();s.ellipse(0,0,1.05,1.06,0,0,Math.PI*2);s.stroke();});
  number(c,driverNumber,10.55,0,1.75,-Math.PI/2,1.65);
  for(const [label,x,size] of [['VISA',12.05,.43],['Gate',12.65,.4],['AT&T',13.25,.4],['AVA TRADE',13.9,.33],['CARLYLE',14.48,.28],['neat.',15.05,.38],['Mobil 1',15.6,.35]])text(c,label,x,0,size,WHITE,-Math.PI/2,1.55);
  ford(c,20.65,0,.38,-Math.PI/2);
  c.fillStyle=Number(driverNumber)===6?'#e4ee21':'#111318';c.fillRect(-4.8,-.55,1.05,1.1);
  const sides=[1,-1].map(parity=>{
    const side=surface(2048,512,-24,24,0,10),s=side.c;s.mirror=-parity;
    bluePanel(s,[[-16,2.8],[-13,4.45],[-10,6.75],[-6.5,8.92],[-3.9,8.9],[-1.9,7],[3,6.1],[7.7,4.7],[17,3.25],[21.9,2.6],[21.9,1.95],[14,2.32],[5.5,3.25],[-1,3.05],[-8,2.46]],97);
    // Dark lower sidepod panel carries the large Oracle lettering.
    polygon(s,[[-14,1.7],[-7,1.65],[1.4,2.3],[4.4,3.35],[1.8,3.8],[-5.7,3.6],[-11.7,3]],CARBON);
    s.strokeStyle='#2363d5';s.lineWidth=.04;s.beginPath();s.moveTo(-14,1.7);s.lineTo(-7,1.65);s.lineTo(1.4,2.3);s.lineTo(4.4,3.35);s.stroke();
    polygon(s,[[-7.3,7.83],[-5.8,8.97],[-3.9,8.9],[-2.72,7.7],[-1.72,6.73],[-4.13,6.55],[-7.4,6.75]],YELLOW);
    polygon(s,[[16.1,2.49],[21.95,1.91],[22.13,2.57],[16.25,3.46],[15.5,3.1]],YELLOW);
    bluePanel(s,[[-21.7,4.8],[-17.5,4.8],[-17.5,7.1],[-21.7,7.1]],24);
    bluePanel(s,[[18.1,1.3],[22,1.2],[21.7,3.35],[18.45,3.35]],65);
    bull(s,-7.7,5.95,6.0,3.0,0,.12);
    bull(s,16.2,3.1,3.6,.89);
    text(s,'Red Bull',-6.8,4.15,.88,RED,0,5.8,true);
    text(s,'ORACLE',-3.5,2.78,1.42,WHITE,0,12.75);
    text(s,'ROKT',-.7,5.55,.72,WHITE,0,3.8);
    ford(s,-12.3,4.75,1.08);text(s,'RACING',-12.3,4.12,.32,WHITE,0,2.3,false,true);
    text(s,'CARLYLE',8.6,4.14,.55,WHITE,0,5.8);
    text(s,'1Password',7.7,3.48,.45,WHITE,0,4.4);
    text(s,'Hard Rock',3.88,4.17,.43,WHITE,0,2.8,false,true);
    text(s,'VISA',1.1,6.38,.55,WHITE,0,3.1);
    text(s,'Mobil 1',-19.65,6.03,.9,WHITE,0,4.05);
    text(s,'Mobil 1',20.06,2.45,.56,WHITE,0,3.3);
    text(s,'AT&T',16.9,3.73,.46,WHITE,0,2.8);
    text(s,'SIEMENS',-6.1,1.63,.29,WHITE,0,2.1);
    text(s,'HEXAGON',-10.1,1.49,.31,WHITE,0,2.65);
    text(s,'CLEAR',-2.6,1.8,.29,WHITE,0,1.7);
    number(s,driverNumber,-14.1,6.42,1.3,0,1.9);
    const flipped=document.createElement('canvas');flipped.width=2048;flipped.height=512;
    const f=flipped.getContext('2d');f.translate(0,512);f.scale(1,-1);f.drawImage(side.canvas,0,0);return flipped;
  });
  return {top:top.canvas,side:sides[0],opposite:sides[1]};
}
export function createPaint(driverNumber,anisotropy=4){return createProjectedPaint(makeLiveryCanvases(driverNumber),anisotropy,{engineCoverSide:true});}
