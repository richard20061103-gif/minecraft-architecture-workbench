import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
const exists=p=>fs.access(p).then(()=>true,()=>false);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export async function atomicWrite(file,data){await fs.mkdir(path.dirname(file),{recursive:true});const temp=file+'.tmp-'+crypto.randomUUID();try{await fs.writeFile(temp,data,{mode:0o600,flag:'wx'});await fs.rename(temp,file);}finally{await fs.rm(temp,{force:true});}}
export class FileTransaction{
 constructor(journal){this.journal=journal;this.record={schema:1,status:'applying',operations:[]};}
 async flush(){await atomicWrite(this.journal,JSON.stringify(this.record,null,2)+'\n');}
 get backups(){return this.record.operations.map(o=>o.backup).filter(Boolean);}
 async change(file,data){file=path.resolve(file);const previous=await exists(file)?await fs.readFile(file):null,next=data===null?null:Buffer.from(data);if(previous?.equals(next??Buffer.alloc(0))&&next!==null||!previous&&!next)return;const backup=previous?file+'.backup-'+crypto.randomUUID():null;if(backup)await atomicWrite(backup,previous);const operation={file,backup,before:previous?sha(previous):null,after:next?sha(next):null};this.record.operations.push(operation);await this.flush();const now=await exists(file)?sha(await fs.readFile(file)):null;if(now!==operation.before)throw Error('File changed during installation: '+file);if(next)await atomicWrite(file,next);else await fs.unlink(file);}
 async commit(){this.record.status='complete';await this.flush();}
 async rollback(){const conflicts=[];for(const op of this.record.operations.toReversed()){const now=await exists(op.file)?sha(await fs.readFile(op.file)):null;if(now===op.before)continue;if(now!==op.after){conflicts.push(op.file);continue;}if(op.backup)await atomicWrite(op.file,await fs.readFile(op.backup));else await fs.rm(op.file,{force:true});}this.record.status=conflicts.length?'needs-review':'rolled-back';this.record.conflicts=conflicts;await this.flush();return conflicts;}
}
