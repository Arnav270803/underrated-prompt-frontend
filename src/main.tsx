import '@fontsource-variable/inter'
import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { reloadOnce } from './lib/reload'

// A tab left open across a deploy may ask for a JS chunk that no longer exists: reload once.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  reloadOnce()
})

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
