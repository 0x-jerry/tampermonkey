import { buildSingleFile } from './build'

const [file] = process.argv.slice(2)

if (!file) {
  throw new Error(`Please pass a file`)
}

buildSingleFile(file, { watch: true })
