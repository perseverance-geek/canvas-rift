import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CatmullRomCurve3,LineCurve3,Vector3} from 'three';
import {impastoStroke} from '../src/art/impasto.ts';

test('a vertical paint stroke has finite surfaces even when its tangent matches the reference',()=>{
  const geometry=impastoStroke(new LineCurve3(new Vector3(0,0,0),new Vector3(0,30,0)),2,.4,0,32,new Vector3(0,1,0));
  for(const name of ['position','normal','uv'])assert.ok([...geometry.attributes[name].array].every(Number.isFinite));
  assert.ok(geometry.boundingSphere.radius>15);
  assert.ok([...geometry.index.array].every(i=>i<geometry.attributes.position.count));
  geometry.dispose();
});

test('a rising S-shaped brush load keeps its cross-section orientation through vertical tangents',()=>{
  const curve=new CatmullRomCurve3([new Vector3(-8,0,0),new Vector3(0,15,-3),new Vector3(0,30,-6),new Vector3(-8,45,-9),new Vector3(2,60,-12)]);
  const geometry=impastoStroke(curve,2,.3,0,160,new Vector3(0,1,0));
  const positions=geometry.attributes.position,side=new Vector3(),previous=new Vector3(),a=new Vector3(),b=new Vector3();
  for(let i=0;i<=160;i++){
    a.fromBufferAttribute(positions,i*9);b.fromBufferAttribute(positions,i*9+8);side.subVectors(b,a).normalize();
    assert.ok(side.lengthSq()>.99);
    if(i)assert.ok(side.dot(previous)>.9,`cross-section flipped at sample ${i}`);
    previous.copy(side);
  }
  geometry.dispose();
});
