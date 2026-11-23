import { sleep } from '../../utils'
import { md5 } from '../md5'
import { get, post } from '../request'
import { localStore } from '../store'
import type { DownloadResult, PageKind, Provider } from '../types'
import { mountProviderButton } from '../ui/button'
import { loading } from '../ui/modal'

const mount = {
  home: '[class*="FileMenu__menus--"], [class*="FileMenu__menu--"]',
}

const api = {
  getLink: 'https://api-pan.xunlei.com/drive/v1/files/',
  getCaptchaToken: 'https://xluser-ssl.xunlei.com/v1/shield/captcha/init',
  getAccessToken: 'https://xluser-ssl.xunlei.com/v1/auth/token',
}

const salts = [
  'o6b11ImBwJA1KSNMTALjL0xMkMjTP',
  'oVHCQaox9N6+R91GY63sbxci9K9ymFl',
  'XReS2zbwYB/+vUnYDwZ',
  'O56ssQHYiK5enUTKaV',
  'sGKNxaX7aUzpjJ2n+/2f1I0',
  '1oyQWde2s4zvz',
  'ziq13Yyc6HUXr3477c20PJfwBjg7ux',
  'xKMXTJmlEqamEpkWfp6WeP1qZezdCA',
  'rUA',
  'XVIzRTbY7MGdUXn0+qLjw',
  'aGrpbD3EUDGo0wmvaKPDGxVRaNVN6',
  'ieQk/',
]

const tokenLock: { lock: Promise<any> } = { lock: Promise.resolve() }

function captchaSign(
  clientId: string,
  version: string,
  host: string,
  deviceId: string,
  timestamp: string,
) {
  let hash = `${clientId}${version}${host}${deviceId}${timestamp}`
  for (const salt of salts) hash = md5(hash + salt)
  return `1.${hash}`
}

function getToken(force = false, withLoading = true) {
  tokenLock.lock = tokenLock.lock.catch(() => {}).then(async () => {
    if (withLoading) {
      loading.title('令牌获取中')
      loading.update('获取状态中~')
    }

    let creds: any = {}
    let captcha: any = {}
    let userId = ''
    let clientId = ''
    let credsKey = ''
    let captchaKey = ''

    const clientVersion = '1.92.62'
    const timestamp = Date.now()
    const rawDeviceId = localStore.get<any>('deviceid', '')
    const deviceId = /(\w{32})/.exec(String(rawDeviceId).split(',')[0])?.[0] || ''

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue

      const value = localStore.get<any>(key)
      if (key.startsWith('credentials_')) {
        creds = value || {}
        userId = creds?.user_id || ''
        clientId = key.split('_')[1]
        credsKey = key
        captchaKey = `captcha_${clientId}`
      } else if (key.startsWith('captcha_') && !clientId) {
        captcha = value || {}
        clientId = key.split('_')[1]
        captchaKey = key
        credsKey = `credentials_${clientId}`
      }
    }

    if (!clientId || !deviceId) throw new Error('错误：<br/>请先登录网盘后再获取文件呢~')

    const credsExpiresAt = creds?.expires_at ? new Date(creds.expires_at).getTime() : 0
    const credsExpired = force || !creds?.access_token || Date.now() >= credsExpiresAt - 60000

    if (credsExpired) {
      if (!creds?.refresh_token) {
        throw new Error('错误：<br/>登录凭证已过期，请重新登录网盘~')
      }

      if (withLoading) loading.update('登录凭证过期，正在获取新凭证~')

      const response: any = await post(
        api.getAccessToken,
        {
          client_id: clientId,
          grant_type: 'refresh_token',
          refresh_token: creds.refresh_token,
        },
        {
          'Content-Type': 'application/json',
          'x-action': '401',
          'x-client-id': clientId,
          'x-device-id': rawDeviceId,
          'x-device-sign': deviceId,
          'x-protocol-version': '301',
          'x-sdk-version': '3.4.20',
        },
      )

      if (!response?.access_token) {
        throw new Error(`错误：<br/>身份凭证刷新失败：${response?.error_description || response?.error || '未知错误'}`)
      }

      creds = {
        ...creds,
        ...response,
        expires_at: new Date(timestamp + (response.expires_in || 43200) * 1000).toISOString(),
      }
      userId = creds.user_id || userId
      localStore.set(credsKey, creds)
    }

    const captchaExpiresAt = captcha?.expires_at ? new Date(captcha.expires_at).getTime() : 0
    const captchaExpired = force || !captcha?.token || Date.now() >= captchaExpiresAt - 60000

    if (captchaExpired) {
      if (withLoading) loading.update('验证令牌过期，正在获取新令牌~')

      const response: any = await post(
        api.getCaptchaToken,
        {
          client_id: clientId,
          action: 'get:/drive/v1/about',
          device_id: deviceId,
          meta: {
            username: '',
            phone_number: '',
            email: '',
            package_name: location.host,
            client_version: clientVersion,
            captcha_sign: captchaSign(
              clientId,
              clientVersion,
              location.host,
              deviceId,
              timestamp.toString(),
            ),
            timestamp: timestamp.toString(),
            user_id: userId,
          },
        },
        { 'Content-Type': 'application/json' },
      )

      if (!response?.captcha_token) {
        throw new Error(`错误：<br/>验证令牌刷新失败：${response?.error_description || response?.error || '未知错误'}`)
      }

      captcha = {
        token: response.captcha_token,
        expires_at: new Date(timestamp + response.expires_in * 1000).toString(),
      }
      localStore.set(captchaKey, captcha)
    }

    if (!creds?.access_token || !captcha?.token) {
      throw new Error('错误：<br/>获取令牌失败，请重新登录网盘~')
    }

    return { credentials: creds, captcha, device_id: deviceId }
  })

  return tokenLock.lock
}

async function getFileUrl(item: any, index: number, isRetry = false) {
  if (item.downloadUrl) return { index, downloadUrl: item.downloadUrl }

  const token = await getToken(false, false)
  const response: any = await get(`${api.getLink}${item.id}`, {
    Authorization: `${token.credentials?.token_type} ${token.credentials?.access_token}`,
    'Content-Type': 'application/json',
    'X-Captcha-Token': token.captcha.token,
    'X-Device-Id': token.device_id,
  })

  if (response?.web_content_link) return { index, downloadUrl: response.web_content_link }

  if (response?.error_code == 9) {
    if (!isRetry) {
      await getToken(true, false)
      return getFileUrl(item, index, true)
    }
    return { index, downloadUrl: '获取下载地址失败，页面验证令牌过期，请重新获取~' }
  }

  return {
    index,
    downloadUrl: `获取下载地址失败，${
      response?.error_description ? `服务器说：${response.error_description}` : '刷新后再试试吧~'
    }`,
  }
}

function getSelectedList(): any[] {
  try {
    const list: any[] = []
    for (const dom of document.querySelectorAll('[class*="SourceListItem__item--"]')) {
      const vue = (dom as any).__vue__
      if (vue?.selected?.includes?.(vue.info.id)) list.push(vue.info)
    }
    return list
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '[迅雷云盘] 获取已勾选文件列表失败')
  }
}

function detectPage(): PageKind {
  const path = location.pathname
  if (/^\/$/.test(path)) return 'home'
  if (/^\/(s|share)\//.test(path)) return 'share'
  return ''
}

async function getLink(): Promise<DownloadResult> {
  const selects = getSelectedList()
  if (selects.length === 0) throw new Error('提示：<br/>请先勾选要下载的文件哦~')
  if (selects.every((item) => item.kind !== 'drive#file')) {
    throw new Error('提示：<br/>请打开文件夹后再勾选文件~')
  }
  if (contextPage() !== 'home') throw new Error('提示：<br/>请在我的云盘页面使用下载助手~')

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
      dir: (file) => file.kind === 'drive#folder',
      name: (file) => file.name,
      size: (file) => file.size,
      link: (file) => file.downloadUrl,
    },
    headers: {},
  }
}

function contextPage(): PageKind {
  return detectPage()
}

export const xunlei: Provider = {
  detectPage,
  addButton() {
    mountProviderButton(this, [mount.home])
  },
  getLink,
}
