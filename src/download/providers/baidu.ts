import { sleep } from '../../utils'
import { siteConfig } from '../config'
import { context } from '../context'
import { findVueComponent } from '../framework'
import { get, getFinal, post } from '../request'
import { clone, encodeBase, stringify } from '../serialize'
import { gmStore } from '../store'
import type { DownloadResult, PageKind, Provider } from '../types'
import { mountProviderButton } from '../ui/button'
import { loading, toast } from '../ui/modal'

const api = siteConfig.baidu.api

async function getToken() {
  loading.title('令牌获取中')
  loading.update('正在获取授权状态~')

  const authorize: string = await getFinal(api.getAccessToken, { Origin: '', Referer: '' }, true)
  let accessToken = ''

  if (authorize.includes('authorize')) {
    loading.update('正在获取授权页面~')
    const html = await get<string>(api.getAccessToken, {}, 'text', false)
    const bdstoken = html.match(/name="bdstoken"\s+value="([^"]+)"/)?.[1]
    const clientId = html.match(/name="client_id"\s+value="([^"]+)"/)?.[1]

    loading.update('正在自动确认授权~')
    await post(
      api.getAccessToken,
      stringify({
        grant_permissions_arr: 'netdisk',
        bdstoken,
        client_id: clientId,
        response_type: 'token',
        display: 'page',
        grant_permissions: 'basic,netdisk',
      }),
      { Origin: '', Referer: '', 'Content-Type': 'application/x-www-form-urlencoded' },
    )

    const retry: string = await getFinal(api.getAccessToken, { Origin: '', Referer: '' }, true)
    accessToken = retry.match(/access_token=([^&]+)/)?.[1] || ''
  } else if (authorize.includes('access_token=')) {
    accessToken = authorize.match(/access_token=([^&]+)/)?.[1] || ''
  }

  if (!accessToken) return ''

  loading.update('授权成功，令牌已缓存~')
  gmStore.set('baidu_access_token', accessToken)
  return accessToken
}

function getShareData() {
  const url = new URL(location.href)
  const win = unsafeWindow as any
  const locals = win?.locals?.dump?.()

  const surl = (url.pathname.split('/').pop() || '').replace(/^1(.{22})$/, '$1')
  const pwd =
    localStorage.getItem(`${surl}_pwd`) ||
    localStorage.getItem(`1${surl}_pwd`) ||
    url.searchParams.get('pwd')

  return {
    share: {
      id: locals?.shareid?.value,
      url: surl,
      pwd,
      uk: locals?.share_uk?.value,
    },
    baidu: {
      id: document.cookie.split('BAIDUID=')?.[1]?.split(';')?.[0],
      token: locals?.bdstoken?.value,
    },
    jsToken: win?.jsToken,
    sekey: win?.currentSekey || win?.cache?.list?.config?.params?.sekey,
    sign: '',
    timestamp: '',
  }
}

async function getFilesUrl(items: any[], token: string) {
  items = items.filter((item) => !item.isdir)
  const batchSize = 50
  let processed = 0

  const pending = items.filter((item) => {
    const index = context.glinks.findIndex((cache) => cache.id == item.fs_id)
    if (index === -1) return true

    const cached = context.glinks[index]
    if (cached.expires > Date.now()) {
      Object.assign(item, cached.data)
      processed++
      return false
    }

    context.glinks.splice(index, 1)
    return true
  })

  for (let i = 0; i < pending.length; i += batchSize) {
    const batch = pending.slice(i, i + batchSize)
    const url = new URL(api.getLink)
    url.searchParams.set('fsids', JSON.stringify(batch.map((item) => item.fs_id)))
    url.searchParams.set('access_token', token)

    const response: any = await get(url.toString(), { 'User-Agent': api.ua })

    if (!response || response.errno !== 0 || !response.list) {
      if (response?.errno === 112) throw new Error('提示：<br/>页面已过期，请刷新后重试~')
      if (response?.errno === 9019) {
        gmStore.del('baidu_access_token')
        throw new Error('提示：<br/>访问令牌已过期，再获取一次吧~')
      }

      const message = response?.errno || response?.errmsg
      if (message) {
        batch.forEach((item) => {
          item.dlink = `获取下载地址失败，服务器说：${response.errno || ''} ${
            response.errmsg || ''
          }`.trim()
        })
      } else {
        throw new Error('提示：<br/>获取下载地址失败，刷新网页后再试试吧~')
      }
    }

    batch.forEach((item) => {
      const matched = response?.list?.find?.((entry: any) => entry.fs_id == item.fs_id)
      if (!matched) return

      Object.assign(item, matched)
      context.glinks.push({
        id: item.fs_id,
        expires: Date.now() + 4 * 60 * 60 * 1000,
        data: matched,
      })
    })

    processed += response.list?.length || 0
    loading.update(`已获取 ${processed} / ${items.length} 个地址`)

    if (i + batchSize < pending.length) await sleep(1000)
  }

  return clone(items)
}

async function getShareFilesUrl(items: any[], shareData: any) {
  items = items.filter((item) => !item.isdir)
  let processed = 0

  const pending = items.filter((item) => {
    const index = context.glinks.findIndex((cache) => cache.id == item.fs_id)
    if (index === -1) return true

    const cached = context.glinks[index]
    if (cached.expires > Date.now()) {
      Object.assign(item, cached.data)
      processed++
      return false
    }

    context.glinks.splice(index, 1)
    return true
  })

  for (const item of pending) {
    const url = new URL(api.getShareLink)
    url.searchParams.set('sign', shareData.sign)
    url.searchParams.set('timestamp', shareData.timestamp)
    url.searchParams.set('bdstoken', shareData.baidu.token)
    url.searchParams.set('logid', encodeBase(shareData.baidu.id))
    url.searchParams.set('jsToken', shareData.jsToken)

    const data = new URLSearchParams({
      encrypt: '0',
      product: 'share',
      uk: String(shareData.share.uk),
      primaryid: String(shareData.share.id),
      fid_list: JSON.stringify([item.fs_id]),
    })
    if (shareData.sekey) data.set('extra', JSON.stringify({ sekey: shareData.sekey }))

    const response: any = await post(url.toString(), data)

    if (!response || response.errno !== 0 || !response.list) {
      if (response?.errno === 112) throw new Error('提示：<br/>页面已过期，请刷新后重试~')
      if (response?.errno === 9019) {
        gmStore.del('baidu_access_token')
        throw new Error('提示：<br/>访问令牌已过期，再获取一次吧~')
      }

      const message = response?.errno || response?.errmsg
      if (message) {
        item.dlink = `获取下载地址失败，服务器说：${response.errno || ''} ${
          response.errmsg || ''
        }`.trim()
      } else {
        throw new Error('提示：<br/>获取下载地址失败，刷新网页后再试试吧~')
      }
    }

    if (Array.isArray(response.list)) Object.assign(item, response.list[0])
    if (typeof response.list === 'string') {
      item.dlink = '获取下载地址失败，服务器说：此文件大小超过可获取限制，需要保存到网盘后于网盘中下载。'
    }

    context.glinks.push({
      id: item.fs_id,
      expires: Date.now() + 4 * 60 * 60 * 1000,
      data: Array.isArray(response.list) ? response.list[0] : {},
    })

    processed++
    loading.update(`已获取 ${processed} / ${items.length} 个地址`)

    if (processed < pending.length) await sleep(1000)
  }

  return clone(items)
}

async function getFilesList(dirs: any[], accessToken: string, processed = 0) {
  let count = 0

  async function walk(targets: any[]): Promise<any[]> {
    let files: any[] = []

    for (const dir of targets) {
      loading.title('文件获取中')
      const url = `${api.getFiles}&dir=${encodeURIComponent(dir.path)}&access_token=${accessToken}`
      const response: any = await get(url.toString(), { 'User-Agent': api.ua })
      count++

      if (response.list?.length && (response.errno === 0 || response.errmsg === 'succ')) {
        const subFiles = response.list.filter((file: any) => !file.isdir)
        processed += subFiles.length
        loading.update(`已获取 ${processed} 个文件~\n${dir.path}`)
        files = files.concat(subFiles)

        const subDirs = response.list.filter((file: any) => file.isdir)
        if (subDirs.length) files = files.concat(await walk(subDirs))
      }

      if (count >= 50) {
        loading.update(`已获取 ${processed} 个文件~\n休息 3 秒...`)
        await sleep(3000)
        count = 0
      }
    }

    return files
  }

  return walk(dirs)
}

function getSelectedList(): any[] {
  try {
    let list: any[] = []

    const fileList = document.querySelector('.file-list') as any
    if (fileList?.__vue__?.allFileList?.[0]) {
      list = fileList.__vue__.allFileList.filter((item: any) => !!item.selected)
    }

    const core = document.querySelector('.wp-s-core-pan') as any
    if (core?.__vue__?.selectedList?.[0]) list = core.__vue__.selectedList

    const win = unsafeWindow as any
    const ctx = win.require?.('system-core:context/context.js')
    if (ctx?.instanceForSystem?.list?.getSelected?.()?.[0]) {
      list = ctx.instanceForSystem.list.getSelected()
    }

    const share = getShareSelectedList()
    if (share?.[0]) list = share

    return clone(list)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '[百度网盘] 获取已勾选文件列表失败')
  }
}

function getShareSelectedList(): any[] {
  try {
    const toArray = (value: any) => {
      if (value && typeof value === 'object' && 'value' in value) value = value.value
      return value ? Array.from(value) : []
    }

    const root = document.querySelector('#app')
    const listView = findVueComponent('ListView', root)

    if (listView) {
      const { files, isSelected } = listView.props
      return toArray(files).filter((file: any) => {
        try {
          return isSelected(file) || isSelected(String(file.fs_id)) || isSelected(file.fs_id)
        } catch {
          return false
        }
      })
    }

    const shareHeader = findVueComponent('ShareHeader', root)
    const ctx = shareHeader?.props?.context
    if (ctx?.pageKind === 'single') {
      const file = toArray(ctx.files)[0]
      if (file) return [file]
    }

    const preview = findVueComponent(
      ['DocViewer', 'FileInfoPreview', 'PicturePreview', 'AudioPreview', 'VideoPreview'],
      root,
    )
    if (preview?.props?.file) return [preview.props.file]

    return []
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : '[百度网盘][分享] 获取已勾选文件列表失败',
    )
  }
}

function detectPage(): PageKind {
  const path = location.pathname
  if (/^\/disk\/home/.test(path)) return 'home'
  if (/^\/disk\/main/.test(path)) return 'main'
  if (/^\/youth\/pan\/main/.test(path)) return 'youth'
  if (/^\/(s|share)\//.test(path)) return 'share'
  return ''
}

async function getLink(): Promise<DownloadResult> {
  let token = gmStore.get('baidu_access_token', '')

  if (!token) {
    token = await getToken().catch((error) => {
      console.warn('[netdisk-download] get baidu token failed', error)
      return ''
    })
  }

  if (!token) {
    gmStore.del('baidu_access_token')
    toast('请在新标签页中完成授权后，重新点击下载助手~', 'info')
    GM_openInTab(api.getAccessToken, { active: true, insert: true, setParent: true })
    throw new Error('提示：<br/>请在新标签页授权后再获取一次~')
  }

  const selects = getSelectedList()
  if (selects.length === 0) throw new Error('提示：<br/>请先勾选要下载的文件哦~')

  loading.title('地址获取中')
  loading.update('正在获取文件对应的下载地址~')

  let files = selects.filter((file) => !file.isdir)
  const dirs = selects.filter((file) => file.isdir)

  if (context.page === 'home' || context.page === 'main') {
    if (dirs.length) files = files.concat(await getFilesList(dirs, token, files.length))
    if (!files.length) throw new Error('提示：<br/>文件夹是空的哦~')

    loading.update('正在获取文件对应的下载地址~')
    files = await getFilesUrl(files, token)
  } else if (context.page === 'share') {
    if (files.every((file) => file.isdir === 1)) {
      throw new Error('提示：<br/>请打开文件夹后再勾选文件~')
    }

    const shareData = getShareData()
    const sign: any = await get(
      `${api.getShareSign}&surl=1${shareData.share.url}&bdstoken=${shareData.baidu.token}&logid=${encodeBase(
        shareData.baidu.id,
      )}`,
    )

    if (sign?.data?.sign && sign?.data?.timestamp) {
      shareData.sign = sign.data.sign
      shareData.timestamp = sign.data.timestamp
    }

    files = await getShareFilesUrl(files, shareData)
  } else {
    throw new Error('提示：<br/>页面错误~')
  }

  return {
    files,
    get: {
      dir: (file) => file.isdir === 1,
      name: (file) => file.server_filename || file.filename,
      size: (file) => file.size,
      link: (file) => {
        if (!file.dlink || !file.dlink.startsWith('http')) return file.dlink
        const url = new URL(file.dlink)
        url.searchParams.set('access_token', token)
        return url.href
      },
    },
    headers: { 'User-Agent': api.ua },
  }
}

export const baidu: Provider = {
  detectPage,
  addButton() {
    const mount = siteConfig.baidu.mount
    mountProviderButton(this, [mount.home, mount.main, mount.share, mount.share_v2])
  },
  getLink,
}
