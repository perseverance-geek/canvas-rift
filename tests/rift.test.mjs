import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {rift,riftBlocks,insideRift,chapterAt,explorationBounds} from '../src/journey.ts';
import {moveWithCollisions} from '../src/flight.ts';

test('the opening admits a complete body in both directions and rejects its edge',()=>{
  const a={x:5,y:243,z:-557},b={...a,z:-560};
  assert.equal(riftBlocks(a,b),false);assert.equal(riftBlocks(b,a),false);
  assert.equal(riftBlocks({...a,x:50},{...b,x:50}),true);
  assert.equal(riftBlocks({...a,y:224},{...b,y:224}),true);
  assert.equal(insideRift(0,0),true);assert.equal(insideRift(100,0),false);
});
test('continuous flight crosses and retraces the seam without changing height or x',()=>{
  let p=new Vector3(5,243,-470),chapter=2,changes=0;
  for(const dz of [-.13,.13])for(let i=0;i<1300;i++){
    p=moveWithCollisions(p,new Vector3(0,0,dz),[]);
    const next=chapterAt(p,chapter);if(next!==chapter)changes++;chapter=next;
  }
  assert.ok(Math.abs(p.z+470)<1e-7);assert.equal(p.x,5);assert.equal(p.y,243);assert.equal(changes,2);
});
test('a visitor cannot leave the night garden through the wall or be clamped into the opening',()=>{
  const p=new Vector3(55,390,rift.z-.1);
  assert.deepEqual(moveWithCollisions(p,new Vector3(0,0,.3),[]).toArray(),p.toArray());
  assert.equal(explorationBounds({x:184,y:259,z:-550}).minZ,-556);
  assert.equal(chapterAt({x:5,y:243,z:rift.z-1},2),2);
  assert.equal(chapterAt({x:5,y:243,z:rift.z+1},3),3);
});
