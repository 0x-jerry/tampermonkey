import type { GlinkCache, PageKind } from './types'

export const context = {
  page: '' as PageKind,
  glinks: [] as GlinkCache[],
  pugs: '',
}
