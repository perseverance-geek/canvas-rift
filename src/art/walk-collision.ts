import * as THREE from 'three';
import {OBB} from 'three/addons/math/OBB.js';

// Only the sloped stone street needs oriented collision. It still participates in
// the existing Box3 list and axis-by-axis sliding; the first two worlds are unchanged.
class WalkObstacle extends THREE.Box3 {
  private oriented:OBB;
  constructor(oriented:OBB){
    super();this.oriented=oriented;const {center,halfSize,rotation}=oriented,e=rotation.elements;
    const extent=new THREE.Vector3(
      Math.abs(e[0])*halfSize.x+Math.abs(e[3])*halfSize.y+Math.abs(e[6])*halfSize.z,
      Math.abs(e[1])*halfSize.x+Math.abs(e[4])*halfSize.y+Math.abs(e[7])*halfSize.z,
      Math.abs(e[2])*halfSize.x+Math.abs(e[5])*halfSize.y+Math.abs(e[8])*halfSize.z,
    );this.set(center.clone().sub(extent),center.clone().add(extent));
  }
  intersectsBox(box:THREE.Box3){return super.intersectsBox(box)&&this.oriented.intersectsBox3(box);}
}
export function walkObstacle(a:THREE.Vector3,b:THREE.Vector3,width:number){
  const tangent=b.clone().sub(a).normalize(),side=new THREE.Vector3().crossVectors(tangent,new THREE.Vector3(0,1,0)).normalize();
  const normal=new THREE.Vector3().crossVectors(side,tangent).normalize();
  const rotation=new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeBasis(side,normal,tangent.clone().negate()));
  const center=a.clone().add(b).multiplyScalar(.5);center.y-=.625;
  return new WalkObstacle(new OBB(center,new THREE.Vector3(width/2,.625*normal.y+.025,a.distanceTo(b)/2+.625*Math.abs(tangent.y)+.025),rotation));
}
