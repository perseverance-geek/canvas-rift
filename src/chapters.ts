import * as THREE from 'three';
import {chapterAt,rift,type Chapter} from './journey';

type Landmarks={houseEntrance:THREE.Vector3;lamp:THREE.Vector3;atrium:THREE.Vector3};
export function createChapters(camera:THREE.Camera,stars:THREE.Vector3[],seam:THREE.Vector3,notify:(message:string)=>void,landmarks:Landmarks){
  const title=document.querySelector('#chapter-name')!,location=document.querySelector('#location')!,route=document.querySelector('#journey-route')!;
  const reveal=document.querySelector('#chapter-reveal')!;
  const buttons=[document.querySelector('#chapter-one')!,document.querySelector('#chapter-two')!,document.querySelector('#chapter-three')!];
  const names=['金色的夜','星河无岸','白昼的暗面'],english=['THE GILDED NIGHT','A RIVER OF STARS','THE OTHER SIDE OF DAY'];
  let chapter:Chapter=1,starFound=false,seamFound=false,houseFound=false,lampFound=false,timer=0;
  const announced=new Set<Chapter>();let previousMode='gallery';
  function write(element:Element,text:string){if(element.textContent!==text)element.textContent=text;}
  function showChapter(){
    document.body.classList.toggle('surreal',chapter===3);
    title.textContent=`第${['一','二','三'][chapter-1]}幕 · ${names[chapter-1]}`;
    buttons.forEach((button,index)=>button.classList.toggle('active',index===chapter-1));
  }
  return {update(dt:number,mode:string){
    timer=Math.max(0,timer-dt);reveal.classList.toggle('visible',timer>0&&mode==='flying');
    reveal.setAttribute('aria-hidden',String(timer===0||mode!=='flying'));
    if(mode==='gallery'){
      if(previousMode!=='gallery'){chapter=1;showChapter();route.textContent='';timer=0;}
      previousMode=mode;return;
    }
    if(previousMode==='gallery')showChapter();previousMode=mode;
    if(mode!=='flying')return;
    const next=chapterAt(camera.position,chapter);
    if(next!==chapter){
      chapter=next;showChapter();
      if(chapter!==1&&!announced.has(chapter)){
        announced.add(chapter);timer=6;reveal.classList.add('visible');
        reveal.querySelector('small')!.textContent=`${chapter===2?'II':'III'} · ${english[chapter-1]}`;
        reveal.querySelector('h2')!.textContent=names[chapter-1];
        reveal.querySelector('p')!.textContent=chapter===2?'《罗讷河上的星夜》启发的绘画宇宙':'白昼天空下的悬空夜园 · 马格利特艺术思想启发';
      }
    }
    if(chapter===1){
      write(location,camera.position.y>17?'ABOVE THE ROOFTOPS':camera.position.y>4?'BETWEEN THE BRUSHSTROKES':'ARLES · 1888');
      write(route,`罗讷河岸在街巷尽头 · ${Math.max(0,Math.round(camera.position.z+174))} m`);return;
    }
    if(chapter===3){
      const inside=Math.abs(camera.position.x)<29&&Math.abs(camera.position.z+835)<36&&camera.position.y>306&&camera.position.y<348;
      write(location,inside?'INSIDE THE INVERTED HOUSE':camera.position.y<215?'BENEATH THE SUSPENDED NIGHT':'DAY ABOVE · NIGHT BELOW');
      write(route,inside?'白昼井上下贯通 · 回廊与树冠倒悬，飞行方向依旧':camera.position.distanceTo(landmarks.houseEntrance)<65?'穿过宅邸正面的开放门洞，进入倒悬中庭':camera.position.z>rift.z-65?'循弯曲灯路进入夜园 · 回头仍可飞回梵高星空':'左侧悬空石径通向宅邸 · 也可自由升空，寻找门洞');
      if(!houseFound&&camera.position.distanceTo(landmarks.atrium)<19){houseFound=true;notify('你进入了倒悬宅邸。树从天花板向下生长，白昼井直通脚下的夜园。');}
      if(!lampFound&&camera.position.distanceTo(landmarks.lamp)<18){lampFound=true;notify('灯下出现一片白昼，头顶的云却进入黑夜。光在这里，遵守另一种规则。');}
      return;
    }
    const y=camera.position.y;
    write(location,y<24?'RHÔNE · 1888':y<120?'WHERE REFLECTIONS TAKE FLIGHT':'INSIDE THE PAINTED UNIVERSE');
    write(route,y<24?'沿升起的金色笔迹，飞向星空':y<120?'穿行星冠 · 回望河面，仍是同一片夜色':'沿金色笔迹抵达天空细缝 · 接近后，穿过颜料之间的白昼');
    if(!starFound&&stars.some(star=>camera.position.distanceTo(star)<17)){starFound=true;notify('星辰没有坚硬的内核。你正在它的笔触之间。');}
    if(!seamFound&&camera.position.distanceTo(seam)<21){seamFound=true;notify('细缝正在展开。保持航向，穿过深蓝颜料之间的白昼；随时可以原路返回。');}
  }};
}
