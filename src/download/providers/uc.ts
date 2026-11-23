import { sleep } from '../../utils'
import { siteConfig } from '../config'
import { findReact } from '../framework'
import { post } from '../request'
import type { DownloadResult, PageKind, Provider } from '../types'
import { mountProviderButton } from '../ui/button'
import { loading } from '../ui/modal'

const mount = siteConfig.uc.mount
const api = siteConfig.uc.api

function getSelectedList(): any[] {
  try {
    const list: any[] = []
    const reactDom = document.getElementsByClassName('file-list')[0]
    const reactObj = findReact(reactDom)
    const props = reactObj?.props
    if (!props) return list

    const stoken = props.stoken || ''
    const fileList = props.list || []
    const selectedKeys = props.selectedRowKeys || []

    for (const file of fileList) {
      if (selectedKeys.includes(file.fid)) list.push({ ...file, stoken })
    }

    return list
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '[UC 网盘] 获取已勾选文件列表失败')
  }
}

function detectPage(): PageKind {
  const path = location.pathname
  if (/^\/list/.test(path)) return 'home'
  if (/^\/(s|share)\//.test(path)) return 'share'
  return ''
}

async function fetchFiles(selects: any[]) {
  const data: any[] = []
  const batchSize = 15
  let processed = 0

  selects = selects.filter((item) => item.file === true)
  const page = contextPage()

  let pwdId = ''
  if (page === 'share') {
    const win = unsafeWindow as any
    pwdId =
      win.factStat?.ut?.baseParams?.pwd_id ||
      win.factStat?.wa?.customStatParams?.pwd_id ||
      location.pathname.match(/^\/(?:s|share)\/([a-zA-Z0-9]+)/)?.[1] ||
      ''
    if (!pwdId) throw new Error('错误：<br/>无法提取分享 ID~')
  }

  for (let i = 0; i < selects.length; i += batchSize) {
    const batch = selects.slice(i, i + batchSize)
    const fids = batch.map((item) => item.fid)
    const body: any = { fids }

    if (page === 'share') {
      body.fids_token = batch.map((item) => item.share_fid_token)
      body.pwd_id = pwdId
      body.stoken = batch[0].stoken
    }

    const response: any = await post(api.getLink, body, {
      'Content-Type': 'application/json',
      Cookie: String(document.cookie),
      'User-Agent': api.ua,
      'Sec-Ch-Ua': api.secCh,
    })

    if (!response || response.code !== 0 || !response.data) {
      if (response?.code == 31001) throw new Error('提示：<br/>请先登录网盘~')
      if (response?.code == 23018) {
        const fid = response.message?.match(/\[([a-f0-9]{32})\]/)?.[1]
        const item = batch.find((entry) => entry.fid === fid)
        throw new Error(
          `提示：<br/>超出游客可获取大小限制，请登录后获取~${item?.file_name ? `<br/>文件：${item.file_name}` : ''}`,
        )
      }
      throw new Error(
        `提示：<br/>获取地址失败~ ${response?.code || ''} ${response?.message || ''}`.trim(),
      )
    }

    data.push(...response.data)
    processed += batch.length
    loading.update(`已获取 ${processed} / ${selects.length} 个地址~`)
    await sleep(1000)
  }

  return data
}

async function getLink(): Promise<DownloadResult> {
  const selects = getSelectedList()
  if (selects.length === 0) throw new Error('提示：<br/>请先勾选要下载的文件哦~')
  if (selects.every((item) => !item.file)) {
    throw new Error('提示：<br/>请打开文件夹后再勾选文件~')
  }

  loading.title('地址获取中')
  loading.update('正在获取文件对应的下载地址~')

  const data = await fetchFiles(selects)

  return {
    files: data,
    get: {
      dir: (file) => file.file === false,
      name: (file) => file.file_name,
      size: (file) => file.size,
      link: (file) => file.download_url,
    },
    headers: { 'User-Agent': api.ua, 'Sec-Ch-Ua': api.secCh },
  }
}

function contextPage(): PageKind {
  return detectPage()
}

export const uc: Provider = {
  detectPage,
  addButton() {
    mountProviderButton(this, [mount.home, mount.share])
  },
  getLink,
}
