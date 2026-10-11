import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Vector3,Quaternion,Euler} from 'three';
import {entryDuration,sampleTour,tourDuration,tourTitle,createTourClock} from '../src/tour.ts';
import {moveWithCollisions,playerBox} from '../src/flight.ts';
import {createInvertedHouse} from '../src/art/inverted-house.ts';
import {createSkyWalk} from '../src/art/sky-walk.ts';
import {chapterAt} from '../src/journey.ts';

test('the continuous tour fits bounds, portal and real house/stone-walk obstacles',()=>{
  const obstacles=[];createInvertedHouse(obstacles);createSkyWalk(obstacles);
  let previous=sampleTour(entryDuration),chapter=1,changes=[];
  assert.ok(previous.position.distanceTo(new Vector3(.5,1.75,12))<1e-8);
  assert.ok(previous.quaternion.angleTo(new Quaternion().setFromEuler(new Euler(.02,.15,0,'YXZ')))<1e-7);
  for(let tick=Math.ceil(entryDuration*600)+1;tick<=tourDuration*600;tick++){
    const time=tick/600,pose=sampleTour(time),step=pose.position.clone().sub(previous.position);
    assert.ok(step.length()<.2,`position jump at ${time}`);
    assert.ok(pose.quaternion.angleTo(previous.quaternion)<.025,`rotation jump at ${time}`);
    assert.ok(pose.position.distanceTo(pose.target)>5,`degenerate aim at ${time}`);
    assert.ok(!obstacles.some(o=>o.intersectsBox(playerBox(pose.position))),`solid at ${time}`);
    const actual=moveWithCollisions(previous.position,step,obstacles);
    assert.ok(actual.distanceTo(pose.position)<1e-7,`blocked at ${time}: ${actual.toArray()} / ${pose.position.toArray()}`);
    const next=chapterAt(pose.position,chapter);if(next!==chapter)changes.push(next);chapter=next;
    const up=new Vector3(1,0,0).applyQuaternion(pose.quaternion);
    assert.ok(Math.abs(up.y)<1e-8,'camera must not roll');previous=pose;
  }
  assert.deepEqual(changes,[2,3]);
  assert.ok(previous.position.distanceTo(new Vector3(8,323,-824))<1e-8);
  assert.ok(sampleTour(60).position.distanceTo(sampleTour(59.2).position)<1e-8);
});

test('tour clock pauses on Esc/hidden pages, replays and holds the end',()=>{
  const clock=createTourClock();clock.advance(5);assert.equal(clock.time,0);
  clock.start();clock.advance(10);clock.togglePause();clock.advance(20);assert.equal(clock.time,10);
  clock.togglePause();clock.advance(20,false);assert.equal(clock.time,10);
  clock.advance(50);assert.equal(clock.state,'finished');clock.advance(10);assert.equal(clock.time,60);
  clock.reset();assert.equal(clock.state,'ready');assert.equal(clock.time,0);assert.equal(clock.paused,false);
  clock.start();clock.advance(4.5);assert.equal(tourTitle(clock.time).index,'I');
  assert.equal(tourTitle(14.5).index,'II');assert.equal(tourTitle(45).index,'III');assert.equal(tourTitle(60),null);
});

test('Bezier segments maintain continuous velocity at timed joins',()=>{
  for(const t of [6,8,14,22,28,34,37,39.5,41,44.5,49,53,55.5,58,59.2]){
    const h=1e-4,p=sampleTour(t).position;
    const a=p.clone().sub(sampleTour(t-h).position).divideScalar(h);
    const b=sampleTour(t+h).position.sub(p).divideScalar(h);
    assert.ok(a.distanceTo(b)<.05,`velocity discontinuity at ${t}`);
  }
});
