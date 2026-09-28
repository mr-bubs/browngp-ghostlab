import {createProjectedPaint} from '../projected-paint.js';

// MCL40 paint reconstructed from the four supplied 2026 launch photographs.
// The underlying geometry remains the shared Ghost Lab open-wheel chassis.
// Driver numbers are supplied at runtime, never stored in constructor paint.
const CARBON='#101315',PAPAYA='#ff8700',WHITE='#f4f4ef',TEAL='#064f50',NAVY='#172858';
function surface(w,h,x0,x1,y0,y1){
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const c=canvas.getContext('2d');c.fillStyle=CARBON;c.fillRect(0,0,w,h);
  c.scale(w/(x1-x0),h/(y1-y0));c.translate(-x0,-y0);return {canvas,c};
}
function polygon(c,p,color){c.fillStyle=color;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function badge(c,x,y,angle,draw){
  c.save();c.translate(x,y);c.rotate(angle);
  // Apply decal parity once, including symbols, on either side of the model.
  // Texture height is flipped later; lettering must not inherit that inversion.
  if(c.mirror)c.scale(c.mirror,-1);draw(c);c.restore();
}
function text(c,value,x,y,size,color=WHITE,angle=0,width,weight=700){
  badge(c,x,y,angle,s=>{s.scale(1/64,1/64);s.font=`${weight} ${size*64}px Arial, sans-serif`;s.textAlign='center';s.textBaseline='middle';s.fillStyle=color;
    if(width)s.fillText(String(value),0,0,width*64);else s.fillText(String(value),0,0);});
}
function mastercard(c,x,y,r,angle=0){badge(c,x,y,angle,s=>{
  for(const [cx,color] of [[-r*.6,'#eb001b'],[r*.6,'#f79e1b']]){s.fillStyle=color;s.beginPath();s.arc(cx,0,r,0,Math.PI*2);s.fill();}
  s.save();s.beginPath();s.arc(-r*.6,0,r,0,Math.PI*2);s.clip();s.fillStyle='#ff5f00';s.beginPath();s.arc(r*.6,0,r,0,Math.PI*2);s.fill();s.restore();
});}
function gemini(c,x,y,r,angle=0){badge(c,x,y,angle,s=>{
  const g=s.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#56c0ff');g.addColorStop(.35,'#4384ff');g.addColorStop(.57,'#39d2ba');g.addColorStop(.77,'#f4e581');g.addColorStop(1,'#d655b9');s.fillStyle=g;
  s.beginPath();s.moveTo(0,-r);s.quadraticCurveTo(r*.2,-r*.2,r,0);s.quadraticCurveTo(r*.2,r*.2,0,r);s.quadraticCurveTo(-r*.2,r*.2,-r,0);s.quadraticCurveTo(-r*.2,-r*.2,0,-r);s.fill();
});}
function speedmark(c,x,y,r,angle=0){badge(c,x,y,angle,s=>{s.fillStyle=PAPAYA;s.beginPath();s.moveTo(-r,-r*.07);s.bezierCurveTo(r*.02,-r*.64,r*1.18,-r*.61,r*.8,-r*.03);s.lineTo(r*.25,r*.63);s.quadraticCurveTo(r*.56,-r*.03,-r,-r*.07);s.fill();});}
function dropbox(c,x,y,r,angle=0){badge(c,x,y,angle,s=>{
  for(const [dx,dy] of [[-.6,-.5],[.6,-.5],[-.6,.25],[.6,.25],[0,.99]])polygon(s,[[dx*r,(dy-.32)*r],[(dx+.5)*r,dy*r],[dx*r,(dy+.32)*r],[(dx-.5)*r,dy*r]],CARBON);
});}
function cisco(c,x,y,size){badge(c,x,y,0,s=>{s.strokeStyle=CARBON;s.lineWidth=size*.11;s.lineCap='round';for(let i=-3;i<=3;i++){s.beginPath();s.moveTo(i*size*.3,0);s.lineTo(i*size*.3,-size*(.22+(.85-.22)*Math.abs(Math.sin((i+4)*.72))));s.stroke();}});text(c,'CISCO',x,y-.38,size*.5,CARBON,0,size*2.1);}
function workday(c,x,y,size,angle=0){badge(c,x,y,angle,s=>{
  s.strokeStyle=CARBON;s.lineWidth=size*.065;s.beginPath();s.arc(0,0,size*.78,Math.PI,Math.PI*2);s.stroke();
  const parity=s.mirror;s.mirror=0;text(s,'workday',0,size*.16,size*.58,CARBON,0,size*2.5,600);s.mirror=parity;
});}
function geminiLockup(c,x,y){badge(c,x,y,0,s=>{
  const parity=s.mirror;s.mirror=0;
  gemini(s,-3.1,0,.57);text(s,'Gemini',.45,0,1.03,WHITE,0,5.1,600);
  s.mirror=parity;
});}
function dropboxLockup(c,x,y){badge(c,x,y,0,s=>{
  const parity=s.mirror;s.mirror=0;
  dropbox(s,-1.55,0,.27);text(s,'Dropbox',.28,0,.62,CARBON,0,2.6);
  s.mirror=parity;
});}
function okx(c,x,y,size){badge(c,x,y,0,s=>{
  s.fillStyle=WHITE;const unit=size/5,gap=unit*.17;
  const cells=['1111010010101','1011010100010','1011011000101','1011010100010','1111010010101'];
  cells.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')s.fillRect((i-6.5)*unit,(j-2.5)*unit,unit-gap,unit-gap);}));
});}
function mirror(points,side){return points.map(([x,y])=>[x,y*side]);}

export function makeLiveryCanvases(driverNumber){
  const top=surface(2048,1024,-24,24,-9,9),c=top.c;
  // Papaya upper nose ends before the exposed-carbon tip.
  polygon(c,[[2,-1.9],[7,-1.62],[18.4,-.75],[18.8,0],[18.4,.75],[7,1.62],[2,1.9]],PAPAYA);
  for(const side of [-1,1]){
    polygon(c,mirror([[-16,.25],[-12,1.95],[-9,2.9],[-7.6,2.54],[-11.2,1.02],[-12.6,.25]],side),PAPAYA);
    polygon(c,mirror([[-4.2,.6],[-2.8,2.75],[.5,3.1],[3.9,1.82],[1.4,1.25],[-1.4,1.1]],side),PAPAYA);
    polygon(c,mirror([[-14.4,2.35],[-10.1,4.3],[-5.4,4.91],[-3.3,4.25],[-8.4,3.38],[-10.6,2.7]],side),PAPAYA);
    polygon(c,mirror([[-2.2,4.4],[1.9,5.37],[4.8,2.58],[2.6,2.37],[.1,3.7]],side),PAPAYA);
    polygon(c,mirror([[-5.2,.7],[-4.2,1.3],[-2.4,1.1],[-2.1,.65]],side),TEAL);
    polygon(c,mirror([[3.1,4.4],[5.3,4.22],[5.3,4.83],[3.2,5]],side),TEAL);
    const direction=side>0?Math.PI:0;
    text(c,'VELO',.85,side*3.66,.65,CARBON,direction,3.7);
    text(c,'allwyn',4.3,side*4.61,.38,WHITE,direction,2.1);
    // Orange wing strips remain framed by carbon edges.
    polygon(c,mirror([[18.1,1.2],[21.7,1.15],[22.15,5.6],[20.75,5.8]],side),PAPAYA);
    text(c,'ONEflight',20.5,side*3.38,.52,CARBON,-Math.PI/2,3.4);
    mastercard(c,18.2,side*2.2,.54,-Math.PI/2);
  }
  polygon(c,[[-21.1,-4.9],[-18,-4.9],[-18,4.9],[-21.1,4.9]],PAPAYA);
  text(c,'McLAREN',-19.5,0,.94,CARBON,-Math.PI/2,7.7);
  // The engine-cover Gemini marks belong to the side projection. Painting
  // another copy on top made it wrap vertically across the side lettering.
  text(c,'DELL',11.7,0,.55,CARBON,-Math.PI/2,1.9);
  text(c,'Deloitte.',13.05,0,.39,CARBON,-Math.PI/2,1.7);
  text(c,'webex',14.2,0,.4,CARBON,-Math.PI/2,1.7,600);
  text(c,'rubrik',15.3,0,.4,CARBON,-Math.PI/2,1.6,600);
  text(c,'DEWALT',16.4,0,.39,CARBON,-Math.PI/2,1.6);
  text(c,'PIRELLI',17.45,0,.31,CARBON,-Math.PI/2,1.4);
  gemini(c,19.4,0,.58,-Math.PI/2);speedmark(c,21,0,.51,-Math.PI/2);
  mastercard(c,1.85,0,.38,-Math.PI/2);
  // As in the corrected Ferrari, top decals face negative model-space X.
  text(c,driverNumber,9.35,0,1.65,CARBON,-Math.PI/2,2,500);
  const sides=[1,-1].map(parity=>{
    const side=surface(2048,512,-24,24,0,10),s=side.c;s.mirror=-parity;
    polygon(s,[[3.5,3.3],[8,3.14],[18.2,2.12],[18.8,2.8],[10,4.2],[4.3,5.45],[2.5,5.05]],PAPAYA);
    polygon(s,[[-16.2,3.05],[-10.1,3.5],[-8.2,4.32],[-12.2,6.8],[-15.8,6.42]],PAPAYA);
    polygon(s,[[-16.1,6],[-13.8,7.2],[-10.7,7.58],[-12.6,6.12]],PAPAYA);
    polygon(s,[[-5.4,8.88],[-2.9,8.83],[-2.05,7.16],[1,6.25],[4.1,5.47],[1.5,4.45],[-1.6,4.48],[-3.6,6.4]],PAPAYA);
    polygon(s,[[-7.3,8.03],[-5.4,8.98],[-2.91,8.82],[-2.74,8.2],[-4.4,8.14]],TEAL);
    polygon(s,[[-13.2,2.48],[-8.1,2.73],[-6.8,3.28],[-9.12,3.09]],PAPAYA);
    polygon(s,[[-.7,3.9],[2.8,3.9],[4.55,4.65],[2.85,5.08],[.3,4.93]],PAPAYA);
    polygon(s,[[5.1,3.59],[10.5,3.07],[12.75,3.03],[11.4,3.81],[6.1,4.34]],NAVY);
    polygon(s,[[-21.6,3.8],[-17.9,3.86],[-17.9,7.4],[-21.6,7.4]],PAPAYA);
    polygon(s,[[18.2,1.44],[22,1.42],[21.5,3.23],[18.5,3.18]],PAPAYA);
    geminiLockup(s,-8.1,6.97);
    text(s,'allwyn',-4.72,8.45,.7,WHITE,0,3.4);
    text(s,'DELL',-12.2,4.64,.66,CARBON,0,3.3);text(s,'Technologies',-12.2,4.13,.29,CARBON,0,3.2,500);
    cisco(s,-1.65,5.87,.72);
    text(s,'VELO',1.8,4.36,.73,CARBON,0,3.5);
    okx(s,-3.4,3.91,.61);mastercard(s,-7.4,3.5,.55);
    text(s,'DP WORLD',8.1,3.65,.46,WHITE,0,4.4);
    text(s,'RICHARD MILLE',7.9,4.18,.38,CARBON,0,5.7);
    text(s,"JACK DANIEL’S",16.8,2.73,.32,WHITE,0,4);
    dropboxLockup(s,-19.8,6.18);
    text(s,'groq',-19.73,3.59,.54,WHITE,0,2.6);
    workday(s,20.1,2.55,.7);
    speedmark(s,-2.2,1.93,.81);
    text(s,'allwyn',4.1,5.84,.4,WHITE,0,2.5);
    // Driver identifiers are the only marks that change with the selected lap.
    text(s,driverNumber,-13.05,6.62,1.1,CARBON,0,1.8,500);
    const flipped=document.createElement('canvas');flipped.width=2048;flipped.height=512;
    const f=flipped.getContext('2d');f.translate(0,512);f.scale(1,-1);f.drawImage(side.canvas,0,0);return flipped;
  });
  return {top:top.canvas,side:sides[0],opposite:sides[1]};
}
export function createPaint(driverNumber,anisotropy=4){return createProjectedPaint(makeLiveryCanvases(driverNumber),anisotropy);}
