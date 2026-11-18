// C4 – foutmelding. Draait `test:fail` (precies 2 opzettelijk falende tests) per library en per modus
// met de standaardreporter, en bewaart:
//   results/c4-<library>-<modus>.txt          volledige uitvoer (stdout + stderr), paden opgeschoond
//   results/c4-artefacten/<library>-<modus>/  alle bestanden die de run aanmaakte of wijzigde
//   results/c4-artefacten/<library>-<modus>/BESTANDEN.txt  lijst van die bestanden met grootte
//   results/c4.csv                            exitcode en tijd per run
// Server moet draaien (of gebruik scripts/session.mjs).
// Gebruik: node scripts/run-c4.mjs
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { copyClean } from './artefacts.mjs'
import { assertNoUserPath, csvLine, LIBRARIES, MODES, RESULTS, requireServer, runScript, sanitize } from './lib.mjs'

await requireServer()
const SKIP = new Set(['node_modules', '.next', '.git'])

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return []
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

const artefactRoot = join(RESULTS, 'c4-artefacten')
rmSync(artefactRoot, { recursive: true, force: true })
mkdirSync(artefactRoot, { recursive: true })
const rows = [['library', 'modus', 'exitcode', 'tijd_ms', 'bestanden_aangemaakt']]

for (const mode of MODES) {
  for (const lib of LIBRARIES) {
    const outFile = join(RESULTS, `c4-${lib.name}-${mode}.txt`)
    // Artefacten van een vorige run weghalen, in beide libraries gelijk. Normaal doet Cypress dit zelf
    // (trashAssetsBeforeRuns), maar op deze Mac faalt dat (zie WAARNEMINGEN.md: x86_64-binary zonder
    // Rosetta); zonder opruimen krijgen screenshots een achtervoegsel " (1)". Playwright ruimt
    // test-results/ zelf op en overschrijft playwright-report/.
    for (const dir of ['cypress/screenshots', 'cypress/videos', 'test-results', 'playwright-report']) {
      rmSync(join(lib.dir, dir), { recursive: true, force: true })
    }
    const startedAt = Date.now() - 1000
    const r = runScript(lib, 'test:fail', { mode, outFile })
    const text = sanitize(readFileSync(outFile, 'utf8'))
    assertNoUserPath(text, outFile)
    writeFileSync(outFile, text)

    // Alles wat de run in het project aanmaakte of wijzigde (behalve het uitvoerbestand zelf, dat in results/ staat).
    const created = walk(lib.dir).filter((f) => statSync(f).mtimeMs >= startedAt)
    const dest = join(artefactRoot, `${lib.name}-${mode}`)
    const listing = []
    for (const file of created) {
      const rel = relative(lib.dir, file)
      copyClean(file, join(dest, rel, '..'))
      listing.push(`${rel}\t${statSync(file).size} bytes`)
    }
    writeFileSync(
      join(dest, 'BESTANDEN.txt'),
      `Bestanden die \`${r.command.replace(/ >.*$/, '')}\` (modus ${mode}) aanmaakte of wijzigde in ${lib.name}-app/:\n\n` +
        (listing.length ? listing.sort().join('\n') : '(geen)') +
        '\n',
    )
    rows.push([lib.name, mode, r.exitCode, Math.round(r.ms), created.length])
    console.log(`${mode.padEnd(7)} ${lib.name.padEnd(10)} exit ${r.exitCode} · ${Math.round(r.ms)} ms · ${created.length} bestand(en) → ${relative(RESULTS, dest)}/`)
  }
}
writeFileSync(join(RESULTS, 'c4.csv'), rows.map(csvLine).join('\n') + '\n')
