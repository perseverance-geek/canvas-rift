import * as THREE from 'three';
import './style.css';
import { createWorld } from './art/world';
import { createRenderer } from './art/render';
import { createFlight } from './flight';
import { createSound } from './sound';
import { createChapters } from './chapters';
import { cosmosWeight, riverWeight, surrealWeight } from './journey';
import { createTourPlayer } from './tour-player';

const tourMode=new URLSearchParams(location.search).get('tour')==='1';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
<canvas id="world" aria-label="可自由探索的三维咖啡座、罗讷河星夜与悬空夜园"></canvas>
<div class="shade"></div><div class="frame"></div>
<header class="topbar">
<a class="brand" href="./"><span class="brand-mark">Ⅽ<span>╱</span></span><span>CANVAS RIFT<small>画 境 裂 隙</small></span></a>
<span class="edition">AN EXPERIMENT IN IMMERSIVE ART <i></i> VOL. 001</span>
<div class="tools"><button id="sound" aria-pressed="false" title="开启环境音">♫ <span>声音关闭</span></button><button id="about" aria-label="关于作品">ⓘ</button></div>
</header>
<main class="intro">
<div class="eyebrow"><span class="line"></span> BEYOND THE FRAME <span>✦</span></div>
<h1>世界，<br>不止于画框<span class="title-dot">。</span></h1>
<p class="intro-copy">让夜色苏醒，让笔触成为风。<br>走进梵高的金色街巷，飞向画布之外的宇宙。</p>
<div class="entry-row"><button id="enter" class="enter"><span class="enter-icon">↗</span><span>进入画境<small>ENTER THE PAINTING</small></span><span class="enter-arrow">⟶</span></button><span class="entry-note">戴上耳机，忘记重力。</span></div>
</main>
<aside class="painting-label"><span class="label-index">01 / THE GILDED NIGHT</span><span class="label-rule"></span><h2>金色的夜</h2><p>《夜间露天咖啡座》启发的艺术世界</p><small>VINCENT VAN GOGH · ARLES, 1888</small><div class="live-tag"><i></i> 实时三维 · 自由探索</div></aside>
<footer class="bottom-bar"><div class="chapters"><button class="chapter active" id="chapter-one"><b>01</b><span>金色的夜<small>THE GILDED NIGHT</small></span><i></i></button><button class="chapter" id="chapter-two" title="从咖啡座沿街巷前往河岸"><b>02</b><span>星河无岸<small>A RIVER OF STARS</small></span></button><button class="chapter" id="chapter-three" title="循星河航线穿越天空裂缝"><b>03</b><span>白昼的暗面<small>THE OTHER SIDE OF DAY</small></span></button></div><button id="quality" class="quality" aria-pressed="false"><span>◈</span> 高画质 <small>↗</small></button></footer>
<section class="hud" aria-label="探索控制"><div class="hud-location"><i></i><span><span id="chapter-name">第一幕 · 金色的夜</span><small id="location">ARLES · 1888</small></span></div><div class="journey-route" id="journey-route"></div><div class="hud-actions"><button id="help">操作指南</button><button id="flight-quality" aria-pressed="false">高画质</button><button id="home">↙ 返回画框</button></div><div class="crosshair"></div><div class="flight-readout"><span id="altitude">1.7</span><small>METERS ABOVE THE CANVAS</small></div><div class="flight-hint" id="hint">W A S D 移动 <span>·</span> 空格上升 / C 下降 <span>·</span> 拖动画面环顾</div><div class="mobile-controls"><button data-move="forward">↑</button><button data-move="left">←</button><button data-move="backward">↓</button><button data-move="right">→</button><button data-move="up">＋</button><button data-move="down">−</button></div></section>
<div class="chapter-reveal" id="chapter-reveal" role="status" aria-hidden="true"><small>II · A RIVER OF STARS</small><h2>星河无岸</h2><p>《罗讷河上的星夜》启发的绘画宇宙</p></div>
<dialog id="info"><button class="close" aria-label="关闭">×</button><div class="eyebrow">THE ART OF GETTING LOST</div><h2>画框之后，还有宇宙。</h2><p>Canvas Rift 是一场从二维绘画走向三维空间的艺术实验。这里的街巷、光线与笔触全部实时生成，你可以自由漫步、飞越屋顶，寻找漂浮的金色笔迹。</p><p>从第一幕《夜间露天咖啡座》沿街巷前行，即可到达第二幕《罗讷河上的星夜》。沿河面升起的金色笔迹飞向星冠，也可随时飞回小镇。继续飞向天空深处的裂缝，即可进入第三幕白昼天空下的悬空夜园。倒悬宅邸的门洞、回廊和中庭均可探索；从裂缝也能原路飞回星空。</p><div class="guide-grid"><span><kbd>W A S D</kbd> 前后与横移</span><span><kbd>空格 / C</kbd> 上升与下降</span><span><kbd>Shift</kbd> 加速飞行</span><span><kbd>鼠标拖动</kbd> 环顾四周</span><span><kbd>双击画面</kbd> 锁定鼠标视角</span><span><kbd>Esc</kbd> 释放鼠标 / 暂停</span></div><p class="dialog-note">触屏：拖动画面环顾，底部方向键移动与升降。<br>水面可低空掠过；星冠和悬浮笔触均可自由穿行。第三幕保持相同飞行方向；宅邸门洞和白昼井上下贯通。</p><button class="dialog-okay">继续旅程 ⟶</button></dialog>
<div class="toast" role="status" aria-live="polite"></div><div class="loading"><span class="loading-mark">✦</span><p>正在唤醒夜色</p><small>PREPARING YOUR CANVAS</small></div>`;

const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
const world = createWorld();
const camera = new THREE.PerspectiveCamera(58,tourMode?16/9:innerWidth/innerHeight,.1,350);
camera.position.set(4.5,6.8,29);camera.lookAt(-3,8,-18);
try {
  const rendering = createRenderer(canvas,world.scene,camera,tourMode?{width:1920,height:1080,pixelRatio:1}:undefined);
  const flight = createFlight(camera,canvas,world.obstacles,toast);
  const chapters = createChapters(camera,world.starCenters,world.seamPosition,toast,world.thirdLandmarks);
  document.querySelector<HTMLButtonElement>('#chapter-two')!.onclick=()=>{flight.enter();toast('从咖啡座沿街巷向前，或飞越屋顶。罗讷河的岸灯在小镇尽头等你。');};
  document.querySelector<HTMLButtonElement>('#chapter-three')!.onclick=()=>{flight.enter();toast('沿街巷前往罗讷河，循金色笔迹升空；深处的细缝通向白昼天空下的夜园。');};
  const tour=tourMode?createTourPlayer(camera,flight):undefined;
  let low=!tourMode&&matchMedia('(max-width:700px)').matches;
  function updateQuality(){
    rendering.setQuality(low);
    world.setQuality(low);
    document.querySelector('#quality')!.innerHTML=`<span>◈</span> ${low?'轻量画质':'高画质'} <small>↗</small>`;
    document.querySelector('#quality')!.setAttribute('aria-pressed',String(low));
    document.querySelector('#flight-quality')!.textContent=low?'轻量画质':'高画质';
    document.querySelector('#flight-quality')!.setAttribute('aria-pressed',String(low));
  }
  updateQuality();
  document.querySelector<HTMLButtonElement>('#quality')!.onclick=()=>{low=!low;updateQuality();};
  document.querySelector<HTMLButtonElement>('#flight-quality')!.onclick=()=>{low=!low;updateQuality();};
  if(tourMode)for(const id of ['quality','flight-quality','sound'])document.querySelector<HTMLButtonElement>(`#${id}`)!.disabled=true;
  function updateHint(){document.querySelector('#hint')!.innerHTML=innerWidth<=700?'拖动画面环顾 <span>·</span> 方向键漫游 <span>·</span> ＋ / − 自由升降':'W A S D 移动 <span>·</span> 空格上升 / C 下降 <span>·</span> 拖动画面环顾';}
  updateHint();
  window.addEventListener('resize',()=>{camera.aspect=tourMode?16/9:innerWidth/innerHeight;camera.updateProjectionMatrix();rendering.resize();updateHint();});
  const started=performance.now();let previous=started,discovered=false;
  function frame(now:number){
    const rawDt=(now-previous)/1000,dt=Math.min(rawDt,.05);previous=now;
    if(!document.hidden){
      const chapterDt=tour?tour.update(rawDt):dt;
      if(!tour)flight.update(dt);
      world.update(tour?tour.time:(now-started)/1000,tour?tour.awakening:flight.awakening,camera);
      chapters.update(chapterDt,flight.mode);sound.setRegion(riverWeight(camera.position)*flight.awakening,cosmosWeight(camera.position)*flight.awakening,surrealWeight(camera.position)*flight.awakening);
      rendering.render();
      if(!tour&&!discovered&&flight.mode==='flying'&&camera.position.distanceTo(world.brushPosition)<9){discovered=true;toast('你找到了一段游离的笔触。它在风里，继续画着自己的夜。');}
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange',()=>{previous=performance.now();});
  document.querySelector('.loading')!.classList.add('loaded');
} catch(error) {
  document.querySelector('.loading')!.innerHTML='<p>此浏览器无法创建 WebGL 2 画境。</p><small>请开启硬件加速，或使用支持 WebGL 2 的现代浏览器。</small>';
  console.error(error);
}
const info = document.querySelector<HTMLDialogElement>('#info')!;
document.querySelector<HTMLButtonElement>('#about')!.onclick=()=>{document.exitPointerLock();info.showModal();};
document.querySelector<HTMLButtonElement>('.close')!.onclick=()=>info.close();
document.querySelector<HTMLButtonElement>('.dialog-okay')!.onclick=()=>info.close();
let toastTimer=0;
function toast(message:string){const el=document.querySelector('.toast')!;el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>el.classList.remove('visible'),4200);}
const sound=createSound(document.querySelector<HTMLButtonElement>('#sound')!);
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();toast('图形上下文已中断，请刷新页面重新进入画境。');});
