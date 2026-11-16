// Hulpscript voor het handmatige watch-protocol (C6, zie BENCHMARK.md).
// Gebruik:
//   node scripts/watch-mode.mjs park            tests-fail/ en tests-bench/ tijdelijk uit beide projecten halen
//   node scripts/watch-mode.mjs apply <lib>     de vooraf bepaalde wijziging maken (lib = jest | vitest)
//   node scripts/watch-mode.mjs revert <lib>    de wijziging terugdraaien
//   node scripts/watch-mode.mjs restore         tests-fail/ terugzetten
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { LIBRARIES, ROOT } from './lib.mjs'

// De vooraf bepaalde wijziging: gedrag blijft gelijk (eerst kleine letters, dan trimmen),
// maar het is een echte codewijziging in één bronbestand.
const FILE = 'lib/filter.ts'
const BEFORE = 'const query = filter.query.trim().toLowerCase();'
const AFTER = 'const query = filter.query.toLowerCase().trim();'
const PARKED = join(ROOT, '.parked')

const [command, libName] = process.argv.slice(2)
const pick = () => {
  const lib = LIBRARIES.find((l) => l.name === libName)
  if (!lib) throw new Error('Geef een library op: jest of vitest')
  return lib
}

function swap(from, to) {
  const lib = pick()
  const path = join(lib.dir, FILE)
  const text = readFileSync(path, 'utf8')
  if (!text.includes(from)) throw new Error(`Verwachte regel niet gevonden in ${lib.name}/${FILE}`)
  writeFileSync(path, text.replace(from, to))
  const now = new Date()
  console.log(`${lib.name}/${FILE} opgeslagen om ${now.toISOString()} (epoch ms ${now.getTime()})`)
}

switch (command) {
  case 'park':
    mkdirSync(PARKED, { recursive: true })
    for (const lib of LIBRARIES) {
      rmSync(join(lib.dir, 'tests-bench'), { recursive: true, force: true })
      const from = join(lib.dir, 'tests-fail')
      if (existsSync(from)) renameSync(from, join(PARKED, `${lib.name}-tests-fail`))
    }
    console.log('tests-fail/ geparkeerd in .parked/, tests-bench/ verwijderd')
    break
  case 'restore':
    for (const lib of LIBRARIES) {
      const from = join(PARKED, `${lib.name}-tests-fail`)
      if (existsSync(from)) renameSync(from, join(lib.dir, 'tests-fail'))
    }
    rmSync(PARKED, { recursive: true, force: true })
    console.log('tests-fail/ teruggezet')
    break
  case 'apply':
    swap(BEFORE, AFTER)
    break
  case 'revert':
    swap(AFTER, BEFORE)
    break
  default:
    console.error('Gebruik: park | apply <jest|vitest> | revert <jest|vitest> | restore')
    process.exit(1)
}
