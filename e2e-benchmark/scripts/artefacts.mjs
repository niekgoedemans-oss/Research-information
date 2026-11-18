// Kopieert artefacten (screenshots, traces, HTML-rapport) naar results/ zonder absolute paden met de
// gebruikersnaam. Zips (trace.zip, en de zip die in playwright-report/index.html is ingebed) worden
// uitgepakt, opgeschoond en opnieuw ingepakt met het systeemeigen `zip`/`unzip` (macOS standaard).
// De inhoud blijft verder ongewijzigd; alleen het pad naar de projectmap wordt …/ en de thuismap ~.
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import { dirname, join, relative } from 'node:path'
import { ROOT } from './lib.mjs'

const REPLACEMENTS = [
  [dirname(ROOT) + '/', '…/'],
  [ROOT, '…/e2e-benchmark'],
  [os.homedir(), '~'],
]
const USER = Buffer.from(os.userInfo().username)

function replaceAll(buffer, from, to) {
  const needle = Buffer.from(from)
  const parts = []
  let start = 0
  let i
  while ((i = buffer.indexOf(needle, start)) !== -1) {
    parts.push(buffer.subarray(start, i), Buffer.from(to))
    start = i + needle.length
  }
  if (start === 0) return buffer
  parts.push(buffer.subarray(start))
  return Buffer.concat(parts)
}

function cleanBuffer(buffer) {
  let out = buffer
  for (const [from, to] of REPLACEMENTS) out = replaceAll(out, from, to)
  return out
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' })
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} faalde: ${r.stderr}`)
}

function cleanZip(zipBuffer) {
  const tmp = mkdtempSync(join(os.tmpdir(), 'e2e-zip-'))
  try {
    writeFileSync(join(tmp, 'in.zip'), zipBuffer)
    mkdirSync(join(tmp, 'x'))
    run('unzip', ['-q', join(tmp, 'in.zip'), '-d', join(tmp, 'x')], tmp)
    for (const file of walk(join(tmp, 'x'))) cleanFile(file, file)
    run('zip', ['-X', '-q', '-r', join(tmp, 'out.zip'), '.'], join(tmp, 'x'))
    return readFileSync(join(tmp, 'out.zip'))
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

const EMBEDDED = /(<template id="playwrightReportBase64">data:application\/zip;base64,)([^<]*)(<\/template>)/

function cleanFile(src, dest) {
  let buffer = readFileSync(src)
  if (src.endsWith('.zip')) {
    buffer = cleanZip(buffer)
  } else {
    if (src.endsWith('.html')) {
      const html = buffer.toString('utf8')
      const m = html.match(EMBEDDED)
      if (m) {
        const zip = cleanZip(Buffer.from(m[2], 'base64'))
        buffer = Buffer.from(html.replace(EMBEDDED, (_, a, __, c) => a + zip.toString('base64') + c))
      }
    }
    buffer = cleanBuffer(buffer)
    if (buffer.includes(USER)) {
      throw new Error(`Gebruikersnaam blijft staan in ${relative(ROOT, src)} (niet automatisch op te schonen)`)
    }
  }
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, buffer)
}

/** Kopieert een map of bestand opgeschoond naar dest. Geeft de lijst gekopieerde bestanden terug. */
export function copyClean(src, dest) {
  if (!existsSync(src)) return []
  const files = statSync(src).isDirectory() ? walk(src) : [src]
  const base = statSync(src).isDirectory() ? src : dirname(src)
  return files.map((file) => {
    const target = join(dest, relative(base, file))
    cleanFile(file, target)
    return target
  })
}

export { cpSync }
