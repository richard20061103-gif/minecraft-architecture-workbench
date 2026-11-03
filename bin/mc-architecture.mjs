#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {planDiff,preflight,inverse,stageDatapack,lightingCensus,stratifiedLightEstimate,checkCompatibility} from '../src/core.mjs';
import {serve} from '../src/server.mjs';
const [command,...args]=process.argv.slice(2);
const opt=(name,fallback)=>{const i=args.indexOf(`--${name}`);return i>=0?args[i+1]:fallback};
const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const completeMap=(file,bounds)=>{const data=read(file);if(data?.complete!==true||JSON.stringify(data.bounds?.min)!==JSON.stringify(bounds.min)||JSON.stringify(data.bounds?.max)!==JSON.stringify(bounds.max)||!Array.isArray(data.blocks))throw Error(`Incomplete or mismatched snapshot: ${file}`);return data.blocks};
const write=(p,value)=>{fs.mkdirSync(path.dirname(path.resolve(p)),{recursive:true});fs.writeFileSync(path.resolve(p),JSON.stringify(value,null,2)+'\n')};
const usage=`mc-architecture <command> [options]
  init --project DIR --name NAME --version 1.21.8
  diff --before complete-before.json --after complete-after.json --bounds bounds.json --out plan.json
  preflight --plan plan.json --live blocks.json [--out report.json]
  rollback --plan plan.json --out rollback.json
  compat --project project.json --probe game-probe.json [--blocks blocks.json] --out report.json
  stage --plan plan.json --out DIR --version 1.21.8 [--pack-format 81]
  lighting --readings readings.json --zones zones.json --out report.json
  lighting-sample --strata strata.json --target target.json --out report.json
  serve --project DIR [--port 5300]
Complete snapshot: {"complete":true,"bounds":{"min":[0,60,0],"max":[2,70,2]},"blocks":[{"x":0,"y":64,"z":0,"block":"minecraft:stone"}]}
Omitted snapshot cells mean air. The live preflight file is an array with explicit air at every changed cell.
Use exact block states. Live writes require a verified bridge and a backup.`;
try{
  if(command==='init'){
    const dir=path.resolve(opt('project','project'));fs.mkdirSync(dir,{recursive:true});
    const version=opt('version','1.21.8');const project={schema:1,name:opt('name',path.basename(dir)),edition:'java',version,dataVersion:version==='1.21.8'?4440:null,mode:'preview',world:null,dimension:'minecraft:overworld',bounds:null,protectedPositions:[],source:{survey:null,reference:[]},design:{brief:'',style:'',floors:[],lightingZones:[],risks:[]},artifacts:{model:null,interior:null,cutaway:null,diff:null,preflight:null,lighting:null}};
    if(fs.existsSync(path.join(dir,'project.json')))throw Error('Project already exists');write(path.join(dir,'project.json'),project);console.log(dir);
  }else if(command==='diff'){
    const b=read(opt('bounds'));const plan=planDiff({before:completeMap(opt('before'),b),after:completeMap(opt('after'),b),bounds:b,protectedPositions:b.protectedPositions||[]});write(opt('out','plan.json'),plan);console.log(JSON.stringify(plan.summary));
  }else if(command==='preflight'){
    const r=preflight(read(opt('plan')),read(opt('live')));if(opt('out'))write(opt('out'),r);console.log(JSON.stringify(r,null,2));if(r.conflicts.length)process.exitCode=2;
  }else if(command==='rollback'){
    write(opt('out','rollback.json'),inverse(read(opt('plan'))));console.log(path.resolve(opt('out','rollback.json')));
  }else if(command==='compat'){
    const r=checkCompatibility(read(opt('project')),read(opt('probe')),opt('blocks')?read(opt('blocks')):[]);write(opt('out','compat-report.json'),r);console.log(JSON.stringify(r,null,2));if(!r.stageReady)process.exitCode=2;
  }else if(command==='stage'){
    const version=opt('version');if(!version)throw Error('stage requires --version');
    const suppliedFormat=opt('pack-format');if(version!=='1.21.8'&&!suppliedFormat)throw Error('Experimental versions require an explicit --pack-format checked against the game');
    const r=stageDatapack(read(opt('plan')),opt('out','staged-build'),{version,packFormat:suppliedFormat||81});console.log(JSON.stringify(r,null,2));
  }else if(command==='lighting'){
    const r=lightingCensus(read(opt('readings')),read(opt('zones')));write(opt('out','lighting-report.json'),r);console.log(JSON.stringify(r,null,2));
  }else if(command==='lighting-sample'){
    const r=stratifiedLightEstimate(read(opt('strata')),read(opt('target')));write(opt('out','lighting-sample-report.json'),r);console.log(JSON.stringify(r,null,2));
  }else if(command==='serve'){
    await serve(path.resolve(opt('project','project')),Number(opt('port',5300)));
  }else{console.log(usage);if(command&&command!=='help')process.exitCode=1;}
}catch(e){console.error(e.message);process.exitCode=1;}
