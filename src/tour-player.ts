import * as THREE from 'three';
import {createTourClock,entryDuration,sampleTour,tourTitle} from './tour';
import type {createFlight} from './flight';

export function createTourPlayer(camera:THREE.PerspectiveCamera,flight:ReturnType<typeof createFlight>){
  const clock=createTourClock();
  const status=document.createElement('output');status.id='tour-status';status.className='tour-status';
  const title=document.createElement('div');title.className='tour-title';title.setAttribute('aria-hidden','true');
  title.innerHTML='<small></small><h2></h2><p></p>';
  document.body.append(status,title);document.body.classList.add('tour');
  let lastTitle='',readout=0;
  const frameTimes:number[]=[];
  function showStatus(){
    document.body.classList.toggle('tour-paused',clock.paused);
    status.textContent=clock.state==='ready'?'60 秒连续运镜 · 16:9 · 高画质 · 点击进入画境开始':clock.paused?'已暂停 · Esc 继续 · R 重置 · Home 返回画框':'';
    status.dataset.state=clock.state;status.dataset.paused=String(clock.paused);
  }
  function reset(){
    clock.reset();frameTimes.length=0;flight.home();title.classList.remove('visible');title.setAttribute('aria-hidden','true');lastTitle='';
    document.body.classList.remove('tour-playing');document.querySelector('.toast')!.classList.remove('visible');status.dataset.time='0';showStatus();
  }
  function enter(){
    if(clock.state!=='ready')return;
    flight.enter();flight.setExternalControl(true);clock.start();
    document.body.classList.add('tour-playing');showStatus();
  }
  for(const id of ['enter','chapter-one','chapter-two','chapter-three'])document.querySelector<HTMLButtonElement>(`#${id}`)!.onclick=enter;
  document.querySelector<HTMLButtonElement>('#home')!.onclick=reset;
  window.addEventListener('keydown',event=>{
    if(event.metaKey||event.ctrlKey||event.altKey)return;
    if(document.querySelector<HTMLDialogElement>('#info')!.open)return;
    if(!['Escape','KeyR','Home'].includes(event.code))return;
    event.preventDefault();event.stopImmediatePropagation();
    if(event.repeat)return;
    if(event.code==='Escape')clock.togglePause();else reset();
    showStatus();
  },{capture:true});
  showStatus();
  return {get time(){return clock.time;},get awakening(){return Math.min(clock.time/2,1);},update(dt:number){
    const before=clock.time;
    clock.advance(dt,!document.hidden);
    const advanced=clock.time-before;
    if(advanced>0)frameTimes.push(dt*1000);
    if(clock.state!=='ready'){
      if(before<entryDuration&&advanced>0)flight.update(advanced);
      if(clock.time>=entryDuration){const pose=sampleTour(clock.time);camera.position.copy(pose.position);camera.quaternion.copy(pose.quaternion);}
    }
    const caption=tourTitle(clock.time),name=caption?.name??'';
    if(name!==lastTitle){
      if(caption){title.querySelector('small')!.textContent=`${caption.index} · CANVAS RIFT`;title.querySelector('h2')!.textContent=caption.name;title.querySelector('p')!.textContent=caption.source;}
      title.classList.toggle('visible',!!caption);title.setAttribute('aria-hidden',String(!caption));lastTitle=name;
    }
    readout+=dt;
    if(readout>.25){
      status.dataset.time=clock.time.toFixed(2);status.dataset.position=camera.position.toArray().map(v=>v.toFixed(2)).join(',');
      const recent=frameTimes.slice(-120);
      if(recent.length){status.dataset.fps=(1000/(recent.reduce((sum,v)=>sum+v,0)/recent.length)).toFixed(1);}
      readout=0;
    }
    if(clock.state==='finished')showStatus();
    return advanced;
  }};
}
