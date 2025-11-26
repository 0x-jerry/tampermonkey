export * from './utils'

export function css(
  template: { raw: readonly string[] | ArrayLike<string> },
  ...substitutions: any[]
) {
  return String.raw(template, ...substitutions)
}
