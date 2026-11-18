// Schrijft OS, CPU, RAM, Node, pnpm en de exacte library- en browserversies naar results/system.txt.
// Gebruik: node scripts/system-info.mjs
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'
import { LIBRARIES, RESULTS, sanitize } from './lib.mjs'

const tryRun = (cmd, cwd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', cwd, stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return 'onbekend'
  }
}
const [cypress, playwright] = LIBRARIES
const bin = (lib, name) => join(lib.dir, 'node_modules', '.bin', name)

// Cypress: de binary ís Electron; met ELECTRON_RUN_AS_NODE=1 geeft hij zijn eigen Chromium-versie.
const cypressVersion = JSON.parse(readFileSync(join(cypress.dir, 'node_modules', 'cypress', 'package.json'), 'utf8')).version
const cypressBinary = join(os.homedir(), 'Library', 'Caches', 'Cypress', cypressVersion, 'Cypress.app', 'Contents', 'MacOS', 'Cypress')
const electron = tryRun(
  `ELECTRON_RUN_AS_NODE=1 "${cypressBinary}" -e "console.log(process.versions.electron + ' / Chromium ' + process.versions.chrome)"`,
)

// Playwright: de Chromium-versie die het zelf meldt (headless gebruikt chrome-headless-shell, zelfde versie).
const pwChromium = tryRun(
  `node -e "import('@playwright/test').then(async ({ chromium }) => { const b = await chromium.launch(); console.log(b.version()); await b.close() })"`,
  playwright.dir,
)

const macos = process.platform === 'darwin' ? `${tryRun('sw_vers -productName')} ${tryRun('sw_vers -productVersion')} (${tryRun('sw_vers -buildVersion')})` : ''
const lines = [
  `Datum:              ${new Date().toISOString()}`,
  `OS:                 ${macos || os.type()} · ${os.type()} ${os.release()} · ${os.arch()}`,
  `CPU:                ${os.cpus()[0]?.model} · ${os.cpus().length} logische cores`,
  `RAM:                ${(os.totalmem() / 1024 ** 3).toFixed(0)} GB`,
  `Node.js:            ${process.version}`,
  `pnpm:               ${tryRun('pnpm --version')}`,
  `next (base):        ${JSON.parse(readFileSync(join(cypress.dir, '..', 'base', 'node_modules', 'next', 'package.json'), 'utf8')).version}`,
  `Cypress:            ${tryRun(`"${bin(cypress, 'cypress')}" version --component package`)} (binary ${tryRun(`"${bin(cypress, 'cypress')}" version --component binary`)})`,
  `Cypress-browser:    Electron ${electron} (standaardbrowser van cypress run)`,
  `@playwright/test:   ${tryRun(`"${bin(playwright, 'playwright')}" --version`).replace('Version ', '')}`,
  `Playwright-browser: Chromium ${pwChromium} (project "chromium", Desktop Chrome; headless = chrome-headless-shell)`,
]
mkdirSync(RESULTS, { recursive: true })
const text = sanitize(lines.join('\n') + '\n')
writeFileSync(join(RESULTS, 'system.txt'), text)
console.log(text)
