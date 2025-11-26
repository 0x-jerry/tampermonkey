import { defineHeader, run } from './utils'

export const config = defineHeader({
  name: 'Eruda',
  version: '1.0.3',
  description: 'Eruda devtool for mobile browser',
  matches: ['https://*/*'],
  runAt: 'document-end',
})

run(async () => {
  const eruda = (await import('eruda')).default

  eruda.init({
    useShadowDom: true,
    tool: ['console', 'elements', 'info'],
  })
})
