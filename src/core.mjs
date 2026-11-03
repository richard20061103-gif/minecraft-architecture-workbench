import fs from 'node:fs';
import path from 'node:path';

export const position = b => `${b.x},${b.y},${b.z}`;
const BLOCK=/^minecraft:[a-z0-9_]+(?:\[[a-z0-9_=,]+\])?$/;
export function assertBlock(b) {
  for (const k of ['x','y','z']) if (!Number.isInteger(b[k])) throw Error(`Invalid ${k}: ${JSON.stringify(b)}`);
  if (typeof b.block !== 'string' || !BLOCK.test(b.block)) throw Error(`Invalid block: ${JSON.stringify(b)}`);
}
export function mapBlocks(blocks) {
  const out = new Map();
  for (const b of blocks) { assertBlock(b); const p=position(b); if(out.has(p)) throw Error(`Duplicate position ${p}`); out.set(p,b.block); }
  return out;
}
export function inBounds(b, bounds) {
  return ['x','y','z'].every((v,i)=>b[v]>=bounds.min[i]&&b[v]<=bounds.max[i]);
}
export function planDiff({before,after,bounds,protectedPositions=[]}) {
  const old=mapBlocks(before),next=mapBlocks(after),protect=new Set(protectedPositions);
  const keys=new Set([...old.keys(),...next.keys()]); const changes=[];
  for(const p of keys){const [x,y,z]=p.split(',').map(Number),pos={x,y,z};
    const from=old.get(p)||'minecraft:air',to=next.get(p)||'minecraft:air';
    if(from===to)continue;
    if(!inBounds(pos,bounds))throw Error(`Diff escapes bounds at ${p}`);
    if(protect.has(p))throw Error(`Protected position changed at ${p}`);
    changes.push({...pos,expect:from,to});
  }
  changes.sort((a,b)=>(a.to==='minecraft:air'?1:0)-(b.to==='minecraft:air'?1:0)||(a.to==='minecraft:air'?b.y-a.y:a.y-b.y)||a.x-b.x||a.z-b.z);
  return {schema:1,bounds,changes,summary:{changes:changes.length,removals:changes.filter(x=>x.to==='minecraft:air').length}};
}
export function preflight(plan,live) {
  const current=mapBlocks(live),conflicts=[],ready=[],applied=[];
  for(const c of plan.changes){const p=position(c);if(!current.has(p))throw Error(`Live snapshot missing changed cell ${p}; record explicit air blocks`);
    const actual=current.get(p);
    if(actual===c.to)applied.push(c);else if(actual===c.expect)ready.push(c);else conflicts.push({...c,actual});}
  return {ready:ready.length,applied:applied.length,conflicts};
}
export function inverse(plan) {
  return {...plan,changes:[...plan.changes].reverse().map(({expect,to,...rest})=>({...rest,expect:to,to:expect}))};
}
export function checkCompatibility(project,probe,blocks=[]) {
  const errors=[],warnings=[];
  const version=project?.version;
  if(project?.edition!=='java'||!/^1\.21(?:\.\d+)?$/.test(version||''))errors.push('Project must target Java 1.21.x');
  if(probe?.edition!=='java'||probe?.version!==version)errors.push('Connected game edition/version does not match project');
  if(!project?.world||!probe?.worldId)errors.push('World identity is required for live staging');
  if(project?.world&&probe?.worldId!==project.world)errors.push('Connected world ID does not match project');
  if(!project?.dimension||!probe?.dimension||probe.dimension!==project.dimension)errors.push('Connected dimension does not match project');
  if(!project?.bounds||!Array.isArray(project.bounds.min)||!Array.isArray(project.bounds.max))errors.push('Bounded live construction area is required');
  if(!Number.isInteger(probe?.dataVersion)||probe.dataVersion<1)errors.push('Game data version has not been verified');
  if(!Number.isInteger(project?.dataVersion)||project.dataVersion!==probe?.dataVersion)errors.push('NBT data version does not match the game or is undeclared');
  const f=String(probe?.packFormat??'');const match=/^(\d+)(?:\.(\d+))?$/.exec(f),major=match?Number(match[1]):0;
  if(!match||major<1)errors.push('Game data pack format has not been verified');
  const patch=Number(String(version||'').split('.')[2]||0);
  if(version==='1.21.8'&&major!==81)errors.push('Java 1.21.8 data pack format must be 81');
  if(patch>=9&&major<82)errors.push('Java 1.21.9+ needs new data pack metadata');
  if(patch<=8&&major>=82)errors.push('Selected game predates new data pack metadata');
  const required=['get_status','get_block','get_blocks_region','run_command'];
  for(const c of required)if(!probe?.bridgeTools?.includes(c))errors.push(`Bridge tool unavailable: ${c}`);
  const known=new Set(probe?.knownBlockIds||[]);
  const used=new Set(blocks.map(b=>String(b.block||b.to||'').split('[')[0]).filter(Boolean));
  if(!used.size)errors.push('Target block palette was not supplied');
  if(used.size&&!known.size)errors.push('Block registry was not supplied');
  else for(const id of used)if(!known.has(id))errors.push(`Unknown target block ID: ${id}`);
  if(blocks.some(b=>String(b.block||b.to||'').includes('[')))warnings.push('Block state properties still require an in-game check');
  if(version!=='1.21.8')warnings.push('This Java 1.21.x version is experimental until tested in-game');
  return {schema:1,version,packFormat:f,errors,warnings,previewReady:project?.edition==='java',stageReady:errors.length===0,liveVerifiedByThisCheck:false};
}
export function stageDatapack(plan,dir,{namespace='mcarchitecture',batchSize=300,packFormat=81,version='1.21.8'}={}) {
  if(!/^[a-z0-9_.-]+$/.test(namespace)||!Number.isInteger(batchSize)||batchSize<1||batchSize>1000)throw Error('Invalid stage options');
  if(!/^1\.21(?:\.\d+)?$/.test(version))throw Error('Only Java 1.21.x can be staged');
  const formatText=String(packFormat);
  if(!/^\d+(?:\.\d+)?$/.test(formatText))throw Error('A target-version data pack format is required');
  const [major,minor=0]=formatText.split('.').map(Number);
  if(major<1||!Number.isSafeInteger(major)||!Number.isSafeInteger(minor))throw Error('Invalid data pack format');
  const patch=Number(version.split('.')[2]||0);
  if(version==='1.21.8'&&major!==81)throw Error('Java 1.21.8 requires data pack format 81');
  if(patch>=9&&major<82)throw Error('Java 1.21.9+ requires the new data pack metadata format');
  if(patch<=8&&major>=82)throw Error('The selected 1.21.x version predates the new data pack metadata format');
  if(!plan||!plan.bounds||!Array.isArray(plan.changes))throw Error('Invalid diff plan');
  for(const c of plan.changes){for(const k of ['x','y','z'])if(!Number.isInteger(c[k]))throw Error('Invalid diff coordinate');
    if(!inBounds(c,plan.bounds)||!BLOCK.test(c.expect)||!BLOCK.test(c.to))throw Error(`Unsafe diff entry at ${position(c)}`);}
  const root=path.resolve(dir);if(fs.existsSync(root))throw Error(`Stage directory already exists: ${root}`);
  const target=path.join(root,'data',namespace,'function');fs.mkdirSync(target,{recursive:true});
  const pack=major<82?{pack_format:major,description:'Minecraft Architecture bounded build'}:{min_format:[major,minor],max_format:[major,minor],description:'Minecraft Architecture bounded build'};
  fs.writeFileSync(path.join(root,'pack.mcmeta'),JSON.stringify({pack}));
  const batches=[];
  for(let i=0;i<plan.changes.length;i+=batchSize){const name=`batch_${String(i/batchSize).padStart(3,'0')}`;
    const lines=plan.changes.slice(i,i+batchSize).map(c=>`execute if block ${c.x} ${c.y} ${c.z} ${c.expect} run setblock ${c.x} ${c.y} ${c.z} ${c.to}`);
    fs.writeFileSync(path.join(target,`${name}.mcfunction`),lines.join('\n')+'\n');batches.push(`${namespace}:${name}`);}
  fs.writeFileSync(path.join(root,'deployment.json'),JSON.stringify({schema:1,createdAt:new Date().toISOString(),bounds:plan.bounds,summary:plan.summary,batches,rollback:inverse(plan)},null,2));
  return {root,batches,commands:plan.changes.length};
}
export function lightingCensus(readings,zones){
  const out=[];
  for(const z of zones){const rows=readings.filter(r=>r.zone===z.id),a=rows.map(r=>r.blockLight);
    if(!a.length)throw Error(`No readings for ${z.id}`);
    if(!Number.isInteger(z.population)||z.population!==rows.length)throw Error(`Incomplete walkable-cell census for ${z.id}`);
    if(new Set(rows.map(position)).size!==rows.length||rows.some(r=>['x','y','z'].some(k=>!Number.isInteger(r[k]))))throw Error(`Duplicate or invalid reading coordinates for ${z.id}`);
    if(a.some(v=>!Number.isInteger(v)||v<0||v>15))throw Error(`Invalid blockLight in ${z.id}`);
    a.sort((x,y)=>x-y); const mean=a.reduce((x,y)=>x+y,0)/a.length;
    const p05=a[Math.ceil(.05*a.length)-1];
    out.push({zone:z.id,n:a.length,mean,median:a.length%2?a[Math.floor(a.length/2)]:(a[a.length/2-1]+a[a.length/2])/2,min:a[0],p05,belowLower:a.filter(v=>v<z.lower).length,darkPoints:rows.filter(r=>r.blockLight<z.lower).map(({x,y,z,blockLight})=>({x,y,z,blockLight})),target:[z.lower,z.upper],pass:mean>=z.lower&&mean<=z.upper&&(z.min===undefined||a[0]>=z.min)&&(z.p05Min===undefined||p05>=z.p05Min)});
  }
  const n=out.reduce((s,z)=>s+z.n,0);return {method:'full-census',zones:out,overallMean:out.reduce((s,z)=>s+z.mean*z.n,0)/n};
}
const t95=[[1,12.706],[2,4.303],[3,3.182],[4,2.776],[5,2.571],[6,2.447],[7,2.365],[8,2.306],[9,2.262],[10,2.228],[12,2.179],[15,2.131],[20,2.086],[25,2.060],[30,2.042],[40,2.021],[60,2],[120,1.98],[Infinity,1.96]];
export function stratifiedLightEstimate(spec,target){
  const {strata,seed,method}=spec;
  if(!Array.isArray(strata)||!strata.length||seed===undefined||method!=='random-without-replacement')throw Error('A predeclared random sample method and seed are required');
  const N=strata.reduce((s,h)=>s+h.population,0);if(N<1)throw Error('Empty population');
  let mean=0,variance=0,denominator=0;
  const report=strata.map(h=>{
    const a=h.values,n=a.length,Nh=h.population;
    if(!Number.isInteger(Nh)||Nh<n||n<2||a.some(v=>!Number.isInteger(v)||v<0||v>15))throw Error(`Invalid sample stratum ${h.id}`);
    const m=a.reduce((s,v)=>s+v,0)/n,s2=a.reduce((s,v)=>s+(v-m)**2,0)/(n-1),w=Nh/N,v=w*w*(1-n/Nh)*s2/n;
    mean+=w*m;variance+=v;if(v>0)denominator+=v*v/(n-1);
    return {id:h.id,population:Nh,sampled:n,mean:m,sampleVariance:s2,weight:w,varianceContribution:v};
  });
  const se=Math.sqrt(variance),df=denominator?variance**2/denominator:null;
  const fullCensus=report.every(h=>h.population===h.sampled);
  const critical=variance===0?(fullCensus?0:null):df&&df>=1?t95.filter(([d])=>d<=df).at(-1)?.[1]:null;
  const interval=critical===null||critical===undefined?null:[mean-critical*se,mean+critical*se];
  return {method:'stratified-srswor',seed,strata:report,estimate:mean,standardError:se,degreesFreedom:df,interval95:interval,meanPass:interval?interval[0]>=target.lower&&interval[1]<=target.upper:null,minimumCertified:false,p05Certified:false,notes:'Predeclared independent strata; adjacent spatial cells may violate independence. The critical value uses the next lower listed degrees of freedom conservatively.'};
}
