import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3, Box3 } from 'three';
import { moveWithCollisions } from '../src/flight.ts';

test('walls stop forward movement but allow sliding parallel to the wall',()=>{
  const wall=new Box3(new Vector3(1,0,-5),new Vector3(4,12,5));
  const result=moveWithCollisions(new Vector3(.6,2,0),new Vector3(.3,0,-.4),[wall]);
  assert.equal(result.x,.6);assert.equal(result.z,-.4);
});
test('the visitor can fly above a roof and descend safely onto it',()=>{
  const building=new Box3(new Vector3(-5,0,-5),new Vector3(5,12,5));
  const position=new Vector3(0,14,0);
  assert.equal(moveWithCollisions(position,new Vector3(0,0,-.2),[building]).z,-.2);
  assert.equal(moveWithCollisions(position,new Vector3(0,-1,0),[building]).y,14);
});
test('ground and exploration bounds contain the visitor',()=>{
  const result=moveWithCollisions(new Vector3(35,2,39),new Vector3(9,-9,9),[]);
  assert.deepEqual(result.toArray(),[36,1.65,40]);
});
test('boost substeps do not tunnel through a building',()=>{
  const building=new Box3(new Vector3(-5,0,-6),new Vector3(5,15,-5));
  let position=new Vector3(0,2,0);
  for(let i=0;i<120;i++)position=moveWithCollisions(position,new Vector3(0,0,-14*.01),[building]);
  assert.ok(position.z>-4.68);assert.ok(position.z<-4.4);
});
