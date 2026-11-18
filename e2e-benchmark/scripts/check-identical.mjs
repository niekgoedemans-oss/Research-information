// Controleert dat app/, components/ en lib/ byte-identiek zijn in base/, cypress-app/ en playwright-app/,
// én gelijk aan benchmark/base uit de repo (commit 598e999). Controleert ook dat de gedeelde testdata
// (één JSON-bestand per project) in beide projecten identiek is.
//
// Gebruik:
//   node scripts/check-identical.mjs                 haalt de referentie op met git (netwerk nodig)
//   node scripts/check-identical.mjs --ref <map>     gebruikt een lokale kopie van benchmark/base als referentie
// Exitcode 1 bij een verschil.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import os from 'node:os'
import { join, relative } from 'node:path'
import { ROOT } from './lib.mjs'

const REPO = 'https://github.com/niekgoedemans-oss/Research-information.git'
const COMMIT = '598e999'
const DIRS = ['app', 'components', 'lib']

function referenceDir() {
  const i = process.argv.indexOf('--ref')
  if (i > 0) return { dir: process.argv[i + 1], cleanup: () => {} }
  const tmp = mkdtempSync(join(os.tmpdir(), 'e2e-ref-'))
  const git = (...args) => {
    const r = spawnSync('git', args, { cwd: tmp, encoding: 'utf8' })
    if (r.status !== 0) throw new Error(`git ${args.join(' ')} faalde:\n${r.stderr}`)
  }
  git('clone', '--quiet', '--filter=blob:none', '--no-checkout', REPO, '.')
  git('checkout', '--quiet', COMMIT, '--', 'benchmark/base')
  return { dir: join(tmp, 'benchmark', 'base'), cleanup: () => rmSync(tmp, { recursive: true, force: true }) }
}

function files(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

function hashes(root) {
  const map = new Map()
  for (const dir of DIRS) {
    for (const file of files(join(root, dir))) {
      map.set(relative(root, file), createHash('sha256').update(readFileSync(file)).digest('hex'))
    }
  }
  return map
}

const ref = referenceDir()
const projects = [
  [`repo@${COMMIT}`, ref.dir],
  ['base', join(ROOT, 'base')],
  ['cypress-app', join(ROOT, 'cypress-app')],
  ['playwright-app', join(ROOT, 'playwright-app')],
]
const all = Object.fromEntries(projects.map(([name, dir]) => [name, hashes(dir)]))
ref.cleanup()
const names = projects.map(([name]) => name)
const paths = [...new Set(names.flatMap((p) => [...all[p].keys()]))].sort()
let problems = 0
for (const path of paths) {
  const values = names.map((p) => all[p].get(path) ?? 'ONTBREEKT')
  const same = values.every((v) => v === values[0])
  if (!same) problems++
  console.log(`${same ? 'OK ' : 'NOK'} ${values[0].slice(0, 12)} ${path}${same ? '' : '  ← ' + names.map((p, i) => `${p}:${values[i].slice(0, 12)}`).join(' ')}`)
}
for (const project of names) {
  const total = createHash('sha256')
  for (const path of paths) total.update(`${path}\0${all[project].get(path) ?? ''}\n`)
  console.log(`totaal ${project.padEnd(15)} ${total.digest('hex')}`)
}

// Gedeelde testdata
const data = [
  join(ROOT, 'cypress-app', 'cypress', 'fixtures', 'testdata.json'),
  join(ROOT, 'playwright-app', 'tests', 'fixtures', 'testdata.json'),
].map((f) => createHash('sha256').update(readFileSync(f)).digest('hex'))
const dataSame = data[0] === data[1]
if (!dataSame) problems++
console.log(`${dataSame ? 'OK ' : 'NOK'} ${data[0].slice(0, 12)} testdata.json (cypress/fixtures ↔ tests/fixtures)`)

console.log(problems === 0 ? `\nIDENTIEK: ${paths.length} bestanden in ${DIRS.join('/, ')}/ + testdata.json` : `\nVERSCHIL: ${problems} bestand(en)`)
process.exit(problems === 0 ? 0 : 1)
