import { glob, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { exec } from '@0x-jerry/utils/node'
import { type ExpressionStatement, type Program, parse } from 'oxc-parser'
import prompts from 'prompts'
import type { ReleaseType } from 'semver'
import semver from 'semver'
import yc from 'yoctocolors'
import { generateReadme } from './updateReadme'
import { DEFINE_HEADER_FN_NAME } from './utils'

const prompt = prompts

const releaseTypes: ReleaseType[] = ['patch', 'minor', 'major']

const releaseType = await prompt({
  type: 'select',
  name: 'versionType',
  message: 'Select bump version type',
  choices: releaseTypes.map((n) => ({ title: n, value: n })),
})

const allFiles = await Array.fromAsync(glob('src/*.ts'))

const files = await prompt({
  type: 'multiselect',
  name: 'files',
  message: 'Pick release files',
  instructions: false,
  choices: allFiles.map((file) => ({
    title: path.basename(file, '.user.ts'),
    value: file,
  })),
})

const data = Object.assign(releaseType, files)

const successFiles: string[] = []

for (const file of data.files) {
  const filepath = path.resolve(file)
  const filename = path.basename(file, '.user.ts')

  const code = await readFile(filepath, 'utf8')
  const result = await parse(filepath, code)

  const bumpResult = bumpVersion(result.program, code, data.versionType)

  if (!bumpResult) {
    console.log(yc.bgRed(' Error '), yc.cyan(filename), 'Bump version faield!')
    continue
  }

  await writeFile(filepath, bumpResult.code)

  console.log(
    yc.bgGreen(' Done '),
    yc.green(filename),
    bumpResult.oldVersion,
    '->',
    bumpResult.newVersion,
  )
  successFiles.push(filename)
}

if (successFiles.length) {
  await generateReadme()
  await exec(`git add .`)

  const msg = `chore: release with ${successFiles.join(', ')}`
  await exec(`git commit -m ${JSON.stringify(msg)}`)
}

function bumpVersion(ast: Program, code: string, releaseType: ReleaseType) {
  for (const node of ast.body) {
    if (node.type !== 'ExpressionStatement') {
      continue
    }

    const versionToken = extractVersionToken(node)
    const oldVersion = versionToken?.value?.toString()

    if (!versionToken || !oldVersion) {
      continue
    }

    const newVersion = semver.inc(oldVersion, releaseType)

    code = `${code.slice(0, versionToken.start)}'${newVersion}'${code.slice(versionToken.end)}`

    return {
      code,
      oldVersion,
      newVersion,
    }
  }

  return
}

function extractVersionToken(node: ExpressionStatement) {
  if (node.expression.type !== 'CallExpression') {
    return
  }

  const callDecl = node.expression

  if (callDecl.callee.type !== 'Identifier') {
    return
  }

  if (callDecl.callee.name !== DEFINE_HEADER_FN_NAME) {
    return
  }

  const param = callDecl.arguments.at(0)
  if (param?.type !== 'ObjectExpression') {
    return
  }

  const versionProp = param.properties.find((prop) => {
    if (prop.type !== 'Property') {
      return false
    }

    if (prop.key.type !== 'Identifier') {
      return false
    }

    if (prop.key.name !== 'version') {
      return false
    }

    return true
  })

  if (versionProp?.type !== 'Property') {
    return
  }

  if (versionProp.value.type !== 'Literal') {
    return
  }

  return versionProp.value
}
