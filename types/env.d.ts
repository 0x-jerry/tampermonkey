/// <reference types="@types/tampermonkey" />

import type { ITamperMonkeyHeader } from './tampermonkey'

declare global {
  /**
   * Used by build script, avoid to run the entire script when read config.
   */
  var __ENV_DISABLE_RUN__: boolean

  var __TAMPER_HEADER_CONFIG__: ITamperMonkeyHeader
}
