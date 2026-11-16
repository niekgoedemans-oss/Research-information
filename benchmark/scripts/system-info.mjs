// Schrijft OS, CPU, RAM, Node- en pnpm-versie naar results/system.txt.
// Gebruik: node scripts/system-info.mjs
import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'
import { RESULTS } from './lib.mjs'

const tryRun = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim()
  } catch {
    return 'onbekend'
  }
}
const macos = process.platform === 'darwin' ? `${tryRun('sw_vers -productName')} ${tryRun('sw_vers -productVersion')} (${tryRun('sw_vers -buildVersion')})` : ''
const lines = [
  `Datum:        ${new Date().toISOString()}`,
  `OS:           ${macos || os.type()} · ${os.type()} ${os.release()} · ${os.arch()}`,
  `CPU:          ${os.cpus()[0]?.model} · ${os.cpus().length} logische cores`,
  `RAM:          ${(os.totalmem() / 1024 ** 3).toFixed(0)} GB`,
  `Node.js:      ${process.version}`,
  `pnpm:         ${tryRun('pnpm --version')}`,
  `watchman:     ${tryRun('command -v watchman') === 'onbekend' ? 'niet geïnstalleerd' : tryRun('watchman --version')}`,
]
mkdirSync(RESULTS, { recursive: true })
writeFileSync(join(RESULTS, 'system.txt'), lines.join('\n') + '\n')
console.log(lines.join('\n'))
