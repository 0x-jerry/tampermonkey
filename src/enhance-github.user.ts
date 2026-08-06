import { defineHeader, html, parseRawHeadersString, run, waitElement } from './utils'
import { dataIcon, sendIcon } from './assets/icons-svg'
import dayjs from 'dayjs'

defineHeader({
  name: 'Enhance GitHub',
  version: '1.0.7',
  description: 'Enhance GitHub with useful features like displaying repository size',
  matches: ['https://github.com/*/*'],
  runAt: 'document-idle',
  grants: ['GM.xmlHttpRequest'],
})

interface RepoInfo {
  owner: string
  repo: string
}

const SIDEBAR_SELECTOR = '.SidebarSection-module__sidebarSection__e8jFN'
const ENHANCE_MARKER = '[data-enhance-github]'

const REPO_SIZE_ID = 'repo-size-value'
const FIRST_COMMIT_DATE_ID = 'first-commit-date'

const INFO_ROWS = [
  { icon: dataIcon, id: REPO_SIZE_ID, title: 'Repository Size' },
  { icon: sendIcon, id: FIRST_COMMIT_DATE_ID, title: 'First Commit Datetime' },
] as const

run(async () => {
  const context = createContext()

  await enhance(context)

  let timer: number | undefined
  const observer = new MutationObserver(() => {
    clearTimeout(timer)
    timer = window.setTimeout(() => enhance(context), 300)
  })

  observer.observe(document.body, { childList: true, subtree: true })
})

interface EnhanceContext {
  enhancedRepo: string
  enhancing: boolean
}

function createContext(): EnhanceContext {
  return { enhancedRepo: '', enhancing: false }
}

async function enhance(ctx: EnhanceContext) {
  if (ctx.enhancing) return
  ctx.enhancing = true

  try {
    const repoInfo = getRepoInfo()
    if (!repoInfo) return

    const key = repoKey(repoInfo)

    // Skip if this repo is already enhanced
    if (key === ctx.enhancedRepo && document.querySelector(ENHANCE_MARKER)) return

    const sidebar = await waitElement(SIDEBAR_SELECTOR).catch(() => null)
    if (!sidebar) return

    const readmeEl = sidebar.querySelector(`${SIDEBAR_SELECTOR} .mt-2`)
    if (!readmeEl) return

    // The user may have navigated again while we were waiting
    const now = getRepoInfo()
    if (!now || repoKey(now) !== key) return

    ctx.enhancedRepo = key

    // Remove leftovers from the previous repo page
    removeEnhancements()

    readmeEl.parentElement?.insertBefore(createInfoRows(), readmeEl)

    await Promise.all([
      fillInfo(REPO_SIZE_ID, () => fetchRepoSize(repoInfo)),
      fillInfo(FIRST_COMMIT_DATE_ID, () => fetchFirstCommitDate(repoInfo)),
    ])
  } catch (err) {
    console.error(err)
  } finally {
    ctx.enhancing = false
  }
}

function getRepoInfo(): RepoInfo | null {
  const [owner, repo] = location.pathname.split('/').filter(Boolean)

  return owner && repo ? { owner, repo } : null
}

function repoKey(info: RepoInfo) {
  return `${info.owner}/${info.repo}`
}

function removeEnhancements() {
  document.querySelectorAll(ENHANCE_MARKER).forEach((el) => el.remove())
}

function createInfoRows() {
  const frag = document.createDocumentFragment()

  for (const { icon, id, title } of INFO_ROWS) {
    frag.append(html`
      <div class="mt-2" data-enhance-github>
        <span class="Link--muted" title="${title}">
          <img
            src="${icon}"
            class="octicon octicon-people mr-2 tmp-mr-2"
            style="width: 16px; height: 16px;"
          />
          <span id="${id}">Loading...</span>
        </span>
      </div>
    `)
  }

  return frag
}

async function fillInfo(id: string, fetcher: () => Promise<string>) {
  const el = document.getElementById(id)
  if (!el) return

  try {
    el.textContent = await fetcher()
  } catch (err) {
    console.error(err)
    el.textContent = 'Unavailable'
  }
}

interface GitHubResponse<T> {
  headers: Headers
  data: T
}

async function fetchGitHub<T>(url: string): Promise<GitHubResponse<T>> {
  const resp = await GM.xmlHttpRequest({
    method: 'GET',
    url,
    headers: { Accept: 'application/vnd.github.v3+json' },
    responseType: 'json',
  })

  return {
    headers: parseRawHeadersString(resp.responseHeaders),
    data: resp.response as T,
  }
}

async function fetchRepoSize(repoInfo: RepoInfo) {
  const { data } = await fetchGitHub<{ size: number }>(
    `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`,
  )

  const sizeKB = data.size

  return sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`
}

interface Commit {
  commit: { committer: { date: string } }
}

async function fetchFirstCommitDate(repoInfo: RepoInfo) {
  const { headers } = await fetchGitHub<Commit[]>(
    `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits?per_page=1`,
  )

  // <https://api.github.com/repositories/65899476/commits?per_page=1&page=52989>; rel="next", <https://api.github.com/repositories/65899476/commits?per_page=1&page=52988>; rel="last", <https://api.github.com/repositories/65899476/commits?per_page=1&page=1>; rel="first", <https://api.github.com/repositories/65899476/commits?per_page=1&page=52987>; rel="prev"
  const lastPageUrl = getLastPageUrl(headers)
  if (!lastPageUrl) return 'Unavailable'

  const { data } = await fetchGitHub<Commit[]>(lastPageUrl)
  const date = data.at(0)?.commit.committer.date

  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : 'Unavailable'
}

function getLastPageUrl(headers: Headers) {
  const link = headers.get('link')
  if (!link) return

  for (const part of link.split(',')) {
    const [url, rel] = part.split(';')

    if (rel?.includes('rel="last"')) {
      return url.trim().slice(1, -1)
    }
  }
}
