import * as THREE from 'three';
import {rift,riftOutline} from '../journey';

export function createRift(){
  const group=new THREE.Group();group.name='The opening in the painted night';
  const shape=new THREE.Shape(riftOutline.map(([x,y])=>new THREE.Vector2(x,y)));
  const aperture=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({
    side:THREE.DoubleSide,colorWrite:false,depthWrite:false,stencilWrite:true,
    stencilRef:1,stencilFunc:THREE.AlwaysStencilFunc,stencilZPass:THREE.ReplaceStencilOp,
  }));
  aperture.name='Canvas Rift aperture';
  aperture.position.set(rift.x,rift.y,rift.z);aperture.layers.set(2);group.add(aperture);
  // Each faceted wall has actual depth. The middle remains a wide, unobstructed flight path.
  const vertices:number[]=[],indices:number[]=[];
  const sections=[[-478,.025],[-493,.55],[-520,.87],[rift.z,1]];
  for(const [z,scale] of sections)for(const [x,y] of riftOutline)vertices.push(rift.x+x*scale,rift.y+y*scale,z);
  for(let j=0;j<sections.length-1;j++)for(let i=0;i<riftOutline.length;i++){
    const a=j*riftOutline.length+i,b=j*riftOutline.length+(i+1)%riftOutline.length,c=a+riftOutline.length,d=b+riftOutline.length;
    indices.push(a,b,c,b,d,c);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const material=new THREE.ShaderMaterial({side:THREE.DoubleSide,
    vertexShader:`varying vec3 vWorld;varying vec3 vNormal;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;vNormal=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vWorld;varying vec3 vNormal;
      void main(){float t=smoothstep(478.,558.,-vWorld.z);float grain=sin(vWorld.y*18.+sin(vWorld.z*2.))*sin(vWorld.z*35.)*.025;
        vec3 pigment=mix(vec3(.016,.045,.095),vec3(.055,.080,.079),t);
        float edge=.7+.3*abs(dot(normalize(vNormal),normalize(vec3(-.4,.8,.4))));
        pigment*=edge*(1.+grain*(1.-t));pigment+=vec3(.025,.05,.055)*pow(t,5.);
        gl_FragColor=vec4(pigment,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const walls=new THREE.Mesh(geometry,material);group.add(walls);
  const outer=new THREE.Shape(riftOutline.map(([x,y])=>new THREE.Vector2(x*1.08,y*1.05)));
  outer.holes.push(new THREE.Path([...riftOutline].reverse().map(([x,y])=>new THREE.Vector2(x,y))));
  const rim=new THREE.Mesh(new THREE.ExtrudeGeometry(outer,{depth:1.5,bevelEnabled:true,bevelSize:.18,bevelThickness:.18,bevelSegments:1}),new THREE.MeshBasicMaterial({color:'#899e9b',side:THREE.DoubleSide}));
  rim.position.set(rift.x,rift.y,rift.z-.7);rim.layers.set(1);group.add(rim);
  // The wall starts narrow at the old seam but opens as the visitor approaches it.
  const seam=new THREE.Vector3(5,243,-478);
  return {group,aperture,update(camera:THREE.Camera){
    const p=camera.position,near=1-THREE.MathUtils.smoothstep(p.distanceTo(seam),12,85);
    const reveal=p.z<-493?1:near;
    group.visible=p.distanceTo(seam)<100||p.z<-493;
    const attribute=geometry.getAttribute('position') as THREE.BufferAttribute;
    for(let i=0;i<riftOutline.length;i++){
      attribute.setXY(i,rift.x+riftOutline[i][0]*Math.max(.025,reveal),rift.y+riftOutline[i][1]*Math.max(.025,reveal));
    }
    // Only this tiny throat is animated; the rest of the tunnel is static.
    attribute.needsUpdate=true;geometry.computeVertexNormals();
  }};
}
