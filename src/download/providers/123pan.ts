import { sleep } from '../../utils'
import { siteConfig } from '../config'
import { findReact } from '../framework'
import { post } from '../request'
import { decodeBase } from '../serialize'
import { localStore } from '../store'
import type { DownloadResult, PageKind, Provider } from '../types'
import { mountProviderButton } from '../ui/button'
import { loading } from '../ui/modal'

const mount = siteConfig.pan123.mount
const api = siteConfig.pan123.api

function getToken() {
  loading.title('令牌获取中')
  loading.update('正在获取令牌~')
  return localStore.get<string>('authorToken', '')
}

function getUUID() {
  loading.title('用户标识获取中')
  loading.update('正在获取用户标识~')
  return localStore.get<string>('LoginUuid', '')
}

async function getFileUrl(
  item: any,
  index: number,
  token: string,
  uuid: string,
  shareKey?: string,
) {
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json; charset=UTF-8',
    Authorization: `Bearer ${token}`,
    'User-Agent': api.ua,
    'Sec-Ch-Ua': api.secCh,
    Platform: 'web',
    Platform_os: api.os,
    'App-Version': api.version,
    LoginUuid: uuid || '',
    Devicename: '',
    'Mac-Addr': '',
  }

  const response: any = shareKey
    ? await post(
        api.getShareLink,
        {
          ShareKey: shareKey,
          FileID: item.FileId,
          S3keyFlag: item.S3KeyFlag,
          Size: item.Size,
          Etag: item.Etag,
        },
        headers,
      )
    : await post(
        api.getLink,
        {
          driveId: 0,
          etag: item.Etag,
          fileId: item.FileId,
          s3keyFlag: item.S3KeyFlag,
          type: item.Type,
          fileName: item.FileName,
          size: item.Size,
        },
        headers,
      )

  if (response?.data?.dispatchList?.length > 0 && response?.data?.downloadPath) {
    const prefix = response.data.dispatchList[0].prefix || ''
    let url = `${prefix}${response.data.downloadPath}`

    try {
      const params = new URL(url).searchParams.get('params')
      if (params) url = decodeBase(params)
    } catch {}

    return { index, downloadUrl: url }
  }

  if (response?.code) {
    if (response.code == 5112) throw new Error('提示：<br/>请先登录网盘后再获取地址~')
    if (response.code == 5113) {
      return { index, downloadUrl: '获取下载地址失败，本月免费流量不足，请开通网盘会员~' }
    }
  }

  return {
    index,
    downloadUrl: `获取下载地址失败，${response?.message ? `服务器说：${response.message}。` : '刷新后再试试吧~'}`,
  }
}

function getSelectedList(): any[] {
  try {
    const selected: any[] = []
    const reactDom = document.querySelector(
      '.ant-table-wrapper, .tiled-list, .file-list, .single-file-sharing-container-content, .custom-table-wrapper, [class^="mfy_h-table-module__shell__"]',
    )
    const reactObj = findReact(reactDom)
    const props = reactObj?.pendingProps
    if (!props) return selected

    const fileList = props.dataSource || props.loadedFileList || props.files || []
    const selectedKeys = props.rowSelection?.selectedRowKeys || []

    for (const file of fileList) {
      if (file?.checked === true || selectedKeys.includes(file.FileId)) selected.push(file)
    }

    if (props.file?.S3KeyFlag) selected.push(props.file)

    return selected
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '[123 云盘] 获取已勾选文件列表失败')
  }
}

function detectPage(): PageKind {
  const path = location.pathname
  if (/^\/$/.test(path)) return 'home'
  if (/^\/(s|123pan)\//.test(path)) return 'share'
  return ''
}

async function getLink(): Promise<DownloadResult> {
  let selects = getSelectedList()
  if (selects.length === 0) throw new Error('提示：<br/>请先勾选要下载的文件哦~')
  if (selects.every((item) => item.Type !== 0)) {
    throw new Error('提示：<br/>请打开文件夹后再勾选文件~')
  }

  const page = contextPage()
  const token = getToken()
  const uuid = getUUID()
  const shareKey =
    page === 'share' ? location.pathname.split('/').filter(Boolean)[1] : undefined

  const batchSize = 15
  let processed = 0
  selects = selects.filter((item) => item.Type === 0)

  loading.title('地址获取中')
  loading.update('正在获取文件对应的下载地址~')

  for (let i = 0; i < selects.length; i += batchSize) {
    const batch = selects.slice(i, i + batchSize)
    const queue = batch.map((item, localIndex) => {
      const globalIndex = i + localIndex
      return getFileUrl(item, globalIndex, token, uuid, shareKey).then((value) => {
        processed++
        loading.update(`已获取 ${processed} / ${selects.length} 个地址~`)
        return value
      })
    })

    const results = await Promise.all(queue)
    results.forEach((value) => {
      selects[value.index].DownloadUrl = value.downloadUrl
    })

    await sleep(1000)
  }

  return {
    files: selects,
    get: {
      dir: (file) => file.Type !== 0,
      name: (file) => file.FileName,
      size: (file) => file.Size,
      link: (file) => file.DownloadUrl || file.DownloadURL,
    },
    headers: {},
  }
}

function contextPage(): PageKind {
  return detectPage()
}

export const pan123: Provider = {
  detectPage,
  addButton() {
    mountProviderButton(this, [mount.home, mount.share])
  },
  getLink,
}
