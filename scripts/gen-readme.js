import { readFile, readdir, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const sourceDir = fileURLToPath(path.join(import.meta.url, '../../src'))

const files = (await readdir(sourceDir)).filter((n) => n.endsWith('.user.ts'))

const matches = {
  name: /@name (.+)$/m,
  description: /@description (.+)$/m,
  url: /@updateURL (.+)$/m,
}

const p = files.map(async (file) => {
  const filePath = path.join(sourceDir, file)

  const content = await readFile(filePath, { encoding: 'utf-8' })

  const name = matches.name.exec(content).at(1).trim()
  const description = matches.description.exec(content).at(1).trim()
  const url = matches.url.exec(content).at(1).trim()

  return `- ${name}: ${description} [install](${url})`
})

const descriptions = await Promise.all(p)

const headers = [
  //
  `# Some Useful TamperMonkey Scripts`,
  '',
  `**Scripts:**`,
  '',
]

await writeFile(
  path.join(sourceDir, '../README.md'),
  [...headers, ...descriptions.filter(Boolean), ''].join('\n'),
)
