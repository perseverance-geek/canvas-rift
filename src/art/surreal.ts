import * as THREE from 'three';
import {seeded} from './paint';
import {createDaySky} from './day-sky';
import {createNightBuilder} from './night-builder';
import {createInvertedHouse,houseEntrance} from './inverted-house';
import {createSkyWalk} from './sky-walk';

function islandGeometry(rx:number,rz:number){
  const positions:number[]=[],indices:number[]=[],segments=80;
  const rings=[[.001,231],[.64,231],[.9,231],[1,227],[.91,216],[.56,200],[.001,195]];
  for(const [radius,y] of rings)for(let i=0;i<=segments;i++){
    const angle=i/segments*Math.PI*2,edge=1+.017*Math.sin(angle*7)+.012*Math.sin(angle*13);
    positions.push(Math.cos(angle)*rx*radius*edge,y,Math.sin(angle)*rz*radius*edge);
  }
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){
    const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}

export function createSurrealWorld(){
  const group=new THREE.Group();group.name='The Other Side of Day · a suspended nocturne';
  const obstacles:THREE.Box3[]=[],b=createNightBuilder(group,obstacles),rand=seeded(195409);
  const sky=createDaySky();group.add(sky.group);
  const ground=b.material('#263d36','ground'),stone=b.material('#44514b'),edge=b.material('#67736c'),metal=b.material('#23383c','metal'),light=b.material('#f4c788','metal',1.15);
  const garden=new THREE.Mesh(islandGeometry(113,157),ground);garden.position.z=-743;group.add(garden);
  // Conservative slices follow the curved island. The rim remains a flying approach, not an invisible rectangular wall.
  for(let i=-7;i<=7;i++){
    const z=i*18,halfWidth=96*Math.sqrt(Math.max(0,1-Math.pow((Math.abs(z)+9)/141,2)));
    b.obstacle(0,225,-743+z,halfWidth*2,12,18);
  }
  // A narrow landing ribbon joins the actual aperture without resetting the visitor's eye height.
  b.box(5,232,-585,24,2,55,stone,true);
  for(const x of [-7,17]){b.box(x,233,-585,.4,1.7,53,edge);}
  const path=new THREE.CatmullRomCurve3([new THREE.Vector3(5,233.05,-610),new THREE.Vector3(25,233.05,-657),new THREE.Vector3(19,233.05,-716),new THREE.Vector3(-12,233.05,-766)]);
  function ribbon(offset:number,width:number,mat:THREE.Material){
    const positions:number[]=[],indices:number[]=[],up=new THREE.Vector3(0,1,0),side=new THREE.Vector3();
    for(let i=0;i<=80;i++){
      const t=i/80,p=path.getPoint(t);side.crossVectors(path.getTangent(t),up).normalize();
      for(const edge of [-.5,.5]){const point=p.clone().addScaledVector(side,offset+edge*width);positions.push(point.x,point.y,point.z);}
      if(i<80){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();group.add(new THREE.Mesh(g,mat));
  }
  ribbon(0,10,b.material('#394749','ground'));ribbon(-5.5,.8,edge);ribbon(5.5,.8,edge);
  for(let i=0;i<=32;i++){const p=path.getPoint(i/32);b.obstacle(p.x,232.1,p.z,10,1.9,6);}
  // Raised road slabs have matching collision, with a garden floor beneath them.
  for(const [x,z] of [[24,-661],[-40,-735],[57,-780],[3,-715],[13,-628]]){
    b.box(x,235.5,z,.22,8,.22,metal,true);b.box(x,239.4,z,1.1,1.6,1.1,light);
    b.box(x,240.4,z,1.65,.3,1.65,metal);b.box(x,238.3,z,1.5,.25,1.5,metal);
    for(const dx of [-.55,.55])for(const dz of [-.55,.55])b.box(x+dx,239.4,z+dz,.09,1.7,.09,metal);
  }
  function villa(x:number,z:number,w:number,d:number,h:number){
    const wall=b.material('#647167'),trim=b.material('#9c9d83'),slate=b.material('#243e46','slate'),glass=b.material('#deb17b','metal',.7),dark=b.material('#142a30');
    b.box(x,231+h/2,z,w,h,d,wall,true);
    for(const y of [231.5,231+h,231+h-1])b.box(x,y,z,w+1,.45,d+1,trim);
    const shape=new THREE.Shape([new THREE.Vector2(-w/2-1,0),new THREE.Vector2(0,7),new THREE.Vector2(w/2+1,0)]);
    const roof=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:d+2,bevelEnabled:false}),slate);roof.position.set(x,231+h,z-d/2-1);group.add(roof);
    b.box(x,234+h,z,w*.65,6,d,slate,true);
    for(const yy of [236,245])for(let dx=-w/2+3;dx<w/2;dx+=5){
      b.box(x+dx,yy,z+d/2+.15,1.8,3,.25,(Math.round(dx)+yy)%3===0?glass:dark);
      b.box(x+dx,yy+1.8,z+d/2+.35,2.7,.4,.6,trim);b.box(x+dx,yy-1.7,z+d/2+.3,2.6,.3,.6,trim);
      b.box(x+dx,yy,z+d/2+.35,.1,3,.2,dark);
      for(const sx of [-1.5,1.5])b.box(x+dx+sx,yy,z+d/2+.2,.7,3.3,.15,dark);
    }
    b.box(x+4,232.8,z+d/2+1,6,3.6,4,stone,true);b.box(x+4,235.8,z+d/2+.1,2.5,5,.2,dark);
    b.box(x-w*.25,239+h,z,1.5,7,2.1,wall,true);b.box(x-w*.25,243+h,z,2.3,.6,2.8,trim);
  }
  villa(-63,-736,29,24,21);villa(-87,-744,16,18,15);villa(72,-796,20,19,17);
  const bark=b.material('#48584b'),leaves=b.material('#15332b','leaf'),darkLeaf=b.material('#0c2525','leaf');
  function tree(x:number,z:number,h:number){
    const base=new THREE.Vector3(x,231,z),fork=base.clone().add(new THREE.Vector3(0,h*.55,0));
    b.branch(base,fork,.52,bark);b.box(x,237,z,1.3,12,1.3,bark,true);
    for(let i=0;i<25;i++){
      const angle=i*2.399,width=h*.28;
      const end=new THREE.Vector3(x+Math.cos(angle)*width*(.35+rand()*.65),231+h*(.55+rand()*.40),z+Math.sin(angle)*width*.65);
      b.branch(fork,end,.18+rand()*.18,bark);
      b.foliage(end.x,end.y,end.z,width*(.30+rand()*.35),h*(.08+rand()*.065),width*(.28+rand()*.27),i%3?leaves:darkLeaf);
    }
  }
  tree(-43,-676,44);tree(-88,-788,34);tree(60,-711,37);tree(43,-836,30);
  // Cypress profiles use a shaped lathe, with asymmetry in placement, rather than cones.
  const profile:Array<THREE.Vector2>=[];
  for(let i=0;i<=20;i++){const t=i/20;profile.push(new THREE.Vector2((.15+.8*Math.sin(Math.PI*t)*Math.pow(1-t,.25))*(1+.05*Math.sin(i*2.3)),t));}
  const cypress=new THREE.LatheGeometry(profile,12);
  for(const [x,z,h] of [[-29,-627,26],[-82,-697,33],[-37,-818,35],[87,-759,30],[73,-849,25],[-64,-841,29]]){
    b.instance(cypress,new THREE.Vector3(x,231,z),new THREE.Vector3(3.8,h,3.8),darkLeaf);b.box(x,239,z,.9,16,.9,bark,true);
  }
  // A quiet water court reflects a DAY that never reaches its banks. This is pigment, not a second scene capture.
  const waterMaterial=new THREE.ShaderMaterial({clipping:true,uniforms:{uTime:{value:0}},
    vertexShader:`varying vec2 vUv;varying vec3 vWorld;
      #include <clipping_planes_pars_vertex>
      void main(){vUv=uv;vWorld=(modelMatrix*vec4(position,1.)).xyz;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
        #include <clipping_planes_vertex>
      }`,fragmentShader:`uniform float uTime;varying vec2 vUv;varying vec3 vWorld;
      #include <clipping_planes_pars_fragment>
      void main(){
        #include <clipping_planes_fragment>
        vec2 p=(vUv-.5)*2.;float ripple=sin(p.y*83.+sin(p.x*24.+uTime*.08)*.3)*.008;
        vec3 color=mix(vec3(.008,.022,.03),vec3(.075,.15,.18),smoothstep(-.6,.5,p.y));
        float clouds=sin(p.x*8.+sin(p.y*5.))*sin(p.y*7.-p.x*3.);color+=smoothstep(.25,.8,clouds)*vec3(.04,.052,.054);
        float gold=exp(-pow((p.x+.42+sin(p.y*65.+uTime*.1)*.008)/.018,2.))*(.45+.55*sin(p.y*79.));
        color+=gold*vec3(.28,.16,.047);color+=ripple;
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const pool=new THREE.Mesh(new THREE.CircleGeometry(1,80),waterMaterial);pool.rotation.x=-Math.PI/2;pool.scale.set(47,32,1);pool.position.set(-2,231.35,-798);group.add(pool);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(1,.018,6,96),edge);rim.rotation.x=-Math.PI/2;rim.scale.set(48,33,25);rim.position.set(-2,231.6,-798);group.add(rim);
  for(const z of [-773,-807]){b.box(-54,232,z,9,1.4,8,stone,true);b.box(-54,233,z,10,.35,9,edge);}
  // A hovering architectural fragment makes the void below navigable and gives the island its own silhouette.
  const remote=new THREE.Mesh(islandGeometry(34,43),stone);remote.position.set(150,37,-923);group.add(remote);
  for(let i=0;i<5;i++)b.box(126+i*12,273,-929,1.2,14,1.2,edge);
  b.box(150,281,-929,55,1.4,2,edge);b.box(150,266,-929,55,1.2,14,stone,true);
  const house=createInvertedHouse(obstacles);group.add(house.group);
  const walk=createSkyWalk(obstacles);group.add(walk.group);
  let wake=0,previousTime=0;
  const lamp=new THREE.Vector3(-40,237,-735),atrium=new THREE.Vector3(0,327,-835);
  const animatedMaterials=[...b.materials.values(),...house.materials.values(),...walk.materials.values()];
  b.finish();group.traverse(object=>object.layers.set(1));
  return {group,obstacles,landmarks:{houseEntrance,lamp,atrium},setQuality:sky.setQuality,update(time:number,camera:THREE.Camera){
    const target=1-THREE.MathUtils.smoothstep(camera.position.distanceTo(lamp),10,29);
    wake=THREE.MathUtils.damp(wake,target,2.8,Math.min(.05,Math.max(0,time-previousTime)));previousTime=time;
    sky.update(camera,wake);waterMaterial.uniforms.uTime.value=time;
    for(const mat of animatedMaterials){mat.uniforms.uWake.value=wake;}
  }};
}
