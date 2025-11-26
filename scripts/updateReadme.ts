import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getScriptHeaderConfig } from './utils'

export async function generateReadme() {
  const sourceDir = path.join(fileURLToPath(import.meta.url), '../../src')

  const files = (await readdir(sourceDir)).filter((n) => n.endsWith('.user.ts'))

  const p = files.map(async (file) => {
    const filepath = path.join(sourceDir, file)
    const filename = path.basename(file, '.ts')

    const config = await getScriptHeaderConfig(filepath)

    const name = config.name
    const description = config.description || 'Try to save the world!'

    const url = `https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/${filename}.js`

    return `- ${name}: ${description} [install](${url})`
  })

  const descriptions = await Promise.all(p)

  const generatedContent = descriptions.filter(Boolean).join('\n')

  const content = await renderWithData({
    GENERATED_CONTENT: generatedContent,
  })

  await writeFile(path.join(sourceDir, '../README.md'), content)
}

async function renderWithData(data: Record<string, string>) {
  let outputContent = await readFile('readme.tpl.md', 'utf8')

  Object.entries(data).forEach(([key, value]) => {
    outputContent = outputContent.replaceAll(`<!--${key}-->`, value)
  })

  return outputContent
}
