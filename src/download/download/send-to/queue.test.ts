import assert from 'node:assert'
import { createQueue } from './queue'

const run = createQueue()
const order: string[] = []
let active = 0
let maxActive = 0

const task = (name: string, delay: number, fail = false) => () =>
  new Promise<void>((resolve, reject) => {
    active++
    maxActive = Math.max(maxActive, active)
    setTimeout(() => {
      active--
      order.push(name)
      fail ? reject(new Error(name)) : resolve()
    }, delay)
  })

await Promise.allSettled([run(task('a', 20)), run(task('b', 1, true)), run(task('c', 5))])

assert.deepEqual(order, ['a', 'b', 'c'])
assert.equal(maxActive, 1)
