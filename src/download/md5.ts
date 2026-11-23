const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9,
  14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32))

function add32(a: number, b: number) {
  return (a + b) & 0xffffffff
}

function rotl(value: number, shift: number) {
  return (value << shift) | (value >>> (32 - shift))
}

function toBytes(input: string) {
  const utf8 = unescape(encodeURIComponent(input))
  const bytes: number[] = []
  for (let i = 0; i < utf8.length; i++) bytes.push(utf8.charCodeAt(i))
  return bytes
}

export function md5(input: string) {
  const bytes = toBytes(input)
  const bitLength = bytes.length * 8

  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)

  const low = bitLength >>> 0
  const high = Math.floor(bitLength / 2 ** 32)
  for (let i = 0; i < 4; i++) bytes.push((low >>> (i * 8)) & 0xff)
  for (let i = 0; i < 4; i++) bytes.push((high >>> (i * 8)) & 0xff)

  let a = 0x67452301
  let b = 0xefcdab89
  let c = 0x98badcfe
  let d = 0x10325476

  for (let offset = 0; offset < bytes.length; offset += 64) {
    const x: number[] = []
    for (let i = 0; i < 16; i++) {
      const j = offset + i * 4
      x[i] = bytes[j] | (bytes[j + 1] << 8) | (bytes[j + 2] << 16) | (bytes[j + 3] << 24)
    }

    let aa = a
    let bb = b
    let cc = c
    let dd = d

    for (let i = 0; i < 64; i++) {
      let f: number
      let g: number

      if (i < 16) {
        f = (bb & cc) | (~bb & dd)
        g = i
      } else if (i < 32) {
        f = (dd & bb) | (~dd & cc)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        f = bb ^ cc ^ dd
        g = (3 * i + 5) % 16
      } else {
        f = cc ^ (bb | ~dd)
        g = (7 * i) % 16
      }

      const oldD = dd
      dd = cc
      cc = bb
      bb = add32(bb, rotl(add32(add32(add32(aa, f), K[i]), x[g]), S[i]))
      aa = oldD
    }

    a = add32(a, aa)
    b = add32(b, bb)
    c = add32(c, cc)
    d = add32(d, dd)
  }

  return [a, b, c, d]
    .map((n) => {
      let out = ''
      for (let i = 0; i < 4; i++) {
        out += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, '0')
      }
      return out
    })
    .join('')
}
