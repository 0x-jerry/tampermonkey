import { context } from '../context'
import type { Provider } from '../types'
import { pan123 } from './123pan'
import { aliyun } from './aliyun'
import { baidu } from './baidu'
import { baiduAuthorize } from './baidu-authorize'
import { guangya } from './guangya'
import { mcloud } from './mcloud'
import { quark } from './quark'
import { tcloud } from './tcloud'
import { uc } from './uc'
import { xunlei } from './xunlei'

export function resolveProvider(): Provider | null {
  const host = location.host
  const href = location.href
  let provider: Provider | null = null

  if (/(pan|yun)\.baidu\.com/.test(host)) provider = baidu
  else if (/openapi\.baidu\.com\/oauth/.test(href)) provider = baiduAuthorize
  else if (/www\.(aliyundrive|alipan)\.com/.test(host)) provider = aliyun
  else if (/(yun|caiyun)\.139\.com/.test(host)) provider = mcloud
  else if (/cloud\.189\.cn/.test(host)) provider = tcloud
  else if (/pan\.xunlei\.com/.test(host)) provider = xunlei
  else if (/www\.guangyapan\.com/.test(host)) provider = guangya
  else if (/pan\.quark\.cn/.test(host)) provider = quark
  else if (/drive\.uc\.cn/.test(host)) provider = uc
  else if (
    /(www|login|yun|user|share)\.(123(pan|684|865|952|912)\.com|123pan\.cn)$/.test(host)
  ) {
    provider = pan123
  }

  if (provider) context.page = provider.detectPage()

  return provider
}
