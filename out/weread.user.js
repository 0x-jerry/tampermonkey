// ==UserScript==
// @name         WeRead Solarized Theme
// @namespace    0x-jerry
// @description  Change the theme of WeRead
// @version      1.0.7
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/weread.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/weread.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src\weread.user.ts
// @icon         https://www.google.com/s2/favicons?sz=64&domain=weread.qq.com
// @match        https://weread.qq.com/**
// @run-at       document-end
// ==/UserScript==
(function(exports) {


//#region src/utils/config.ts
/**
	* Define tamper monkey headers, only used by build process
	* @param config
	* @returns
	*/
	function defineHeader(config$1) {
		return config$1;
	}

//#endregion
//#region src/utils/helper.ts
	function css(template, ...substitutions) {
		return String.raw(template, ...substitutions);
	}

//#endregion
//#region src/utils/utils.ts
/**
	* @param {() => any} fn
	*/
	async function run(fn) {
		try {
			await fn();
		} catch (error) {
			console.error("Running error", error);
		}
	}
	function injectStyle(style) {
		const $style = document.createElement("style");
		$style.innerText = style;
		document.head.appendChild($style);
		return $style;
	}

//#endregion
//#region src/weread.user.ts
	const config = defineHeader({
		name: "WeRead Solarized Theme",
		version: "1.0.7",
		description: "Change the theme of WeRead",
		icon: "https://www.google.com/s2/favicons?sz=64&domain=weread.qq.com",
		matches: ["https://weread.qq.com/**"]
	});
	run(async () => {
		injectStyle(css`
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
 `);
	});

//#endregion
exports.config = config;
return exports;
})({});