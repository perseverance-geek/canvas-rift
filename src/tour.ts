import * as THREE from 'three';

export const tourDuration=60;
export const entryDuration=3.8;
type Point=readonly [number,number,number];
interface Shot {time:number;position:Point;target:Point}
const initialDirection=new THREE.Vector3(0,0,-100).applyEuler(new THREE.Euler(.02,.15,0,'YXZ'));
const initialTarget=initialDirection.add(new THREE.Vector3(.5,1.75,12)).toArray() as [number,number,number];

// Times are measured from the real entry click. The opening is owned by flight.ts.
const shots:Shot[]=[
  {time:3.8,position:[.5,1.75,12],target:initialTarget},
  {time:6,position:[1,2.7,0],target:[-3,4,-15]},
  {time:8,position:[1,3,-28],target:[1,8,-115]},
  {time:14,position:[1,4.5,-174],target:[-8,12,-310]},
  {time:22,position:[8,9,-230],target:[-15,28,-395]},
  {time:28,position:[12,80,-289],target:[-38,160,-386]},
  {time:34,position:[30,176,-367],target:[-38,180,-425]},
  {time:37,position:[-15,209,-442],target:[-55,207,-505]},
  {time:39.5,position:[5,243,-490],target:[5,243,-625]},
  {time:41,position:[5,243,-540],target:[5,243,-625]},
  {time:44.5,position:[5,243,-610],target:[-26,245,-690]},
  {time:49,position:[-8,249,-652],target:[-40,250,-735]},
  {time:53,position:[9,273,-710],target:[0,320,-797]},
  {time:55.5,position:[0,320,-773],target:[0,326,-835]},
  {time:58,position:[0,320,-815],target:[0,329,-835]},
  {time:59.2,position:[8,323,-824],target:[0,329,-835]},
  {time:60,position:[8,323,-824],target:[0,329,-835]},
];

// Monotone Hermite tangents become Bezier handles: continuous velocity without
// overshooting narrow street/door/portal corridors, unlike an unconstrained spline.
function curves(field:'position'|'target'){
  const points=shots.map(shot=>new THREE.Vector3(...shot[field]));
  const tangents=points.map((_,i)=>{
    const tangent=new THREE.Vector3();
    if(i===0||i===points.length-1)return tangent;
    const before=shots[i].time-shots[i-1].time,after=shots[i+1].time-shots[i].time;
    for(const axis of ['x','y','z'] as const){
      const a=(points[i][axis]-points[i-1][axis])/before,b=(points[i+1][axis]-points[i][axis])/after;
      if(a*b>0){const w1=2*after+before,w2=after+2*before;tangent[axis]=(w1+w2)/(w1/a+w2/b);}
    }
    return tangent;
  });
  return points.slice(0,-1).map((point,i)=>{
    const interval=(shots[i+1].time-shots[i].time)/3;
    return new THREE.CubicBezierCurve3(point,point.clone().addScaledVector(tangents[i],interval),points[i+1].clone().addScaledVector(tangents[i+1],-interval),points[i+1]);
  });
}
const positions=curves('position'),targets=curves('target');
const aimCamera=new THREE.PerspectiveCamera();
export function sampleTour(time:number){
  const t=THREE.MathUtils.clamp(time,entryDuration,tourDuration);
  let index=0;
  while(index<shots.length-2&&t>shots[index+1].time)index++;
  const u=(t-shots[index].time)/(shots[index+1].time-shots[index].time);
  const position=positions[index].getPoint(u),target=targets[index].getPoint(u);
  aimCamera.position.copy(position);aimCamera.lookAt(target);
  return {position,target,quaternion:aimCamera.quaternion.clone()};
}

export function tourTitle(time:number){
  if(time>=4&&time<7)return {index:'I',name:'金色的夜',source:'《夜间露天咖啡座》启发的艺术世界'};
  if(time>=14&&time<17)return {index:'II',name:'星河无岸',source:'《罗讷河上的星夜》启发的绘画宇宙'};
  if(time>=44.5&&time<47.5)return {index:'III',name:'白昼的暗面',source:'白昼天空下的悬空夜园 · 马格利特艺术思想启发'};
  return null;
}

export function createTourClock(){
  let time=0,paused=false,state:'ready'|'playing'|'finished'='ready';
  return {
    get time(){return time;},get paused(){return paused;},get state(){return state;},
    start(){time=0;paused=false;state='playing';},
    reset(){time=0;paused=false;state='ready';},
    togglePause(){if(state==='playing')paused=!paused;},
    advance(dt:number,visible=true){
      if(state==='playing'&&!paused&&visible){time=Math.min(tourDuration,time+Math.max(0,dt));if(time===tourDuration)state='finished';}
      return time;
    },
  };
}
