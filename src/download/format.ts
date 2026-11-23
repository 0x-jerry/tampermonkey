export function isType(value: unknown) {
  return Object.prototype.toString
    .call(value)
    .replace(/^\[object (.+)\]$/, '$1')
    .toLowerCase()
}

export function getExtension(name: string) {
  if (typeof name !== 'string' || name === '' || name.startsWith('.')) return ''
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return ''
  const ext = name.slice(dot + 1)
  return ext !== '' && !/[^\w]/.test(ext) ? ext.toUpperCase() : ''
}

export function sizeFormat(value = 0) {
  const base = 1024
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  const names = ['字节', '千字节', '兆字节', '吉字节', '太字节', '拍字节', '艾字节', '泽字节', '尧字节']
  const size = Number(value)

  if (!Number.isFinite(size) || size < 0) return ''
  if (size === 0) return '0B(字节)'

  const index = Math.min(Math.floor(Math.log(size) / Math.log(base)), units.length - 1)
  const n = size / base ** index
  const formatted = n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)

  return `${formatted}${names[index]}(${units[index]})`
}

export function fixFilename(name: string) {
  return String(name).replace(/[!?&|`"'*\/:<>\\]/g, '_')
}
