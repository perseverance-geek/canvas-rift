import * as THREE from 'three';

// A brush load has a rounded body, a dark underside and an irregular edge.
// Closed surfaces write depth: flying close does not expose stacks of transparent cards.
export function impastoStroke(curve:THREE.Curve<THREE.Vector3>,width:number,thickness:number,seed=0,steps=56,reference=new THREE.Vector3(0,0,1),crossSteps=8) {
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  const row=crossSteps+1,layer=(steps+1)*row;
  const tangent=new THREE.Vector3(),side=new THREE.Vector3(),normal=new THREE.Vector3();
  const frames:THREE.Vector3[]=[],previous=curve.getTangent(0),rotation=new THREE.Quaternion();
  side.crossVectors(reference,previous);
  if(side.lengthSq()<1e-8)side.crossVectors(Math.abs(previous.x)<.8?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0),previous);
  side.normalize();
  for(let i=0;i<=steps;i++){
    tangent.copy(curve.getTangent(i/steps));rotation.setFromUnitVectors(previous,tangent);
    side.applyQuaternion(rotation).normalize();frames.push(side.clone());previous.copy(tangent);
  }
  for(let face=0;face<2;face++)for(let i=0;i<=steps;i++){
    const t=i/steps,p=curve.getPoint(t);tangent.copy(curve.getTangent(t));
    side.copy(frames[i]);normal.crossVectors(tangent,side).normalize();
    const taper=.12+.88*Math.pow(Math.sin(Math.PI*t),.45);
    const breadth=width*taper*(1+.1*Math.sin(t*19+seed)+.045*Math.sin(t*47+seed*3));
    for(let j=0;j<=crossSteps;j++){
      const v=j/crossSteps*2-1;
      const raised=face===0?thickness*(.25+.75*Math.pow(Math.cos(v*Math.PI/2),.45)):-thickness*.22;
      const point=p.clone().addScaledVector(side,v*breadth).addScaledVector(normal,raised*taper);
      positions.push(point.x,point.y,point.z);uvs.push(t,j/crossSteps);
      if(i<steps&&j<crossSteps){const a=face*layer+i*row+j,b=a+row;
        if(face===0)indices.push(a,b,a+1,a+1,b,b+1);else indices.push(a,a+1,b,a+1,b+1,b);
      }
    }
  }
  for(let i=0;i<steps;i++)for(const j of [0,crossSteps]){
    const a=i*row+j,b=a+row;
    if(j===0)indices.push(a,a+layer,b,b,a+layer,b+layer);else indices.push(a,b,a+layer,b,b+layer,a+layer);
  }
  for(const i of [0,steps])for(let j=0;j<crossSteps;j++){
    const a=i*row+j;
    if(i===0)indices.push(a,a+1,a+layer,a+1,a+layer+1,a+layer);else indices.push(a,a+layer,a+1,a+1,a+layer,a+layer+1);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
  return geometry;
}

export function pigmentMaterial(instanced=false,ink='#c9a54e') {
  return new THREE.ShaderMaterial({side:THREE.DoubleSide,fog:true,defines:instanced?{PAINT_INSTANCED:1}:{},
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uTime:{value:0},uReveal:{value:1},uEnergy:{value:1},uInk:{value:new THREE.Color(ink)}}]),
    vertexShader:`
      uniform float uTime;varying vec2 vUv;varying vec3 vInk;varying vec3 vNormal;varying vec3 vView;varying float vPhase;
      uniform vec3 uInk;
      #include <fog_pars_vertex>
      void main(){
        vUv=uv;vec4 p=vec4(position,1.);vec3 n=normal;vInk=uInk;vPhase=0.;
        #ifdef PAINT_INSTANCED
          p=instanceMatrix*p;
          n/=vec3(dot(instanceMatrix[0].xyz,instanceMatrix[0].xyz),dot(instanceMatrix[1].xyz,instanceMatrix[1].xyz),dot(instanceMatrix[2].xyz,instanceMatrix[2].xyz));
          n=mat3(instanceMatrix)*n;vInk=instanceColor;
          vPhase=dot(instanceMatrix[3].xyz,vec3(.17,.11,.07));
        #endif
        p.xyz+=normal*sin(uv.x*7.+uTime*.25+vPhase)*.018;
        vec4 mvPosition=modelViewMatrix*p;vView=-mvPosition.xyz;vNormal=normalize(normalMatrix*n);
        gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`
      uniform float uTime;uniform float uReveal;uniform float uEnergy;
      varying vec2 vUv;varying vec3 vInk;varying vec3 vNormal;varying vec3 vView;varying float vPhase;
      #include <fog_pars_fragment>
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
      void main(){
        if(uReveal<.01)discard;
        // Thin hairs disappear at distance instead of shimmering as parallel wire lines.
        float hair=vUv.y*96.+sin(vUv.x*8.+vPhase)*2.+noise(vUv*vec2(8.,12.)+vPhase)*2.;
        float bristle=sin(hair)*max(0.,1.-fwidth(hair)*.65);
        float sweep=vUv.y*31.+noise(vec2(vUv.x*7.,vPhase))*2.;
        float load=.46+.22*sin(sweep)+.22*noise(vUv*vec2(7.,27.)+vPhase);
        float dryEdge=.025+.025*noise(vUv*vec2(90.,9.)+vPhase);
        if(vUv.y<dryEdge||vUv.y>1.-dryEdge)discard;
        float fleck=noise(vUv*vec2(130.,65.)+vPhase);
        vec3 n=normalize(vNormal)*(gl_FrontFacing?1.:-1.);
        float light=.48+.52*max(0.,dot(n,normalize(vec3(-.4,.7,.6))));
        float ridge=.91+.065*bristle+.1*load;
        vec3 pigment=mix(vInk*.72,vInk*1.18,load);
        pigment=mix(pigment,pigment*vec3(.68,.81,1.1),(.5-.5*bristle)*.12);
        pigment+=vec3(.016,.021,.025)*(fleck-.5);
        float edge=smoothstep(0.,.2,vUv.y)*smoothstep(0.,.2,1.-vUv.y);
        pigment*=light*ridge*(.78+.22*edge);
        pigment*=uEnergy*(.32+.68*uReveal)*(1.+.025*sin(uTime*.3+vPhase));
        // Keep the eye clear when it passes through a painted body, without fading entire layers.
        float near=smoothstep(.35,1.4,length(vView));
        if(near<hash(floor(gl_FragCoord.xy)))discard;
        gl_FragColor=vec4(pigment,1.);
        #include <fog_fragment>
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
}
