import * as THREE from 'three';

export const nightLamps=[new THREE.Vector3(24,238,-661),new THREE.Vector3(-40,237,-735),new THREE.Vector3(57,237,-780),new THREE.Vector3(0,319,-807)];
export type Finish='stone'|'leaf'|'metal'|'ground'|'slate';
const finishes:Record<Finish,number>={stone:0,leaf:1,metal:2,ground:3,slate:4};
export function nightMaterial(ink:string,finish:Finish='stone',emission=0){
  return new THREE.ShaderMaterial({clipping:true,side:THREE.DoubleSide,uniforms:{
    uInk:{value:new THREE.Color(ink)},uFinish:{value:finishes[finish]},uEmission:{value:emission},
    uLamps:{value:nightLamps},uWake:{value:0},
  },vertexShader:`varying vec3 vWorld;varying vec3 vNormal;
    #include <clipping_planes_pars_vertex>
    void main(){vec4 p=vec4(position,1.);vec3 n=normal;
      #ifdef USE_INSTANCING
        p=instanceMatrix*p;
        n/=vec3(dot(instanceMatrix[0].xyz,instanceMatrix[0].xyz),dot(instanceMatrix[1].xyz,instanceMatrix[1].xyz),dot(instanceMatrix[2].xyz,instanceMatrix[2].xyz));
        n=mat3(instanceMatrix)*n;
      #endif
      vWorld=(modelMatrix*p).xyz;vNormal=normalize(mat3(modelMatrix)*n);
      vec4 mvPosition=modelViewMatrix*p;gl_Position=projectionMatrix*mvPosition;
      #include <clipping_planes_vertex>
    }`,fragmentShader:`uniform vec3 uInk;uniform float uFinish;uniform float uEmission;uniform vec3 uLamps[4];uniform float uWake;
    varying vec3 vWorld;varying vec3 vNormal;
    #include <clipping_planes_pars_fragment>
    float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
        mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+1.),f.x),f.y),f.z);}
    void main(){
      #include <clipping_planes_fragment>
      vec3 n=normalize(vNormal)*(gl_FrontFacing?1.:-1.);
      float variation=.91+.14*noise(vWorld*1.7)+.055*noise(vWorld*9.);
      if(uFinish<.5){
        float row=floor(vWorld.y/.65),joint=abs(fract((vWorld.x+vWorld.z)*.62+mod(row,2.)*.5)-.5);
        float mortar=1.-smoothstep(.015,.04,abs(fract(vWorld.y/.65)-.5));
        variation*=1.-.11*mortar-.07*(1.-smoothstep(.015,.035,joint));
      }
      if(uFinish>3.5)variation*=.85+.15*smoothstep(.05,.12,abs(fract(vWorld.z*1.7+vWorld.y*.35)-.5));
      float cool=.32+.52*max(0.,dot(n,normalize(vec3(-.55,.5,.4))));
      vec3 color=uInk*variation*cool*vec3(.82,.97,1.14);
      for(int i=0;i<4;i++){
        vec3 light=uLamps[i]-vWorld;float distance=length(light);
        float glow=exp(-distance*distance/180.)*(.3+.7*max(0.,dot(n,normalize(light))));
        color+=uInk*vec3(5.5,3.1,1.1)*glow;
      }
      color+=uInk*uEmission;
      // A lamp casts a small region of DAY into the night, without changing the whole world.
      float impossible=exp(-pow(length(vWorld.xz-vec2(-40.,-735.))/11.,2.))*uWake;
      if(uFinish>2.5&&uFinish<3.5)color=mix(color,vec3(.13,.23,.19)*variation,impossible*.75);
      float mist=1.-exp(-length(cameraPosition-vWorld)*.0006);
      color=mix(color,vec3(.012,.027,.038),mist);
      gl_FragColor=vec4(color,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
}
