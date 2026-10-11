import * as THREE from 'three';
import {seeded} from './paint';

export function createDaySky(){
  const group=new THREE.Group(),rand=seeded(1954);
  const skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
    vertexShader:`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vDirection;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      void main(){vec3 d=normalize(vDirection);float h=smoothstep(-.12,.85,d.y);
        vec3 c=mix(vec3(.35,.52,.57),vec3(.065,.24,.40),h);
        vec2 p=d.xz/max(.16,d.y+.36)*2.8;
        float body=noise(p)+.35*noise(p*2.7)+.14*noise(p*6.4);
        float cloud=smoothstep(.78,1.14,body)*smoothstep(-.02,.24,d.y)*(1.-smoothstep(.65,.95,d.y));
        c=mix(c,vec3(.79,.83,.81),cloud*.9);
        c+=pow(max(0.,dot(d,normalize(vec3(-.7,.6,.25)))),28.)*vec3(.08,.075,.05);
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(900,40,24),skyMaterial);sky.frustumCulled=false;sky.renderOrder=-10;group.add(sky);
  const geometry=new THREE.SphereGeometry(1,16,10);
  const cloudMaterial=new THREE.ShaderMaterial({clipping:true,uniforms:{uWake:{value:0}},
    vertexShader:`varying vec3 vNormal;varying vec3 vWorld;
      #include <clipping_planes_pars_vertex>
      void main(){vec4 p=instanceMatrix*vec4(position,1.);vWorld=(modelMatrix*p).xyz;
        vec3 n=normal/vec3(dot(instanceMatrix[0].xyz,instanceMatrix[0].xyz),dot(instanceMatrix[1].xyz,instanceMatrix[1].xyz),dot(instanceMatrix[2].xyz,instanceMatrix[2].xyz));
        vNormal=normalize(mat3(instanceMatrix)*n);vec4 mvPosition=modelViewMatrix*p;gl_Position=projectionMatrix*mvPosition;
        #include <clipping_planes_vertex>
      }`,fragmentShader:`uniform float uWake;varying vec3 vNormal;varying vec3 vWorld;
      #include <clipping_planes_pars_fragment>
      void main(){
        #include <clipping_planes_fragment>
        vec3 n=normalize(vNormal);float light=.25+.75*max(0.,dot(n,normalize(vec3(-.7,.6,.3))));
        vec3 c=mix(vec3(.055,.13,.20),vec3(.60,.68,.64),light);
        float curse=exp(-pow(length(vWorld-vec3(-40.,283.,-735.))/28.,2.))*uWake;
        c=mix(c,vec3(.015,.03,.048),curse*.94);
        float mist=1.-exp(-length(cameraPosition-vWorld)*.00065);c=mix(c,vec3(.36,.52,.59),mist*.5);
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const cloud=new THREE.InstancedMesh(geometry,cloudMaterial,175),dummy=new THREE.Object3D();
  for(let bank=0;bank<25;bank++){
    let x:number,y:number,z:number,scale:number;
    if(bank===0){x=-40;y=283;z=-735;scale=12;}
    else if(bank<9){x=(bank%2?1:-1)*(140+rand()*140);y=191+rand()*24;z=-650-rand()*450;scale=24+rand()*16;}
    else{x=(rand()-.5)*1200;y=370+rand()*120;z=-880-rand()*340;scale=30+rand()*24;}
    for(let part=0;part<7;part++){
      const angle=part*2.399;dummy.position.set(x+Math.cos(angle)*scale*.8,y+(part%3)*scale*.17,z+Math.sin(angle)*scale*.4);
      dummy.scale.set(scale*(.65+rand()*.5),scale*(.38+rand()*.24),scale*(.4+rand()*.3));dummy.rotation.set(0,rand()*3,.03);dummy.updateMatrix();cloud.setMatrixAt(bank*7+part,dummy.matrix);
    }
  }
  cloud.computeBoundingSphere();group.add(cloud);
  return {group,material:cloudMaterial,setQuality(low:boolean){cloud.count=low?112:175;},update(camera:THREE.Camera,wake:number){sky.position.copy(camera.position);cloudMaterial.uniforms.uWake.value=wake;}};
}
