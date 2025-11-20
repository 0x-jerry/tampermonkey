import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export async function generateReadme() {
  const sourceDir = path.join(fileURLToPath(import.meta.url), '../../src')

  const files = (await readdir(sourceDir)).filter((n) => n.endsWith('.user.ts'))

  const matches = {
    name: /@name (.+)$/m,
    description: /@description (.+)$/m,
    url: /@updateURL (.+)$/m,
  }

  const p = files.map(async (file) => {
    const filePath = path.join(sourceDir, file)

    const content = await readFile(filePath, { encoding: 'utf-8' })

    const name = matches.name.exec(content)?.at(1)?.trim()
    const description = matches.description.exec(content)?.at(1)?.trim()
    const url = matches.url.exec(content)?.at(1)?.trim()

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
}
