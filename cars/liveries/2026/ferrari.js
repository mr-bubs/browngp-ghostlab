import {createProjectedPaint} from '../projected-paint.js';

// Ferrari SF-26 paint study based on the supplied top, front and three-quarter
// references. The shared open-wheel model cannot reproduce SF-26 bodywork.
// Car numbers are painted from the selected driver's data at render time.
const BLACK='#101114',RED='#d9152d',RED_DARK='#9f1022',WHITE='#e9eaeb',BLUE='#1268ba',YELLOW='#f4cd2c';

function surface(width,height,x0,x1,y0,y1){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const c=canvas.getContext('2d');c.fillStyle=BLACK;c.fillRect(0,0,width,height);
  c.scale(width/(x1-x0),height/(y1-y0));c.translate(-x0,-y0);
  return {canvas,c};
}
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function text(c,value,x,y,size,color=WHITE,angle=0,maxWidth){
  c.save();c.translate(x,y);c.rotate(angle);if(c.mirror)c.scale(c.mirror,-1);
  c.scale(1/64,1/64);c.font=`800 ${size*64}px Arial, sans-serif`;
  c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;
  if(maxWidth)c.fillText(String(value),0,0,maxWidth*64);else c.fillText(String(value),0,0);
  c.restore();
}
function hp(c,x,y,r,angle=0){
  c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=BLUE;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();
  c.strokeStyle=WHITE;c.lineWidth=r*.08;c.stroke();text(c,'hp',0,0,r*1.15,WHITE,-.22,r*1.65);c.restore();
}
function shell(c,x,y,r,angle=0){
  c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=YELLOW;c.strokeStyle=RED_DARK;c.lineWidth=r*.1;
  c.beginPath();c.moveTo(-r*.85,-r*.45);c.quadraticCurveTo(0,-r*1.15,r*.85,-r*.45);
  c.lineTo(r*.7,r*.5);c.quadraticCurveTo(0,r*1.15,-r*.7,r*.5);c.closePath();c.fill();c.stroke();
  for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(0,r*.52);c.lineTo(i*r*.33,-r*.48);c.stroke();}c.restore();
}
function mirrored(points,side){return points.map(([x,y])=>[x,y*side]);}

export function makeLiveryCanvases(driverNumber){
  const top=surface(2048,1024,-24,24,-9,9),c=top.c;
  // Black carbon wings surround a crimson nose and full red sidepods.
  polygon(c,[[4,-1.9],[9,-1.45],[21.9,-.49],[22.3,0],[21.9,.49],[9,1.45],[4,1.9]],RED);
  polygon(c,[[-16,-1.1],[-12,-2.35],[-5.1,-2.7],[1.2,-2.2],[5,-1.6],[5,1.6],[1.2,2.2],[-5.1,2.7],[-12,2.35],[-16,1.1]],RED);
  polygon(c,[[-14.9,-.8],[-12.3,-1.5],[-6.6,-2.02],[.35,-2.05],[2.15,-1.55],[2.15,1.55],[.35,2.05],[-6.6,2.02],[-12.3,1.5],[-14.9,.8]],WHITE);
  // The white cockpit fairing splits around the dark cockpit and halo.
  polygon(c,[[-4.8,-1.31],[-3.5,-1.8],[2.4,-1.55],[4.1,-1.08],[4.1,1.08],[2.4,1.55],[-3.5,1.8],[-4.8,1.31]],WHITE);
  polygon(c,[[-6.7,-.66],[-3.8,-1.2],[.9,-1.1],[2.6,-.55],[2.6,.55],[.9,1.1],[-3.8,1.2],[-6.7,.66]],BLACK);
  for(const side of [-1,1]){
    polygon(c,mirrored([[-16,1.7],[-11.7,3.9],[-4,5.85],[1.7,5.35],[5.6,2.38],[3.3,2.12],[-3,4.45],[-10,2.7]],side),RED);
    polygon(c,mirrored([[-12.1,2.7],[-9,4.1],[-5.2,4.56],[-4,4.25],[-9.1,3.5]],side),RED_DARK);
    polygon(c,mirrored([[17.2,5.36],[22,5.3],[22,5.66],[18.2,5.72]],side),RED);
    polygon(c,mirrored([[-21.5,4.53],[-17.3,4.52],[-17.3,4.82],[-21.5,4.82]],side),RED);
    text(c,'UniCredit',-4.8,side*3.86,.47,WHITE,side>0?Math.PI:0,4.9);
    text(c,'RICHARD MILLE',7.8,side*1.3,.35,WHITE,Math.PI/2,3.5);
    hp(c,-8,side*.96,.43,-Math.PI/2);
  }
  // The top reference's central red nose carries a yellow Shell badge.
  // In model space positive X points toward the nose. The top-view camera
  // displays that direction downward, so top decals face toward negative X.
  shell(c,13.7,0,.85,-Math.PI/2);
  text(c,'ZYN',17,0,.86,WHITE,-Math.PI/2,2.5);
  text(c,'Shell',12.15,0,.33,WHITE,-Math.PI/2,1.15);
  text(c,'PERONI',3.8,0,.42,BLACK,-Math.PI/2,1.7);
  hp(c,-11.9,0,.66,-Math.PI/2);
  text(c,'Ferrari',-19.5,0,1.02,WHITE,-Math.PI/2,4.2);
  // Driver-only markings are last, so the team paint is reusable.
  text(c,driverNumber,10.35,0,1.73,WHITE,-Math.PI/2,1.7);
  const sides=[1,-1].map(mirror=>{
    // The side images are flipped vertically after drawing. On the loaded
    // chassis the camera-facing side also reverses the model-space X axis;
    // invert the old text parity so HP and all other side marks read forward.
    const side=surface(2048,512,-24,24,0,10),s=side.c;s.mirror=-mirror;
    polygon(s,[[-16,2],[-9,2.12],[-3.5,2.1],[3.5,2.75],[8,3.3],[15,2.42],[21.9,1.8],[21.9,2.58],[12,3.45],[5,3.84],[-2,4.1],[-10,3.26],[-16,2.75]],RED);
    polygon(s,[[-15.5,3.2],[-10.8,4.1],[-4,5.2],[3.3,5.4],[7.8,4.6],[8.5,3.74],[4,4.3],[-2.2,4.6],[-9.5,3.48]],RED);
    polygon(s,[[-15.4,4.6],[-11.4,6.76],[-7,8.95],[-4.2,8.75],[-2.1,7.1],[1.4,6.8],[4.3,6.27],[1.1,6.08],[-4.5,6.56],[-10.9,5.2]],WHITE);
    polygon(s,[[-16.3,5.9],[-12.2,7.2],[-10.3,7.2],[-12.8,6.23]],RED);
    polygon(s,[[4.2,4.2],[8.2,3.25],[21.9,1.9],[21.9,2.6],[9,4.7],[4.2,5.4]],RED);
    text(s,'hp',-8.8,7.12,1.38,BLUE,0,2.5);
    text(s,'UniCredit',-8,3.76,.67,WHITE,0,7.2);
    text(s,'CEVA',-4.1,2.79,.6,WHITE,0,3.2);
    shell(s,-6.5,4.5,.63);
    text(s,'Ferrari',-13.2,3.54,.48,WHITE,0,3.2);
    text(s,'RICHARD MILLE',5.8,4.04,.45,WHITE,0,4.7);
    text(s,'ZYN',14.4,3.16,.7,WHITE,0,2.8);
    text(s,'V-Power',19.5,2.53,.44,WHITE,0,3.5);
    text(s,driverNumber,-14,6.75,1.42,WHITE,0,2.5);
    // Side canvas has the opposite vertical orientation to glTF model height.
    const flipped=document.createElement('canvas');flipped.width=2048;flipped.height=512;
    const f=flipped.getContext('2d');f.translate(0,512);f.scale(1,-1);f.drawImage(side.canvas,0,0);
    return flipped;
  });
  return {top:top.canvas,side:sides[0],opposite:sides[1]};
}

export function createPaint(driverNumber,anisotropy=4){return createProjectedPaint(makeLiveryCanvases(driverNumber),anisotropy);}
