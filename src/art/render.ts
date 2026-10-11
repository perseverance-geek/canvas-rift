import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SpatialPass } from './spatial-pass';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function createRenderer(canvas: HTMLCanvasElement, scene: THREE.Scene, camera: THREE.Camera,output?:{width:number;height:number;pixelRatio:number}) {
  const renderer = new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(output?.pixelRatio??Math.min(devicePixelRatio,1.5));
  renderer.setSize(output?.width??innerWidth,output?.height??innerHeight,!output);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  const composer = new EffectComposer(renderer);
  composer.renderTarget1.stencilBuffer=true;composer.renderTarget2.stencilBuffer=true;
  composer.addPass(new SpatialPass(scene,camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.35,.65,.85);
  composer.addPass(bloom);
  const canvasPass = new ShaderPass({
    uniforms:{tDiffuse:{value:null},uResolution:{value:new THREE.Vector2(innerWidth,innerHeight)},uTime:{value:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 uResolution;uniform float uTime;varying vec2 vUv;
      float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
      void main(){
        vec2 uv=vUv;vec2 texel=1./uResolution;
        vec3 c=texture2D(tDiffuse,uv).rgb;
        float grain=hash(floor(uv*uResolution))-.5;
        float weave=sin(uv.x*uResolution.x*2.4)*sin(uv.y*uResolution.y*2.1);
        c*=1.+grain*.035+weave*.012;
        vec3 n=texture2D(tDiffuse,uv+texel*1.5).rgb;
        c+=clamp(c-n,-.03,.03)*.15;
        float vignette=1.-smoothstep(.18,.8,distance(uv,vec2(.5,.48)));
        c*=mix(.76,1.,vignette);gl_FragColor=vec4(c,1.);
      }`
  });
  composer.addPass(canvasPass);composer.addPass(new OutputPass());
  let low = false;
  function resize(){
    const width=output?.width??innerWidth,height=output?.height??innerHeight;
    renderer.setPixelRatio(output?.pixelRatio??Math.min(devicePixelRatio,low?1:1.5));
    renderer.setSize(width,height,!output);composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(width,height);
    canvasPass.uniforms.uResolution.value.set(width*renderer.getPixelRatio(),height*renderer.getPixelRatio());
  }
  return {renderer,render:()=>composer.render(),resize,setQuality(value:boolean){low=value;bloom.enabled=!low;resize();}};
}
