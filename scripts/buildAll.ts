import { glob, readFile } from 'node:fs/promises'
import path from 'node:path'
import { build, type InlineConfig } from 'tsdown'

buildAll()

async function buildAll() {
  const entryFiles = glob('src/*.ts', {})

  for await (const file of entryFiles) {
    const banner = await extractBannerConfig(file)
    const outputFile = path.join('out', `${path.basename(file, '.ts')}.js`)

    const conf: InlineConfig = {
      entry: file,
      outputOptions: {
        file: outputFile,
      },
      clean: false,
      format: 'iife',
      banner: {
        js: banner,
      },
    }

    await build(conf)
  }
}

async function extractBannerConfig(file: string) {
  const content = await readFile(file, { encoding: 'utf8' })

  const BANNER_RE = /\/\/ ==UserScript==(.|\n)+\/\/ ==\/UserScript==/

  const banner = content.match(BANNER_RE)?.at(0)

  if (!banner) {
    throw new Error(`Extract banner content failed! Path: ${file}`)
  }

  return banner
}
