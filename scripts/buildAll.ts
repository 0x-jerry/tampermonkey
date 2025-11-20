import { glob } from 'node:fs/promises'
import { buildSingleFile } from './build'
import { generateReadme } from './updateReadme'

main()

async function main() {
  await generateReadme()
  await buildAll()
}

async function buildAll() {
  const entryFiles = glob('src/*.ts', {})

  for await (const file of entryFiles) {
    await buildSingleFile(file)
  }
}
