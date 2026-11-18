// C7 – gedrag in CI: exitcodes per library, per modus en per situatie, zonder iets aan de standaard te
// veranderen. Situaties: groen (`test`), falend (`test:fail`, de 2 tests uit C4), leeg (`test:empty`,
// map zonder testbestanden).
// Uitvoer: results/c7.csv en results/c7-logs/<library>-<modus>-<situatie>.txt (volledige uitvoer).
// Kolom extra_pogingen = totaal aantal herhaalpogingen (retries, over alle tests) dat in de uitvoer te zien is.
// Server moet draaien (of gebruik scripts/session.mjs).
// Gebruik: node scripts/run-c7.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { assertNoUserPath, csvLine, LIBRARIES, MODES, RESULTS, requireServer, runScript, sanitize } from './lib.mjs'

await requireServer()
const SITUATIONS = [
  ['groen', 'test'],
  ['falend', 'test:fail'],
  ['leeg', 'test:empty'],
]
const logs = join(RESULTS, 'c7-logs')
mkdirSync(logs, { recursive: true })
const rows = [['library', 'modus', 'situatie', 'script', 'commando', 'exitcode', 'tijd_ms', 'extra_pogingen']]

function retries(libName, text) {
  // Playwright: één kopregel "Retry #N ───" per herhaalpoging per test.
  // Cypress: "(Attempt N of M)" per poging; alleen N ≥ 2 is een herhaling.
  const re = libName === 'playwright' ? /^\s*Retry #\d+ ─/ : /\(Attempt ([2-9]|\d{2,}) of \d+\)/
  return text.split('\n').filter((l) => re.test(l)).length
}

for (const mode of MODES) {
  for (const lib of LIBRARIES) {
    for (const [situation, script] of SITUATIONS) {
      const outFile = join(logs, `${lib.name}-${mode}-${situation}.txt`)
      const r = runScript(lib, script, { mode, outFile })
      const text = sanitize(readFileSync(outFile, 'utf8'))
      assertNoUserPath(text, outFile)
      writeFileSync(outFile, text)
      const command = r.command.replace(/ >.*$/, '')
      rows.push([lib.name, mode, situation, script, command, r.exitCode, Math.round(r.ms), retries(lib.name, text)])
      console.log(`${mode.padEnd(7)} ${lib.name.padEnd(10)} ${situation.padEnd(7)} exit ${r.exitCode} · ${Math.round(r.ms)} ms`)
    }
  }
}
writeFileSync(join(RESULTS, 'c7.csv'), rows.map(csvLine).join('\n') + '\n')
