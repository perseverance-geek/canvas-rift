import * as THREE from 'three';
import { cosmosWeight, explorationBounds, rift, riftBlocks } from './journey.ts';

const playerRadius = .32;
export function playerBox(position: THREE.Vector3) {
  return new THREE.Box3(
    new THREE.Vector3(position.x-playerRadius,position.y-1.55,position.z-playerRadius),
    new THREE.Vector3(position.x+playerRadius,position.y+.2,position.z+playerRadius),
  );
}

// Resolve each axis independently so a visitor slides along walls rather than sticking.
export function moveWithCollisions(position: THREE.Vector3, displacement: THREE.Vector3, obstacles: THREE.Box3[]) {
  const result=position.clone();
  for(const axis of ['x','z','y'] as const){
    const next=result.clone();next[axis]+=displacement[axis];
    if(riftBlocks(result,next)){
      if(result.z>=-556&&result.z>=rift.z)next.z=-556;
      else continue;
    }
    const bounds=explorationBounds(next);
    next.x=THREE.MathUtils.clamp(next.x,-bounds.width,bounds.width);next.z=THREE.MathUtils.clamp(next.z,bounds.minZ,bounds.maxZ);next.y=THREE.MathUtils.clamp(next.y,bounds.minY,bounds.maxY);
    if(!obstacles.some(obstacle=>obstacle.intersectsBox(playerBox(next)))) result.copy(next);
  }
  return result;
}

export function createFlight(camera:THREE.PerspectiveCamera,canvas:HTMLCanvasElement,obstacles:THREE.Box3[],notify:(message:string)=>void){
  type Mode='gallery'|'entering'|'flying';
  let mode:Mode='gallery',paused=false,elapsed=0,yaw=.15,pitch=.02,externalControl=false;
  const galleryPosition=camera.position.clone(),galleryRotation=camera.quaternion.clone();
  const destination=new THREE.Vector3(.5,1.75,12),endRotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(.02,.15,0,'YXZ'));
  const velocity=new THREE.Vector3(),keys=new Set<string>();
  const touchMoves=new Set<string>();
  const enterButton=document.querySelector<HTMLButtonElement>('#enter')!;
  const info=document.querySelector<HTMLDialogElement>('#info')!;
  let dragging=false,lastX=0,lastY=0;
  function clear(){keys.clear();touchMoves.clear();velocity.set(0,0,0);dragging=false;}
  function enter(){
    if(mode!=='gallery')return;
    mode='entering';paused=false;elapsed=0;clear();enterButton.disabled=true;
    document.body.classList.add('exploring');
    document.querySelectorAll<HTMLElement>('.intro,.bottom-bar,.painting-label').forEach(element=>element.inert=true);
    document.querySelector('#altitude')!.textContent='1.7';
    document.querySelector('#location')!.textContent='ARLES · 1888';
    notify('夜色正在苏醒。拖动画面环顾，按空格飞越屋顶。');
  }
  function home(){
    document.exitPointerLock();mode='gallery';paused=false;externalControl=false;elapsed=0;clear();
    camera.position.copy(galleryPosition);camera.quaternion.copy(galleryRotation);camera.fov=58;camera.updateProjectionMatrix();
    document.body.classList.remove('exploring');enterButton.disabled=false;
    document.querySelectorAll<HTMLElement>('.intro,.bottom-bar,.painting-label').forEach(element=>element.inert=false);
  }
  enterButton.onclick=enter;
  document.querySelector<HTMLButtonElement>('#chapter-one')!.onclick=enter;
  document.querySelector<HTMLButtonElement>('#home')!.onclick=home;
  document.querySelector<HTMLButtonElement>('#help')!.onclick=()=>{clear();document.exitPointerLock();info.showModal();};
  window.addEventListener('keydown',event=>{
    if(externalControl||mode!=='flying'||info.open)return;
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
    if(event.code==='Escape'){paused=!paused;clear();notify(paused?'旅程已暂停。点击画面或按 Esc 继续。':'继续飞行。');return;}
    keys.add(event.code);
  });
  window.addEventListener('keyup',event=>keys.delete(event.code));
  window.addEventListener('blur',clear);
  document.addEventListener('visibilitychange',clear);
  info.addEventListener('close',()=>{clear();paused=false;});
  function rotate(dx:number,dy:number){yaw-=dx*.0025;pitch=THREE.MathUtils.clamp(pitch-dy*.0025,-1.4,1.4);}
  canvas.addEventListener('pointerdown',event=>{
    if(externalControl||mode!=='flying')return;paused=false;dragging=true;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(externalControl||mode!=='flying'||paused||info.open)return;
    if(document.pointerLockElement===canvas){rotate(event.movementX,event.movementY);return;}
    if(dragging){rotate(event.clientX-lastX,event.clientY-lastY);lastX=event.clientX;lastY=event.clientY;}
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>dragging=false);
  canvas.addEventListener('dblclick',()=>{
    if(externalControl||mode!=='flying')return;
    if(!canvas.requestPointerLock){notify('此浏览器支持拖动视角，请按住画面环顾。');return;}
    canvas.requestPointerLock()?.catch(()=>notify('此浏览器未允许锁定视角，可拖动画面环顾。'));
  });
  document.addEventListener('pointerlockerror',()=>notify('可使用拖动画面来环顾四周。'));
  document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(button=>{
    const names:Record<string,string>={forward:'前进',backward:'后退',left:'向左',right:'向右',up:'上升',down:'下降'};
    button.setAttribute('aria-label',names[button.dataset.move!]);
    button.addEventListener('pointerdown',event=>{if(externalControl)return;event.preventDefault();button.setPointerCapture(event.pointerId);touchMoves.add(button.dataset.move!);});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>touchMoves.delete(button.dataset.move!));
  });
  let readoutTime=0;
  return {enter,home,setExternalControl(value:boolean){externalControl=value;clear();},get awakening(){return mode==='gallery'?0:Math.min(elapsed/2,1);},get mode(){return mode;},update(dt:number){
    if(mode==='gallery')return;
    if(mode==='entering'){
      elapsed+=dt;const t=THREE.MathUtils.smoothstep(elapsed,0,3.8);
      camera.position.lerpVectors(galleryPosition,destination,t);camera.quaternion.slerpQuaternions(galleryRotation,endRotation,t);
      if(t>=1){mode='flying';yaw=.15;pitch=.02;}
      return;
    }
    if(externalControl)return;
    camera.quaternion.setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));
    if(paused||info.open||document.hidden){velocity.set(0,0,0);return;}
    const pressed=(codes:string[],touch:string)=>codes.some(code=>keys.has(code))||touchMoves.has(touch);
    const forward=Number(pressed(['KeyW','ArrowUp'],'forward'))-Number(pressed(['KeyS','ArrowDown'],'backward'));
    const sideways=Number(pressed(['KeyD','ArrowRight'],'right'))-Number(pressed(['KeyA','ArrowLeft'],'left'));
    const vertical=Number(pressed(['Space','KeyE'],'up'))-Number(pressed(['KeyC','KeyQ'],'down'));
    const direction=new THREE.Vector3(0,0,-forward).applyQuaternion(camera.quaternion);
    direction.add(new THREE.Vector3(sideways,0,0).applyAxisAngle(new THREE.Vector3(0,1,0),yaw));direction.y+=vertical;
    if(direction.lengthSq()>1)direction.normalize();
    const space=cosmosWeight(camera.position);
    direction.multiplyScalar(keys.has('ShiftLeft')||keys.has('ShiftRight')?14+space*12:6+space*6);
    velocity.lerp(direction,1-Math.exp(-dt*5));
    // Small fixed substeps prevent tunneling even if a slow frame coincides with boosting.
    const steps=Math.max(1,Math.ceil(dt/.012));
    for(let i=0;i<steps;i++)camera.position.copy(moveWithCollisions(camera.position,velocity.clone().multiplyScalar(dt/steps),obstacles));
    readoutTime+=dt;
    if(readoutTime>.12){
      readoutTime=0;document.querySelector('#altitude')!.textContent=camera.position.y.toFixed(1);
    }
  }};
}
