import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {skillRoot} from './setup.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.nbt':'application/octet-stream'};
export async function serve(projectDir,port=5300){
  projectDir=fs.realpathSync(projectDir);
  const manifestPath=path.join(projectDir,'project.json');if(!fs.existsSync(manifestPath))throw Error(`Missing ${manifestPath}`);
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  const artifact=p=>{if(typeof p!=='string')return null;const resolved=path.resolve(projectDir,p);if(!resolved.startsWith(projectDir+path.sep))return null;if(fs.existsSync(resolved)&&!fs.realpathSync(resolved).startsWith(projectDir+path.sep))return null;return resolved};
  const report=p=>{const file=artifact(p);if(!file||!fs.existsSync(file))return null;try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return null}};
  const previews={};let preview=null;
  for(const key of ['model','interior','cutaway'])if(manifest.artifacts?.[key]){const model=artifact(manifest.artifacts[key]);if(!model||!fs.existsSync(model))throw Error(`Model is missing or outside the project: ${key}`);}
  for(const key of ['model','interior','cutaway']){
    const model=artifact(manifest.artifacts?.[key]);
    if(!manifest.artifacts?.[key])continue;
    if(!model||!fs.existsSync(model))throw Error(`Model is missing or outside the project: ${key}`);
    if(!preview){const skill=await skillRoot();const {startPreview}=await import(pathToFileURL(path.join(skill,'scripts/preview.mjs')).href);preview=await startPreview({nbt:model,modelRoot:projectDir,port:0});}
    const url=new URL(preview.origin);url.searchParams.set('nbt','/__minecraft_builder__/models/'+path.relative(projectDir,model).split(path.sep).map(encodeURIComponent).join('/'));url.searchParams.set('name',path.basename(model));previews[key]={url:url.toString()};
  }
  const server=http.createServer((req,res)=>{
    const u=new URL(req.url,'http://localhost');
    if(u.pathname==='/api/project'){
      const current=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
      const diff=report(current.artifacts?.diff),preflight=report(current.artifacts?.preflight),lighting=report(current.artifacts?.lighting);
      const reports={diff:diff?.summary||null,preflight:preflight?{ready:preflight.ready,applied:preflight.applied,conflicts:preflight.conflicts?.length}:null,lighting:lighting?.zones?.map(({zone,n,mean,min,p05,pass})=>({zone,n,mean,min,p05,pass}))||null};
      res.setHeader('Content-Type','application/json');res.end(JSON.stringify({...current,reports,previewUrls:Object.fromEntries(Object.entries(previews).map(([k,v])=>[k,v.url]))}));return;}
    let file=path.join(here,'../app',u.pathname==='/'?'index.html':u.pathname.slice(1));
    if(!file.startsWith(path.join(here,'../app')+path.sep)&&file!==path.join(here,'../app/index.html')){res.writeHead(403).end();return;}
    fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end('Not found');return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);});
  });
  try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve)})}catch(e){await preview?.close();throw e}
  const url=`http://127.0.0.1:${server.address().port}/`;console.log(`Workbench: ${url}`);
  const close=async()=>{await new Promise(r=>server.close(r));await preview?.close()};
  const signal=()=>void close();process.once('SIGINT',signal);process.once('SIGTERM',signal);
  return{url,close:async()=>{process.removeListener('SIGINT',signal);process.removeListener('SIGTERM',signal);await close()}};
}
