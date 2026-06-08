import { defineHeader, html, parseRawHeadersString, run, waitElement } from './utils'
import { dataIcon, sendIcon } from './assets/icons-svg'
import dayjs from 'dayjs'

defineHeader({
  name: 'Enhance GitHub',
  version: '1.0.2',
  description: 'Enhance GitHub with useful features like displaying repository size',
  matches: ['https://github.com/*/*'],
  runAt: 'document-idle',
  grants: ['GM.xmlHttpRequest'],
})

interface RepoInfo {
  repo: string
  owner: string
}

run(async () => {
  const pathParts = location.pathname.split('/').filter(Boolean)
  if (pathParts.length < 2) return

  const [owner, repo] = pathParts

  const repoInfo: RepoInfo = {
    owner,
    repo,
  }

  const sidebar = await waitElement('.BorderGrid')
  if (!sidebar) return

  const sizeEl = html`
    <div class="mt-2">
      <span class="Link--muted" title="Repository Size">
        <img
          src="${dataIcon}"
          class="octicon octicon-people mr-2 tmp-mr-2"
          style="width: 16px; height: 16px;"
        />
        <span id="repo-size-value">Loading...</span>
      </span>
    </div>
    <div class="mt-2">
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

  const readmeEl = sidebar.querySelector('.BorderGrid-cell .hide-sm')?.querySelector('.mt-2')

  if (!readmeEl) {
    return
  }

  readmeEl?.parentElement?.insertBefore(sizeEl, readmeEl)

  await updateRepoSize(repoInfo)

  await updateFirstCommitDate(repoInfo)
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

        const date = data.at(0)?.commit.author.date as string

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
