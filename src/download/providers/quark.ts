import { sleep } from '../../utils'
import { context } from '../context'
import { findReact } from '../framework'
import { post, standCookies } from '../request'
import { gmStore } from '../store'
import type { DownloadResult, PageKind, Provider } from '../types'
import { mountProviderButton } from '../ui/button'
import { loading } from '../ui/modal'

const mount = {
  home: '.btn-operate .btn-main',
  share: '.share-btns',
}

const api = {
  ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 QuarkPC/6.9.7.761 QuarkCloudDrivePC/6.9.7.761 quark-cloud-drive/2.5.40',
  getLink:
    'https://drive-pc.quark.cn/1/clouddrive/file/download?pr=ucpro&fr=pc&sys=win32&ve=6.9.7.761',
  getSocialToken:
    'https://drive-social-api.quark.cn/1/clouddrive/chat/conv/file/acquire_dl_token?pr=ucpro&fr=pc&sys=win32&ve=6.9.7.761&fr=win&la=zh-CN&ch=pckk%40product_guanwan',
}

async function getSocialToken() {
  const now = Date.now()
  const cached = gmStore.get<any>('quark_social_token')
  if (cached?.token && cached?.expired_timestamp > now + 60000) return cached.token

  const time = Math.floor(now / 1000)
  const response: any = await post(
    api.getSocialToken,
    {
      conversation_id: `300000${time}`,
      conversation_type: 3,
      msg_id: `${time}000`,
    },
    { 'Content-Type': 'application/json', Cookie: String(document.cookie), 'User-Agent': api.ua },
  )

  if (!response || response.code !== 0 || !response.data?.token) {
    if (response?.code == 31001) throw new Error('提示：<br/>请先登录网盘~')
    throw new Error(
      `提示：<br/>获取令牌失败~ ${response?.code || ''} ${response?.message || ''}`.trim(),
    )
  }

  gmStore.set('quark_social_token', response.data)
  return response.data.token as string
}

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
    throw new Error(error instanceof Error ? error.message : '[夸克网盘] 获取已勾选文件列表失败')
  }
}

function detectPage(): PageKind {
  const path = location.pathname
  if (/^\/list/.test(path)) return 'home'
  if (/^\/(s|share)\//.test(path)) return 'share'
  return ''
}

async function getHomeFiles(selects: any[]) {
  const data: any[] = []
  const batchSize = 15
  let processed = 0

  selects = selects.filter((item) => item.file === true)

  for (let i = 0; i < selects.length; i += batchSize) {
    const batch = selects.slice(i, i + batchSize)
    const fids = batch.map((item) => item.fid)
    const token = await getSocialToken()

    const response: any = await post(
      api.getLink,
      { fids, speedup_session: '', token },
      { 'Content-Type': 'application/json', Cookie: String(document.cookie), 'User-Agent': api.ua },
    )

    if (!response || response.code !== 0 || !response.data) {
      if (response?.code == 31001) throw new Error('提示：<br/>请先登录网盘~')
      if (response?.code == 23018) {
        const fid = response.message?.match(/\[([a-f0-9]{32})\]/)?.[1]
        const item = batch.find((entry) => entry.fid === fid)
        throw new Error(
          `提示：<br/>超出游客可获取大小限制，请登录后获取~${item?.file_name ? `<br/>文件：${item.file_name}` : ''}`,
        )
      }

      gmStore.del('quark_social_token')
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

async function getShareFiles(selects: any[]) {
  const win = unsafeWindow as any
  const pwdId =
    win.factStat?.ut?.baseParams?.pwd_id ||
    win.factStat?.wa?.customStatParams?.pwd_id ||
    location.pathname.match(/^\/(?:s|share)\/([a-zA-Z0-9]+)/)?.[1]

  if (!pwdId) throw new Error('错误：<br/>无法提取分享 ID~')

  context.pugs = context.pugs || standCookies(document.cookie, 'cookie').__pugs || ''
  const cookie = `__pugs=${context.pugs}`

  const data: any[] = []
  const batchSize = 15
  let processed = 0

  selects = selects.filter((item) => item.file === true)

  for (let i = 0; i < selects.length; i += batchSize) {
    const batch = selects.slice(i, i + batchSize)
    const fids = batch.map((item) => item.fid)
    const fidsToken = batch.map((item) => item.share_fid_token)
    const token = await getSocialToken().catch(() => '')

    const response: any = await post(
      api.getLink,
      {
        fids,
        fids_token: fidsToken,
        pwd_id: pwdId,
        stoken: batch[0].stoken,
        speedup_session: '',
        token,
      },
      { 'Content-Type': 'application/json', Cookie: cookie, 'User-Agent': api.ua },
      'json',
      true,
      true,
    )

    if (!context.pugs && response?.responseHeaders?.['Set-Cookie']?.__pugs) {
      context.pugs = response.responseHeaders['Set-Cookie'].__pugs
    }

    const result = response?.response ?? (() => {
      try {
        return JSON.parse(response?.responseText || '{}')
      } catch {
        return {}
      }
    })()

    if (!result || result.code !== 0 || !result.data) {
      if (result?.code == 31001) throw new Error('提示：<br/>请先登录网盘~')
      if (result?.code == 23018) {
        const fid = result.message?.match(/\[([a-f0-9]{32})\]/)?.[1]
        const item = batch.find((entry) => entry.fid === fid)
        throw new Error(
          `提示：<br/>超出游客可获取大小限制，请登录后获取~${item?.file_name ? `<br/>文件：${item.file_name}` : ''}`,
        )
      }
      throw new Error(
        `提示：<br/>获取地址失败~ ${result?.code || ''} ${result?.message || ''}`.trim(),
      )
    }

    data.push(...result.data)
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

  const page = contextPage()
  const data =
    page === 'home' ? await getHomeFiles(selects) : page === 'share' ? await getShareFiles(selects) : null

  if (!data) throw new Error('提示：<br/>页面错误~')

  return {
    files: data,
    get: {
      dir: (file) => file.file === false,
      name: (file) => file.file_name,
      size: (file) => file.size,
      link: (file) => file.download_url,
    },
    headers: {
      'User-Agent': api.ua,
      ...(page === 'share' && context.pugs
        ? { Cookie: `__pugs=${context.pugs}` }
        : { Cookie: String(document.cookie) }),
    },
  }
}

function contextPage(): PageKind {
  return detectPage()
}

export const quark: Provider = {
  detectPage,
  addButton() {
    mountProviderButton(this, [mount.home, mount.share])
  },
  getLink,
}
