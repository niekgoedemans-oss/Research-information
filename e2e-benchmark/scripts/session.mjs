// Eén meetsessie: één `next build` in base/, één `next start` op poort 3001, daarna alle metingen
// tegen die ene server, en tot slot de server stoppen. Build en serverstart vallen buiten alle tijden.
//
// Gebruik: node scripts/session.mjs [--only system,identical,compare,verify,c6,c4,c7] [-- <extra args voor c6>]
// Standaard: alle stappen in de volgorde hieronder.
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { buildBase, ROOT, startServer } from './lib.mjs'

const STEPS = {
  system: ['system-info.mjs'],
  identical: ['check-identical.mjs'],
  compare: ['compare-tests.mjs'],
  verify: ['verify.mjs'],
  c6: ['measure-c6.mjs'],
  c4: ['run-c4.mjs'],
  c7: ['run-c7.mjs'],
}
const i = process.argv.indexOf('--only')
const selected = i > 0 ? process.argv[i + 1].split(',') : Object.keys(STEPS)
const dash = process.argv.indexOf('--')
const c6Args = dash > 0 ? process.argv.slice(dash + 1) : []

const needsServer = selected.some((s) => ['verify', 'c6', 'c4', 'c7'].includes(s))
let server
const failures = []
try {
  if (needsServer) {
    console.log('== next build (base/)')
    buildBase()
    console.log('== next start (base/, poort 3001)')
    server = await startServer()
  }
  for (const step of selected) {
    const [script] = STEPS[step]
    console.log(`\n== ${step}: node scripts/${script}`)
    const args = [join(ROOT, 'scripts', script), ...(step === 'c6' ? c6Args : [])]
    const r = spawnSync(process.execPath, args, { stdio: 'inherit', cwd: ROOT })
    if (r.status !== 0) failures.push(`${step} (exit ${r.status})`)
    if (step === 'verify' && r.status !== 0) {
      console.error('verify niet groen: metingen worden niet gestart.')
      break
    }
  }
} finally {
  if (server) server.kill('SIGTERM')
}
console.log(failures.length ? `\nKlaar met fouten: ${failures.join(', ')}` : '\nKlaar zonder fouten.')
process.exit(failures.length ? 1 : 0)
