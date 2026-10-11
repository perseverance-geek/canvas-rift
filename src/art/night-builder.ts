import * as THREE from 'three';
import {nightMaterial,type Finish} from './night-material.ts';

export function createNightBuilder(group:THREE.Group,obstacles:THREE.Box3[]){
  const boxGeometry=new THREE.BoxGeometry(1,1,1),sphereGeometry=new THREE.SphereGeometry(1,14,10),cylinderGeometry=new THREE.CylinderGeometry(1,1,1,10);
  const materials=new Map<string,THREE.ShaderMaterial>(),batches=new Map<THREE.BufferGeometry,Map<THREE.Material,THREE.Matrix4[]>>();
  const dummy=new THREE.Object3D();
  const foliageGeometry=new THREE.SphereGeometry(1,18,12);
  const leafPositions=foliageGeometry.getAttribute('position') as THREE.BufferAttribute;
  for(let i=0;i<leafPositions.count;i++){
    const x=leafPositions.getX(i),y=leafPositions.getY(i),z=leafPositions.getZ(i);
    const ridge=1+.10*Math.sin(x*19+z*8)*Math.sin(y*14-z*7)+.055*Math.sin(z*31+y*17);
    leafPositions.setXYZ(i,x*ridge,y*ridge,z*ridge);
  }
  foliageGeometry.computeVertexNormals();
  function material(ink:string,finish:Finish='stone',emission=0){
    const key=`${ink}:${finish}:${emission}`;
    if(!materials.has(key))materials.set(key,nightMaterial(ink,finish,emission));
    return materials.get(key)!;
  }
  function instance(geometry:THREE.BufferGeometry,p:THREE.Vector3,size:THREE.Vector3,mat:THREE.Material,rotation=new THREE.Euler()){
    dummy.position.copy(p);dummy.scale.copy(size);dummy.rotation.copy(rotation);dummy.updateMatrix();
    if(!batches.has(geometry))batches.set(geometry,new Map());
    const batch=batches.get(geometry)!;if(!batch.has(mat))batch.set(mat,[]);batch.get(mat)!.push(dummy.matrix.clone());
  }
  function box(x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material,solid=false){
    instance(boxGeometry,new THREE.Vector3(x,y,z),new THREE.Vector3(w,h,d),mat);
    if(solid){group.updateWorldMatrix(true,false);obstacles.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x,y,z),new THREE.Vector3(w,h,d)).applyMatrix4(group.matrixWorld));}
  }
  function obstacle(x:number,y:number,z:number,w:number,h:number,d:number){
    group.updateWorldMatrix(true,false);obstacles.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x,y,z),new THREE.Vector3(w,h,d)).applyMatrix4(group.matrixWorld));
  }
  function foliage(x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material){instance(foliageGeometry,new THREE.Vector3(x,y,z),new THREE.Vector3(w,h,d),mat);}
  function ellipsoid(x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material){instance(sphereGeometry,new THREE.Vector3(x,y,z),new THREE.Vector3(w,h,d),mat);}
  function branch(a:THREE.Vector3,b:THREE.Vector3,r:number,mat:THREE.Material){
    const midpoint=a.clone().add(b).multiplyScalar(.5),length=a.distanceTo(b);
    const rotation=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize()));
    instance(cylinderGeometry,midpoint,new THREE.Vector3(r,length,r),mat,rotation);
  }
  function finish(){
    for(const [geometry,byMaterial] of batches)for(const [mat,matrices] of byMaterial){
      const mesh=new THREE.InstancedMesh(geometry,mat,matrices.length);matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.computeBoundingSphere();mesh.layers.set(1);group.add(mesh);
    }
  }
  return {material,box,obstacle,foliage,ellipsoid,branch,instance,finish,materials};
}
