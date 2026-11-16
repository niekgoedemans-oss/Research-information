// Meting C7: exitcodes in CI-situaties (CI=true), zonder iets aan de standaard te veranderen.
// Gebruik: node scripts/run-c7.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { LIBRARIES, RESULTS, csvLine, runScript, scriptCommand } from './lib.mjs'

const SITUATIONS = [
  { name: 'alle-tests-groen', script: 'test' },
  { name: 'falende-tests-c4', script: 'test:fail' },
  { name: 'geen-testbestanden', script: 'test:empty' },
]

const logDir = join(RESULTS, 'c7-logs')
mkdirSync(logDir, { recursive: true })
const lines = [csvLine(['library', 'situatie', 'commando', 'exitcode'])]
for (const lib of LIBRARIES) {
  for (const situation of SITUATIONS) {
    const outFile = join(logDir, `${lib.name}-${situation.name}.txt`)
    const { exitCode } = runScript(lib, situation.script, { outFile })
    const command = scriptCommand(lib, situation.script)
    lines.push(csvLine([lib.name, situation.name, command, exitCode]))
    console.log(`${lib.name.padEnd(6)} ${situation.name.padEnd(20)} ${command.padEnd(22)} exit ${exitCode}`)
  }
}
writeFileSync(join(RESULTS, 'c7.csv'), lines.join('\n') + '\n')
