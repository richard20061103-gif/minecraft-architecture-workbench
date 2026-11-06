import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
import{ROOT,json,exists,locations}from './setup.mjs';
import{inspectInstance,selectVersion,bridgeCheck,mergeCodexConfig,serverSource,api}from './bridge-support.mjs';
import{FileTransaction}from './file-transaction.mjs';import{download}from './setup.mjs';
const sha512=b=>crypto.createHash('sha512').update(b).digest('hex');
export async function bridgeSetup(options={}){
 const info=await inspectInstance(options.instance,options),mods=path.join(info.instance,'mods'),runtime=path.join(ROOT,'.workbench/bridge');
 await fs.mkdir(mods,{recursive:true});await fs.mkdir(runtime,{recursive:true});
 if((await fs.lstat(mods)).isSymbolicLink())throw Error('A symlinked mods directory requires manual review');
 const id=crypto.createHash('sha256').update(info.instance).digest('hex').slice(0,12),recordFile=path.join(runtime,'installation-'+id+'.json');
 const pending=(await fs.readdir(runtime)).filter(n=>n.startsWith('transaction-'+id+'-')&&n.endsWith('.json'));
 for(const file of pending){const old=await json(path.join(runtime,file));if(['applying','needs-review'].includes(old.status))throw Error('An unfinished installation needs review: '+path.join(runtime,file)+'. Its paths, hashes and backups are retained.');}
 const config=path.join(info.instance,'config/mcpfabric.config.json');
 if(await exists(path.dirname(config))&&(await fs.lstat(path.dirname(config))).isSymbolicLink())throw Error('A symlinked config directory requires manual review');
 const oldConfig=await exists(config)?await json(config):null;
 if(oldConfig&&(oldConfig.host!=='127.0.0.1'||oldConfig.requireAuth!==true||!oldConfig.token))throw Error('Existing bridge configuration is not authenticated localhost. It was preserved; review it manually.');
 let cached=null;
 if(!options.replaceMod&&await exists(recordFile)){
  const record=await json(recordFile);let same=record.instance===info.instance&&record.mods?.length>0;
  for(const mod of record.mods??[]){const file=path.join(mods,path.basename(mod.filename));same&&=!!mod.sha512&&await exists(file)&&sha512(await fs.readFile(file))===mod.sha512;}
  if(same)cached=record;
 }
 const existing=(await fs.readdir(mods)).filter(n=>/^mcpfabric.*\.jar$/i.test(n));
 if(existing.length&&!options.replaceMod&&!cached)throw Error('Unmanaged or differing MCPFabric already exists. Review it, then use --replace-mod to back it up.');
 const primary=cached?{version_number:cached.mods.find(m=>/^mcpfabric/.test(m.filename))?.version}:await selectVersion('mcpfabric',info.mc,info.loader);
 const queue=cached?[]:[primary],seen=new Set(),payloads=[];
 if(cached)for(const mod of cached.mods)payloads.push({...mod,bytes:await fs.readFile(path.join(mods,path.basename(mod.filename)))});
 while(queue.length){
  const version=queue.shift();if(!version.game_versions?.includes(info.mc)||!version.loaders?.includes(info.loader))throw Error('Dependency release conflicts with selected game version/loader');
  if(seen.has(version.project_id))continue;seen.add(version.project_id);if(seen.size>8)throw Error('Unexpected dependency graph size');
  const file=version.files.find(f=>f.primary)??version.files[0];
  if(!file?.filename.endsWith('.jar')||path.basename(file.filename)!==file.filename||!file.hashes?.sha512)throw Error('Mod release has no verifiable JAR');
  payloads.push({filename:file.filename,bytes:await download(file.url,{sha512:file.hashes.sha512}),project:version.project_id,version:version.version_number});
  for(const dep of version.dependencies??[])if(dep.dependency_type==='required'&&dep.project_id&&!seen.has(dep.project_id))queue.push(dep.version_id?await api('https://api.modrinth.com/v2/version/'+encodeURIComponent(dep.version_id)):await selectVersion(dep.project_id,info.mc,info.loader));
 }
 const remove=new Set(),present=await fs.readdir(mods);
 for(const payload of payloads){const prefix=payload.filename.match(/^(.+?)(?=\d)/)?.[1];if(prefix)for(const name of present)if(name.endsWith('.jar')&&name.startsWith(prefix)&&name!==payload.filename){if(!options.replaceMod)throw Error('Older dependency '+name+' requires reviewed --replace-mod');remove.add(name);}const file=path.join(mods,payload.filename);if(await exists(file)&&!((await fs.readFile(file)).equals(payload.bytes))&&!options.replaceMod)throw Error('Existing mod differs: '+payload.filename);}
 for(const name of existing)if(!payloads.some(p=>p.filename===name))remove.add(name);
 const modVersion=primary.version_number?.match(/(?:^|[^0-9])(\d+\.\d+\.\d+)/)?.[1];if(!modVersion)throw Error('Cannot resolve upstream client release');
 const tag=(info.loader==='neoforge'?'neoforge-v':'v')+modVersion,server=path.join(runtime,'server-'+tag);
 if(!await exists(path.join(server,'dist/index.js')))await serverSource(server,tag);
 const launcher=path.join(runtime,'launch-'+id+'.mjs');
 const script=`import fs from 'node:fs';import {spawn} from 'node:child_process';\nconst c=JSON.parse(fs.readFileSync(${JSON.stringify(config)},'utf8'));if(c.host!=='127.0.0.1'||!c.requireAuth||!c.token||!Number.isInteger(c.port)||c.port<1||c.port>65535)throw Error('Authenticated localhost bridge required');\nconst child=spawn(process.execPath,[${JSON.stringify(path.join(server,'dist/index.js'))}],{stdio:'inherit',windowsHide:true,env:{...process.env,MCPFABRIC_URL:'http://127.0.0.1:'+c.port,MCPFABRIC_TOKEN:c.token}});child.on('error',()=>{console.error('MCP client could not start');process.exitCode=1});child.on('exit',code=>process.exit(code??1));process.on('SIGINT',()=>child.kill());process.on('SIGTERM',()=>child.kill());\n`;
 const {home}=locations(options),codex=path.join(home,'config.toml'),text=options.agent!=='custom'&&await exists(codex)?await fs.readFile(codex,'utf8'):'';
 const merged=mergeCodexConfig(text,process.execPath,[launcher]);
 const transaction=new FileTransaction(path.join(runtime,'transaction-'+id+'-'+crypto.randomUUID()+'.json'));await transaction.flush();
 try{
  for(const name of remove)await transaction.change(path.join(mods,name),null);
  for(const p of payloads)await transaction.change(path.join(mods,p.filename),p.bytes);
  if(!oldConfig)await transaction.change(config,JSON.stringify({host:'127.0.0.1',port:25599,token:crypto.randomBytes(32).toString('hex'),requireAuth:true,enableWorldWrite:!!options.allowWorldWrite,enableCommands:!!options.allowWorldWrite,enablePlayerControl:!!options.allowWorldWrite,enableVision:true,enableUiControl:false},null,2)+'\n');
  else if(options.allowWorldWrite&&(!oldConfig.enableWorldWrite||!oldConfig.enableCommands))await transaction.change(config,JSON.stringify({...oldConfig,enableWorldWrite:true,enableCommands:true},null,2)+'\n');
  await transaction.change(launcher,script);
  if(merged.changed&&options.agent!=='custom')await transaction.change(codex,merged.text);
  if(merged.conflict||options.agent==='custom')await transaction.change(path.join(runtime,'codex-mcp-fragment-'+id+'.toml'),merged.fragment);
  const result={...info,installed:true,alreadyInstalled:!!cached,launcher,mods:payloads.map(({filename,project,version,bytes})=>({filename,project,version,sha512:sha512(bytes)})),backups:[...(cached?.backups??[]),...transaction.backups],journal:transaction.journal,agentConfigured:options.agent!=='custom'&&!merged.conflict,configConflict:options.agent!=='custom'&&merged.conflict,restartRequired:true,next:'Restart the selected game and reload the agent, then run bridge check. Installation does not authorize world edits.'};
  await transaction.change(recordFile,JSON.stringify(result,null,2)+'\n');await transaction.change(path.join(runtime,'installation.json'),JSON.stringify(result,null,2)+'\n');await transaction.commit();return result;
 }catch(error){const conflicts=await transaction.rollback();if(conflicts.length)throw Error(error.message+'; rollback conflicts need review: '+transaction.journal);throw error;}
}
