// C6 – uitvoertijd. Server moet draaien (of gebruik scripts/session.mjs).
// Gebruik: node scripts/measure-c6.mjs [--scales 1,5,10] [--runs 5] [--modes lokaal,ci]
//
// Per schaal: bench/ vullen met N kopieën (scale-tests.mjs). Daarna per modus:
//   1. telrun per library met de JSON-reporter (niet gemeten) → aantal tests, bestanden, workers
//   2. 1 opwarmrun per library (niet meegeteld; staat in c6-opwarm.csv)
//   3. 5 gemeten runs, per run afwisselend welke library eerst gaat
// Gemeten: wandkloktijd van het hele runnercommando (`cypress run …` / `playwright test …`).
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'
import {
  countFromJson,
  csvLine,
  JSON_ARGS,
  LIBRARIES,
  median,
  MODES,
  RESULTS,
  requireServer,
  runScript,
  sanitize,
} from './lib.mjs'
import { cleanBench, countBenchFiles, scaleTests } from './scale-tests.mjs'

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}
const SCALES = arg('scales', '1,5,10').split(',').map(Number)
const RUNS = Number(arg('runs', '5'))
const RUN_MODES = arg('modes', MODES.join(',')).split(',')

await requireServer()
mkdirSync(join(RESULTS, 'c6-logs'), { recursive: true })
const tmp = mkdtempSync(join(os.tmpdir(), 'e2e-c6-'))
const HEADER = ['library', 'modus', 'schaal', 'run', 'tijd_ms', 'aantal_tests', 'aantal_bestanden', 'ms_per_test', 'exitcode']
const rows = [HEADER]
const warmup = [HEADER]
const counts = [['library', 'modus', 'schaal', 'aantal_tests', 'geslaagd', 'gefaald', 'flaky', 'aantal_bestanden', 'workers', 'exitcode']]
const started = Date.now()

function measured(lib, mode, scale, run, count) {
  const outFile = join(tmp, 'out.txt')
  const r = runScript(lib, 'test:bench', { mode, outFile })
  if (r.exitCode !== 0) {
    // Bij een rode run de uitvoer bewaren (opgeschoond), zodat te zien is wat er misging.
    const log = join(RESULTS, 'c6-logs', `${lib.name}-${mode}-${scale}x-${run}.txt`)
    writeFileSync(log, sanitize(readFileSync(outFile, 'utf8')))
  }
  const line = [lib.name, mode, scale, run, Math.round(r.ms), count.tests, count.files, (r.ms / count.tests).toFixed(1), r.exitCode]
  console.log(`  ${String(run).padEnd(6)} ${lib.name.padEnd(10)} ${String(Math.round(r.ms)).padStart(7)} ms  exit ${r.exitCode}`)
  return line
}

try {
  for (const scale of SCALES) {
    scaleTests(scale)
    const files = LIBRARIES.map(countBenchFiles)
    if (files[0] !== files[1]) throw new Error(`Aantal kopieën verschilt: ${files}`)
    for (const mode of RUN_MODES) {
      console.log(`\n== schaal ${scale}× · modus ${mode} · ${files[0]} bestanden`)
      // 1. telrun met JSON-reporter
      const count = {}
      for (const lib of LIBRARIES) {
        const outFile = join(tmp, `${lib.name}.json.txt`)
        const r = runScript(lib, 'test:bench', { mode, extraArgs: JSON_ARGS[lib.name], outFile })
        const c = countFromJson(lib.name, readFileSync(outFile, 'utf8'))
        counts.push([lib.name, mode, scale, c.tests, c.passed, c.failed, c.flaky, c.files, c.workers, r.exitCode])
        if (r.exitCode !== 0 || c.failed > 0) {
          writeFileSync(join(RESULTS, 'c6-logs', `${lib.name}-${mode}-${scale}x-telrun.txt`), sanitize(readFileSync(outFile, 'utf8')))
          throw new Error(`Telrun ${lib.name} ${mode} ${scale}× niet groen (exit ${r.exitCode}, ${c.failed} gefaald)`)
        }
        count[lib.name] = c
        console.log(`  telrun ${lib.name.padEnd(10)} ${c.tests} tests in ${c.files} bestanden, workers ${c.workers}`)
      }
      if (count.cypress.tests !== count.playwright.tests) {
        throw new Error(`Aantal tests verschilt: cypress ${count.cypress.tests}, playwright ${count.playwright.tests}`)
      }
      // 2. opwarmrun
      for (const lib of LIBRARIES) warmup.push(measured(lib, mode, scale, 'opwarm', count[lib.name]))
      // 3. gemeten runs, afwisselend wie eerst
      for (let run = 1; run <= RUNS; run++) {
        const order = run % 2 ? LIBRARIES : [...LIBRARIES].reverse()
        for (const lib of order) rows.push(measured(lib, mode, scale, run, count[lib.name]))
      }
      // tussentijds wegschrijven, zodat een afgebroken meting niet alles kwijt is
      writeFileSync(join(RESULTS, 'c6.csv'), rows.map(csvLine).join('\n') + '\n')
      writeFileSync(join(RESULTS, 'c6-opwarm.csv'), warmup.map(csvLine).join('\n') + '\n')
      writeFileSync(join(RESULTS, 'c6-telruns.csv'), counts.map(csvLine).join('\n') + '\n')
    }
  }
} finally {
  for (const lib of LIBRARIES) cleanBench(lib)
  rmSync(tmp, { recursive: true, force: true })
}

// Samenvatting: mediaan per library, modus en schaal
const summary = [['library', 'modus', 'schaal', 'runs', 'aantal_tests', 'aantal_bestanden', 'workers', 'mediaan_ms', 'min_ms', 'max_ms', 'mediaan_ms_per_test', 'alle_exitcodes_0']]
for (const scale of SCALES) {
  for (const mode of RUN_MODES) {
    for (const lib of LIBRARIES) {
      const sel = rows.slice(1).filter((r) => r[0] === lib.name && r[1] === mode && r[2] === scale)
      const times = sel.map((r) => r[4])
      const tests = sel[0][5]
      const workers = counts.find((c) => c[0] === lib.name && c[1] === mode && c[2] === scale)[8]
      summary.push([lib.name, mode, scale, sel.length, tests, sel[0][6], workers, median(times), Math.min(...times), Math.max(...times), (median(times) / tests).toFixed(1), sel.every((r) => r[8] === 0) ? 'ja' : 'NEE'])
    }
  }
}
writeFileSync(join(RESULTS, 'c6-summary.csv'), summary.map(csvLine).join('\n') + '\n')
const md = [
  '# C6 – uitvoertijd (mediaan van 5 gemeten runs)',
  '',
  `Gemeten op ${new Date(started).toISOString()}, duur ${((Date.now() - started) / 60000).toFixed(1)} min. Machine: zie results/system.txt.`,
  'Tijd = wandklok van het hele runnercommando; build en serverstart tellen niet mee.',
  '',
  '| library | modus | schaal | tests | bestanden | workers | mediaan (ms) | min | max | ms/test | alle exit 0 |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...summary.slice(1).map((r) => `| ${r[0]} | ${r[1]} | ${r[2]}× | ${r[4]} | ${r[5]} | ${r[6]} | ${r[7]} | ${r[8]} | ${r[9]} | ${r[10]} | ${r[11]} |`),
]
writeFileSync(join(RESULTS, 'c6-summary.md'), md.join('\n') + '\n')
console.log('\n' + md.join('\n'))
