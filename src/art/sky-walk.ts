import * as THREE from 'three';
import {createNightBuilder} from './night-builder.ts';
import {walkObstacle} from './walk-collision.ts';

// A street bends into the sky and arrives at the upside-down house's rear door.
// It has volume and collision, but does not force motion, roll the camera or add gravity.
export function createSkyWalk(obstacles:THREE.Box3[]){
  const group=new THREE.Group(),b=createNightBuilder(group,obstacles);
  const stone=b.material('#53645d'),rail=b.material('#87948c','metal'),gold=b.material('#dfb782','metal',.45);
  const curve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-54,233,-773),new THREE.Vector3(-76,249,-807),new THREE.Vector3(-93,285,-850),
    new THREE.Vector3(-74,323,-888),new THREE.Vector3(-32,338,-894),new THREE.Vector3(0,327,-885),new THREE.Vector3(0,321,-862),
  ]);
  const positions:number[]=[],indices:number[]=[],segments=180,up=new THREE.Vector3(0,1,0),side=new THREE.Vector3();
  const left:THREE.Vector3[]=[],right:THREE.Vector3[]=[];
  for(let i=0;i<=segments;i++){
    const t=i/segments,p=curve.getPoint(t);side.crossVectors(curve.getTangent(t),up).normalize();
    for(const [width,depth] of [[-4,0],[4,0],[-4,-1.25],[4,-1.25]]){
      const q=p.clone().addScaledVector(side,width);q.y+=depth;positions.push(q.x,q.y,q.z);
    }
    left.push(p.clone().addScaledVector(side,-3.8).addScaledVector(up,1.1));right.push(p.clone().addScaledVector(side,3.8).addScaledVector(up,1.1));
    if(i<segments){const a=i*4,c=a+4;indices.push(a,c,a+1,a+1,c,c+1,a+2,a+3,c+2,a+3,c+3,c+2,a,a+2,c,a+2,c+2,c,a+1,c+1,a+3,a+3,c+1,c+3);}
    if(i%3===0&&i<segments){
      const q=curve.getPoint((i+3)/segments);
      obstacles.push(walkObstacle(p,q,8));
    }
    if(i%12===0){
      for(const direction of [-1,1]){
        const q=p.clone().addScaledVector(side,direction*3.8);b.box(q.x,q.y+.6,q.z,.1,1.2,.1,rail);
        if(i%36===0)b.ellipsoid(q.x,q.y+1.2,q.z,.17,.25,.17,gold);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();group.add(new THREE.Mesh(geometry,stone));
  for(const points of [left,right])group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),160,.09,5,false),rail));
  b.finish();group.traverse(o=>o.layers.set(1));return {group,curve,materials:b.materials};
}
