// Gedeelde helpers voor de meetscripts. Alleen Node-ingebouwde modules.
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import os from 'node:os'
import { delimiter, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const RESULTS = join(ROOT, 'results')

// Poort 3000 was op de meetmachine bezet; met akkoord van de onderzoeker is 3001 gebruikt.
// Moet gelijk zijn aan baseURL (playwright.config.ts) en baseUrl (cypress.config.ts).
export const PORT = 3001
export const BASE_URL = `http://localhost:${PORT}`

// Mappen per library. Alle submappen vallen binnen het standaard-testpatroon (testDir / specPattern);
// welke map draait, bepaalt het pad in het package.json-script.
export const LIBRARIES = [
  {
    name: 'cypress',
    dir: join(ROOT, 'cypress-app'),
    testRoot: join(ROOT, 'cypress-app', 'cypress', 'e2e'),
    suffix: '.cy.ts',
  },
  {
    name: 'playwright',
    dir: join(ROOT, 'playwright-app'),
    testRoot: join(ROOT, 'playwright-app', 'tests'),
    suffix: '.spec.ts',
  },
]

export const MODES = ['lokaal', 'ci']

export function scriptCommand(lib, scriptName) {
  const pkg = JSON.parse(readFileSync(join(lib.dir, 'package.json'), 'utf8'))
  const command = pkg.scripts?.[scriptName]
  if (!command) throw new Error(`Script "${scriptName}" ontbreekt in ${lib.name}`)
  return command
}

/**
 * Omgeving per modus.
 * - lokaal: CI wordt verwijderd (ook als de shell hem zelf had gezet).
 * - ci: CI=true.
 * PLAYWRIGHT_HTML_OPEN=never staat altijd aan (officiële env-variabele van de HTML-reporter,
 * https://playwright.dev/docs/test-reporters#html-reporter); zonder die variabele opent Playwright
 * lokaal bij een falende test het rapport in de browser en blijft het proces wachten.
 * Cypress leest deze variabele niet.
 */
export function envFor(lib, mode) {
  const env = { ...process.env }
  delete env.CI
  if (mode === 'ci') env.CI = 'true'
  env.PLAYWRIGHT_HTML_OPEN = 'never'
  env.PATH = join(lib.dir, 'node_modules', '.bin') + delimiter + process.env.PATH
  return env
}

/**
 * Voert een package.json-script uit zoals pnpm dat doet (lokale bin op PATH, via de shell),
 * maar zonder de opstarttijd van pnpm zelf mee te meten.
 * - extraArgs: extra CLI-argumenten achter het script
 * - outFile: stdout + stderr samen (in volgorde) naar dit bestand; anders weg
 */
export function runScript(lib, scriptName, { mode, extraArgs = [], outFile } = {}) {
  if (!MODES.includes(mode)) throw new Error(`Onbekende modus: ${mode}`)
  let command = [scriptCommand(lib, scriptName), ...extraArgs].join(' ')
  command += outFile ? ` > "${outFile}" 2>&1` : ' > /dev/null 2>&1'
  const env = envFor(lib, mode)
  const start = performance.now()
  const result = spawnSync(command, { cwd: lib.dir, env, shell: true, stdio: 'ignore' })
  const ms = performance.now() - start
  if (result.error) throw result.error
  return { command, ms, exitCode: result.status ?? 1 }
}

/** Vervangt het pad naar de projectmap door …/ en de thuismap door ~ (geen gebruikersnaam in resultaten). */
export function sanitize(text) {
  const home = os.homedir()
  return text
    .split(dirname(ROOT) + '/').join('…/')
    .split(ROOT).join('…/e2e-benchmark')
    .split(home).join('~')
}

export function assertNoUserPath(text, label) {
  const user = os.userInfo().username
  if (text.includes(user)) throw new Error(`Gebruikersnaam staat nog in ${label}`)
}

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function csvLine(values) {
  return values
    .map((value) => {
      const text = String(value)
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
    })
    .join(',')
}

/** Controleert dat op BASE_URL de vacature-app draait (en niet iets anders). */
export async function serverIsOurs() {
  try {
    const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(2000) })
    const html = await response.text()
    return response.ok && html.includes('Vacaturebank (fictief)')
  } catch {
    return false
  }
}

export async function requireServer() {
  if (!(await serverIsOurs())) {
    console.error(
      `Geen vacature-app op ${BASE_URL}. Start eerst de server (node scripts/server.mjs) ` +
        `of gebruik node scripts/session.mjs, dat bouwt en start zelf.`,
    )
    process.exit(2)
  }
}

/** Start `next start` in base/ op PORT. Geeft het child process terug. */
export async function startServer() {
  if (await serverIsOurs()) throw new Error(`Er draait al een server op ${BASE_URL}`)
  const base = join(ROOT, 'base')
  const child = spawn(join(base, 'node_modules', '.bin', 'next'), ['start', '-p', String(PORT)], {
    cwd: base,
    stdio: ['ignore', 'inherit', 'inherit'],
    detached: false,
  })
  for (let i = 0; i < 100; i++) {
    if (await serverIsOurs()) return child
    if (child.exitCode !== null) throw new Error(`next start stopte met exitcode ${child.exitCode}`)
    await new Promise((r) => setTimeout(r, 200))
  }
  child.kill('SIGTERM')
  throw new Error('Server kwam niet op binnen 20 s')
}

export function buildBase() {
  const base = join(ROOT, 'base')
  const result = spawnSync(join(base, 'node_modules', '.bin', 'next'), ['build'], {
    cwd: base,
    stdio: 'inherit',
  })
  if (result.status !== 0) throw new Error(`next build faalde (exitcode ${result.status})`)
}

/** Haalt alle top-level JSON-objecten uit de uitvoer van Cypress' json-reporter (één per spec). */
export function parseCypressJson(text) {
  const objects = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== '{') continue
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j] !== '}') continue
      try {
        objects.push(JSON.parse(lines.slice(i, j + 1).join('\n')))
        i = j
        break
      } catch {
        // nog niet het juiste einde; verder zoeken
      }
    }
  }
  return objects
}

/**
 * Telt tests uit een JSON-reporter-run.
 * Geeft { tests, passed, failed, flaky, skipped, files, names, workers }.
 */
export function countFromJson(libName, text) {
  if (libName === 'cypress') {
    const specs = parseCypressJson(text)
    const sum = (key) => specs.reduce((total, spec) => total + (spec.stats?.[key] ?? 0), 0)
    return {
      tests: sum('tests'),
      passed: sum('passes'),
      failed: sum('failures'),
      flaky: 0,
      skipped: sum('pending'),
      files: specs.length,
      names: specs.flatMap((spec) => spec.tests.map((t) => t.fullTitle)),
      workers: 1,
    }
  }
  const start = text.indexOf('{')
  const report = JSON.parse(text.slice(start))
  const names = []
  const files = new Set()
  const walk = (suite, prefix) => {
    for (const spec of suite.specs ?? []) {
      names.push([...prefix, spec.title].join(' '))
      files.add(spec.file)
    }
    for (const child of suite.suites ?? []) walk(child, [...prefix, child.title])
  }
  for (const suite of report.suites ?? []) walk(suite, [])
  const s = report.stats
  return {
    tests: s.expected + s.unexpected + s.flaky + s.skipped,
    passed: s.expected,
    failed: s.unexpected,
    flaky: s.flaky,
    skipped: s.skipped,
    files: files.size,
    names: names.map((n) => n.replace(/^\S+\.spec\.ts /, '')),
    workers: report.config?.metadata?.actualWorkers ?? report.config?.workers,
  }
}

/** Extra CLI-argumenten voor een JSON-reporter-run. */
export const JSON_ARGS = {
  cypress: ['--reporter', 'json'],
  playwright: ['--reporter=json'],
}
