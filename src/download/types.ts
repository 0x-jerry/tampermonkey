export type PageKind = 'home' | 'main' | 'youth' | 'share' | ''

export type DownloadMode = 'api' | 'curl' | 'aria2' | 'bitcomet' | 'abdm'

export interface FileAccessor<T = any> {
  dir: (file: T) => unknown
  name: (file: T) => string
  size: (file: T) => number
  link: (file: T) => string | undefined
}

export interface DownloadResult<T = any> {
  files: T[]
  get: FileAccessor<T>
  headers?: Record<string, string | string[]>
}

export interface Provider {
  detectPage(): PageKind
  addButton(): void
  getLink(): Promise<DownloadResult>
}

export interface GlinkCache {
  id: unknown
  expires: number
  data: any
}

export interface RpcConfig {
  domain: string
  port: string
  path: string
  token?: string
  dir?: string
  key?: string
  authName?: string
  authPass?: string
  default?: boolean
}
