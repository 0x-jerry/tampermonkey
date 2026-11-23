import { siteConfig } from '../config'
import { waitForKeyElements } from '../dom'
import { gmStore } from '../store'
import type { PageKind, Provider } from '../types'
import { toast } from '../ui/modal'

const allowedClientIds = [
  new URL(siteConfig.baidu.api.getAccessToken).searchParams.get('client_id'),
  'L6g70tBRRIXLsY0Z3HwKqlRE',
  'NqOMXF6XGhGRIGemsQ9nG0Na',
  'fSds3K4w43rw37tOqlQmTa2kDwaczK4U',
  'TFwtw8uwHxpdkvVqVKdIlx1XqXUnr1zG',
  '9dgBV9yesuBVOXaxls7aVHbLBLqU8yyg',
  'l9DdBOG4RYroMscmzK5OChdaGelgd92M',
  'Kyr013gHQBf2immy3fQt1jZ3nZVpiGAm',
  'iYCeC9g08h5vuP9UqvPHKKSVrKFXGa1v',
  'omiOnr2tYnN9vSyDErcVFWpPU2mZA7YO',
  'QHOuRXiepJBMjtk0esLhrPoNlQyYd0mF',
  'IlLqBbU3GjQ0t46TRwFateTprHWl39zF',
  'iG6ghsi9r0RR0jTFCrlvTjX9',
  'YgMAXXnP0Lziw0LPVbc6E4zm',
]

function authorize() {
  const url = new URL(location.href)

  if (/openapi\.baidu\.com\/oauth\/2\.0\/authorize/.test(location.href)) {
    const clientId = url.searchParams.get('client_id') || ''
    if (!allowedClientIds.includes(clientId)) return

    if (!url.searchParams.get('response_type')?.includes('token')) return
    if (!url.searchParams.get('scope')?.includes('netdisk')) return

    waitForKeyElements(
      'button#auth-allow',
      (element) => {
        element.click()
      },
      true,
    )
    return
  }

  if (/openapi\.baidu\.com\/oauth\/2\.0\/login_success/.test(location.href)) {
    const timer = setInterval(() => {
      if (!location.href.includes('access_token')) return

      clearInterval(timer)
      const token = location.href.match(/access_token=(.*?)&/)?.[1]
      if (!token) return

      gmStore.set('baidu_access_token', token)
      toast('百度网盘授权成功，5 秒后自动关闭~', 'success')
      setTimeout(() => window.close(), 5000)
    }, 200)
  }
}

export const baiduAuthorize: Provider = {
  detectPage(): PageKind {
    return ''
  },
  addButton() {
    authorize()
  },
  async getLink() {
    throw new Error('当前页面无需获取下载地址~')
  },
}
