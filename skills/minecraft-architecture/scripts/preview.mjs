#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import {randomUUID} from 'node:crypto'
import { createServer } from 'vite'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const skillRoot = path.resolve(scriptDir, '..')
const viewerRoot = path.join(skillRoot, 'assets', 'viewer')

function usage() {
  return `Usage:
  node scripts/preview.mjs --nbt <path/to/build.nbt> [--host 127.0.0.1] [--port 5173] [--lighting day|night] [--open|--no-open]
`
}

function parseArgs(argv) {
  const options = {
    nbt: undefined,
    host: '127.0.0.1',
    port: 5173,
    lighting: 'day',
    open: true,
    help: false,
  }
  const readValue = (arg, index) => {
    const value = argv[index + 1]
    if (!value || value.startsWith('-')) throw new Error(`${arg} requires a value`)
    return value
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '-h' || arg === '--help') {
      options.help = true
    } else if (arg === '--nbt') {
      options.nbt = readValue(arg, index)
      index += 1
    } else if (arg.startsWith('--nbt=')) {
      options.nbt = arg.slice('--nbt='.length)
    } else if (arg === '--host') {
      options.host = readValue(arg, index)
      index += 1
    } else if (arg.startsWith('--host=')) {
      options.host = arg.slice('--host='.length)
    } else if (arg === '--port') {
      options.port = Number(readValue(arg, index))
      index += 1
    } else if (arg.startsWith('--port=')) {
      options.port = Number(arg.slice('--port='.length))
    } else if (arg === '--lighting') {
      options.lighting = readValue(arg, index)
      index += 1
    } else if (arg.startsWith('--lighting=')) {
      options.lighting = arg.slice('--lighting='.length)
    } else if (arg === '--open') {
      options.open = true
    } else if (arg === '--no-open') {
      options.open = false
    } else if (!options.nbt) {
      options.nbt = arg
    } else {
      throw new Error(`Unexpected argument: ${arg}`)
    }
  }
  if (!Number.isInteger(options.port) || options.port < 0) {
    throw new Error('--port must be a non-negative integer')
  }
  if (!['day', 'night'].includes(options.lighting)) {
    throw new Error('--lighting must be day or night')
  }
  return options
}

function contentType(filePath) {
  if (filePath.endsWith('.json')) return 'application/json'
  if (filePath.endsWith('.png')) return 'image/png'
  if (filePath.endsWith('.txt')) return 'text/plain; charset=utf-8'
  if (filePath.endsWith('.nbt')) return 'application/octet-stream'
  return 'application/octet-stream'
}

async function resolveLodestoneRoot() {
  const indexUrl = await import.meta.resolve('@mattzh72/lodestone')
  const indexPath = fileURLToPath(indexUrl)
  return path.resolve(path.dirname(indexPath), '..')
}

async function openUrl(url) {
  const command = process.platform === 'darwin'
    ? 'open'
    : process.platform === 'win32'
      ? 'cmd'
      : 'xdg-open'
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url]
  const child = spawn(command, args, {
    stdio: 'ignore',
    detached: true,
  })
  child.on('error', () => undefined)
  child.unref()
}

function serveFile(response, filePath) {
  response.statusCode = 200
  response.setHeader('Content-Type', contentType(filePath))
  const stream = createReadStream(filePath)
  stream.on('error', error => {
    if (!response.headersSent) {
      response.statusCode = 500
      response.end('Failed to read file')
    } else {
      response.destroy(error)
    }
  })
  stream.pipe(response)
}

function createPreviewMiddlewarePlugin(nbtPath, defaultPackRoot, modelRoot) {
  return {
    name: 'minecraft-builder-preview-middleware',
    configureServer(server) {
      server.middlewares.use('/__minecraft_builder__/build.nbt', (_request, response) => {
        serveFile(response, nbtPath)
      })

      // Related full/detail/cutaway NBTs may share one local preview server.
      server.middlewares.use('/__minecraft_builder__/models/', async (request, response) => {
        try {
          const requestUrl = new URL(request.url ?? '/', 'http://localhost')
          const relativePath = decodeURIComponent(requestUrl.pathname.replace(/^\/+/, ''))
          const modelPath = path.resolve(modelRoot, relativePath)
          if (!modelPath.startsWith(`${modelRoot}${path.sep}`) || !modelPath.endsWith('.nbt')) {
            response.statusCode = 403
            response.end('Forbidden')
            return
          }
          await fs.access(modelPath)
          const realModel=await fs.realpath(modelPath),realRoot=await fs.realpath(modelRoot)
          if(!realModel.startsWith(realRoot+path.sep)){response.statusCode=403;response.end('Forbidden');return}
          serveFile(response, modelPath)
        } catch {
          response.statusCode = 404
          response.end('Not found')
        }
      })

      server.middlewares.use('/__minecraft_builder__/default-pack/', async (request, response) => {
        try {
          const requestUrl = new URL(request.url ?? '/', 'http://localhost')
          const relativePath = decodeURIComponent(requestUrl.pathname.replace(/^\/+/, ''))
          const filePath = path.resolve(defaultPackRoot, relativePath)
          const allowedRoot = `${defaultPackRoot}${path.sep}`
          if (filePath !== defaultPackRoot && !filePath.startsWith(allowedRoot)) {
            response.statusCode = 403
            response.end('Forbidden')
            return
          }
          await fs.access(filePath)
          serveFile(response, filePath)
        } catch {
          response.statusCode = 404
          response.end('Not found')
        }
      })
    },
  }
}

export async function startPreview(input) {
  const options={host:'127.0.0.1',port:0,lighting:'day',...input}
  if (!options.nbt) {
    throw new Error(`Missing --nbt path.\n${usage()}`)
  }

  const nbtPath = path.resolve(options.nbt)
  await fs.access(nbtPath)
  const lodestoneRoot = await resolveLodestoneRoot()
  const defaultPackRoot = path.join(lodestoneRoot, 'assets', 'default-pack')
  const modelRoot=path.resolve(options.modelRoot??path.dirname(nbtPath))
  const cacheDir=path.join(os.tmpdir(),'mc-architecture-vite-'+randomUUID())

  const server = await createServer({
    root: viewerRoot,
    appType: 'spa',
    clearScreen: false,
    cacheDir,
    plugins: [createPreviewMiddlewarePlugin(nbtPath, defaultPackRoot, modelRoot)],
    server: {
      host: options.host,
      port: options.port,
      strictPort: false,
      open: false,
      fs: {
        strict: true,
        allow: [viewerRoot,lodestoneRoot,modelRoot,skillRoot],
      },
    },
  })

  await server.listen()
  try{
    await server.environments.client.warmupRequest('/src/main.js')
    await server.environments.client.waitForRequestsIdle()
  }catch(error){await server.close();await fs.rm(cacheDir,{recursive:true,force:true});throw error}
  const local = server.resolvedUrls?.local?.[0] ?? `http://${options.host}:${options.port}/`
  const url = new URL(local)
  url.searchParams.set('nbt', '/__minecraft_builder__/build.nbt')
  url.searchParams.set('name', path.basename(nbtPath))
  if (options.lighting !== 'day') {
    url.searchParams.set('lighting', options.lighting)
  }

  return {url:url.toString(),origin:new URL(local).origin,close:async()=>{await server.close();await fs.rm(cacheDir,{recursive:true,force:true})}}
}
async function main(){const options=parseArgs(process.argv.slice(2));if(options.help){console.log(usage());return}const preview=await startPreview(options);console.log(`Minecraft build preview: ${preview.url}`);if(options.open)await openUrl(preview.url);let closing=false;const close=async()=>{if(closing)return;closing=true;await preview.close()};process.once('SIGINT',close);process.once('SIGTERM',close)}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(err => {
  console.error(`preview: ${err.message}`)
  process.exitCode = 1
})
