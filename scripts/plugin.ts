import path from 'node:path'
import type { Program } from '@oxc-project/types'
import * as esrap from 'esrap'
import ts from 'esrap/languages/ts'
import { Visitor } from 'oxc-parser'
import type { Plugin } from 'rolldown'
import { DEFINE_HEADER_FN_NAME } from './utils'

export function tampermonkey(): Plugin<void> {
  const configFile = path.resolve('src/utils/config.ts')

  return {
    name: 'tampermonkey-plugin',
    transform(code, id, meta) {
      if (id !== configFile) {
        return
      }

      if (!meta.ast) return

      if (!clearDefineFunctionBody(meta.ast, DEFINE_HEADER_FN_NAME)) {
        return
      }

      const newCode = esrap.print(meta.ast, ts()).code

      return {
        moduleType: 'ts',
        code: newCode,
      }
    },
  }
}

function clearDefineFunctionBody(ast: Program, fnName: string): boolean {
  let removed = false

  const visitor = new Visitor({
    FunctionDeclaration(node) {
      if (node.id?.name === fnName) {
        if (node.body?.body.length) {
          node.body.body = []
          removed = true
        }
      }
    },
  })
  visitor.visit(ast)

  return removed
}
