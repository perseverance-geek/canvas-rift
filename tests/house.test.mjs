import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {createInvertedHouse} from '../src/art/inverted-house.ts';
import {createSkyWalk} from '../src/art/sky-walk.ts';
import {moveWithCollisions} from '../src/flight.ts';

function segment(p,target,obstacles){
  const delta=target.clone().sub(p),count=Math.ceil(delta.length()/.08),step=delta.divideScalar(count);
  for(let i=0;i<count;i++)p=moveWithCollisions(p,step,obstacles);
  assert.ok(p.distanceTo(target)<1e-6,`blocked at ${p.toArray()} before ${target.toArray()}`);return p;
}
test('the inverted house door and atrium admit a round trip using their real obstacles',()=>{
  const obstacles=[];createInvertedHouse(obstacles);
  let p=new Vector3(0,320,-784);
  p=segment(p,new Vector3(0,320,-850),obstacles);
  p=segment(p,new Vector3(0,320,-784),obstacles);assert.equal(p.y,320);
  const blocked=moveWithCollisions(new Vector3(17,320,-797.5),new Vector3(0,0,-.1),obstacles);
  assert.ok(blocked.z>-797.61);
});
test('the day well is open vertically through the roof and the upper courtyard',()=>{
  const obstacles=[];createInvertedHouse(obstacles);
  let p=new Vector3(8,295,-835);p=segment(p,new Vector3(8,380,-835),obstacles);
  segment(p,new Vector3(8,295,-835),obstacles);
});
test('the rising stone street actually reaches the rear doorway without trapping a flyer',()=>{
  const obstacles=[];createInvertedHouse(obstacles);const walk=createSkyWalk(obstacles);
  const points=Array.from({length:121},(_,i)=>walk.curve.getPoint(i/120).add(new Vector3(0,4.5,0)));
  let p=points[0];for(const point of points.slice(1))p=segment(p,point,obstacles);
  for(const point of points.slice(0,-1).reverse())p=segment(p,point,obstacles);
});
