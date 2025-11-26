import path from 'node:path'
import { build, type InlineConfig } from 'tsdown'
import type { ITamperMonkeyHeader } from '../types'
import { getScriptHeaderConfig } from './utils'

export async function buildSingleFile(file: string, opt?: { dev?: boolean }) {
  const outputFile = path.join('out', `${path.basename(file, '.ts')}.js`)

  const banner = await extractBannerConfig(file)

  const conf: InlineConfig = {
    entry: file,
    outputOptions: {
      file: outputFile,
    },
    clean: false,
    format: 'iife',
    watch: opt?.dev ? [file] : false,
    define: {
      _ENV_DISABLE_RUN_: JSON.stringify(false),
    },
    banner,
    logLevel: opt?.dev ? 'info' : 'error',
  }

  await build(conf)
}

async function extractBannerConfig(file: string) {
  const filepath = path.resolve(file)

  const config = await getScriptHeaderConfig(filepath)

  if (!config) {
    throw new Error(`No config found in ${file}`)
  }

  return generateBanner(config, file)
}

function generateBanner(config: ITamperMonkeyHeader, file: string) {
  const name = path.basename(file, '.ts')

  const url = `https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/${name}.js`
  const sourceUrl = `https://github.com/0x-jerry/tampermonkey/blob/main/${file}`

  const banner: string[] = []

  banner.push(`@name ${config.name}`)
  banner.push(`@namespace 0x-jerry`)

  config.tags?.forEach((tag) => {
    banner.push(`@tag ${tag}`)
  })

  if (config.description) {
    banner.push(`@description ${config.description}`)
  }

  banner.push(`@version ${config.version}`)
  banner.push(`@updateURL ${url}`)
  banner.push(`@downloadURL ${url}`)
  banner.push(`@source ${sourceUrl}`)

  if (config.supportURL) {
    banner.push(`@supportURL ${config.supportURL}`)
  }

  if (config.icon) {
    banner.push(`@icon ${config.icon}`)
  }

  config.matches?.forEach((match) => {
    banner.push(`@match ${match}`)
  })

  banner.push(`@run-at ${config.runAt || 'document-end'}`)

  config.grants?.forEach((grant) => {
    banner.push(`@grant ${grant}`)
  })

  if (config.noframes) {
    banner.push(`@noframes`)
  }

  const content = banner.map((n) => {
    const idx = n.indexOf(' ')

    const left = n.slice(0, idx).trim()
    const right = n.slice(idx + 1).trim()

    return `// ${left.padEnd(13, ' ')} ${right}`
  })

  const result = [
    //
    '// ==UserScript==',
    ...content,
    '// ==/UserScript==',
  ]

  return result.join('\n')
}
