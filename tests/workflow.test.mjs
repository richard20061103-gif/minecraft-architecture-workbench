import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {planDiff,preflight,inverse,stageDatapack,lightingCensus,stratifiedLightEstimate,checkCompatibility} from '../src/core.mjs';
const b=(x,y,z,block)=>({x,y,z,block});
const bounds={min:[0,60,0],max:[2,70,2]};
const cleanupTemp=dir=>{const root=fs.realpathSync(os.tmpdir()),target=fs.realpathSync(dir);if(!target.startsWith(root+path.sep)||path.basename(target).indexOf('mc-architecture-')!==0)throw Error('Unsafe temporary cleanup target');fs.rmSync(target,{recursive:true,force:true})};
test('bounded diff refuses protected positions and creates inverse',()=>{
  assert.throws(()=>planDiff({before:[],after:[b(3,64,0,'minecraft:stone')],bounds}),/escapes bounds/);
  assert.throws(()=>planDiff({before:[],after:[b(1,64,0,'minecraft:stone')],bounds,protectedPositions:['1,64,0']}),/Protected/);
  const d=planDiff({before:[b(0,64,0,'minecraft:oak_planks')],after:[b(1,64,0,'minecraft:stone')],bounds});
  assert.equal(d.changes.length,2);assert.equal(d.summary.removals,1);
  const live=[b(0,64,0,'minecraft:oak_planks'),b(1,64,0,'minecraft:dirt')];
  assert.equal(preflight(d,live).conflicts.length,1);
  const done=[b(0,64,0,'minecraft:air'),b(1,64,0,'minecraft:stone')];assert.equal(preflight(d,done).applied,2);
  assert.equal(preflight(inverse(d),done).ready,2);
  assert.throws(()=>preflight(d,[b(1,64,0,'minecraft:air')]),/missing changed cell/);
});
test('staged data pack guards every write and refuses overwrite',()=>{
  const d=planDiff({before:[],after:[b(0,64,0,'minecraft:stone')],bounds});
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mc-architecture-'));
  try{const dir=path.join(tmp,'stage');const r=stageDatapack(d,dir);assert.equal(r.commands,1);
    const fn=fs.readFileSync(path.join(dir,'data','mcarchitecture','function','batch_000.mcfunction'),'utf8');
    assert.match(fn,/execute if block 0 64 0 minecraft:air run setblock 0 64 0 minecraft:stone/);
    assert.throws(()=>stageDatapack(d,dir),/already exists/);
    assert.throws(()=>stageDatapack(d,path.join(tmp,'wrong'),{version:'1.21.9',packFormat:81}),/new data pack/);
    const newer=path.join(tmp,'stage-new');stageDatapack(d,newer,{version:'1.21.11',packFormat:'94.1'});
    const meta=JSON.parse(fs.readFileSync(path.join(newer,'pack.mcmeta'),'utf8'));
    assert.deepEqual(meta.pack.min_format,[94,1]);assert.deepEqual(meta.pack.max_format,[94,1]);
  }finally{cleanupTemp(tmp);}
});
test('lighting census and stratified sample keep dark-point limits separate',()=>{
  const c=lightingCensus([{zone:'hall',x:0,y:65,z:0,blockLight:5},{zone:'hall',x:1,y:65,z:0,blockLight:11}],[{id:'hall',population:2,lower:7,upper:10,min:6}]);
  assert.equal(c.zones[0].mean,8);assert.equal(c.zones[0].median,8);assert.equal(c.zones[0].pass,false);
  assert.equal(c.zones[0].darkPoints[0].x,0);
  assert.throws(()=>lightingCensus([{zone:'hall',x:0,y:65,z:0,blockLight:5},{zone:'hall',x:0,y:65,z:0,blockLight:11}],[{id:'hall',population:2,lower:7,upper:10}]),/Duplicate/);
  assert.equal(lightingCensus([{zone:'hall',x:0,y:65,z:0,blockLight:7},{zone:'hall',x:1,y:65,z:0,blockLight:11}],[{id:'hall',population:2,lower:7,upper:10,p05Min:8}]).zones[0].pass,false);
  const s=stratifiedLightEstimate({method:'random-without-replacement',seed:42,strata:[{id:'a',population:4,values:[8,9,10,11]},{id:'b',population:4,values:[8,9,10,11]}]},{lower:7,upper:12});
  assert.equal(s.estimate,9.5);assert.deepEqual(s.interval95,[9.5,9.5]);assert.equal(s.minimumCertified,false);
  const flat=stratifiedLightEstimate({method:'random-without-replacement',seed:7,strata:[{id:'a',population:8,values:[10,10]}]},{lower:9,upper:11});
  assert.equal(flat.interval95,null);assert.equal(flat.meanPass,null);
  assert.throws(()=>stageDatapack({bounds,changes:[{x:0,y:64,z:0,expect:'minecraft:air',to:'minecraft:stone\nkill @a'}]},path.join(os.tmpdir(),'bad-stage')),/Unsafe diff entry/);
});
test('cross-version check stops mismatches and keeps experimental status explicit',()=>{
  const project={edition:'java',version:'1.21.11',dataVersion:4000,world:'example-world',dimension:'minecraft:overworld',bounds};
  const probe={edition:'java',version:'1.21.11',dataVersion:4000,packFormat:'94.1',worldId:'example-world',dimension:'minecraft:overworld',bridgeTools:['get_status','get_block','get_blocks_region','run_command'],knownBlockIds:['minecraft:stone']};
  const okay=checkCompatibility(project,probe,[b(0,0,0,'minecraft:stone')]);
  assert.equal(okay.stageReady,true);assert.equal(okay.liveVerifiedByThisCheck,false);assert.match(okay.warnings.join(' '),/experimental/);
  assert.equal(checkCompatibility(project,{...probe,worldId:'another-world'},[]).stageReady,false);
  assert.equal(checkCompatibility(project,{...probe,packFormat:81},[]).stageReady,false);
  assert.equal(checkCompatibility(project,probe,[b(0,0,0,'minecraft:future_block')]).stageReady,false);
});
test('CLI diff refuses partial captures and accepts declared complete maps',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mc-architecture-cli-'));
  const cli=path.resolve('bin/mc-architecture.mjs');
  try{
    const put=(name,value)=>{const file=path.join(tmp,name);fs.writeFileSync(file,JSON.stringify(value));return file};
    const limit=put('bounds.json',bounds),before=put('before.json',{complete:true,bounds,blocks:[]}),after=put('after.json',[b(0,64,0,'minecraft:stone')]);
    const output=path.join(tmp,'plan.json');
    assert.throws(()=>execFileSync(process.execPath,[cli,'diff','--before',before,'--after',after,'--bounds',limit,'--out',output],{stdio:'pipe'}));
    put('after.json',{complete:true,bounds,blocks:[b(0,64,0,'minecraft:stone')]});
    execFileSync(process.execPath,[cli,'diff','--before',before,'--after',after,'--bounds',limit,'--out',output],{stdio:'pipe'});
    assert.equal(JSON.parse(fs.readFileSync(output,'utf8')).summary.changes,1);
  }finally{cleanupTemp(tmp);}
});
