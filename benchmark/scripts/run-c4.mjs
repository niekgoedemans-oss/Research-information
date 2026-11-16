// Meting C4: volledige uitvoer van de 2 opzettelijk falende tests, met de standaardreporter.
// Gebruik: node scripts/run-c4.mjs
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { LIBRARIES, RESULTS, runScript } from './lib.mjs'

mkdirSync(RESULTS, { recursive: true })
for (const lib of LIBRARIES) {
  const outFile = join(RESULTS, `c4-${lib.name}.txt`)
  const { command, exitCode } = runScript(lib, 'test:fail', { outFile })
  console.log(`${lib.name}: \`${command.split(' >')[0]}\` → exit ${exitCode} → ${outFile}`)
}
