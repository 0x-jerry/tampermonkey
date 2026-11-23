export function createQueue() {
  let tail: Promise<unknown> = Promise.resolve()

  return <T>(task: () => Promise<T>) => {
    const next = tail.catch(() => {}).then(task)
    tail = next
    return next
  }
}
