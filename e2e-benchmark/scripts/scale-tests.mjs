// Gebruik: node scripts/scale-tests.mjs <N>   |   node scripts/scale-tests.mjs clean
// Kopieert de testbestanden uit main/ N keer naar bench/ (plat, als copy-XX-<naam>), in beide projecten
// dezelfde kopieën. Plat zodat de relatieve import van de testdata (../fixtures of ../../fixtures)
// in de kopie hetzelfde blijft als in het origineel.
// bench/ valt binnen testDir/specPattern maar draait alleen via `test:bench`, niet via `test`.
// bench/ bevat altijd alleen de huidige schaal.
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { LIBRARIES } from './lib.mjs'

export function mainFiles(lib) {
  return readdirSync(join(lib.testRoot, 'main')).filter((f) => f.endsWith(lib.suffix)).sort()
}

export function cleanBench(lib) {
  const bench = join(lib.testRoot, 'bench')
  mkdirSync(bench, { recursive: true })
  for (const f of readdirSync(bench)) {
    if (f.startsWith('copy-')) rmSync(join(bench, f))
  }
}

export function scaleTests(n) {
  for (const lib of LIBRARIES) {
    cleanBench(lib)
    for (let i = 1; i <= n; i++) {
      for (const file of mainFiles(lib)) {
        copyFileSync(
          join(lib.testRoot, 'main', file),
          join(lib.testRoot, 'bench', `copy-${String(i).padStart(2, '0')}-${file}`),
        )
      }
    }
  }
}

export function countBenchFiles(lib) {
  return readdirSync(join(lib.testRoot, 'bench')).filter((f) => f.startsWith('copy-')).length
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = process.argv[2]
  if (arg === 'clean') {
    for (const lib of LIBRARIES) cleanBench(lib)
    console.log('bench/ geleegd in beide projecten')
  } else {
    const n = Number(arg)
    if (!Number.isInteger(n) || n < 1) {
      console.error('Gebruik: node scripts/scale-tests.mjs <N>|clean')
      process.exit(1)
    }
    scaleTests(n)
    for (const lib of LIBRARIES) console.log(`${lib.name}: ${countBenchFiles(lib)} bestand(en) in bench/`)
  }
}
