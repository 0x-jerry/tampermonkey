/// <reference types="@types/tampermonkey" />

declare global {
  /**
   * Used by build script, avoid to run the entire script when read config.
   */
  var _ENV_DISABLE_RUN_: boolean
}

export {}
