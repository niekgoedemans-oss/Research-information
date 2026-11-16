// Laat zien dat de tests in jest-app en vitest-app alleen verschillen in toegestane regels:
// imports uit 'vitest' en jest.* ↔ vi.*.
// Schrijft results/tests.diff (ruwe diff) en controleert genormaliseerd op gelijkheid.
// Gebruik: node scripts/diff-tests.mjs   (exitcode 1 bij een inhoudelijk verschil)
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { RESULTS, ROOT } from './lib.mjs'

const DIRS = ['tests', 'tests-fail', 'tests-empty']
const JEST = join(ROOT, 'jest-app')
const VITEST = join(ROOT, 'vitest-app')

function files(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

// Normaliseer een Vitest-bestand naar de Jest-vorm: alleen de toegestane verschillen worden weggehaald.
const normalizeVitest = (text) =>
  text.replace(/^import \{[^}]*\} from 'vitest'\n/m, '').replace(/\bvi\./g, 'jest.')

mkdirSync(RESULTS, { recursive: true })
const diffs = DIRS.map((dir) =>
  spawnSync('diff', ['-ru', join('jest-app', dir), join('vitest-app', dir)], { cwd: ROOT, encoding: 'utf8' }).stdout,
).join('')
writeFileSync(join(RESULTS, 'tests.diff'), diffs)

let problems = 0
let changedLines = 0
const paths = [...new Set(DIRS.flatMap((d) => [...files(join(JEST, d)), ...files(join(VITEST, d))].map((f) => relative(f.startsWith(JEST) ? JEST : VITEST, f))))].sort()
for (const path of paths) {
  const a = existsSync(join(JEST, path)) ? readFileSync(join(JEST, path), 'utf8') : null
  const b = existsSync(join(VITEST, path)) ? readFileSync(join(VITEST, path), 'utf8') : null
  const ok = a !== null && b !== null && a === normalizeVitest(b)
  if (!ok) problems++
  console.log(`${ok ? 'OK ' : 'NOK'} ${path}`)
}
for (const line of diffs.split('\n')) {
  if (/^[-+](?![-+]{2} )/.test(line)) {
    changedLines++
    const allowed = /^\+import \{[^}]*\} from 'vitest'$/.test(line) || /\b(jest|vi)\./.test(line)
    if (!allowed) {
      problems++
      console.log(`NIET TOEGESTAAN: ${line}`)
    }
  }
}
console.log(`\n${paths.length} bestanden vergeleken, ${changedLines} gewijzigde regels in de ruwe diff (results/tests.diff).`)
console.log(problems === 0 ? 'Alleen toegestane verschillen (vitest-import, jest.* ↔ vi.*).' : `${problems} probleem/problemen gevonden.`)
process.exit(problems === 0 ? 0 : 1)
