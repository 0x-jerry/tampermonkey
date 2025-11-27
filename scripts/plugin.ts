import type { ExpressionStatement, Program } from '@oxc-project/types'
import * as esrap from 'esrap'
import ts from 'esrap/languages/ts'
import type { Plugin } from 'rolldown'
import { DEFINE_HEADER_FN_NAME } from './utils'

export function tampermonkey(): Plugin<void> {
  return {
    name: 'test-plugin',
    async resolveId(source, importer, extraOption) {
      const id = await this.resolve(source, importer, extraOption)

      return id
    },
    transform(code, id, meta) {
      if (!meta.ast) return

      if (!removeDefineFunction(meta.ast)) {
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

function removeDefineFunction(ast: Program) {
  const idx = ast.body.findIndex((node) => {
    if (node.type === 'ExpressionStatement') {
      return isCallable(node, DEFINE_HEADER_FN_NAME)
    }

    return false
  })

  if (idx >= 0) {
    ast.body.splice(idx, 1)
    return true
  }

  return false
}

function isCallable(node: ExpressionStatement, defineName: string) {
  if (node.expression.type !== 'CallExpression') {
    return
  }

  const callDecl = node.expression

  if (callDecl.callee.type !== 'Identifier') {
    return
  }

  if (callDecl.callee.name !== defineName) {
    return
  }

  return true
}
