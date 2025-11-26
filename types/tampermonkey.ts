export type IGrantPermission = `GM_${keyof typeof GM}`

export enum RunAt {
  documentStart = 'document-start',
  documentBody = 'document-body',
  documentEnd = 'document-end',
  documentIdle = 'document-idle',
  contextMenu = 'context-menu',
}

/**
 * https://www.tampermonkey.net/documentation.php
 */
export interface ITamperMonkeyHeader {
  name: string
  version: string
  tags?: string[]
  description?: string
  matches?: string[]
  icon?: string
  runAt?: `${RunAt}`
  grants?: IGrantPermission[]
  noframes?: boolean
  supportURL?: string
}
