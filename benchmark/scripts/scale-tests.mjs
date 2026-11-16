// Gebruik: node scripts/scale-tests.mjs <N>   |   node scripts/scale-tests.mjs clean
// Kopieert tests/ van elk project N keer naar tests-bench/copy-XX/ (in beide projecten dezelfde kopieën).
// tests-bench/ bevat altijd alleen de huidige schaal, zodat geen enkele run bestanden van een
// andere schaal hoeft te doorzoeken.
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { LIBRARIES } from './lib.mjs'

export function scaleTests(n) {
  for (const lib of LIBRARIES) {
    const bench = join(lib.dir, 'tests-bench')
    rmSync(bench, { recursive: true, force: true })
    for (let i = 1; i <= n; i++) {
      cpSync(join(lib.dir, 'tests'), join(bench, `copy-${String(i).padStart(2, '0')}`), {
        recursive: true,
      })
    }
  }
}

export function countCopies(lib) {
  const bench = join(lib.dir, 'tests-bench')
  return existsSync(bench) ? readdirSync(bench).length : 0
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = process.argv[2]
  if (arg === 'clean') {
    scaleTests(0)
    for (const lib of LIBRARIES) rmSync(join(lib.dir, 'tests-bench'), { recursive: true, force: true })
    console.log('tests-bench/ verwijderd in beide projecten')
  } else {
    const n = Number(arg)
    if (!Number.isInteger(n) || n < 1) {
      console.error('Gebruik: node scripts/scale-tests.mjs <N>|clean')
      process.exit(1)
    }
    scaleTests(n)
    for (const lib of LIBRARIES) console.log(`${lib.name}: ${countCopies(lib)} kopie(ën) in tests-bench/`)
  }
}
