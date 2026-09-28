import {createProjectedPaint} from '../projected-paint.js';
// A constructor-inspired paint option on the shared open-wheel mesh. This is
// deliberately described as a livery recreation, not an RB21 geometry asset.
const NAVY='#111d37',RED='#e52b37',YELLOW='#ffd52e',WHITE='#f4f5f5';
function surface(width,height,x0,x1,y0,y1){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');c.fillStyle=NAVY;c.fillRect(0,0,width,height);c.scale(width/(x1-x0),height/(y1-y0));c.translate(-x0,-y0);return {canvas,c};}
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function label(c,text,x,y,size,color=WHITE,angle=0,maxWidth){c.save();c.translate(x,y);c.rotate(angle);if(c.mirror)c.scale(c.mirror,-1);c.scale(1/64,1/64);c.font=`900 ${size*64}px Arial, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;if(maxWidth)c.fillText(text,0,0,maxWidth*64);else c.fillText(text,0,0);c.restore();}
export function makeLiveryCanvases(driverNumber){
  const top=surface(2048,1024,-24,24,-9,9),c=top.c;
  polygon(c,[[12,-1.2],[21.8,-.55],[22.3,0],[21.8,.55],[12,1.2]],YELLOW);
  polygon(c,[[8,-1.55],[13,-1.15],[13,1.15],[8,1.55]],RED);
  polygon(c,[[-14,-1.2],[-7,-2.1],[-4,-1.1],[-4,1.1],[-7,2.1],[-14,1.2]],RED);
  for(const sign of [-1,1]){
    const p=points=>points.map(([x,y])=>[x,y*sign]);
    polygon(c,p([[-15,2],[-9,4.6],[-2,5.9],[3.8,4.7],[4.5,3.4],[-2,4.3],[-9,3.5]]),RED);
    polygon(c,p([[19,5.95],[21.8,6.35],[21.2,6.8],[18.9,6.5]]),YELLOW);
    label(c,'ORACLE',-2.5,sign*4.95,1.08,WHITE,sign<0?0:Math.PI,10);
    label(c,'Red Bull',-8.1,sign*2.3,.82,RED,sign<0?0:Math.PI,6.5);
    label(c,'BYBIT',1,sign*2.4,.47,WHITE,sign<0?0:Math.PI,4.8);
    label(c,'Mobil 1',20.4,sign*3.8,.7,WHITE,Math.PI/2,4.4);
    label(c,'telcel',5.6,sign*2,.45,WHITE,sign<0?0:Math.PI,3);
  }
  label(c,'ORACLE',-20.4,0,1.45,WHITE,Math.PI/2,8.5);
  label(c,String(driverNumber),15.5,0,1.7,NAVY,Math.PI/2,1.1);
  label(c,'Red Bull',8.9,0,.75,WHITE,Math.PI/2,2.1);
  c.fillStyle='#131927';c.fillRect(-4.8,-.6,1.2,1.2);
  const sides=[1,-1].map(mirror=>{
    const side=surface(2048,512,-24,24,0,10),s=side.c;s.mirror=mirror;
    polygon(s,[[10,3.3],[21.9,2.4],[21.9,3.3],[12,4.7]],YELLOW);
    polygon(s,[[7,3.7],[12,3.3],[12,4.7],[7,5.6]],RED);
    polygon(s,[[-15,2.1],[-4,1.8],[3,2.5],[4.5,3.3],[-4,2.6],[-14,2.9]],RED);
    s.fillStyle=YELLOW;s.beginPath();s.ellipse(-7.7,6.6,2,1.9,0,0,Math.PI*2);s.fill();
    label(s,'Red Bull',-8,6.5,1.38,RED,0,7.8);
    label(s,'ORACLE',-2.5,3.5,1.65,WHITE,0,14.5);
    label(s,'BYBIT',-.1,6.3,.7,WHITE,0,5.5);
    label(s,String(driverNumber),-12.6,7.25,1.5,WHITE,0,2.2);
    label(s,'Mobil 1',17.6,3.1,.48,NAVY,0,3.4);
    label(s,'HONDA',-19.7,6.1,.65,WHITE,0,4.9);
    label(s,'RACING',-19.7,5.1,.45,WHITE,0,4.3);
    const flipped=document.createElement('canvas');flipped.width=2048;flipped.height=512;const f=flipped.getContext('2d');f.translate(0,512);f.scale(1,-1);f.drawImage(side.canvas,0,0);return flipped;
  });
  return {top:top.canvas,side:sides[0],opposite:sides[1]};
}
export function createPaint(driverNumber,anisotropy=4){return createProjectedPaint(makeLiveryCanvases(driverNumber),anisotropy);}
