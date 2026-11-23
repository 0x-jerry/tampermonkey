import { sleep } from '../../utils'
import { waitForKeyElements } from '../dom'
import { findReact } from '../framework'
import { post } from '../request'
import { localStore } from '../store'
import type { DownloadResult, PageKind, Provider } from '../types'
import { mountProviderButton } from '../ui/button'
import { loading } from '../ui/modal'

const mount = {
  home: '#root #app div > div:has(> .ant-btn.ant-btn-primary.ant-btn-color-primary .ant-btn-icon > .swangpan-icon-upload):has(> .ant-btn.ant-btn-default.ant-btn-color-default .ant-btn-icon > .swangpan-icon-addfolder)',
  share:
    '#root #app div > div:has(> .ant-btn.ant-btn-lg .ant-btn-icon > .swangpan-icon-download)',
}

const api = {
  getLink: 'https://api.guangyapan.com/nd.bizuserres.s/v1/get_res_download_url',
  getShareLink: 'https://api.guangyapan.com/nd.bizuserres.s/v1/get_share_download_url',
  getShareToken: 'https://api.guangyapan.com/nd.bizuserres.s/v1/get_share_access_token',
}

const shareCode = { value: '' }

function getToken() {
  loading.title('令牌获取中')
  loading.update('正在获取状态~')

  let credentials: any = {}
  let captcha: any = {}

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    if (/^credentials_/.test(key)) credentials = localStore.get<any>(key) || {}
    if (/^captcha_[\w]{16}/.test(key)) captcha = localStore.get<any>(key) || {}
  }

  const rawDeviceId = String(localStore.get<any>('deviceid', ''))
  const deviceid = /(\w{32})/.exec(rawDeviceId.split(',')[0])?.[0] || ''

  return { credentials, captcha, deviceid }
}

async function getShareToken(token: any) {
  const url = new URL(location.href)
  const shareId = url.pathname.match(/\/s\/([^/?#]+)/)?.[1] || ''
  const input = document.querySelector<HTMLInputElement>('input.ant-input[type=text]')
  const code = url.searchParams.get('code') || shareCode.value || input?.value.trim() || ''

  const response: any = await post(
    api.getShareToken,
    { shareId, code },
    {
      Authorization: `${token.credentials?.token_type} ${token.credentials?.access_token}`,
      'Content-Type': 'application/json',
      'X-Captcha-Token': token.captcha.captcha_token,
      'X-Device-Id': token.deviceid,
    },
  )

  if (response?.data?.accessToken) return response.data.accessToken as string

  throw new Error(
    `提示：<br/>获取分享令牌失败，${
      response?.msg ? `服务器说：${response.msg}。` : '刷新后再试试吧~'
    }`,
  )
}

async function getFileUrl(item: any, index: number, token: any, shareToken?: string) {
  if (item.downloadUrl) return { index, downloadUrl: item.downloadUrl }

  const headers = {
    Authorization: `${token.credentials?.token_type} ${token.credentials?.access_token}`,
    'Content-Type': 'application/json',
    'X-Captcha-Token': token.captcha.captcha_token,
    'X-Device-Id': token.deviceid,
  }

  const response: any = shareToken
    ? await post(api.getShareLink, { fileId: item.fileId, accessToken: shareToken }, headers)
    : await post(api.getLink, { fileId: item.fileId }, headers)

  if (response?.data?.signedURL || response?.data?.downloadUrl) {
    return { index, downloadUrl: response.data.signedURL ?? response.data.downloadUrl }
  }

  if (response?.code != null) {
    if (response.code == 9) return { index, downloadUrl: '获取下载地址失败，页面验证过期，请刷新后重试~' }
    if (response.code == 103) return { index, downloadUrl: '获取下载地址失败，后端响应超时，请重试~' }
    if (response.code == 207) return { index, downloadUrl: '获取下载地址失败，分享者未打开免登录下载~' }
    if (response.code == 254) return { index, downloadUrl: '获取下载地址失败，非会员下载大小超限~' }
    return { index, downloadUrl: `获取下载地址失败，${response.msg || response.code}` }
  }

  return {
    index,
    downloadUrl: `获取下载地址失败，${response?.msg ? `服务器说：${response.msg}。` : '刷新后再试试吧~'}`,
  }
}

async function getSelectedList(): Promise<any[]> {
  try {
    const reactDom = document.querySelector('.swangpan-file-list__root[data-ui="file-list"]')
    const reactObj = findReact(reactDom)
    const props = reactObj?.pendingProps
    if (!props) return []

    return (props.model.items || [])
      .filter((item: any) => item.selected)
      .map((item: any) => item.record)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '[光鸭云盘] 获取已勾选文件列表失败')
  }
}

function detectPage(): PageKind {
  const path = location.pathname
  if (/^\/$/.test(path)) return 'home'
  if (/^\/(s|share)\//.test(path)) return 'share'
  return ''
}

async function getLink(): Promise<DownloadResult> {
  const selects = await getSelectedList()
  if (selects.length === 0) throw new Error('提示：<br/>请先勾选要下载的文件哦~')
  if (selects.every((item) => item.resType == 2)) {
    throw new Error('提示：<br/>请打开文件夹后再勾选文件~')
  }

  const token = getToken()
  const shareToken = contextPage() === 'share' ? await getShareToken(token) : undefined
  const batchSize = 15
  let processed = 0

  loading.title('地址获取中')
  loading.update('正在获取文件对应的下载地址~')

  for (let i = 0; i < selects.length; i += batchSize) {
    const batch = selects.slice(i, i + batchSize)
    const queue = batch.map((item, localIndex) => {
      const globalIndex = i + localIndex
      return getFileUrl(item, globalIndex, token, shareToken).then((value) => {
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
      dir: (file) => file.resType == 2,
      name: (file) => file.fileName,
      size: (file) => file.fileSize,
      link: (file) => file.downloadUrl,
    },
    headers: {},
  }
}

function contextPage(): PageKind {
  return detectPage()
}

export const guangya: Provider = {
  detectPage,
  addButton() {
    mountProviderButton(this, [mount.home, mount.share])

    if (detectPage() === 'share') {
      waitForKeyElements(
        'input.ant-input[type=text]',
        (element) => {
          if (element.dataset.codeBound) return
          element.dataset.codeBound = '1'
          element.addEventListener('input', () => {
            const value = (element as HTMLInputElement).value.trim()
            if (value) shareCode.value = value
          })
        },
        false,
      )
    }
  },
  getLink,
}
