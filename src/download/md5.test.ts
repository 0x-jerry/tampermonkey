import assert from 'node:assert'
import { md5 } from './md5'

assert.equal(md5(''), 'd41d8cd98f00b204e9800998ecf8427e')
assert.equal(md5('abc'), '900150983cd24fb0d6963f7d28e17f72')
assert.equal(md5('The quick brown fox jumps over the lazy dog'), '9e107d9d372bb6826bd81d3542a419d6')
assert.equal(md5('中文'), 'a7bac2239fcdcb3a067903d8077c4a07')
assert.equal(md5('中文测试'), '089b4943ea034acfa445d050c7913e55')
assert.equal(md5('a'.repeat(1000)), 'cabe45dcc9ae5b66ba86600cca6b8ba8')

console.log('md5 ok')
