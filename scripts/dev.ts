import { glob } from 'node:fs/promises'
import path from 'node:path'
import prompts from 'prompts'
import { buildSingleFile } from './build'

let [file] = process.argv.slice(2)

if (!file) {
  const allFiles = await Array.fromAsync(glob('src/*.user.ts'))

  const result = await prompts({
    type: 'select',
    name: 'file',
    message: 'Select a script to dev',
    choices: allFiles.map((f) => ({
      title: path.basename(f, '.user.ts'),
      value: f,
    })),
  })

  file = result.file

  if (!file) {
    process.exit(0)
  }
}

buildSingleFile(file, { dev: true })
