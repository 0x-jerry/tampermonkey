import { sleep } from '../../utils'
import { md5 } from '../md5'
import { post } from '../request'
import { encodeBase } from '../serialize'
import type { DownloadResult, PageKind, Provider } from '../types'
import { mountProviderButton } from '../ui/button'
import { loading } from '../ui/modal'

const mount = {
  home: '.top_button',
}

const api = {
  getLink: 'https://personal-kd-njs.yun.139.com/hcy/file/getDownloadUrl',
}

function randomString(length = 16) {
  const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
  let result = ''
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length))
  return result
}

function utf8ToBinary(str: string) {
  const fromCharCode = String.fromCharCode
  return str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g, (char) => {
    if (char.length < 2) {
      const code = char.charCodeAt(0)
      return code < 128
        ? char
        : code < 2048
          ? fromCharCode(192 | (code >>> 6)) + fromCharCode(128 | (63 & code))
          : fromCharCode(224 | ((code >>> 12) & 15)) +
            fromCharCode(128 | ((code >>> 6) & 63)) +
            fromCharCode(128 | (63 & code))
    }

    const code =
      65536 + 1024 * (char.charCodeAt(0) - 55296) + (char.charCodeAt(1) - 56320)
    return (
      fromCharCode(240 | ((code >>> 18) & 7)) +
      fromCharCode(128 | ((code >>> 12) & 63)) +
      fromCharCode(128 | ((code >>> 6) & 63)) +
      fromCharCode(128 | (63 & code))
    )
  })
}

function sign(body: any, time: string, key: string) {
  let text = ''
  if (body) {
    text = JSON.stringify(body).replace(/\s*/g, '')
    text = encodeURIComponent(text)
    text = text.split('').sort().join('')
  }

  const a = md5(encodeBase(utf8ToBinary(text)))
  const b = md5(`${time}:${key}`)
  return md5(a + b).toUpperCase()
}

function getCookie(name: string) {
  const cname = `${name}=`
  for (const part of document.cookie.split(';')) {
    const cookie = part.trim()
    if (cookie.indexOf(cname) === 0) return cookie.substring(cname.length)
  }
  return ''
}

async function getFileUrl(item: any, index: number) {
  if (item.downloadUrl) return { index, downloadUrl: item.downloadUrl }

  if (contextPage() === 'home') {
    const body = { fileId: item.contentID }
    const time = new Date(Date.now() + 8 * 3600 * 1000)
      .toJSON()
      .substr(0, 19)
      .replace('T', ' ')
    const key = randomString(16)
    const signature = sign(body, time, key)

    const response: any = await post(api.getLink, body, {
      Authorization: getCookie('authorization'),
      Caller: 'web',
      'Content-Type': 'application/json;charset=UTF-8',
      'CMS-DEVICE': 'default',
      'Mcloud-Channel': '1000101',
      'Mcloud-Client': '10701',
      'Mcloud-Sign': `${time},${key},${signature}`,
      'Mcloud-Version': '7.14.2',
      'X-DeviceInfo': '||9|7.17.0|edge||||windows 10||zh-CN|||',
      'X-Huawei-ChannelSrc': '10000034',
      'X-Inner-Ntwk': '2',
      'X-M4C-Caller': 'PC',
      'X-M4C-Src': '10002',
      'X-SvcType': '1',
      'X-Yun-Api-Version': 'v1',
      'X-Yun-App-Channel': '10000034',
      'X-Yun-Channel-Source': '10000034',
      'X-Yun-Client-Info': '||9|7.17.0|edge||||windows 10||zh-CN|||||',
      'X-Yun-Module-Type': '100',
      'X-Yun-Svc-Type': '1',
      'X-Yun-Url-Type': '3',
    })

    if (response?.success) return { index, downloadUrl: response.data.url }
    return { index, downloadUrl: '获取下载地址失败，服务器未返回有效数据，刷新后再试试吧~' }
  }

  throw new Error('提示：<br/>请在我的云盘页面使用下载助手~')
}

function contextPage(): PageKind {
  const path = location.pathname
  if (/^\/w/.test(path)) return 'home'
  if (/^\/link|shareweb/.test(path)) return 'share'
  return ''
}

function getSelectedList(): any[] {
  try {
    const selects = (document.querySelector('.main_file_list') as any)?.__vue__?.selectList?.map?.(
      (value: any) => value.item,
    )
    if (selects?.length) return selects

    const vueDom = (document.querySelector('.home-page') as any)?.__vue__
    const fileList = vueDom._computedWatchers.fileList.value
    const dirList = vueDom._computedWatchers.dirList.value
    const selectedFile = vueDom.selectedFile as number[]
    const selectedDir = vueDom.selectedDir as number[]

    return [
      ...fileList.filter((_: any, index: number) => selectedFile.includes(index)),
      ...dirList.filter((_: any, index: number) => selectedDir.includes(index)),
    ]
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : '[中国移动云盘] 获取已勾选文件列表失败',
    )
  }
}

async function getLink(): Promise<DownloadResult> {
  let selects = getSelectedList()
  if (selects.length === 0) throw new Error('提示：<br/>请先勾选要下载的文件哦~')
  if (selects.every((item) => !item.contentID && !item.contentName)) {
    throw new Error('提示：<br/>请打开文件夹后再勾选文件~')
  }
  if (contextPage() !== 'home') throw new Error('提示：<br/>请在我的云盘页面使用下载助手~')

  selects = selects.filter((item) => item.contentID && item.contentName && item.contentSuffix)

  const batchSize = 15
  let processed = 0
  loading.title('地址获取中')
  loading.update('正在获取文件对应的下载地址~')

  for (let i = 0; i < selects.length; i += batchSize) {
    const batch = selects.slice(i, i + batchSize)
    const queue = batch.map((item, localIndex) => {
      const globalIndex = i + localIndex
      return getFileUrl(item, globalIndex).then((value) => {
        processed++
        loading.update(`已获取 ${processed} / ${selects.length} 个地址~`)
        return value
      })
    })

    const results = await Promise.all(queue)
    results.forEach((value) => {
      selects[value.index].downloadUrl = value.downloadUrl
    })

    await sleep(1000)
  }

  return {
    files: selects,
    get: {
      dir: (file) => file.dirEtag || file.caName,
      name: (file) => file.contentName || file.coName,
      size: (file) => file.contentSize || file.coSize,
      link: (file) => file.downloadUrl,
    },
    headers: {},
  }
}

export const mcloud: Provider = {
  detectPage: contextPage,
  addButton() {
    mountProviderButton(this, [mount.home])
  },
  getLink,
}
