import type { DownloadMode, RpcConfig } from './types'

export const siteConfig = {
  baidu: {
    api: {
      getAccessToken:
        'https://openapi.baidu.com/oauth/2.0/authorize?response_type=token&scope=basic,netdisk&client_id=omiOnr2tYnN9vSyDErcVFWpPU2mZA7YO&redirect_uri=oob&confirm_login=0',
      getLink: 'https://pan.baidu.com/rest/2.0/xpan/multimedia?method=filemetas&dlink=1',
      getFiles: 'https://pan.baidu.com/rest/2.0/xpan/file?method=list&showempty=1',
      getShareLink:
        'https://pan.baidu.com/api/sharedownload?channel=chunlei&clienttype=0&web=1&app_id=250528',
      getShareSign:
        'https://pan.baidu.com/share/tplconfig?fields=sign,timestamp&channel=chunlei&web=1&app_id=250528&clienttype=0&view_mode=1',
      ua: 'pan.baidu.com',
    },
    mount: {
      home: '.frame-main>div>div>div>div:has(.g-dropdown-button.g-new-create)',
      main: '.wp-s-agile-tool-bar__header',
      share: '.module-share-top-bar .x-button-box .g-dropdown-button.tools-more',
      share_v2: '.module-share-bottom-bar.share-bottom-btns > .bar > .x-button-box',
    },
  },
  aliyun: {
    mount: {
      home: '[class^="header--"]>[class^="actions--"]',
      list: '[class^="node-list-table-view--"]',
      grid: '[class^="node-list-grid-view--"]',
      switch: '[class^="switch-wrapper--"]',
    },
  },
  mcloud: {
    api: {
      getLink: 'https://personal-kd-njs.yun.139.com/hcy/file/getDownloadUrl',
    },
    mount: {
      home: '.top_button',
    },
  },
  tcloud: {
    api: {
      getAccessToken: 'https://api.cloud.189.cn/open/oauth2/ssoH5.action',
      getLink: 'https://api.cloud.189.cn/open/file/getFileDownloadUrl.action',
    },
    mount: {
      home: '[class*="FileHead_file-head-left"]',
      share: '.nav-opea',
    },
  },
  xunlei: {
    api: {
      getLink: 'https://api-pan.xunlei.com/drive/v1/files/',
      getCaptchaToken: 'https://xluser-ssl.xunlei.com/v1/shield/captcha/init',
      getAccessToken: 'https://xluser-ssl.xunlei.com/v1/auth/token',
    },
    mount: {
      home: '[class*="FileMenu__menus--"], [class*="FileMenu__menu--"]',
    },
  },
  guangya: {
    api: {
      getLink: 'https://api.guangyapan.com/nd.bizuserres.s/v1/get_res_download_url',
      getShareLink: 'https://api.guangyapan.com/nd.bizuserres.s/v1/get_share_download_url',
      getShareToken: 'https://api.guangyapan.com/nd.bizuserres.s/v1/get_share_access_token',
    },
    mount: {
      home: '#root #app div > div:has(> .ant-btn.ant-btn-primary.ant-btn-color-primary .ant-btn-icon > .swangpan-icon-upload):has(> .ant-btn.ant-btn-default.ant-btn-color-default .ant-btn-icon > .swangpan-icon-addfolder)',
      share: '#root #app div > div:has(> .ant-btn.ant-btn-lg .ant-btn-icon > .swangpan-icon-download)',
    },
  },
  quark: {
    api: {
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 QuarkPC/6.9.7.761 QuarkCloudDrivePC/6.9.7.761 quark-cloud-drive/2.5.40',
      getLink:
        'https://drive-pc.quark.cn/1/clouddrive/file/download?pr=ucpro&fr=pc&sys=win32&ve=6.9.7.761',
      getSocialToken:
        'https://drive-social-api.quark.cn/1/clouddrive/chat/conv/file/acquire_dl_token?pr=ucpro&fr=pc&sys=win32&ve=6.9.7.761&fr=win&la=zh-CN&ch=pckk%40product_guanwan',
    },
    mount: {
      home: '.btn-operate .btn-main',
      share: '.share-btns',
    },
  },
  uc: {
    api: {
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) uc-cloud-drive/1.8.8 Chrome/100.0.4896.160 Electron/18.3.5.16-b62cf9c50d Safari/537.36 Channel/ucpan_other_ch',
      secCh: '"Not=A?Brand";v="99", "Chromium";v="100", "Google Chrome";v="100"',
      getLink:
        'https://pc-api.uc.cn/1/clouddrive/file/download?pr=UCBrowser&fr=pc&sys=win32&ve=1.8.8',
    },
    mount: {
      home: '.btn-operate .btn-main',
      share: '.file-info-share-buttom',
    },
  },
  pan123: {
    api: {
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) 123pan/3.2.3 Chrome/108.0.5359.215 Electron/22.3.27 Safari/537.36 WebView/1.0',
      os: '123pan/v323(Windows10.0.26200)',
      version: '323',
      secCh: '"Not?A_Brand";v="8", "Chromium";v="108"',
      getLink: 'https://api.123pan.cn/api/v2/file/download_info',
      getShareLink: 'https://api.123pan.cn/api/v2/share/download/info',
    },
    mount: {
      home: '.home-operator .home-operator-button-group',
      share:
        '.content .content-header-container-wrap .rightInfo, .single-file-sharing-container-content-file-operate',
    },
  },
}

export const methodLabels: Record<DownloadMode, string> = {
  api: 'API 下载',
  aria2: 'Aria2 下载',
  abdm: 'ABDM 下载',
}

export const defaultAria2Rpc: RpcConfig = {
  domain: 'http://localhost',
  port: '16800',
  path: '/jsonrpc',
  token: '',
  dir: '',
  default: true,
}

export const defaultAbdmRpc: RpcConfig = {
  domain: 'http://localhost',
  port: '15151',
  path: '',
  key: '',
  default: true,
}

export const defaultIdmRpc = '1'
