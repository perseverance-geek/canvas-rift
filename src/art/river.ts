import * as THREE from 'three';
import { glowTexture, paintTexture, seeded } from './paint';
import { riverStart, riverEnd } from '../journey';
import { createStarRiver, paintedWaterMaterial } from './star-river';

// All coordinates remain in the first world's frame. No camera, input or renderer is created here.
export function createRiver() {
  const group=new THREE.Group();group.name='Rhone · A River of Stars';
  const obstacles:THREE.Box3[]=[];
  const rand=seeded(188809);
  const boxGeometry=new THREE.BoxGeometry(1,1,1);
  const materials=new Map<string,THREE.MeshStandardMaterial>();
  function material(color:string,emission=0){
    const key=`${color}:${emission}`;
    if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({map:paintTexture(color),roughness:.94,emissive:color,emissiveIntensity:emission}));
    return materials.get(key)!;
  }
  const batches=new Map<THREE.Material,THREE.Matrix4[]>();
  const dummy=new THREE.Object3D();
  function box(x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material,solid=false){
    dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);dummy.scale.set(w,h,d);dummy.updateMatrix();
    if(!batches.has(mat))batches.set(mat,[]);batches.get(mat)!.push(dummy.matrix.clone());
    if(solid)obstacles.push(new THREE.Box3(new THREE.Vector3(x-w/2,y-h/2,z-d/2),new THREE.Vector3(x+w/2,y+h/2,z+d/2)));
  }
  // Street paving runs into a wide quay. The bank top is continuous with the old ground.
  box(0,-.35,-138,480,.6,72,material('#365359'));
  const paving=new THREE.Mesh(new THREE.PlaneGeometry(20,65),new THREE.MeshStandardMaterial({map:paintTexture('#293c50','road'),roughness:.8}));
  paving.rotation.x=-Math.PI/2;paving.position.set(1,.01,-141);group.add(paving);
  box(0,-1,riverStart+1,480,2.1,2.5,material('#527372'));
  box(0,-.3,riverEnd-26,480,.5,52,material('#294951'));
  // The town gradually thins, and a few low silhouettes turn the corner along the quay.
  for(const [x,z,w,h,d] of [[-14,-118,13,9,12],[16,-120,14,11,13],[-25,-143,15,7,14],[29,-145,16,9,13],[-53,-156,19,6,14],[59,-153,18,7,15]]){
    box(x,h/2,z,w,h,d,material(x<0?'#5b7971':'#3a596c'),true);
    box(x,h+.12,z,w+.6,.3,d+.6,material('#273f53'),true);
    for(let wx=x-w/2+2;wx<x+w/2;wx+=3)box(wx,3,z-d/2-.06,1.1,1.6,.12,material('#d6ad63',.5));
  }
  const glow=glowTexture();
  for(let i=-8;i<=8;i++){
    const x=i*24+Math.sin(i)*2;
    box(x,2.4,-168,.11,4.8,.11,material('#233f4b'));
    box(x,4.7,-168,.5,.68,.5,material('#f4cf83',1.1));
    box(x,5.1,-168,.8,.15,.8,material('#283f49'));
    const lamp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:'#f7ca75',transparent:true,opacity:.55,depthWrite:false}));
    lamp.position.set(x,4.8,-168);lamp.scale.set(4.5,4.5,1);group.add(lamp);
  }
  // Far-bank lamps draw a low, asymmetric golden horizon; their reflections stay tied to them.
  const farLampX:number[]=[];
  for(let i=0;i<34;i++){
    const x=-220+i*13+rand()*5,z=riverEnd-8-rand()*12,h=3+rand()*13;
    box(x,h/2,z,9+rand()*5,h,8,material(i%3?'#243d53':'#31536a'),true);
    // Pools of gaslight form an uneven rhythm, with dark intervals between them.
    if(i%3===0||i===16){
      farLampX.push(x);box(x,2.1,riverEnd-2,.4,.65,.4,material('#e5aa4d',1.2));
      const lamp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:'#efbd65',transparent:true,opacity:.7,depthWrite:false}));
      lamp.position.set(x,2.4,riverEnd-2);const size=4+(i%4)*1.2;lamp.scale.set(size,size,1);group.add(lamp);
      box(x+2,4.1,z-4.05,1.2,1.5,.08,material('#ac854b',.32));
    }
    if(i%4===0)box(x,h+2,z,1.8,4,2,material('#28465b'));
  }
  // Mooring posts and a little boat establish a human scale before the sky expands.
  for(let i=0;i<9;i++)box(-16+i*4,.45,-171,.24,.9,.24,material('#a58e60'),true);
  const boat=new THREE.Group();boat.position.set(-36,.15,-186);boat.rotation.y=.2;group.add(boat);
  const hull=new THREE.Mesh(new THREE.SphereGeometry(1,16,8),material('#252d37'));hull.scale.set(1.5,.5,5);boat.add(hull);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(1,.06,4,32),material('#b5a479'));rim.rotation.x=-Math.PI/2;rim.scale.set(1.5,5,1);rim.position.y=.22;boat.add(rim);
  for(const x of [-.7,.7]){const oar=new THREE.Mesh(boxGeometry,material('#9b895d'));oar.position.set(x,.3,0);oar.scale.set(.08,.08,6);oar.rotation.y=x;boat.add(oar);}
  for(const {x,z} of [{x:10,z:-160},{x:11.2,z:-160.6}]){
    box(x,.85,z,.48,1.15,.35,material('#243b48'));
    const head=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),material('#c0a680'));head.position.set(x,1.56,z);group.add(head);
  }
  for(const [mat,matrices] of batches){
    const mesh=new THREE.InstancedMesh(boxGeometry,mat,matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.computeBoundingSphere();group.add(mesh);
  }
  const waterMaterial=paintedWaterMaterial(farLampX);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(480,riverStart-riverEnd,64,96),waterMaterial);
  water.rotation.x=-Math.PI/2;water.position.set(0,-.12,(riverStart+riverEnd)/2);group.add(water);
  const painting=createStarRiver(farLampX);group.add(painting.group);
  return {group,obstacles,starCenters:painting.starCenters,seamPosition:painting.seamPosition,setQuality:painting.setQuality,update(time:number,camera:THREE.Camera){
    waterMaterial.uniforms.uTime.value=time;painting.update(time,camera);
    boat.position.y=.15+Math.sin(time*.6)*.045;
  }};
}
