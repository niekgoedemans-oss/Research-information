// Controleert dat app/, components/ en lib/ byte-identiek zijn in base/, jest-app/ en vitest-app/.
// Gebruik: node scripts/check-identical.mjs   (exitcode 1 bij een verschil)
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { ROOT } from './lib.mjs'

const PROJECTS = ['base', 'jest-app', 'vitest-app']
const DIRS = ['app', 'components', 'lib']

function files(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

function hashes(project) {
  const root = join(ROOT, project)
  const map = new Map()
  for (const dir of DIRS) {
    for (const file of files(join(root, dir))) {
      map.set(relative(root, file), createHash('sha256').update(readFileSync(file)).digest('hex'))
    }
  }
  return map
}

const all = Object.fromEntries(PROJECTS.map((p) => [p, hashes(p)]))
const paths = [...new Set(PROJECTS.flatMap((p) => [...all[p].keys()]))].sort()
let problems = 0
for (const path of paths) {
  const values = PROJECTS.map((p) => all[p].get(path) ?? 'ONTBREEKT')
  const same = values.every((v) => v === values[0])
  if (!same) problems++
  console.log(`${same ? 'OK ' : 'NOK'} ${values[0].slice(0, 12)} ${path}${same ? '' : '  ← ' + PROJECTS.map((p, i) => `${p}:${values[i].slice(0, 12)}`).join(' ')}`)
}

// Totaalhash per project over alle bestanden (pad + inhoud).
for (const project of PROJECTS) {
  const total = createHash('sha256')
  for (const path of paths) total.update(`${path}\0${all[project].get(path) ?? ''}\n`)
  console.log(`totaal ${project.padEnd(10)} ${total.digest('hex')}`)
}

console.log(problems === 0 ? `\nIDENTIEK: ${paths.length} bestanden in ${DIRS.join('/, ')}/` : `\nVERSCHIL: ${problems} bestand(en)`)
process.exit(problems === 0 ? 0 : 1)
