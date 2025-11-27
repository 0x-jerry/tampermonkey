import { glob } from 'node:fs/promises'
import yoctoSpinner from 'yocto-spinner'
import { buildSingleFile } from './build'

main()

async function main() {
  const spinner = yoctoSpinner()
  spinner.text = 'Generating readme'

  const entryFiles = glob('src/*.ts', {})

  for await (const file of entryFiles) {
    spinner.text = `Building: ${file}`

    await buildSingleFile(file)
  }

  spinner.success('Done')
}
