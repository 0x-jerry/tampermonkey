import { css, defineHeader, run } from './utils'

defineHeader({
  name: 'WeRead Solarized Theme',
  version: '1.0.9',
  description: 'Change the theme of WeRead',
  icon: 'https://www.google.com/s2/favicons?sz=64&domain=weread.qq.com',
  matches: ['https://weread.qq.com/**'],
  runAt: 'document-start',
  grants: ['GM_addStyle'],
})

run(async () => {
  GM_addStyle(css`
/* https://www.wikiwand.com/en/articles/Solarized#Colors */
:root {
  --s-base03: #002b36;
  --s-base02: #073642;
  --s-base01: #586e75;
  --s-base00: #657b83;
  --s-base0: #839496;

  --s-base1: #93a1a1;
  --s-base2: #eee8d5;
  --s-base3: #fdf6e3;

  --s-yellow: #b58900;
  --s-orange: #cb4b16;
  --s-red: #dc322f;
  --s-magenta: #d33682;
  --s-violet: #6c71c4;
  --s-blue: #268bd2;
  --s-cyan: #2aa198;
  --s-green: #859900;
}

.readerCatalog,
.readerAIChatPanel,
.readerNotePanel,
.font-panel-content,
.font-panel-content_sticky,
.wr_reader_note_panel_footer_wrapper,
.reader_float_panel_container,
.reader_float_reviews_panel_item_bottom_container,
.readerTopBar,
.readerChapterContent_container {
  background-color: var(--s-base2) !important;
}

.reader_floatReviewsPanel_content_arrow.reader_floatReviewsPanel_content_arrow_left {
  border-right-color: var(--s-base2) !important;
}

.reader_floatReviewsPanel_content_arrow.reader_floatReviewsPanel_content_arrow_right {
  border-left-color: var(--s-base2) !important;
}

.wr_reader_note_panel_header_cell,
.wr_reader_note_panel_item_cell_wrapper,
.wr_reader_note_panel_footer_button,
.readerControls_item,
.font-panel-content-fonts-item,
.font-panel-content-fonts-item.selected,
.review_section_toolbar_wrapper,
.reader_float_reviews_panel_item_top_container,
.reader_float_reviews_panel_item_bottom_container,
.readerChapterContent {
  background-color: var(--s-base3) !important;
}
 `)
})
