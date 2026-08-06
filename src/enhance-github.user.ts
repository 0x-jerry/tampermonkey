import { defineHeader, html, parseRawHeadersString, run, waitElement } from './utils'
import { dataIcon, sendIcon } from './assets/icons-svg'
import dayjs from 'dayjs'

defineHeader({
  name: 'Enhance GitHub',
  version: '1.0.5',
  description: 'Enhance GitHub with useful features like displaying repository size',
  matches: ['https://github.com/*/*'],
  runAt: 'document-idle',
  grants: ['GM.xmlHttpRequest'],
})

interface RepoInfo {
  repo: string
  owner: string
}

const ENHANCE_MARKER = '[data-enhance-github]'

run(async () => {
  // GitHub uses client-side navigation (Turbo), so the page content is replaced
  // dynamically. Track which repo we've enhanced and re-apply the enhancement
  // via a MutationObserver whenever the repo changes.
  let currentRepo = ''
  let enhancing = false

  function getRepoInfo(): RepoInfo | null {
    const pathParts = location.pathname.split('/').filter(Boolean)
    if (pathParts.length < 2) return null

    return { owner: pathParts[0], repo: pathParts[1] }
  }

  function repoKey(info: RepoInfo) {
    return `${info.owner}/${info.repo}`
  }

  async function enhance() {
    if (enhancing) return
    enhancing = true

    try {
      const repoInfo = getRepoInfo()
      if (!repoInfo) return

      const key = repoKey(repoInfo)

      // Skip if this repo is already enhanced
      if (key === currentRepo && document.querySelector(ENHANCE_MARKER)) return

      const sidebar = await waitElement('.BorderGrid').catch(() => null)
      if (!sidebar) return

      const readmeEl = sidebar.querySelector('.BorderGrid-cell .hide-sm')?.querySelector('.mt-2')
      if (!readmeEl) return

      // The user may have navigated again while we were waiting
      const now = getRepoInfo()
      if (!now || repoKey(now) !== key) return

      currentRepo = key

      // Remove leftovers from the previous repo page
      document.querySelectorAll(ENHANCE_MARKER).forEach((el) => el.remove())

      const sizeEl = html`
        <div class="mt-2" data-enhance-github>
          <span class="Link--muted" title="Repository Size">
            <img
              src="${dataIcon}"
              class="octicon octicon-people mr-2 tmp-mr-2"
              style="width: 16px; height: 16px;"
            />
            <span id="repo-size-value">Loading...</span>
          </span>
        </div>
        <div class="mt-2" data-enhance-github>
          <span class="Link--muted" title="First Commit Datetime">
            <img
              src="${sendIcon}"
              class="octicon octicon-people mr-2 tmp-mr-2"
              style="width: 16px; height: 16px;"
            />
            <span id="first-commit-date">Loading...</span>
          </span>
        </div>
      `

      readmeEl.parentElement?.insertBefore(sizeEl, readmeEl)

      await updateRepoSize(repoInfo)
      await updateFirstCommitDate(repoInfo)
    } catch (err) {
      console.error(err)
    } finally {
      enhancing = false
    }
  }

  await enhance()

  let timer: number | undefined
  const observer = new MutationObserver(() => {
    clearTimeout(timer)
    timer = window.setTimeout(() => {
      const repoInfo = getRepoInfo()

      if (!repoInfo) {
        // Navigated away from a repo page; allow re-enhance on return
        currentRepo = ''
        return
      }

      const key = repoKey(repoInfo)
      const missing = !document.querySelector(ENHANCE_MARKER)

      // Re-enhance when the repo changed, or when our elements were wiped
      // out by a re-render. Skip when the repo layout isn't present yet.
      if ((key !== currentRepo || missing) && document.querySelector('.BorderGrid')) {
        enhance()
      }
    }, 300)
  })

  observer.observe(document.body, { childList: true, subtree: true })
})

async function updateFirstCommitDate(repoInfo: RepoInfo) {
  const el = document.getElementById('first-commit-date')
  if (!el) return

  try {
    const resp = await GM.xmlHttpRequest({
      method: 'GET',
      url: `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits?per_page=1`,
      headers: { Accept: 'application/vnd.github.v3+json' },
      responseType: 'json',
    })

    const headers = parseRawHeadersString(resp.responseHeaders)

    // <https://api.github.com/repositories/65899476/commits?per_page=1&page=52989>; rel="next", <https://api.github.com/repositories/65899476/commits?per_page=1&page=52988>; rel="last", <https://api.github.com/repositories/65899476/commits?per_page=1&page=1>; rel="first", <https://api.github.com/repositories/65899476/commits?per_page=1&page=52987>; rel="prev"
    const linkStr = headers.get('link')
    const links = linkStr?.split(',') || []

    for (const link of links) {
      let [url, rel] = link.split(';')
      url = (url || '').trim().slice(1, -1)
      rel = (rel || '').trim().slice(5, -1)

      if (rel === 'last') {
        const lastCommitResp = await GM.xmlHttpRequest({
          method: 'GET',
          url,
          headers: { Accept: 'application/vnd.github.v3+json' },
          responseType: 'json',
        })

        const data = lastCommitResp.response

        const date = data.at(0)?.commit.committer.date as string

        if (date) {
          el.textContent = dayjs(date).format('YYYY-MM-DD HH:mm:ss')
          return
        }
      }
    }

    el.textContent = 'Unavailable'
  } catch (err) {
    console.error(err)
    el.textContent = 'Unavailable'
  }
}

async function updateRepoSize(repoInfo: RepoInfo) {
  const el = document.getElementById('repo-size-value')
  if (!el) return

  try {
    const resp = await GM.xmlHttpRequest({
      method: 'GET',
      url: `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`,
      headers: { Accept: 'application/vnd.github.v3+json' },
      responseType: 'json',
    })

    const data = resp.response
    const sizeKB = data.size as number
    const display = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`

    el.textContent = display
  } catch (err) {
    console.error(err)
    el.textContent = 'Unavailable'
  }
}
