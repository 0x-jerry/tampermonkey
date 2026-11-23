import { sleep } from '../../utils'
import { context } from '../context'
import { findReact } from '../framework'
import { post } from '../request'
import { clone } from '../serialize'
import { localStore } from '../store'
import type { DownloadResult, PageKind, Provider } from '../types'
import { mountProviderButton } from '../ui/button'
import { loading, toast } from '../ui/modal'

const mount = {
  home: '[class^="header--"]>[class^="actions--"]',
  list: '[class^="node-list-table-view--"]',
  grid: '[class^="node-list-grid-view--"]',
  switch: '[class^="switch-wrapper--"]',
}

function apiBase() {
  return location.host.replace('www', 'api')
}

function getSelectedList(): any[] {
  try {
    const list: any[] = []
    const reactDom = document.querySelector(mount.list)
    const reactObj = findReact(reactDom, 1)
    const props = reactObj?.pendingProps
    if (!props) return list

    const fileList = props.dataSource || []
    const selectedKeys = String(props.selectedKeys || '').split(',')

    for (const file of fileList) {
      if (selectedKeys.includes(file.fileId)) list.push(file)
    }

    return clone(list)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '[阿里云盘] 获取已勾选文件列表失败')
  }
}

async function getFilesUrl(items: any[], token: string) {
  items = items.filter((item) => item.type === 'file')
  const batchSize = 3
  let processed = 0

  const pending = items.filter((item) => {
    const index = context.glinks.findIndex((cache) => cache.id == item.fileId)
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

    await Promise.all(
      batch.map(async (item) => {
        const response: any = await post(
          `https://${apiBase()}/v2/file/get_download_url`,
          { drive_id: item.driveId, file_id: item.fileId },
          {
            Authorization: token,
            'X-Canary': 'client=windows,app=adrive,version=v6.0.0',
          },
        )

        if (!response || !response.url || response.code) {
          if (response?.code === 'AccessTokenInvalid') {
            throw new Error('提示：<br/>访问令牌过期了，请刷新后重试~')
          }
          if (response?.code) {
            batch.forEach((entry) => {
              entry.downloadUrl = `获取下载地址失败，服务器说：${response.code}`
            })
          } else {
            throw new Error('提示：<br/>获取下载地址失败，刷新网页后再试试吧~')
          }
        }

        Object.assign(item, response)
        context.glinks.push({
          id: item.fileId,
          expires: Date.now() + 5 * 60 * 1000,
          data: response,
        })

        processed++
        loading.update(`已获取 ${processed} / ${pending.length} 个地址`)
      }),
    )

    if (i + batchSize < pending.length) await sleep(1000)
  }

  return clone(items)
}

function detectPage(): PageKind {
  const path = location.pathname
  if (/^\/drive/.test(path)) return 'home'
  if (/^\/(s|share)\//.test(path)) return 'share'
  return ''
}

async function getLink(): Promise<DownloadResult> {
  if (document.querySelector(mount.grid)) {
    const shouldSwitch = confirm('请先切换到列表视图后再获取下载地址，是否立即切换？')
    if (shouldSwitch) {
      ;(document.querySelector(mount.switch) as HTMLElement | null)?.click()
      toast('已切换为列表视图，请再获取一次下载地址~', 'success')
    }
    throw new Error('请切换到列表视图后再试~')
  }

  let selects = getSelectedList()
  if (selects.length === 0) throw new Error('提示：<br/>请先勾选要下载的文件哦~')
  if (selects.every((item) => item.type !== 'file')) {
    throw new Error('提示：<br/>请打开文件夹后再勾选文件~')
  }

  loading.title('地址获取中')
  loading.update('正在获取文件对应的下载地址~')

  if (context.page !== 'home') throw new Error('提示：<br/>请在我的网盘页面使用下载助手~')

  selects = selects.filter((item) => item.type === 'file')
  const tokenInfo = localStore.get<any>('token')
  if (!tokenInfo?.access_token) throw new Error('提示：<br/>请先登录网盘~')

  const token = `${tokenInfo.token_type} ${tokenInfo.access_token}`
  selects = await getFilesUrl(selects, token)

  return {
    files: selects,
    get: {
      dir: (file) => file.type === 'folder',
      name: (file) => file.name,
      size: (file) => file.size,
      link: (file) => file.downloadUrl || file.url,
    },
    headers: {},
  }
}

export const aliyun: Provider = {
  detectPage,
  addButton() {
    mountProviderButton(this, [mount.home])
  },
  getLink,
}
