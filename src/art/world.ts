import * as THREE from 'three';
import { glowTexture, paintTexture, seeded, signTexture } from './paint';
import { createRiver } from './river';
import { riverWeight } from '../journey';
import { createSurrealWorld } from './surreal';
import { createRift } from './rift';

export interface ArtWorld {
  scene: THREE.Scene;
  obstacles: THREE.Box3[];
  update: (time: number, awakening: number, camera: THREE.Camera) => void;
  brushPosition: THREE.Vector3;
  starCenters: THREE.Vector3[];
  seamPosition: THREE.Vector3;
  setQuality: (low: boolean) => void;
  thirdLandmarks: {houseEntrance:THREE.Vector3;lamp:THREE.Vector3;atrium:THREE.Vector3};
}

export function createWorld(): ArtWorld {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#102643');
  scene.fog = new THREE.FogExp2('#183b51', .0085);
  const obstacles: THREE.Box3[] = [];
  const rand = seeded(1888);
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  function mat(color: string, wood = false, emission = 0) {
    const key = `${color}:${wood}:${emission}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ map: paintTexture(color, wood ? 'wood' : 'wall'), roughness: .96, emissive: color, emissiveIntensity: emission }));
    return materials.get(key)!;
  }
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  function box(x: number, y: number, z: number, w: number, h: number, d: number, material: THREE.Material, group: THREE.Object3D = scene) {
    const mesh = new THREE.Mesh(boxGeo, material); mesh.position.set(x, y, z); mesh.scale.set(w, h, d); group.add(mesh); return mesh;
  }
  function solid(x: number, z: number, w: number, h: number, d: number, material: THREE.Material) {
    box(x, h / 2, z, w, h, d, material);
    obstacles.push(new THREE.Box3(new THREE.Vector3(x-w/2, 0, z-d/2), new THREE.Vector3(x+w/2, h+.3, z+d/2)));
  }
  scene.add(new THREE.HemisphereLight('#7fa8d5', '#786042', 1.3));
  const moon = new THREE.DirectionalLight('#a9c8ff', 1.5); moon.position.set(-20, 40, -30); scene.add(moon);
  const warm = new THREE.PointLight('#ffc95c', 100, 31, 1.3); warm.position.set(-3.5, 5, 4); scene.add(warm);
  const warm2 = new THREE.PointLight('#ffba48', 85, 26, 1.3); warm2.position.set(-3.5, 4, -10); scene.add(warm2);

  const road = new THREE.Mesh(new THREE.PlaneGeometry(24, 160), new THREE.MeshStandardMaterial({ map: paintTexture('#293c50', 'road'), roughness: .74, metalness: .14 }));
  road.rotation.x = -Math.PI / 2; road.position.set(1, -.02, -43); scene.add(road);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,190),mat('#173c3e'));
  ground.rotation.x=-Math.PI/2;ground.position.set(0,-.08,-43);scene.add(ground);
  box(-6, .08, -46, 3, .16, 154, mat('#94895a')); box(7, .08, -46, 2, .16, 154, mat('#425b62'));

  const dark = mat('#132d3a', true), shutters = mat('#284944', true), trim = mat('#bd9656'), roof = mat('#283d46');
  const glass = mat('#e6b45c', false, .65);
  function frontWindows(x: number, z: number, w: number, h: number, d: number, color: string) {
    const wall = mat(color);
    solid(x, z, w, h, d, wall);
    box(x, h+.12, z, w+.4, .35, d+.4, roof);
    box(x, h-.3, z+d/2+.08, w+.35, .22, .23, trim);
    for (let y = 3.3; y < h-1; y += 3.4) {
      for (let xx = x-w/2+1.35; xx < x+w/2-1; xx += 2.5) {
        const lit = rand() > .7;
        box(xx, y, z+d/2+.04, 1, 1.8, .1, lit ? glass : dark);
        box(xx-.72, y, z+d/2+.12, .42, 1.85, .16, shutters);
        box(xx+.72, y, z+d/2+.12, .42, 1.85, .16, shutters);
        box(xx, y-.95, z+d/2+.17, 1.75, .16, .35, trim);
        box(xx, y, z+d/2+.13, .055, 1.8, .13, trim);
        box(xx, y+.12, z+d/2+.13, 1, .06, .12, trim);
      }
    }
    // Street-facing windows remain fully modeled when the visitor leaves the opening view.
    const side = x < 0 ? x+w/2 : x-w/2;
    for (let y = 3.4; y < h-1; y += 3.4) {
      for (let zz = z-d/2+1.7; zz < z+d/2-.6; zz += 3) {
        box(side, y, zz, .13, 1.8, 1, rand()>.75 ? glass : dark);
        box(side+(x<0?.12:-.12), y, zz-.68, .17, 1.8, .37, shutters);
        box(side+(x<0?.12:-.12), y, zz+.68, .17, 1.8, .37, shutters);
        box(side, y-.96, zz, .4, .14, 1.8, trim);
      }
    }
    box(side, 1.1, z+1, .16, 2.2, 1.3, dark);
    for (let p = 0; p < 3; p++) box(x-w/2+.5+p*.5, h+1.1, z-.7, .4, 2, .5, wall);
  }

  frontWindows(-10.3, -3, 10.6, 12.8, 21, '#cda243');
  for (let i = 0; i < 7; i++) {
    const z = -22-i*13;
    frontWindows(-10.5, z, 11, 11+rand()*6, 11.8, ['#9b9661','#567b78','#74815d','#49646c'][i%4]);
    frontWindows(13, 5-i*14, 12, 13+rand()*8, 12.8, ['#426578','#426575','#6a7672','#415568'][i%4]);
  }
  // Terrace windows, canopy, scalloped hem and a painted sign.
  for (let z = 5; z > -13; z -= 3) {
    box(-4.93, 1.7, z, .18, 3.1, 2.25, dark);
    box(-4.8, 1.7, z, .17, 3, .08, trim);
    box(-4.78, 1.7, z+1, .15, 3, .12, trim);
  }
  const canopy = mat('#e6b94f', false, .12);
  const awning = box(-3.1, 4.25, -2.5, 4.2, .22, 20.4, canopy); awning.rotation.z = -.13;
  for (let z = -12.2; z < 8; z += .48) {
    box(-1.05, 3.86, z, .16, .55, .43, rand()>.5 ? mat('#dbac3f') : mat('#f6ce67'));
  }
  for (const z of [-12.3,-5.8,.7,7.6]) box(-1.1, 1.9, z, .12, 3.8, .12, mat('#a28740'));
  const sign = box(-4.75, 3.8, 7.58, 6.5, .95, .15, new THREE.MeshStandardMaterial({ map: signTexture(), emissive:'#d6a244', emissiveIntensity:.18 }));
  sign.position.x = -9.8;

  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
  function cyl(x: number, y: number, z: number, radius: number, height: number, material: THREE.Material, group: THREE.Object3D = scene) {
    const mesh = new THREE.Mesh(cylinder, material); mesh.scale.set(radius, height, radius); mesh.position.set(x,y,z); group.add(mesh); return mesh;
  }
  const furniture = mat('#b88c43', true), tabletop = mat('#ddc580'), iron = mat('#253c37');
  function chair(x: number,z: number, angle: number) {
    const g = new THREE.Group(); g.position.set(x,0,z); g.rotation.y = angle; scene.add(g);
    box(0,.58,0,.62,.09,.6,furniture,g);
    for (const xx of [-.25,.25]) for (const zz of [-.24,.24]) box(xx,.3,zz,.055,.6,.055,furniture,g);
    for (const xx of [-.26,.26]) box(xx,.94,-.26,.06,.9,.06,furniture,g);
    box(0,1.14,-.26,.6,.13,.05,furniture,g); box(0,.95,-.26,.6,.09,.05,furniture,g);
  }
  for (let i = 0; i < 9; i++) {
    const z = 6.6-i*2.2, x = i%2 ? -2.8 : -.55;
    cyl(x,.92,z,.6,.11,tabletop); cyl(x,.45,z,.065,.85,iron); cyl(x,.08,z,.32,.06,iron);
    chair(x+.93,z,Math.PI/2); chair(x-.75,z+.35,-Math.PI/2);
    cyl(x,.995,z,.06,.07,mat('#ede1b4')); cyl(x+.21,1,z-.12,.04,.09,glass);
  }
  const glow = glowTexture();
  function lamp(x: number,z: number) {
    cyl(x,2.5,z,.07,5,iron); cyl(x,.15,z,.22,.3,iron);
    box(x+.28,4.8,z,.64,.055,.06,iron);
    const lantern = box(x+.5,4.58,z,.32,.55,.32,mat('#ffe0a1',false,1.5));
    box(x+.5,4.89,z,.5,.12,.5,iron); box(x+.5,4.24,z,.42,.08,.42,iron);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:'#ffd184',transparent:true,depthWrite:false,opacity:.4,blending:THREE.AdditiveBlending}));
    sprite.position.copy(lantern.position); sprite.scale.set(2.7,2.7,1); scene.add(sprite);
  }
  for (let i=0;i<6;i++) {lamp(5.8,6-i*18); if(i>0) lamp(-3.9,-15-i*18);}
  // Small painterly figures give the street a readable human scale.
  const headGeo = new THREE.SphereGeometry(.14,8,6);
  for (const [x,z] of [[2,-10],[3,-17],[1,-31],[4,-43],[-.1,-22]]) {
    const coat = mat(rand()>.5?'#263d4d':'#5e6656');
    cyl(x,.9,z,.19,.8,coat);
    box(x-.1,.3,z,.11,.6,.14,dark); box(x+.1,.3,z,.11,.6,.14,dark);
    const head = new THREE.Mesh(headGeo,mat('#b59665')); head.position.set(x,1.45,z); scene.add(head);
  }
  // Cypress silhouettes and greenery behind the architecture.
  const cone = new THREE.ConeGeometry(1,1,9);
  for(let i=0;i<20;i++) {
    const tree = new THREE.Mesh(cone,mat(i%2?'#204349':'#2a514a'));
    tree.position.set(i%2?-20:23,7+rand()*3,10-i*7); tree.scale.set(2+rand(),14+rand()*9,2+rand()); scene.add(tree);
  }

  const skyMat = new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{uTime:{value:0},uRiver:{value:0}},vertexShader:`
    varying vec3 vPosition;
    void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
  `,fragmentShader:`
    varying vec3 vPosition; uniform float uTime;uniform float uRiver;
    void main(){
      vec3 p=normalize(vPosition);float a=atan(p.z,p.x),h=p.y;
      float bands=sin(a*13.+sin(h*19.+a*3.)*1.8+h*39.-uTime*.06);
      float strokes=sin(a*73.+h*35.+sin(a*19.)*3.)*sin(h*101.+a*25.);
      vec3 c=mix(vec3(.012,.033,.085),vec3(.003,.008,.04),smoothstep(-.12,.8,h));
      c+=vec3(.005,.018,.065)*smoothstep(.1,.95,bands)*smoothstep(.05,.7,h);
      c+=strokes*.0015;
      float tide=sin(h*38.+a*2.+sin(a*3.)*.3-uTime*.035);
      vec3 river=mix(vec3(.008,.042,.09),vec3(.002,.008,.033),smoothstep(-.1,.85,h));
      river+=vec3(.003,.009,.018)*smoothstep(.2,.9,tide);
      float strata=sin(h*117.+sin(a*7.+h*23.)*1.4)*sin(a*41.+h*19.);
      river+=vec3(.0015,.003,.004)*strata;
      river+=vec3(.002,.009,.008)*smoothstep(.4,.95,sin(a*3.+h*17.))*smoothstep(-.15,.2,h);
      c=mix(c,river,uRiver);gl_FragColor=vec4(c,1.);
    }
  `});
  const sky = new THREE.Mesh(new THREE.SphereGeometry(230,48,32),skyMat); scene.add(sky);
  const brushGeo = new THREE.PlaneGeometry(1,1);
  const skyBrush = new THREE.InstancedMesh(brushGeo,new THREE.MeshBasicMaterial({color:'#5d8b9a',side:THREE.DoubleSide,transparent:true,opacity:.22,depthWrite:false}),2100);
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  for(let i=0;i<2100;i++) {
    const a=rand()*Math.PI*2, h=.08+rand()*.94, r=160;
    dummy.position.set(Math.cos(a)*r*Math.sqrt(1-h*h),h*r,Math.sin(a)*r*Math.sqrt(1-h*h));
    dummy.lookAt(0,0,0); dummy.rotateZ(Math.sin(a*4+h*8)*.45); dummy.scale.set(1.5+rand()*4,.15+rand()*.4,1); dummy.updateMatrix();
    skyBrush.setMatrixAt(i,dummy.matrix);color.setHSL(.53+rand()*.1,.3+rand()*.25,.23+rand()*.2);skyBrush.setColorAt(i,color);
  }
  scene.add(skyBrush);
  const stars: THREE.Sprite[]=[];
  for(let i=0;i<65;i++) {
    const star = new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:i%3?'#fff0ad':'#9acbff',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
    const x=(rand()-.5)*230,y=24+rand()*100,z=-70-rand()*100;
    star.position.set(x,y,z);const s=2+rand()*4;star.scale.set(s,s,1);star.userData.size=s; scene.add(star);stars.push(star);
    if(i<22) {
      const halo = new THREE.Mesh(new THREE.TorusGeometry(s*.38,.055,3,32),new THREE.MeshBasicMaterial({color:'#c8b979',transparent:true,opacity:.4}));
      halo.position.copy(star.position);halo.lookAt(0,4,22);scene.add(halo);
      const core = new THREE.Mesh(new THREE.SphereGeometry(s*.075,8,6),mat('#f7e2a1',false,.8)); core.position.copy(star.position);scene.add(core);
    }
  }
  const moonDisk = new THREE.Mesh(new THREE.SphereGeometry(2.3,24,16),mat('#e9d7a0',false,.7)); moonDisk.position.set(-27,40,-95);scene.add(moonDisk);
  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:'#f7d790',transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending}));moonGlow.position.copy(moonDisk.position);moonGlow.scale.set(17,17,1);scene.add(moonGlow);
  // Broken, tangential strokes make halos feel painted rather than digitally circular.
  const haloStrokes = new THREE.InstancedMesh(brushGeo,new THREE.MeshBasicMaterial({side:THREE.DoubleSide,transparent:true,opacity:.36,depthWrite:false}),480);
  const haloCenters=[moonDisk.position,...stars.slice(0,7).map(star=>star.position)];
  let haloIndex=0;
  for(const center of haloCenters){
    const haloBasis=new THREE.Object3D();haloBasis.position.copy(center);haloBasis.lookAt(0,8,25);haloBasis.updateMatrix();
    for(let j=0;j<60;j++){
      const angle=j*2.39996,radius=3.2+(j%4)*.6;
      dummy.position.set(Math.cos(angle)*radius,Math.sin(angle)*radius*.82,0);
      dummy.rotation.set(0,0,angle+Math.PI/2+(rand()-.5)*.3);dummy.scale.set(.5+rand()*.9,.05+rand()*.07,1);dummy.updateMatrix();
      haloStrokes.setMatrixAt(haloIndex,new THREE.Matrix4().multiplyMatrices(haloBasis.matrix,dummy.matrix));
      color.setHSL(j%3?.12:.56,.45,.32+rand()*.18);haloStrokes.setColorAt(haloIndex++,color);
    }
  }
  scene.add(haloStrokes);

  const brushPosition = new THREE.Vector3(-2,21,-19);
  const ribbonGroup = new THREE.Group();ribbonGroup.position.copy(brushPosition);scene.add(ribbonGroup);
  const ribbonMaterial = new THREE.MeshBasicMaterial({color:'#e3bb65',side:THREE.DoubleSide,transparent:true,opacity:.7});
  const ribbons: THREE.Mesh[]=[];
  for(let i=0;i<38;i++) {
    const a=i*.42;
    const stroke=new THREE.Mesh(brushGeo,ribbonMaterial);stroke.position.set(Math.cos(a)*(3+i*.035),Math.sin(a*.54)*1.4+i*.07,Math.sin(a)*(3+i*.035));
    stroke.rotation.set(0,-a,Math.sin(a)*.3);stroke.scale.set(.6+rand()*.9,.065+rand()*.09,1);ribbonGroup.add(stroke);ribbons.push(stroke);
  }
  const motePositions = new Float32Array(280*3);
  for(let i=0;i<280;i++){motePositions[i*3]=(rand()-.5)*17;motePositions[i*3+1]=.6+rand()*19;motePositions[i*3+2]=12-rand()*65;}
  const moteGeo=new THREE.BufferGeometry();moteGeo.setAttribute('position',new THREE.BufferAttribute(motePositions,3));
  const motes=new THREE.Points(moteGeo,new THREE.PointsMaterial({color:'#f3d386',map:glow,size:.2,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(motes);
  // All repeated static details share geometry and become one draw call per material.
  scene.updateMatrixWorld(true);
  const batches=new Map<string,{geometry:THREE.BufferGeometry,material:THREE.Material,meshes:THREE.Mesh[]}>();
  scene.traverse(object=>{
    if(!(object instanceof THREE.Mesh)||object instanceof THREE.InstancedMesh)return;
    if(![boxGeo,cylinder,cone,headGeo].includes(object.geometry))return;
    const material=object.material as THREE.Material,key=`${object.geometry.uuid}:${material.uuid}`;
    if(!batches.has(key))batches.set(key,{geometry:object.geometry,material,meshes:[]});
    batches.get(key)!.meshes.push(object);
  });
  for(const {geometry,material,meshes} of batches.values()){
    if(meshes.length<2)continue;
    const batch=new THREE.InstancedMesh(geometry,material,meshes.length);
    meshes.forEach((mesh,i)=>{batch.setMatrixAt(i,mesh.matrixWorld);mesh.removeFromParent();});
    batch.computeBoundingSphere();scene.add(batch);
  }
  const river=createRiver();scene.add(river.group);obstacles.push(...river.obstacles);
  const surreal=createSurrealWorld();scene.add(surreal.group);obstacles.push(...surreal.obstacles);
  const opening=createRift();scene.add(opening.group);
  river.group.visible=false;
  const streetFog=new THREE.Color('#183b51'),riverFog=new THREE.Color('#16354b');
  return {scene,obstacles,brushPosition,thirdLandmarks:surreal.landmarks,starCenters:river.starCenters,seamPosition:river.seamPosition,setQuality(low){river.setQuality(low);surreal.setQuality(low);},update(time,awakening,camera){
    surreal.update(time,camera);opening.update(camera);
    const riverAmount=riverWeight(camera.position)*awakening;
    skyMat.uniforms.uRiver.value=riverAmount;
    river.group.visible=riverAmount>0;
    if(river.group.visible)river.update(time,camera);
    (scene.fog as THREE.FogExp2).color.copy(streetFog).lerp(riverFog,riverAmount);
    (scene.fog as THREE.FogExp2).density=THREE.MathUtils.lerp(.0085,.002,riverAmount);
    sky.position.z=-260*riverAmount;sky.scale.setScalar(1+riverAmount*1.6);
    if(camera instanceof THREE.PerspectiveCamera){
      const far=350+riverAmount*800;
      if(Math.abs(camera.far-far)>.1||(riverAmount===0&&camera.far!==350)){camera.far=far;camera.updateProjectionMatrix();}
    }
    skyMat.uniforms.uTime.value=time*awakening;
    stars.forEach((star,i)=>{const s=star.userData.size*(1+Math.sin(time*.7+i*3)*.08*awakening);star.scale.set(s,s,1);});
    ribbonGroup.rotation.y=time*.075*awakening;
    const near=1-THREE.MathUtils.smoothstep(camera.position.distanceTo(brushPosition),4,18);
    ribbons.forEach((r,i)=>{r.scale.x=(.8+Math.sin(i)*.3)*(1+near*.7);r.rotation.z=Math.sin(time*.5+i)*.13*awakening;});
    motes.rotation.y=Math.sin(time*.07)*.035*awakening;
    warm.intensity=100+Math.sin(time*1.4)*3*awakening;
  }};
}
