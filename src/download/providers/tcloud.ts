import { sleep } from '../../utils'
import { siteConfig } from '../config'
import { md5 } from '../md5'
import { get, getFinal } from '../request'
import { localStore } from '../store'
import type { DownloadResult, PageKind, Provider } from '../types'
import { mountProviderButton } from '../ui/button'
import { loading } from '../ui/modal'

const mount = siteConfig.tcloud.mount
const api = siteConfig.tcloud.api

async function getToken() {
  loading.title('令牌获取中')
  loading.update('正在获取状态~')

  const finalUrl: string = await getFinal(api.getAccessToken, undefined, true)
  const accessToken = finalUrl.match(/accessToken=(\w+)/)?.[1]

  if (!accessToken) return undefined

  localStore.set('accessToken', accessToken)
  loading.update('获取成功，令牌已缓存~')
  return accessToken
}

async function getFileUrl(item: any, index: number, token: string) {
  if (item.downloadUrl) return { index, downloadUrl: item.downloadUrl }

  const time = Date.now()
  let url = `${api.getLink}?fileId=${item.fileId}`
  let signText = `AccessToken=${token}&Timestamp=${time}`

  if (item.shareId) {
    url += `&dt=1&shareId=${item.shareId}`
    signText += '&dt=1'
  }

  signText += `&fileId=${item.fileId}`
  if (item.shareId) signText += `&shareId=${item.shareId}`

  const response: any = await get(url, {
    Accept: 'application/json;charset=UTF-8',
    'Sign-Type': 1,
    Accesstoken: token,
    Timestamp: time,
    Signature: md5(signText),
  })

  if (response?.res_code == 0) return { index, downloadUrl: response.fileDownloadUrl }
  if (response?.errorcode === 'InvalidSessionKey') {
    return { index, downloadUrl: '提示：<br/>请先登录网盘~' }
  }
  if (response?.res_code === 'ShareNotFoundFlatDir') {
    return { index, downloadUrl: '提示：<br/>请转存文件后前往我的网盘中下载~' }
  }

  return {
    index,
    downloadUrl: `获取下载地址失败，刷新后再试试吧~${response?.res_code || ''}`,
  }
}

function getSelectedList(): any[] {
  try {
    const selected = (document.querySelector('.c-file-list') as any)?.__vue__?.selectedList
    if (selected?.length) return selected

    const detail = (document.querySelector('.info-detail') as any)?.__vue__?.fileDetail
    if (detail) return [detail]
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '[天翼云盘] 获取已勾选文件列表失败')
  }

  return []
}

function detectPage(): PageKind {
  const path = location.pathname
  if (/^\/web\/main/.test(path)) return 'home'
  if (/^\/web\/share/.test(path)) return 'share'
  return ''
}

async function getLink(): Promise<DownloadResult> {
  let selects = getSelectedList()
  if (selects.length === 0) throw new Error('提示：<br/>请先勾选要下载的文件哦~')
  if (selects.every((item) => item.isFolder)) {
    throw new Error('提示：<br/>请打开文件夹后再勾选文件~')
  }

  selects = selects.filter((item) => !item.isFolder)

  loading.title('令牌获取中')
  loading.update('正在获取状态~')

  let token = localStore.get<string>('accessToken', '')
  if (!token) token = (await getToken()) || ''
  if (!token) throw new Error('提示：<br/>请先登录网盘~')

  const batchSize = 15
  let processed = 0
  loading.title('地址获取中')
  loading.update('正在获取文件对应的下载地址~')

  for (let i = 0; i < selects.length; i += batchSize) {
    const batch = selects.slice(i, i + batchSize)
    const queue = batch.map((item, localIndex) => {
      const globalIndex = i + localIndex
      return getFileUrl(item, globalIndex, token).then((value) => {
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
      dir: (file) => file.isFolder,
      name: (file) => file.fileName,
      size: (file) => file.size,
      link: (file) => file.downloadUrl,
    },
    headers: {},
  }
}

export const tcloud: Provider = {
  detectPage,
  addButton() {
    mountProviderButton(this, [mount.home, mount.share])
  },
  getLink,
}
