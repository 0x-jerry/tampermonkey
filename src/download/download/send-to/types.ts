export type SendResult = 'success' | 'fail'

export type SendTarget = 'idm' | 'aria2' | 'abdm'

export interface SendRequest {
  link: string
  filename: string
  filesize?: number
  headers?: Record<string, string | string[]>
}

export interface SendAdapter {
  send(request: SendRequest): Promise<SendResult>
}
