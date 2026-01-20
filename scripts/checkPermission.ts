import { readFile } from 'node:fs/promises'
import type { ITamperMonkeyHeader } from '../types'

const JS_LINE_COMMENT_RE = /\/\/[^\n]*/g
const GM_RE = /\bGM_[a-zA-Z0-9_]+\b/g

export async function checkPermission(
  config: ITamperMonkeyHeader,
  outputFile: string,
): Promise<string[]> {
  const code = await readFile(outputFile, 'utf-8')

  const permissions = code.replace(JS_LINE_COMMENT_RE, '').match(GM_RE)

  const required = [...new Set(permissions)]
  const granted = [...new Set(config.grants)] as string[]

  return required.filter((perm) => !granted.includes(perm))
}
