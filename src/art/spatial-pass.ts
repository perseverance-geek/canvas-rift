import * as THREE from 'three';
import {Pass,FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
import {rift} from '../journey';

// Both worlds occupy one Scene and use the same camera. Stencil limits the other
// world to the real opening; no texture photograph, camera mapping or teleport.
export class SpatialPass extends Pass {
  private materials:THREE.Material[][]=[[],[]];
  private depthReset=new FullScreenQuad(new THREE.ShaderMaterial({
    colorWrite:false,depthTest:false,depthWrite:true,stencilWrite:true,
    stencilRef:1,stencilFunc:THREE.EqualStencilFunc,
    vertexShader:'void main(){gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:'void main(){gl_FragDepth=1.;gl_FragColor=vec4(0.);}',
  }));
  private frustum=new THREE.Frustum();
  private matrix=new THREE.Matrix4();
  private opening=new THREE.Sphere(new THREE.Vector3(rift.x,rift.y,rift.z),28);
  private aperture:THREE.Object3D|undefined;
  constructor(private scene:THREE.Scene,private camera:THREE.Camera){
    super();this.needsSwap=false;
    this.aperture=scene.getObjectByName('Canvas Rift aperture');
    const sets=[new Set<THREE.Material>(),new Set<THREE.Material>()];
    scene.traverse(object=>{
      if(object instanceof THREE.Mesh||object instanceof THREE.Sprite||object instanceof THREE.Points){
        const list=Array.isArray(object.material)?object.material:[object.material];
        for(let layer=0;layer<2;layer++)if(object.layers.isEnabled(layer))for(const m of list)sets[layer].add(m);
      }
    });
    this.materials=sets.map(set=>[...set]);
  }
  render(renderer:THREE.WebGLRenderer,_write:THREE.WebGLRenderTarget,read:THREE.WebGLRenderTarget){
    const auto=renderer.autoClear,layers=this.camera.layers.mask,background=this.scene.background;
    const region=this.camera.position.z<rift.z?1:0;
    renderer.autoClear=false;renderer.setRenderTarget(this.renderToScreen?null:read);renderer.clear(true,true,true);
    this.camera.layers.set(region);renderer.render(this.scene,this.camera);
    this.matrix.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.matrix);
    if(this.aperture?.parent?.visible&&this.frustum.intersectsSphere(this.opening)&&Math.abs(this.camera.position.z-rift.z)>.15){
      this.scene.background=null;
      this.camera.layers.set(2);renderer.render(this.scene,this.camera);
      this.depthReset.render(renderer);
      const destination=1-region;
      for(const m of this.materials[destination]){m.stencilWrite=true;m.stencilRef=1;m.stencilFunc=THREE.EqualStencilFunc;}
      // Restrict destination objects to their own side. Skies intentionally don't clip.
      renderer.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,0,destination?-1:1),destination?rift.z:-rift.z)];
      this.camera.layers.set(destination);renderer.render(this.scene,this.camera);
      renderer.clippingPlanes=[];
      for(const m of this.materials[destination])m.stencilWrite=false;
    }
    this.scene.background=background;this.camera.layers.mask=layers;renderer.autoClear=auto;
  }
  dispose(){this.depthReset.material.dispose();this.depthReset.dispose();}
}
