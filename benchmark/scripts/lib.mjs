// Gedeelde helpers voor de meetscripts. Alleen Node-ingebouwde modules.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { delimiter, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const RESULTS = join(ROOT, 'results')

export const LIBRARIES = [
  { name: 'jest', dir: join(ROOT, 'jest-app') },
  { name: 'vitest', dir: join(ROOT, 'vitest-app') },
]

export function scriptCommand(lib, scriptName) {
  const pkg = JSON.parse(readFileSync(join(lib.dir, 'package.json'), 'utf8'))
  const command = pkg.scripts?.[scriptName]
  if (!command) throw new Error(`Script "${scriptName}" ontbreekt in ${lib.name}`)
  return command
}

/**
 * Voert een package.json-script uit zoals pnpm dat doet (lokale bin op PATH, via de shell),
 * maar zonder de opstarttijd van pnpm zelf mee te meten. Altijd met CI=true.
 * - extraArgs: extra CLI-argumenten achter het script
 * - outFile: stdout + stderr samen (in volgorde) naar dit bestand
 */
export function runScript(lib, scriptName, { extraArgs = [], outFile } = {}) {
  let command = [scriptCommand(lib, scriptName), ...extraArgs].join(' ')
  if (outFile) command += ` > "${outFile}" 2>&1`
  const env = {
    ...process.env,
    CI: 'true',
    PATH: join(lib.dir, 'node_modules', '.bin') + delimiter + process.env.PATH,
  }
  const start = performance.now()
  const result = spawnSync(command, { cwd: lib.dir, env, shell: true, stdio: 'ignore' })
  const ms = performance.now() - start
  if (result.error) throw result.error
  return { command, ms, exitCode: result.status ?? 1 }
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
