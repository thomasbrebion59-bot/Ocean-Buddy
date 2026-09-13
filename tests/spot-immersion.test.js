const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../spot-immersion-model');

test('freshwater never inherits ocean wave, tide or sea-temperature readings',()=>{
  const marine={live:true,wind:'14 km/h N',swell:'1.5 m',tide:'0.4 m',temp:'22°C'};
  assert.equal(M.reading('vent',marine,true),'14 km/h N');
  for(const topic of ['houle','maree','eau'])assert.equal(M.reading(topic,marine,true),null);
  assert.ok(M.topicList(true).every(([id])=>!['houle','maree'].includes(id)));
  assert.ok(M.topicList(false).some(([id])=>id==='maree'));
});

test('teaching panels never substitute an example for unavailable forecasts',()=>{
  for(const data of [null,{}, {live:false,wind:'10 km/h'}, {live:true,wind:'—'}]) {
    assert.equal(M.reading('vent',data,false),null);
  }
  assert.equal(M.reading('houle',{live:true,swell:'0.0 m'},false),'0.0 m');
  assert.equal(M.reading('terrain',{live:true,wind:'10 km/h'},false),null);
});

test('rising tide covers more of the sloping shore without leaving the diagram',()=>{
  let previous=M.tideGeometry(0);
  for(let n=1;n<=100;n++){
    const next=M.tideGeometry(n);
    assert.ok(next.waterY<previous.waterY);
    assert.ok(next.shoreX<previous.shoreX);
    assert.ok(next.waterY>=0&&next.waterY<=260&&next.shoreX>=0&&next.shoreX<=480);
    assert.ok(Math.abs(next.waterY-(62+next.shoreX*186/480))<1e-9,'waterline meets shore');
    previous=next;
  }
  assert.deepEqual(M.tideGeometry(-100),M.tideGeometry(0));
  assert.deepEqual(M.tideGeometry(1000),M.tideGeometry(100));
  assert.deepEqual(M.tideGeometry('broken'),M.tideGeometry(0));
});

test('wind arrows respect the illustrated shore and direction of air movement',()=>{
  const {offshore,onshore,cross}=M.winds;
  assert.ok(offshore.from[0]<135&&offshore.to[0]>135);
  assert.ok(onshore.from[0]>135&&onshore.to[0]<135);
  assert.equal(cross.from[0],cross.to[0]);
  assert.notEqual(cross.from[1],cross.to[1]);
});
