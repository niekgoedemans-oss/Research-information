// Bouwt base/ één keer (`next build`) en start `next start` op poort 3001, in de voorgrond.
// Stoppen met Ctrl+C. Voor handmatig testen in cypress-app/ of playwright-app/.
// Gebruik: node scripts/server.mjs [--no-build]
//
// Waarom base/: app/, components/ en lib/ zijn byte-identiek in alle drie de mappen (zie
// check-identical.mjs). base/ bevat geen testtooling, dus de build kan door geen van beide libraries
// beïnvloed zijn, en beide libraries testen precies dezelfde build tegen dezelfde server.
import { BASE_URL, buildBase, startServer } from './lib.mjs'

if (!process.argv.includes('--no-build')) buildBase()
const server = await startServer()
console.log(`\nServer draait op ${BASE_URL} (PID ${server.pid}). Ctrl+C om te stoppen.`)
const stop = () => {
  server.kill('SIGTERM')
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
