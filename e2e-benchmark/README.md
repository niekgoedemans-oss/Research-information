# E2E-benchmark Cypress vs Playwright (Next.js 16.4.6)

Mini-vacaturesite (fictieve data, dezelfde app als `benchmark/base` uit de Jest/Vitest-benchmark,
commit 598e999) met identieke E2E-tests in Cypress 16.3.0 en Playwright 1.65.1. De externe API wordt in
de browser onderschept (`cy.intercept` / `page.route`).

```
e2e-benchmark/
  base/              kopie van benchmark/base zonder testtooling (hier draait ook de server)
  cypress-app/       kopie van base + Cypress volgens de Next.js-gids
  playwright-app/    kopie van base + Playwright volgens de Next.js-gids
  scripts/           meet-, schaal- en controlescripts (alleen Node-ingebouwde modules)
  results/           uitvoer van de metingen
  SETUP.md           exacte installatiestappen per library, configs vóór/na, alle afwijkingen
  BENCHMARK.md       hoe je elke meting draait, geschatte duur, workers, modi
  TESTS.md           tabel met per test de naam en de stappen in beide libraries
  WAARNEMINGEN.md    wat een library niet of lastig kon, wat opviel, en de bevestiging dat alles groen is
```

Vereist: Node.js 24.20.0 (of een versie die beide ondersteunen), pnpm 12.4.2, macOS met `git`, `zip`
en `unzip`, poort **3001** vrij. Na een verse checkout in elk project `pnpm install --frozen-lockfile`
(in `cypress-app/` downloadt dat ook de Cypress-binary; Playwright-browsers:
`pnpm exec playwright install` in `playwright-app/`).

## Commando's

| Wat | Commando (vanuit `e2e-benchmark/`) | Uitvoer |
| --- | --- | --- |
| **Alles: build, server, verify, C6, C4, C7** | `node scripts/session.mjs` | alles hieronder |
| Server handmatig (build + start op 3001) | `node scripts/server.mjs` | – (Ctrl+C stopt) |
| Machine- en browserversies | `node scripts/system-info.mjs` | `results/system.txt` |
| App-code byte-identiek (ook met repo@598e999)? | `node scripts/check-identical.mjs` | console, exit 0/1 |
| Testnamen en stappen gelijk? | `node scripts/compare-tests.mjs` | `results/testnamen.md`, exit 0/1 |
| Alle tests groen, 5× per library en modus | `node scripts/verify.mjs` | `results/verify.{csv,md}` |
| C6 uitvoertijd (1×, 5×, 10×; lokaal en ci) | `node scripts/measure-c6.mjs` | `results/c6.csv`, `results/c6-summary.{csv,md}` |
| C4 foutmelding | `node scripts/run-c4.mjs` | `results/c4-<library>-<modus>.txt`, `results/c4-artefacten/` |
| C7 exitcodes in CI | `node scripts/run-c7.mjs` | `results/c7.csv`, `results/c7-logs/` |
| Schaalkopieën maken / opruimen | `node scripts/scale-tests.mjs 5` / `… clean` | `*/bench/` |

`verify`, `measure-c6`, `run-c4` en `run-c7` hebben een draaiende server op `http://localhost:3001`
nodig; `session.mjs` regelt die zelf.

Per project (in `cypress-app/` of `playwright-app/`, met de server aan):

```bash
pnpm test                # normale suite: 12 tests in 4 bestanden
```
```bash
PLAYWRIGHT_HTML_OPEN=never pnpm test:fail     # 2 opzettelijk falende tests (C4)
```
```bash
pnpm test:empty          # map zonder testbestanden (C7)
```
```bash
CI=true pnpm test        # ci-modus
```

`PLAYWRIGHT_HTML_OPEN=never` voorkomt dat Playwright lokaal bij een falende test het HTML-rapport
opent en blijft wachten (Cypress negeert de variabele).

## Wat er niet in zit

Geen unit- of componenttests, geen Jest/Vitest, geen Cypress component testing, geen Cypress Cloud,
geen extra packages of plugins. De opzettijd is niet gemeten of geschat; die meet de onderzoeker zelf
met `SETUP.md`.
