import { defineHeader, run } from './utils'
import { main } from './download/main'

defineHeader({
  name: 'Netdisk Download',
  version: '0.1.0',
  description:
    'Get direct download links from netdisk sites (Baidu, Aliyun, 139, 189, Xunlei, Guangya, Quark, UC, 123pan).',
  matches: [
    '*://pan.baidu.com/*',
    '*://yun.baidu.com/*',
    '*://openapi.baidu.com/*',
    '*://www.aliyundrive.com/*',
    '*://www.alipan.com/*',
    '*://yun.139.com/*',
    '*://caiyun.139.com/*',
    '*://cloud.189.cn/*',
    '*://pan.xunlei.com/*',
    '*://www.guangyapan.com/*',
    '*://pan.quark.cn/*',
    '*://drive.uc.cn/*',
    '*://*.123pan.com/*',
    '*://*.123pan.cn/*',
    '*://*.123684.com/*',
    '*://*.123865.com/*',
    '*://*.123952.com/*',
    '*://*.123912.com/*',
  ],
  connects: ['*', 'localhost'],
  grants: [
    'unsafeWindow',
    'window.close',
    'GM_xmlhttpRequest',
    'GM.xmlHttpRequest',
    'GM_setClipboard',
    'GM_setValue',
    'GM_getValue',
    'GM_deleteValue',
    'GM_openInTab',
    'GM_registerMenuCommand',
  ],
  runAt: 'document-start',
})

run(main)
