import * as THREE from 'three';
import {createNightBuilder} from './night-builder.ts';

export const houseEntrance=new THREE.Vector3(0,320,-797);
export function createInvertedHouse(obstacles:THREE.Box3[]){
  const group=new THREE.Group();group.name='The house hanging from its own courtyard';group.position.set(0,345,-835);group.rotation.z=Math.PI;
  const b=createNightBuilder(group,obstacles),wall=b.material('#52605e'),trim=b.material('#89928a'),slate=b.material('#1e343d','slate'),dark=b.material('#172c32'),window=b.material('#dfb477','metal',.95);
  // Four wings enclose a real open atrium. The downward door remains a 10m wide flight passage.
  for(const z of [-36,36]){
    for(const x of [-17,17])b.box(x,15,z,24,30,2.2,wall,true);
    b.box(0,5,z,10,10,2.2,wall,true);b.box(0,29,z,10,2,2.2,wall,true);
    b.box(0,11,z,12,.7,3.3,trim,true);
    for(const x of [-24,-16,-8,8,16,24])for(const y of [7,23]){
      b.box(x,y,z+(z>0?1.15:-1.15),3.2,5.6,.16,(Math.abs(x)+y)%3===0?window:dark);
      b.box(x,y+3,z+(z>0?1.3:-1.3),4.6,.5,.55,trim);
      b.box(x,y,z+(z>0?1.3:-1.3),.12,5.7,.22,dark);
      b.box(x,y,z+(z>0?1.3:-1.3),3.3,.16,.22,dark);
    }
  }
  for(const x of [-29,29]){
    b.box(x,15,0,2,30,72,wall,true);
    for(const z of [-28,-16,-4,8,20,28])for(const y of [7,23]){
      b.box(x+(x>0?1.06:-1.06),y,z,.15,5.6,3.2,(Math.abs(z)+y)%3===0?window:dark);
      b.box(x+(x>0?1.2:-1.2),y+3,z,.6,.45,4.5,trim);
    }
  }
  for(const y of [0,15,30]){
    // Floors are galleries around the void; none seals the courtyard or the door.
    b.box(-22,y,0,14,.7,70,trim,true);b.box(22,y,0,14,.7,70,trim,true);
    b.box(0,y,-29,30,.7,14,trim,true);b.box(0,y,29,30,.7,14,trim,true);
    for(const x of [-30,30])b.box(x,y,0,1.2,.6,75,trim);
    for(const z of [-38,38])b.box(0,y,z,60,.6,1.2,trim);
  }
  // Mansard wings point down after the whole building is inverted, with an open central oculus.
  function roof(x:number,z:number,w:number,d:number){
    const shape=new THREE.Shape([new THREE.Vector2(-w/2,0),new THREE.Vector2(-w*.28,8),new THREE.Vector2(w*.28,8),new THREE.Vector2(w/2,0)]);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,steps:1});
    const mesh=new THREE.Mesh(geometry,slate);mesh.position.set(x,30,z-d/2);group.add(mesh);
    b.box(x,33,z,w*.55,6,d,slate,true);
  }
  roof(-22,0,19,78);roof(22,0,19,78);roof(0,-29,28,16);roof(0,29,28,16);
  // Narrow chimneys and finials suspend the silhouette rather than duplicating the ground villa.
  for(const x of [-22,22])for(const z of [-27,27]){
    b.box(x,42,z,2.3,12,2.5,dark,true);b.box(x,48,z,3.2,.8,3.4,trim);
    b.ellipsoid(x,49,z,.6,1.3,.6,trim);
  }
  // The atrium's tree grows downward from the ceiling: an inverted chandelier made of living night.
  const bark=b.material('#728077'),leaf=b.material('#173d32','leaf'),carpet=b.material('#354542','ground');
  b.branch(new THREE.Vector3(0,1,0),new THREE.Vector3(-1,17,0),.65,bark);
  b.obstacle(-.5,9,0,1.8,17,1.8);
  for(let i=0;i<17;i++){
    const a=i*2.399,end=new THREE.Vector3(Math.cos(a)*(4+i%3),20+(i%4)*1.1,Math.sin(a)*(5+i%2));
    b.branch(new THREE.Vector3(-1,15,0),end,.13+(i%3)*.035,bark);
    b.foliage(end.x,end.y,end.z,2.8,1.8,2.9,leaf);
  }
  // Recessed arcades, ceiling-mounted furniture and a discontinuous staircase reward close flight.
  for(const x of [-14,14])for(const z of [-20,-8,8,20]){
    b.box(x,14,z,.65,28,.65,trim,true);b.box(x,1,z,1.3,1.2,1.3,trim);b.box(x,29,z,1.4,1,1.4,trim);
  }
  for(const x of [-22,22]){
    b.box(x,.6,0,9,.2,48,carpet);
    for(const z of [-20,0,20]){
      b.box(x,3.2,z,4,.35,2.8,dark);
      for(const dx of [-1.6,1.6])for(const dz of [-1,1])b.box(x+dx,1.7,z+dz,.12,3,.12,trim);
      for(const dz of [-4,4]){
        b.box(x,1.8,z+dz,1.5,.25,1.5,trim);b.box(x,2.6,z+dz-.65,1.5,1.5,.2,dark);
        for(const dx of [-.6,.6])for(const dzz of [-.6,.6])b.box(x+dx,.9,z+dz+dzz,.1,1.8,.1,dark);
      }
    }
  }
  for(let i=0;i<15;i++){
    const t=i/14,angle=t*Math.PI*1.7,xx=19+Math.cos(angle)*3,zz=-13+Math.sin(angle)*4;
    b.box(xx,1+t*25,zz,4,.35,2.2,trim,true);
  }
  // Upper and lower railings frame the open day well without closing its flight path.
  for(const y of [2,17])for(const x of [-15,15])for(let z=-20;z<=20;z+=4)b.box(x,y,z,.09,3,.09,dark);
  for(const y of [3.5,18.5])for(const x of [-15,15])b.box(x,y,0,.1,.1,42,trim);
  b.finish();group.traverse(o=>o.layers.set(1));
  return {group,materials:b.materials};
}
