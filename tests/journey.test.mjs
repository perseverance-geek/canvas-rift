import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {chapterAt,cosmosWeight,explorationBounds,riverWeight} from '../src/journey.ts';
import {moveWithCollisions} from '../src/flight.ts';

test('the cafe keeps its original width, height and atmosphere',()=>{
  for(const z of [29,12,-19,-70]){
    const p={x:0,y:40,z};
    assert.equal(explorationBounds(p).width,36);
    assert.equal(explorationBounds(p).maxY,96);
    assert.equal(riverWeight(p),0);assert.equal(cosmosWeight(p),0);
  }
});
test('the street reaches the water and can be retraced without changing height',()=>{
  let p=new Vector3(1,1.75,12);
  for(let i=0;i<2600;i++)p=moveWithCollisions(p,new Vector3(0,0,-.1),[]);
  assert.ok(p.z<-240);assert.equal(p.y,1.75);assert.equal(chapterAt(p,1),2);
  for(let i=0;i<2600;i++)p=moveWithCollisions(p,new Vector3(0,0,.1),[]);
  assert.ok(Math.abs(p.z-12)<1e-8);assert.equal(chapterAt(p,2),1);
});
test('the river allows wide exploration and sky flight but keeps finite limits',()=>{
  assert.deepEqual(moveWithCollisions(new Vector3(184,259,-550),new Vector3(10,10,-10),[]).toArray(),[185,260,-556]);
  assert.equal(moveWithCollisions(new Vector3(0,2,-210),new Vector3(0,-5,0),[]).y,1.65);
});
test('chapter overlap remains stable when crossing the quay repeatedly',()=>{
  assert.equal(chapterAt({x:0,y:2,z:-140},1),1);
  assert.equal(chapterAt({x:0,y:2,z:-140},2),2);
  assert.equal(chapterAt({x:0,y:100,z:-152},1),2);
  assert.equal(chapterAt({x:0,y:100,z:-124},2),1);
});
test('cosmic scale expands smoothly with altitude only over the river',()=>{
  const weights=[24,50,90,155].map(y=>cosmosWeight({x:0,y,z:-220}));
  assert.equal(weights[0],0);assert.equal(weights[3],1);
  assert.ok(weights[1]>0&&weights[1]<weights[2]&&weights[2]<1);
});
