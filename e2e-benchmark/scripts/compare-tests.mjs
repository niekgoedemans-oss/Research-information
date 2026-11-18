// Vergelijkt de testbestanden van beide projecten statisch: per bestand dezelfde describe-naam,
// dezelfde testnamen in dezelfde volgorde, en hetzelfde aantal stappen per test.
// Een "stap" is een regel in de testbody die een actie of controle start:
//   Playwright: regels die beginnen met `await` of `expect(`
//   Cypress:    regels die beginnen met `cy.`, `veld(` of `vulFormulierIn(`
//   Beide:      een `for (`-lus telt als één stap.
// Helpers (vulFormulierIn) tellen als één stap, net als in de tabel in TESTS.md.
// `const verzoek = page.waitForRequest(…)` (Playwright) telt niet apart: het is het equivalent van
// `.as('verzoek')` achter cy.intercept en hoort bij de stap "POST onderscheppen".
// Schrijft results/testnamen.md. Exitcode 1 bij een verschil.
// Gebruik: node scripts/compare-tests.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { LIBRARIES, RESULTS } from './lib.mjs'

const FOLDERS = ['main', 'fail']

function parse(lib, file) {
  const source = readFileSync(file, 'utf8')
  const lines = source.split('\n')
  const describe = source.match(/(?:test\.)?describe\('([^']+)'/)?.[1]
  const tests = []
  let current = null
  for (const raw of lines) {
    const line = raw.trim()
    const title = line.match(/^(?:test|it)\('([^']+)'/)?.[1]
    if (title) {
      current = { title, steps: 0 }
      tests.push(current)
      continue
    }
    if (!current) continue
    if (/^\}\);?$/.test(line)) {
      current = null
      continue
    }
    const isStep =
      lib.name === 'playwright'
        ? /^(await |expect\()/.test(line)
        : /^(cy\.|veld\(|vulFormulierIn\()/.test(line)
    // Een lus (for … of vacancies) telt als één stap, ongeacht wat erin staat.
    if (/^for \(/.test(line)) {
      current.steps++
      current.inLoop = true
    } else if (current.inLoop) {
      if (line === '}') current.inLoop = false
    } else if (isStep) {
      current.steps++
    }
  }
  return { describe, tests: tests.map(({ title, steps }) => ({ title, steps })) }
}

const out = ['# Testnamen per library (statische vergelijking)', '']
let problems = 0
for (const folder of FOLDERS) {
  const [cy, pw] = LIBRARIES.map((lib) => {
    const dir = join(lib.testRoot, folder)
    return readdirSync(dir)
      .filter((f) => f.endsWith(lib.suffix))
      .sort()
      .map((f) => ({ file: f, base: f.replace(lib.suffix, ''), ...parse(lib, join(dir, f)) }))
  })
  out.push(`## ${folder}/`, '')
  out.push('| Bestand | Describe | Test | Stappen Cypress | Stappen Playwright | Gelijk |')
  out.push('| --- | --- | --- | --- | --- | --- |')
  const bases = [...new Set([...cy, ...pw].map((f) => f.base))].sort()
  for (const base of bases) {
    const a = cy.find((f) => f.base === base)
    const b = pw.find((f) => f.base === base)
    if (!a || !b || a.describe !== b.describe || a.tests.length !== b.tests.length) {
      problems++
      out.push(`| ${base} | ${a?.describe} / ${b?.describe} | aantal ${a?.tests.length} / ${b?.tests.length} | | | NEE |`)
      continue
    }
    a.tests.forEach((t, i) => {
      const u = b.tests[i]
      const same = t.title === u.title && t.steps === u.steps
      if (!same) problems++
      out.push(`| ${base} | ${a.describe} | ${t.title}${t.title === u.title ? '' : ` ≠ ${u.title}`} | ${t.steps} | ${u.steps} | ${same ? 'ja' : 'NEE'} |`)
    })
  }
  out.push('')
}
const total = LIBRARIES.map((lib) => readdirSync(join(lib.testRoot, 'main')).filter((f) => f.endsWith(lib.suffix)).length)
out.push(`Bestanden in main/: cypress ${total[0]}, playwright ${total[1]}.`, '')
out.push(problems === 0 ? 'Resultaat: **gelijk**.' : `Resultaat: **${problems} verschil(len)**.`)
writeFileSync(join(RESULTS, 'testnamen.md'), out.join('\n') + '\n')
console.log(out.join('\n'))
process.exit(problems === 0 ? 0 : 1)
