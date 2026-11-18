// Draait de normale suite (`test`) per library en per modus 5× achter elkaar met de JSON-reporter en
// controleert: exitcode 0, alle tests geslaagd, 0 flaky, en in beide libraries hetzelfde aantal tests
// met dezelfde namen. Server moet draaien (zie BENCHMARK.md).
// Uitvoer: results/verify.csv, results/verify.md. Exitcode 1 als iets niet klopt.
// Gebruik: node scripts/verify.mjs [--runs 5]
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'
import { countFromJson, csvLine, JSON_ARGS, LIBRARIES, MODES, RESULTS, requireServer, runScript } from './lib.mjs'

await requireServer()
const i = process.argv.indexOf('--runs')
const RUNS = i > 0 ? Number(process.argv[i + 1]) : 5
const tmp = mkdtempSync(join(os.tmpdir(), 'e2e-verify-'))

const rows = [['library', 'modus', 'run', 'exitcode', 'aantal_tests', 'geslaagd', 'gefaald', 'flaky', 'overgeslagen', 'aantal_bestanden', 'workers', 'tijd_ms']]
const names = {}
let ok = true
for (const mode of MODES) {
  for (let run = 1; run <= RUNS; run++) {
    const order = run % 2 ? LIBRARIES : [...LIBRARIES].reverse()
    for (const lib of order) {
      const outFile = join(tmp, `${lib.name}.json.txt`)
      const result = runScript(lib, 'test', { mode, extraArgs: JSON_ARGS[lib.name], outFile })
      const c = countFromJson(lib.name, readFileSync(outFile, 'utf8'))
      names[lib.name] = c.names
      const green = result.exitCode === 0 && c.failed === 0 && c.flaky === 0 && c.passed === c.tests && c.tests > 0
      if (!green) ok = false
      rows.push([lib.name, mode, run, result.exitCode, c.tests, c.passed, c.failed, c.flaky, c.skipped, c.files, c.workers, Math.round(result.ms)])
      console.log(`${mode} run ${run} ${lib.name.padEnd(10)} exit ${result.exitCode} · ${c.passed}/${c.tests} geslaagd · flaky ${c.flaky} · ${c.files} bestanden`)
    }
  }
}
rmSync(tmp, { recursive: true, force: true })

const [a, b] = LIBRARIES.map((lib) => [...names[lib.name]].sort())
const sameNames = a.length === b.length && a.every((n, k) => n === b[k])
if (!sameNames) ok = false

writeFileSync(join(RESULTS, 'verify.csv'), rows.map(csvLine).join('\n') + '\n')
const md = [
  '# Verificatie: normale suite 5× per library en modus',
  '',
  `Datum: ${new Date().toISOString()}`,
  '',
  '| library | modus | run | exitcode | tests | geslaagd | gefaald | flaky | bestanden |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows.slice(1).map((r) => `| ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]} | ${r[4]} | ${r[5]} | ${r[6]} | ${r[7]} | ${r[9]} |`),
  '',
  `Testnamen (describe + test) gelijk in beide libraries: **${sameNames ? 'ja' : 'NEE'}** (${a.length} vs ${b.length}).`,
  '',
  ...a.map((n) => `- ${n}`),
  '',
  `Resultaat: **${ok ? 'alles groen, aantallen en namen gelijk' : 'NIET in orde'}**.`,
]
writeFileSync(join(RESULTS, 'verify.md'), md.join('\n') + '\n')
console.log(`\n${ok ? 'OK' : 'NIET OK'} – zie results/verify.md`)
process.exit(ok ? 0 : 1)
