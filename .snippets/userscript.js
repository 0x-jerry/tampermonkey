const initScript = `import { defineHeader, run } from './utils'

defineHeader({
  name: 'Script',
  version: '1.0.0',
  description: 'Try to save the world',
  matches: ['https://*/*'],
})

run(async () => {
  // Your code here...
})
`

export default {
  Init: {
    prefix: 'GM_init',
    description: "Initialize GM script.",
    body: [initScript],
  },
}
