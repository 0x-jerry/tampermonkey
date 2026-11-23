import assert from 'node:assert'

const values = new Map<string, unknown>()

;(globalThis as any).GM_getValue = (key: string, fallback: unknown) =>
  values.has(key) ? values.get(key) : fallback
;(globalThis as any).GM_setValue = (key: string, value: unknown) => values.set(key, value)

const { getCurlTerminal, getDefaultRpc, getIdmClient, getRpcList, saveRpcList } = await import(
  './settings'
)

assert.equal(getDefaultRpc('aria2').port, '16800')
assert.equal(getDefaultRpc('abdm').port, '15151')
assert.equal(getIdmClient(), '1')
assert.equal(getCurlTerminal(), 'wc')

values.set('netdisk-download:setting_idm_rpc', '')
values.set('netdisk-download:setting_curl_terminal', 'wp')
assert.equal(getIdmClient(), '1')
assert.equal(getCurlTerminal(), 'wp')

values.set('netdisk-download:setting_curl_terminal', 'unknown')
assert.equal(getCurlTerminal(), 'wc')

saveRpcList('aria2', [
  { domain: 'http://localhost', port: '6800', path: '/jsonrpc', default: true },
])
assert.equal(getDefaultRpc('aria2').port, '6800')

values.set(
  'netdisk-download:setting_aria2_rpc',
  JSON.stringify([{ domain: 'http://localhost', port: '6801', path: '/jsonrpc' }]),
)
assert.equal(getDefaultRpc('aria2').port, '6801')

values.set('netdisk-download:setting_abdm_rpc', {
  domain: 'http://localhost',
  port: '15152',
  path: '',
})
assert.equal(getDefaultRpc('abdm').port, '15152')

values.set('netdisk-download:setting_aria2_rpc', '{')
assert.equal(getRpcList('aria2')[0].port, '16800')

console.log('settings ok')
