import { readFileSync } from 'node:fs'
import path from 'node:path'
import { build, type InlineConfig } from 'tsdown'

export async function buildSingleFile(file: string, opt?: { watch?: boolean }) {
  const outputFile = path.join('out', `${path.basename(file, '.ts')}.js`)

  const conf: InlineConfig = {
    entry: file,
    outputOptions: {
      file: outputFile,
    },
    clean: false,
    format: 'iife',
    watch: opt?.watch ? [file] : false,
    banner: () => extractBannerConfig(file),
  }

  await build(conf)
}

function extractBannerConfig(file: string) {
  const content = readFileSync(file, { encoding: 'utf8' })

  const BANNER_RE = /\/\/ ==UserScript==(.|\n)+\/\/ ==\/UserScript==/

  const banner = content.match(BANNER_RE)?.at(0)

  if (!banner) {
    throw new Error(`Extract banner content failed! Path: ${file}`)
  }

  return banner
}
