// Meting C6: uitvoertijd per schaal en per library.
// Gebruik: node scripts/measure-c6.mjs [--scales 1,10,20] [--runs 5]
//
// Per schaal:
//   1. tests-bench/ vullen met N kopieën van tests/ (beide projecten).
//   2. Aantal tests bepalen met een aparte run met de JSON-reporter (niet gemeten).
//   3. Koude run: cache van de runner legen (`test:clear-cache`), dan 1 gemeten run.
//   4. 1 opwarmrun per library (niet meegeteld).
//   5. 5 gemeten warme runs per library, afwisselend jest/vitest als eerste
//      (zodat geen van beide structureel als eerste of tweede draait).
// Wandkloktijd van het hele runner-commando (`test:bench`), met CI=true.
import { mkdirSync, readFileSync, rmSync, writeFileSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { LIBRARIES, RESULTS, csvLine, median, runScript } from './lib.mjs'
import { scaleTests } from './scale-tests.mjs'

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? fallback : args[index + 1]
}
const SCALES = option('scales', '1,10,20').split(',').map(Number)
const RUNS = Number(option('runs', '5'))

mkdirSync(RESULTS, { recursive: true })
const csvPath = join(RESULTS, 'c6.csv')
writeFileSync(
  csvPath,
  csvLine(['library', 'schaal', 'type', 'run', 'tijd_ms', 'aantal_tests', 'ms_per_test', 'exitcode']) + '\n',
)

function countTests(lib) {
  const file = join(RESULTS, `.count-${lib.name}.json`)
  const extraArgs =
    lib.name === 'jest'
      ? ['--json', `--outputFile="${file}"`]
      : ['--reporter=json', `--outputFile="${file}"`]
  const { exitCode } = runScript(lib, 'test:bench', { extraArgs })
  const report = JSON.parse(readFileSync(file, 'utf8'))
  rmSync(file)
  if (exitCode !== 0 || report.numFailedTests > 0) {
    throw new Error(`${lib.name}: telrun niet groen (exit ${exitCode})`)
  }
  return report.numTotalTests
}

const rows = []
function record(lib, scale, type, run, result, count) {
  const row = {
    library: lib.name,
    schaal: `${scale}x`,
    type,
    run,
    tijd_ms: Math.round(result.ms),
    aantal_tests: count,
    ms_per_test: (result.ms / count).toFixed(2),
    exitcode: result.exitCode,
  }
  rows.push(row)
  appendFileSync(csvPath, csvLine(Object.values(row)) + '\n')
  console.log(`  ${row.library.padEnd(6)} ${row.schaal.padEnd(4)} ${type.padEnd(5)} run ${run}: ${row.tijd_ms} ms (exit ${row.exitcode})`)
}

try {
  for (const scale of SCALES) {
    console.log(`\n== Schaal ${scale}x`)
    scaleTests(scale)

    const counts = Object.fromEntries(LIBRARIES.map((lib) => [lib.name, countTests(lib)]))
    console.log(`  aantal tests: ${JSON.stringify(counts)}`)
    if (new Set(Object.values(counts)).size !== 1) {
      throw new Error(`Aantal tests verschilt tussen libraries: ${JSON.stringify(counts)}`)
    }

    for (const lib of LIBRARIES) {
      runScript(lib, 'test:clear-cache')
      record(lib, scale, 'koud', 1, runScript(lib, 'test:bench'), counts[lib.name])
    }

    for (const lib of LIBRARIES) runScript(lib, 'test:bench') // opwarmrun, niet meegeteld

    for (let run = 1; run <= RUNS; run++) {
      const order = run % 2 === 1 ? LIBRARIES : [...LIBRARIES].reverse()
      for (const lib of order) {
        record(lib, scale, 'warm', run, runScript(lib, 'test:bench'), counts[lib.name])
      }
    }
  }
} finally {
  scaleTests(0)
  for (const lib of LIBRARIES) rmSync(join(lib.dir, 'tests-bench'), { recursive: true, force: true })
}

// Samenvatting: mediaan van de warme runs per library en schaal, plus de koude run.
const summary = []
for (const scale of SCALES) {
  for (const lib of LIBRARIES) {
    const mine = rows.filter((r) => r.library === lib.name && r.schaal === `${scale}x`)
    const warm = mine.filter((r) => r.type === 'warm').map((r) => r.tijd_ms)
    const cold = mine.find((r) => r.type === 'koud')
    const count = mine[0].aantal_tests
    summary.push({
      library: lib.name,
      schaal: `${scale}x`,
      aantal_tests: count,
      warm_mediaan_ms: Math.round(median(warm)),
      warm_min_ms: Math.min(...warm),
      warm_max_ms: Math.max(...warm),
      warm_mediaan_ms_per_test: (median(warm) / count).toFixed(2),
      koud_ms: cold.tijd_ms,
      alle_exitcodes_0: mine.every((r) => r.exitcode === 0),
    })
  }
}
const header = Object.keys(summary[0])
writeFileSync(
  join(RESULTS, 'c6-summary.csv'),
  [csvLine(header), ...summary.map((s) => csvLine(Object.values(s)))].join('\n') + '\n',
)
const md = [
  '# C6 – samenvatting (mediaan van de warme runs)',
  '',
  `Gegenereerd: ${new Date().toISOString()} · ${RUNS} warme runs per library per schaal · ruwe data: \`c6.csv\``,
  '',
  `| ${header.join(' | ')} |`,
  `| ${header.map(() => '---').join(' | ')} |`,
  ...summary.map((s) => `| ${Object.values(s).join(' | ')} |`),
  '',
]
writeFileSync(join(RESULTS, 'c6-summary.md'), md.join('\n'))
console.log('\n' + md.join('\n'))
