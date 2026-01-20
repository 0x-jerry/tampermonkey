import { readFile } from 'node:fs/promises'
import type { ITamperMonkeyHeader } from '../types'

const JS_LINE_COMMENT_RE = /\/\/[^\n]*/g
const JS_MULTI_LINE_COMMENT_RE = /\/\*[\s\S]*?\*\//g
const GM_PERMISSION_RE = /\bGM_[a-zA-Z0-9_]+\b/g

export async function scanPermissions(file: string) {
  const code = await readFile(file, 'utf-8')

  const permissions = code
    .replace(JS_LINE_COMMENT_RE, '')
    .replace(JS_MULTI_LINE_COMMENT_RE, '')
    .match(GM_PERMISSION_RE)

  return [...new Set(permissions)]
}

export async function checkPermission(
  config: ITamperMonkeyHeader,
  outputFile: string,
): Promise<string[]> {
  const required = await scanPermissions(outputFile)
  const granted = [...new Set(config.grants)] as string[]

  return required.filter((perm) => !granted.includes(perm))
}
