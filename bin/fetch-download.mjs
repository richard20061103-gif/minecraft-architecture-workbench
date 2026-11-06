// A separate Node process opts into the user's existing proxy without changing OS settings.
import {download} from '../src/setup.mjs';
try{const maxBytes=Number(process.argv[3]);if(!Number.isFinite(maxBytes)||maxBytes<1||maxBytes>100_000_000)throw Error('Invalid download size');process.stdout.write(await download(process.argv[2],{maxBytes}));}catch(e){console.error('Proxy download failed: '+e.message);process.exitCode=1;}
