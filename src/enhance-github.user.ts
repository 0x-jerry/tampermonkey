import { defineHeader, run, waitElement } from './utils'

defineHeader({
  name: 'Enhance GitHub',
  version: '1.0.0',
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

  const row = document.createElement('div')
  row.className = 'BorderGrid-row'

  row.innerHTML = `
    <div class="BorderGrid-cell">
      <h2 class="h4 mb-3">Repository size</h2>
      <span id="repo-size-value">Loading...</span>
    </div>
  `

  const firstRow = sidebar.querySelector('.BorderGrid-row')
  if (firstRow) {
    firstRow.insertAdjacentElement('beforebegin', row)
  } else {
    sidebar.appendChild(row)
  }

  GM_xmlhttpRequest({
    method: 'GET',
    url: `https://api.github.com/repos/${owner}/${repo}`,
    headers: { Accept: 'application/vnd.github.v3+json' },
    onload(res) {
      const sizeEl = document.getElementById('repo-size-value')
      if (!sizeEl) return

      try {
        const data = JSON.parse(res.responseText)
        const sizeKB = data.size as number
        const display = sizeKB > 1024
          ? `${(sizeKB / 1024).toFixed(1)} MB`
          : `${sizeKB} KB`

        sizeEl.textContent = display
      } catch {
        sizeEl.textContent = 'Unavailable'
      }
    },
    onerror() {
      const sizeEl = document.getElementById('repo-size-value')
      if (sizeEl) sizeEl.textContent = 'Unavailable'
    },
  })
})
