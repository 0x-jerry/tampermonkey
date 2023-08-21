import { readFile, readdir, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const jsDir = fileURLToPath(path.join(import.meta.url, '../..'))

const jsFiles = (await readdir(jsDir)).filter((n) => n.endsWith('.js'))

const matches = {
  name: /@name (.+)$/m,
  description: /@description (.+)$/m,
  url: /@updateURL (.+)$/m,
}

const p = jsFiles.map(async (file) => {
  const filePath = path.join(jsDir, file)

  const content = await readFile(filePath, { encoding: 'utf-8' })

  const name = matches.name.exec(content).at(1).trim()
  const description = matches.description.exec(content).at(1).trim()
  const url = matches.url.exec(content).at(1).trim()

  return `- ${name}: ${description} [install](${url})`
})

const descriptions = await Promise.all(p)

const headers = [
  //
  `# 一些 TamperMonkey 脚本`,
  '',
  `**Scripts:**`,
  '',
]

await writeFile(
  path.join(jsDir, 'README.md'),
  [...headers, ...descriptions.filter(Boolean)].join('\n'),
)
