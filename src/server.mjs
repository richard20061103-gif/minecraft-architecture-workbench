import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url));
const skill=path.resolve(here,'../skills/minecraft-architecture');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.nbt':'application/octet-stream'};
export async function serve(projectDir,port=5300){
  const manifestPath=path.join(projectDir,'project.json');if(!fs.existsSync(manifestPath))throw Error(`Missing ${manifestPath}`);
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  const artifact=p=>{if(typeof p!=='string')return null;const resolved=path.resolve(projectDir,p);return resolved.startsWith(projectDir+path.sep)?resolved:null};
  const report=p=>{const file=artifact(p);if(!file||!fs.existsSync(file))return null;try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return null}};
  const previews={};let offset=1;
  for(const key of ['model','interior','cutaway']){
    const model=artifact(manifest.artifacts?.[key]);
    if(!model||!fs.existsSync(model))continue;
    const child=spawn(process.execPath,[path.join(skill,'scripts/preview.mjs'),'--nbt',model,'--host','127.0.0.1','--port',String(port+offset),'--no-open'],{stdio:'ignore',windowsHide:true});
    previews[key]={child,url:`http://127.0.0.1:${port+offset}/?nbt=%2F__minecraft_builder__%2Fbuild.nbt`};offset++;
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
  server.listen(port,'127.0.0.1',()=>console.log(`Workbench: http://127.0.0.1:${port}/`));
  process.once('SIGINT',()=>{for(const p of Object.values(previews))p.child.kill();server.close();});
}
