import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {setup,doctor,demo,locations,ROOT} from './setup.mjs';
import {bridgeSetup,bridgeCheck} from './bridge-setup.mjs';
export async function installationCommand(command,args){
 const opt=(n,f)=>{const i=args.indexOf('--'+n);if(i<0)return f;if(!args[i+1]||args[i+1].startsWith('--'))throw Error('--'+n+' requires a value');return args[i+1];};
 const options={home:opt('home'),skillDir:opt('skill-dir'),agent:opt('agent',opt('skill-dir')?'custom':'codex'),instance:opt('instance'),mcVersion:opt('mc-version'),loader:opt('loader'),replace:args.includes('--replace-skill'),replaceMod:args.includes('--replace-mod'),allowWorldWrite:args.includes('--allow-world-write'),project:opt('project')};
 if(!['codex','custom'].includes(options.agent))throw Error('--agent must be codex or custom');
 if(command==='doctor')return doctor();if(command==='demo')return demo(options);
 if(command==='bridge'){if(args[0]==='check')return bridgeCheck(options);if(args[0]==='setup'){if(!args.includes('--yes'))throw Error('Review the selected instance, then add --yes to install its compatible mod and agent bridge.');return bridgeSetup(options);}throw Error('Use bridge setup --instance DIR --yes, or bridge check --instance DIR');}
 if(command!=='setup')throw Error('Unknown installation command');
 if(!args.includes('--interactive')){if(!args.includes('--yes'))throw Error('Use setup --interactive for the wizard, or setup --yes for agent installation.');return setup(options);}
 if(!stdin.isTTY)throw Error('Interactive setup needs a terminal. Agents should pass setup --yes.');
 const rl=createInterface({input:stdin,output:stdout});try{
  console.log('\nMinecraft Architecture Workbench / 安装向导\n将安装技能和预览依赖；不会修改游戏存档。\n');
  const custom=(await rl.question('技能目录：回车使用 Codex 默认目录，或输入其他 agent 的完整技能目录：')).trim();if(custom){options.skillDir=custom;options.agent='custom';}
  console.log('安装位置：'+locations(options).target);
  if(!/^(y|yes|是)$/i.test((await rl.question('开始安装？[y/N] ')).trim()))return{cancelled:true};
  try{console.log(JSON.stringify(await setup(options),null,2));}catch(e){if(!e.message.includes('--replace-skill'))throw e;console.log(e.message);if(!/^(y|yes|是)$/i.test((await rl.question('备份现有技能后更新？[y/N] ')).trim()))return{cancelled:true};options.replace=true;console.log(JSON.stringify(await setup(options),null,2));}
  console.log('正在生成并验证示例模型……');console.log(JSON.stringify(await demo(options),null,2));
  if(/^(y|yes|是)$/i.test((await rl.question('配置 Minecraft 游戏桥接？[y/N] ')).trim())){
   options.instance=(await rl.question('所选 MC 实例目录（包含 mods/config，不是存档目录）：')).trim();
   options.allowWorldWrite=/^(y|yes|是)$/i.test((await rl.question('允许此实例提供建筑写入和游戏命令能力？[y/N] ')).trim());
   console.log('只处理这个实例。缺少启动器版本信息时会停止并说明原因。');
   try{console.log(JSON.stringify(await bridgeSetup(options),null,2));}catch(e){console.log('桥接安装未完成：'+e.message+'\n设计/预览仍可使用。按 docs/INSTALL.zh-CN.md 排查后重试。');}
  }
  console.log('\n安装流程结束。重新加载 agent 后使用 $minecraft-architecture。\nWindows 用户可双击 workbench.cmd 打开网页示例；它会使用已安装的 Node，无需修改 PATH。\n项目目录：'+ROOT);return await doctor();
 }finally{rl.close();}
}
