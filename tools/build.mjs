import {cpSync,mkdirSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
rmSync(root+'dist',{recursive:true,force:true});mkdirSync(root+'dist',{recursive:true});
for(const item of ['src','tracks','cars','data','assets','vendor','catalog.json'])cpSync(root+item,root+'dist/'+item,{recursive:true});
cpSync(root+'src/index.html',root+'dist/index.html');
// Keep the standalone livery studio beside the replay in the static output.
// Its relative imports resolve through the same dist tree as the main player.
console.log('Built static Ghost Lab into dist/ (relative URLs support /ghostlab/).');
