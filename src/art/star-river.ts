import * as THREE from 'three';
import { seeded } from './paint';
import { cosmosWeight, riverEnd, riverStart } from '../journey';
import { impastoStroke, pigmentMaterial } from './impasto';

export function createStarRiver(farLampX:number[]) {
  const group=new THREE.Group();group.name='Rhone · sculpted light and unfolding water';
  const rand=seeded(91888),dummy=new THREE.Object3D(),color=new THREE.Color();
  const materials:THREE.ShaderMaterial[]=[],details:THREE.InstancedMesh[]=[];
  const smallCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.5,0,0),new THREE.Vector3(0,.025,.015),new THREE.Vector3(.5,-.015,0)]);
  const dab=impastoStroke(smallCurve,.45,.04,3,4,undefined,2);
  function batch(count:number,parent=group){
    const material=pigmentMaterial(true);materials.push(material);
    const mesh=new THREE.InstancedMesh(dab,material,count);parent.add(mesh);return mesh;
  }
  function mark(mesh:THREE.InstancedMesh,i:number,p:THREE.Vector3,size:THREE.Vector3,rotation:THREE.Euler,ink:THREE.Color){
    dummy.position.copy(p);dummy.rotation.copy(rotation);dummy.scale.copy(size);dummy.updateMatrix();
    mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,ink);
  }
  function stroke(curve:THREE.Curve<THREE.Vector3>,width:number,thickness:number,ink:string,parent=group,reference=new THREE.Vector3(0,0,1),seed=0,shared?:THREE.BufferGeometry){
    const material=pigmentMaterial(false,ink);materials.push(material);
    const mesh=new THREE.Mesh(shared??impastoStroke(curve,width,thickness,seed,72,reference),material);parent.add(mesh);return mesh;
  }
  // A quiet blue body leaves negative space between the few long gold reflections.
  const waterMarks=batch(400);
  for(let i=0;i<waterMarks.count;i++){
    const x=(rand()-.5)*460,z=riverEnd+rand()*(riverStart-riverEnd);
    color.setHSL(.57+rand()*.08,.6,.065+rand()*.075);
    mark(waterMarks,i,new THREE.Vector3(x,-.055,z),new THREE.Vector3(2+rand()*8,.08+rand()*.24,.12),new THREE.Euler(-Math.PI/2,0,(rand()-.5)*.12),color);
  }
  waterMarks.computeBoundingSphere();details.push(waterMarks);

  // Deliberate constellations of short, loaded strokes; no equatorial wire rings.
  const starCenters=[new THREE.Vector3(-58,63,-243),new THREE.Vector3(67,107,-322),new THREE.Vector3(-38,160,-386),new THREE.Vector3(115,205,-435),new THREE.Vector3(-55,207,-505)];
  const radii=[11,19,28,35,48],crowns:THREE.Group[]=[],celestial:THREE.ShaderMaterial[]=[];
  const crownLoads:THREE.BufferGeometry[]=[];
  for(let k=0;k<starCenters.length;k++){
    const crown=new THREE.Group();crown.position.copy(starCenters[k]);group.add(crown);crowns.push(crown);
    const radius=radii[k],firstMaterial=materials.length;
    // Five asymmetric, open gestures leave a broad empty passage and readable silhouettes.
    for(let j=0;j<5;j++){
      const points:THREE.Vector3[]=[],start=j*1.31,span=.78+(j%3)*.17;
      for(let n=0;n<=12;n++){
        const t=n/12,a=start+t*span,r=.20+.79*t+.07*Math.sin(t*Math.PI*2+j);
        points.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r*(.8+j*.035),Math.sin(t*Math.PI+j)*.36));
      }
      const load=stroke(new THREE.CatmullRomCurve3(points),j===2?.19:.115,.025,
        ['#d5b058','#b7ac6f','#efd28a','#3b8299','#b48738'][j],crown,undefined,j,crownLoads[j]);
      crownLoads[j]=load.geometry;
      load.scale.set(radius,radius*(.94+k*.03),radius);load.rotation.z=k*.28;load.rotation.y=(j%2?1:-1)*k*.04;
    }
    const sparks=batch(20,crown);
    for(let i=0;i<sparks.count;i++){
      const a=rand()*Math.PI*2,r=radius*(i<3?.14:.95+rand()*.24);
      color.set(i<3?'#ecd297':i%6===0?'#579caa':i%3?'#c9ae61':'#efdaa0');
      mark(sparks,i,new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r*.9,(rand()-.5)*radius*.45),
        new THREE.Vector3(radius*(i<3?.42:.10+rand()*.10),radius*(i<3?.21:.035+rand()*.025),radius*(i<3?.35:.09)),new THREE.Euler(.1,(rand()-.5)*.4,a+.3),color);
    }
    if(k===4)(sparks.material as THREE.ShaderMaterial).uniforms.uEnergy.value=1.25;
    sparks.computeBoundingSphere();
    celestial.push(...materials.slice(firstMaterial));
  }
  // The distant night stays calm; stars have compact cream/ochre cores, not flower outlines.
  const nightStars=batch(126);
  for(let i=0;i<nightStars.count;i++){
    const star=Math.floor(i/6),part=i%6;
    const x=Math.sin(star*19.3)*215,y=32+((star*31)%86),z=-494+Math.sin(star*6.1)*22;
    const a=part*1.047+star*.3,r=part===0?0:1.0;
    color.set(part===0?'#e6d5a0':part%3?'#a6ad83':'#547e8a');
    mark(nightStars,i,new THREE.Vector3(x+Math.cos(a)*r,y+Math.sin(a)*r,z+(part%2)*.4),
      new THREE.Vector3(part===0?2.3:1.4,part===0?1.7:.6,.5),new THREE.Euler(0,0,a),color);
  }
  nightStars.computeBoundingSphere();

  // The same reflection becomes three broad spatial brush loads. The centre remains open.
  const path=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-34,1,-200),new THREE.Vector3(-55,28,-237),new THREE.Vector3(12,73,-283),
    new THREE.Vector3(66,112,-328),new THREE.Vector3(-38,158,-386),new THREE.Vector3(22,212,-449),new THREE.Vector3(5,243,-478),
  ]);
  const ascent=new THREE.Group();group.add(ascent);
  const up=new THREE.Vector3(0,1,0),side=new THREE.Vector3();
  for(let lane=0;lane<3;lane++){
    const points:THREE.Vector3[]=[];
    for(let i=0;i<=56;i++){
      const t=i/56,p=path.getPoint(t);side.crossVectors(up,path.getTangent(t)).normalize();
      p.addScaledVector(side,(lane===1?-1:1)*(5+lane*3+t*12)+Math.sin(t*8+lane)*t*4);
      p.y+=Math.sin(t*9+lane)*t*3;points.push(p);
    }
    stroke(new THREE.CatmullRomCurve3(points),lane===1?2:3.1,.22,['#bd8f34','#2d697b','#ddbc71'][lane],ascent,up,lane+12);
  }
  const streams=batch(180,ascent);
  for(let i=0;i<streams.count;i++){
    const t=rand(),p=path.getPoint(t),tangent=path.getTangent(t);side.crossVectors(up,tangent).normalize();
    p.addScaledVector(side,(rand()>.5?1:-1)*(8+rand()*(4+t*14)));p.y+=(rand()-.5)*4;
    dummy.position.copy(p);dummy.lookAt(p.clone().add(tangent));dummy.rotateY(Math.PI/2);
    color.set(i%5===0?'#4a8594':i%3?'#bb9b4d':'#d2b473');
    mark(streams,i,p,new THREE.Vector3(1.5+rand()*3,.4+rand()*.5,.28),dummy.rotation.clone(),color);
  }
  streams.computeBoundingSphere();details.push(streams);
  const ascentMaterials=ascent.children.map(m=>(m as THREE.Mesh).material as THREE.ShaderMaterial);

  // At altitude the river's coloured planes lift into a monumental, open blue nave.
  // Two continuous surfaces replace the former seven golden hoops. Geometry folds back on descent.
  const folds:THREE.Group[]=[],foldMaterials:THREE.ShaderMaterial[]=[];
  for(const direction of [-1,1]){
    const vertices:number[]=[],uvs:number[]=[],indices:number[]=[],across=16,along=96;
    for(let j=0;j<=along;j++)for(let i=0;i<=across;i++){
      const u=i/across,v=j/along,edge=Math.sin(Math.PI*v);
      const x=direction*u*(215+25*Math.sin(v*5+direction));
      const y=Math.sin(u*Math.PI*.8)*16+Math.sin(v*9+u*4)*u*9;
      vertices.push(x,y,(v-.5)*278+Math.sin(v*7+u*3)*u*12);uvs.push(v,1-u);
      if(i<across&&j<along){const a=j*(across+1)+i,b=a+across+1;indices.push(a,a+1,b,a+1,b+1,b);}
      // A shaped end prevents a rectangular canvas silhouette.
      vertices[vertices.length-3]*=.08+.92*Math.pow(Math.max(0,edge),.55);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
    const material=paintedWaterMaterial(farLampX,true);foldMaterials.push(material);
    const hinge=new THREE.Group();hinge.position.set(direction*22,0,-402);hinge.add(new THREE.Mesh(geometry,material));group.add(hinge);folds.push(hinge);
  }
  // Broad cobalt cross-currents frame the nave's open top, rather than closing it into a dome.
  const roof=new THREE.Group();group.add(roof);
  for(let i=0;i<2;i++)stroke(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-165,181+i*28,-468),new THREE.Vector3(-92,245+i*12,-505),
    new THREE.Vector3(24,268-i*10,-516),new THREE.Vector3(152,218+i*12,-493),
  ]),9+i*3,2.5,i?'#274967':'#345e85',roof,undefined,22+i);
  const roofMaterials=roof.children.map(m=>(m as THREE.Mesh).material as THREE.ShaderMaterial);

  // The distant seam yields to the expanding throat as the visitor approaches.
  const seam=new THREE.Group();seam.position.set(5,243,-478);group.add(seam);
  const seamMarks=batch(24,seam);
  for(let i=0;i<24;i++){
    const y=-8+i*.67;color.set(i%4?'#9aafb9':'#baa775');
    mark(seamMarks,i,new THREE.Vector3(Math.sin(y*.55)*.35,y,0),new THREE.Vector3(.12,.6,.08),new THREE.Euler(0,0,.3),color);
  }
  seamMarks.computeBoundingSphere();
  const fullCounts=new Map(details.map(mesh=>[mesh,mesh.count]));
  return {group,starCenters,seamPosition:seam.position.clone(),setQuality(low:boolean){
    for(const mesh of details)mesh.count=low?Math.floor(fullCounts.get(mesh)!*.55):fullCounts.get(mesh)!;
  },update(time:number,camera:THREE.Camera){
    const space=cosmosWeight(camera.position),unfold=THREE.MathUtils.smoothstep(camera.position.y,105,205)*THREE.MathUtils.smoothstep(space,.18,.95);
    for(const material of materials)material.uniforms.uTime.value=time;
    for(const material of celestial)material.uniforms.uReveal.value=.5+.5*space;
    crowns.forEach((crown,i)=>{crown.scale.setScalar(.4+.6*space);crown.rotation.y=Math.sin(time*.035+i)*.075;crown.rotation.z=Math.sin(time*.027+i)*.045;});
    for(const material of ascentMaterials)material.uniforms.uReveal.value=.45+.55*space;
    for(const material of roofMaterials)material.uniforms.uReveal.value=unfold;
    roof.visible=unfold>.01;
    folds.forEach((fold,i)=>{
      fold.visible=unfold>.01;fold.position.y=unfold*78;
      fold.rotation.z=(i===0?-1:1)*Math.sqrt(unfold)*1.45;
      foldMaterials[i].uniforms.uTime.value=time;foldMaterials[i].uniforms.uReveal.value=unfold;
    });
    seam.visible=space>.62&&camera.position.z>-493&&camera.position.distanceTo(seam.position)>85;
  }};
}

// Reflections live in the water's pigment. They cannot become overlapping yellow cards.
export function paintedWaterMaterial(lampX:number[],fold=false) {
  return new THREE.ShaderMaterial({fog:true,side:THREE.DoubleSide,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uTime:{value:0},uReveal:{value:1},uFold:{value:fold?1:0},uLamps:{value:lampX}}]),
    vertexShader:`uniform float uTime;varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;
      #include <fog_pars_vertex>
      void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);vec3 p=position;
        p+=normal*sin(position.x*.09+uTime*.35)*sin(position.y*.07-uTime*.2)*.025;
        vec4 mvPosition=modelViewMatrix*vec4(p,1.);vView=-mvPosition.xyz;gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform float uTime;uniform float uReveal;uniform float uFold;uniform float uLamps[${lampX.length}];varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;
      #include <fog_pars_fragment>
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
      void main(){
        if(uFold>.5){
          // Unpainted windows keep side approaches open; the lifted river is a gesture, not a wall.
          vec2 opening=(vUv-vec2(.24,.43))/vec2(.16,.30);
          vec2 second=(vUv-vec2(.69,.46))/vec2(.13,.26);
          float torn=.9+noise(vUv*vec2(18.,12.))*.18;
          if(length(opening)<torn||length(second)<torn)discard;
          if(smoothstep(.5,4.,length(vView))<hash(floor(gl_FragCoord.xy)))discard;
        }
        float x=(vUv.x-.5)*480.,depth=(1.-vUv.y)*352.;
        float current=sin(depth*.035+x*.015+uTime*.12)+sin(depth*.083-x*.022-uTime*.09)*.4;
        float body=noise(vec2(x*.028,depth*.095+current*.16));
        vec3 ink=mix(vec3(.006,.018,.05),vec3(.019,.064,.115),body*.7+.12);
        ink=mix(ink,vec3(.017,.036,.105),.25+.2*sin(x*.018+depth*.021));
        float row=floor(depth*.72+sin(x*.055+uTime*.26)*.65);
        float bristle=sin(depth*9.+noise(vec2(x*.2,row))*4.);
        bristle*=max(0.,1.-fwidth(depth*9.)*.4);
        ink*=.94+.065*bristle;
        float gold=0.;
        for(int i=0;i<${lampX.length};i++){
          float phase=float(i)*4.73;
          float reach=292.+57.*sin(phase+1.5)+uFold*70.;
          float t=depth/reach;
          float weave=sin(depth*.085+phase+uTime*.26)*(.25+t*.7);
          weave+=(noise(vec2(row*.11,phase+uTime*.045))-.5)*(.5+t*2.8);
          float width=.7+t*(2.4+.7*sin(phase));
          float dx=abs(x-uLamps[i]-weave);
          float core=exp(-pow(dx/width,2.));
          float shoulder=exp(-pow(dx/(width*2.6),2.))*.17;
          float broken=.08+.92*smoothstep(.3,.74,noise(vec2(row*.73,phase)));
          float end=1.-smoothstep(.65,1.,t);
          float strength=.52+.48*pow(.5+.5*sin(phase*.8),2.);
          gold+=(core+shoulder)*broken*end*strength;
        }
        gold=min(gold,1.);
        // Ochre underpaint, amber middle, small cream accents: never a field of white glitter.
        vec3 reflection=mix(vec3(.32,.135,.019),vec3(.72,.42,.095),smoothstep(.28,.9,gold));
        reflection=mix(reflection,vec3(.85,.65,.29),smoothstep(.84,1.,gold)*.4);
        ink=mix(ink,reflection,gold*.88);
        float foldLight=.72+.28*abs(dot(normalize(vNormal),normalize(vec3(-.3,.8,.45))));
        vec3 lifted=ink*1.7*foldLight;
        lifted+=vec3(.007,.016,.045)*pow(body,2.)*(1.-gold);
        ink=mix(ink,lifted,uFold);
        ink*=mix(1.,.25+.75*uReveal,uFold);
        gl_FragColor=vec4(ink,1.);
        #include <fog_fragment>
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
}
