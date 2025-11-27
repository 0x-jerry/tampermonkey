let count = 0

export async function getScriptHeaderConfig(filepath: string) {
  globalThis.__ENV_DISABLE_RUN__ = true

  // @ts-expect-error
  globalThis.__TAMPER_HEADER_CONFIG__ = undefined

  await import(`${filepath}?key=${count++}`)

  const config = globalThis.__TAMPER_HEADER_CONFIG__

  return config
}

export function getUpdateUrl(filename: string) {
  return `https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/gh-pages/${filename}.js`
}

export function getSourceUrl(filename: string) {
  return `https://github.com/0x-jerry/tampermonkey/blob/main/src/${filename}.ts`
}