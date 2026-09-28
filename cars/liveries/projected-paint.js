import * as T from '../../vendor/three.module.js';
export function createProjectedPaint(canvases,anisotropy=4){
  const textures={};
  for(const [name,canvas] of Object.entries(canvases)){const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.flipY=false;t.anisotropy=anisotropy;textures[name]=t;}
  return material=>{
    material.color.set('#ffffff');material.metalness=.48;material.roughness=.32;
    material.onBeforeCompile=shader=>{
      shader.uniforms.mercedesTop={value:textures.top};shader.uniforms.mercedesSide={value:textures.side};shader.uniforms.mercedesOpposite={value:textures.opposite};
      shader.vertexShader='varying vec3 liveryPosition;\nvarying vec3 liveryNormal;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nliveryPosition=position; liveryNormal=normal;');
      shader.fragmentShader='uniform sampler2D mercedesTop;\nuniform sampler2D mercedesSide;\nuniform sampler2D mercedesOpposite;\nvarying vec3 liveryPosition;\nvarying vec3 liveryNormal;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        vec3 lp=liveryPosition, ln=normalize(liveryNormal);
        vec2 tuv=vec2((lp.x+24.0)/48.0,(lp.y+9.0)/18.0);
        vec2 suv=vec2((lp.x+24.0)/48.0,1.0-clamp(-lp.z/10.0,0.0,1.0));
        vec3 topPaint=texture2D(mercedesTop,tuv).rgb;
        vec3 sidePaint=lp.y<0.0 ? texture2D(mercedesSide,suv).rgb : texture2D(mercedesOpposite,suv).rgb;
        float topWeight=smoothstep(0.35,0.75,abs(ln.z));
        diffuseColor.rgb *= mix(sidePaint,topPaint,topWeight);
      `);
    };
    material.customProgramCacheKey=()=> 'constructor-projected-v1';
    return material;
  };
}
