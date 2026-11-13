import { defineHeader, html, parseRawHeadersString, run, waitElement } from './utils'
import { dataIcon, sendIcon } from './assets/icons-svg'
import dayjs from 'dayjs'

defineHeader({
  name: 'Enhance GitHub',
  version: '1.0.9',
  description: 'Enhance GitHub with useful features like displaying repository size',
  matches: ['https://github.com/*/*'],
  runAt: 'document-idle',
  grants: ['GM.xmlHttpRequest'],
})

interface RepoInfo {
  owner: string
  repo: string
}

// Readme row, rendered in every copy of the repo sidebar (narrow and desktop)
const README_LINK_SELECTOR = 'a[href="#readme-ov-file"]'
const ENHANCE_MARKER = '[data-enhance-github]'

const REPO_SIZE_FIELD = 'repo-size'
const FIRST_COMMIT_DATE_FIELD = 'first-commit-date'

const INFO_ROWS = [
  { icon: dataIcon, field: REPO_SIZE_FIELD, title: 'Repository Size' },
  { icon: sendIcon, field: FIRST_COMMIT_DATE_FIELD, title: 'First Commit Datetime' },
] as const

const apiCache = new Map<string, Promise<string>>()

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

    const readmeLink = await waitElement(README_LINK_SELECTOR).catch(() => null)
    if (!readmeLink) return

    // The user may have navigated again while we were waiting
    const now = getRepoInfo()
    if (!now || repoKey(now) !== key) return

    // Remove leftovers from the previous repo page
    if (key !== ctx.enhancedRepo) {
      removeEnhancements()
      ctx.enhancedRepo = key
    }

    if (!insertInfoRows()) return

    await Promise.all([
      fillInfo(REPO_SIZE_FIELD, () =>
        cached(`${key}/${REPO_SIZE_FIELD}`, () => fetchRepoSize(repoInfo)),
      ),
      fillInfo(FIRST_COMMIT_DATE_FIELD, () =>
        cached(`${key}/${FIRST_COMMIT_DATE_FIELD}`, () => fetchFirstCommitDate(repoInfo)),
      ),
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

function insertInfoRows() {
  let inserted = false

  for (const link of document.querySelectorAll(README_LINK_SELECTOR)) {
    const row = link.closest('.mt-2')
    if (!row || row.previousElementSibling?.matches(ENHANCE_MARKER)) continue

    row.parentElement?.insertBefore(createInfoRows(), row)
    inserted = true
  }

  return inserted
}

function createInfoRows() {
  const frag = document.createDocumentFragment()

  for (const { icon, field, title } of INFO_ROWS) {
    frag.append(html`
      <div class="mt-2" data-enhance-github>
        <span title="${title}" style="display: flex; align-items: center;">
          <img
            src="${icon}"
            class="octicon octicon-people mr-2"
            style="width: 16px; height: 16px;"
          />
          <span data-enhance-field="${field}">Loading...</span>
        </span>
      </div>
    `)
  }

  return frag
}

async function fillInfo(field: string, fetcher: () => Promise<string>) {
  const els = document.querySelectorAll(`[data-enhance-field="${field}"]`)
  if (!els.length) return

  let text = 'Unavailable'

  try {
    text = await fetcher()
  } catch (err) {
    console.error(err)
  }

  els.forEach((el) => (el.textContent = text))
}

function cached(key: string, fetcher: () => Promise<string>) {
  let task = apiCache.get(key)

  if (!task) {
    task = fetcher().catch((err) => {
      apiCache.delete(key)
      throw err
    })
    apiCache.set(key, task)
  }

  return task
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
