import { defineHeader, run, waitElement } from './utils'
import { dataIcon } from './assets/icons-svg'

defineHeader({
  name: 'Enhance GitHub',
  version: '1.0.2',
  description: 'Enhance GitHub with useful features like displaying repository size',
  matches: ['https://github.com/*/*'],
  grants: ['GM_xmlhttpRequest'],
})

run(async () => {
  const pathParts = location.pathname.split('/').filter(Boolean)
  if (pathParts.length < 2) return

  const [owner, repo] = pathParts

  const sidebar = await waitElement('.BorderGrid')
  if (!sidebar) return

  const sizeEl = document.createElement('div')
  sizeEl.className = 'mt-2'

  sizeEl.innerHTML = `
    <div class="mt-2">
      <span class="Link--muted">
        <img src="${dataIcon}" class="octicon octicon-people mr-2 tmp-mr-2" style="width: 16px; height: 16px;" />
        <span id="repo-size-value">Loading...</span>
      </span>
    </div>
  `

  const readmeEl = sidebar.querySelector('.BorderGrid-cell .hide-sm')?.querySelectorAll('.mt-2').values().find(el => el.textContent.trim().endsWith("forks"))

  if (readmeEl) {
    readmeEl.insertAdjacentElement('afterend', sizeEl)
  }

  GM_xmlhttpRequest({
    method: 'GET',
    url: `https://api.github.com/repos/${owner}/${repo}`,
    headers: { Accept: 'application/vnd.github.v3+json' },
    onload(res) {
      const el = document.getElementById('repo-size-value')
      if (!el) return

      try {
        const data = JSON.parse(res.responseText)
        const sizeKB = data.size as number
        const display = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`

        el.textContent = display
      } catch {
        el.textContent = 'Unavailable'
      }
    },
    onerror() {
      const el = document.getElementById('repo-size-value')
      if (el) el.textContent = 'Unavailable'
    },
  })
})
