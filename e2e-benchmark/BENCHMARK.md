# BENCHMARK – hoe je elke meting draait

Alle commando's vanuit `e2e-benchmark/`. De scripts gebruiken alleen Node-ingebouwde modules (plus
`git`, `zip` en `unzip` van het systeem); er is geen `package.json` op dit niveau.

## Geschatte duur (vooraf bepaald)

Geschat op 2026-11-16 uit losse proefruns op de meetmachine (zie `results/system.txt`), vóór de
volledige meting:

| Onderdeel | Losse run (s) | Runs | Schatting |
| --- | --- | --- | --- |
| C6 Cypress, per modus | 1×: 12 · 5×: 48 · 10×: 92 | 7 per schaal (telrun + opwarm + 5) | 2 × 1064 s ≈ **35 min** |
| C6 Playwright lokaal | 1×: 2,5 · 5×: 5 · 10×: 8 | 7 per schaal | ≈ **2 min** |
| C6 Playwright ci | 1×: 4 · 5×: 13 · 10×: 24 | 7 per schaal | ≈ **5 min** |
| verify (5× normale suite, 2 libraries, 2 modi) | 12 / 2,5–4 | 20 | ≈ **2,5 min** |
| C4 (`test:fail`, 2 libraries, 2 modi) | Cypress 13 · Playwright lokaal 31, ci 109 | 4 | ≈ **3 min** |
| C7 (3 situaties, 2 libraries, 2 modi) | zie boven | 12 | ≈ **3,5 min** |
| `next build` + `next start` | – | 1 | < 0,5 min |
| **Totaal `node scripts/session.mjs`** | | | **≈ 50–55 min** |

De gemeten werkelijke duur van C6 staat bovenaan `results/c6-summary.md`. Werkelijk (2026-11-17): C6
40,2 min, de hele sessie ≈ 49 min (12:35–13:24). De eerste sessie (2026-11-16) duurde ≈ 50 min.

## Server (geldt voor alle metingen)

Beide Next.js-gidsen raden aan te testen tegen de productiebuild (`next build` + `next start`).

- Per meetsessie draait **één** `next build` en daarna **één** `next start` op poort **3001**, allebei in
  `base/`. Die ene server draait tijdens alle runs van beide libraries; build en start vallen buiten
  alle gemeten tijden.
- Waarom `base/`: `app/`, `components/` en `lib/` zijn byte-identiek in `base/`, `cypress-app/` en
  `playwright-app/` (en gelijk aan `benchmark/base` uit de repo, zie `scripts/check-identical.mjs`).
  `base/` heeft geen testtooling, dus de build kan door geen van beide libraries beïnvloed zijn. Beide
  libraries testen zo letterlijk dezelfde build tegen dezelfde server.
- Poort 3001 in plaats van 3000: poort 3000 was op de meetmachine bezet door een ander project. Met
  akkoord van de onderzoeker is 3001 gebruikt (afwijking A1 in `SETUP.md`). De poort staat op drie
  plaatsen: `scripts/lib.mjs` (`PORT`), `playwright-app/playwright.config.ts` (`baseURL`) en
  `cypress-app/cypress.config.ts` (`baseUrl`).
- `scripts/session.mjs` doet build → start → alle metingen → stop. Losse meetscripts controleren eerst
  of op `http://localhost:3001` de vacature-app draait (titel "Vacaturebank (fictief)") en stoppen
  anders met exitcode 2. Handmatig: `node scripts/server.mjs` (build + start in de voorgrond, Ctrl+C).

## Twee modi

| Modus | Omgeving | Effect (standaardconfig, niets aangepast) |
| --- | --- | --- |
| `lokaal` | `CI` niet gezet (het script verwijdert `CI` ook als je shell hem wel had) | Playwright: `workers` = standaard (50 % van de logische cores = **5**), `retries` 0, `forbidOnly` uit |
| `ci` | `CI=true` | Playwright: `workers: 1`, `retries: 2`, `forbidOnly: true` (alle drie uit de gegenereerde config) |

Cypress leest `CI` niet voor workers of retries: `retries.runMode` is standaard 0 en `cypress run`
draait spec-bestanden altijd één voor één (parallel alleen via Cypress Cloud, valt buiten dit onderzoek).
Wel zichtbaar verschil in ci-modus: Cypress zet ANSI-kleurcodes in de uitvoer, ook als die naar een
bestand gaat.

**HTML-rapport van Playwright.** De gegenereerde config gebruikt `reporter: 'html'`. Lokaal opent die
bij een falende test het rapport in de browser en blijft het proces wachten. Opgelost met de officiële
omgevingsvariabele **`PLAYWRIGHT_HTML_OPEN=never`** (https://playwright.dev/docs/test-reporters#html-reporter),
niet met een configwijziging. `scripts/lib.mjs` zet die variabele bij elke run, in beide modi en voor
beide libraries (Cypress leest hem niet). Handmatig: `PLAYWRIGHT_HTML_OPEN=never pnpm test:fail`.

## Workers (hoeveel tests/bestanden tegelijk)

| Library | Modus | Tegelijk | Bron |
| --- | --- | --- | --- |
| Cypress | lokaal | 1 spec-bestand | Cypress-docs: `cypress run` draait specs serieel; parallellisatie vereist Cypress Cloud (https://docs.cypress.io/cloud/features/smart-orchestration/parallelization) |
| Cypress | ci | 1 spec-bestand | idem |
| Playwright | lokaal | 5 workers | standaardwaarde: `workers` is in de config `undefined` → standaard 50 % van de logische cores (10 → 5), https://playwright.dev/docs/test-parallel; bevestigd door `actualWorkers` in de JSON-telrun (`results/c6-telruns.csv`) |
| Playwright | ci | 1 worker | config: `workers: process.env.CI ? 1 : undefined` |

Playwright heeft `fullyParallel: true` (config), dus lokaal draaien ook tests binnen één bestand
verdeeld over de 5 workers. Bij 12 tests met 5 workers meldt Playwright "Running 12 tests using 5 workers".

## Hoe een run wordt uitgevoerd

`scripts/lib.mjs` → `runScript()` voert het **package.json-script** van het project uit zoals pnpm dat
zou doen: via de shell, met `node_modules/.bin` vooraan in `PATH`. De opstarttijd van pnpm zelf wordt
dus níet meegemeten. stdout/stderr gaan naar een bestand (beide zonder TTY, dus gelijke uitvoermodus).
Gemeten wordt de **wandkloktijd van het hele runnercommando** (`performance.now()` rond `spawnSync`).

| Script | Cypress | Playwright |
| --- | --- | --- |
| `test` (normaal, 12 tests) | `cypress run --spec "cypress/e2e/main/**/*.cy.ts"` | `playwright test tests/main/` |
| `test:bench` (C6) | `cypress run --spec "cypress/e2e/bench/**/*.cy.ts"` | `playwright test tests/bench/` |
| `test:fail` (C4, C7) | `cypress run --spec "cypress/e2e/fail/**/*.cy.ts"` | `playwright test tests/fail/` |
| `test:empty` (C7) | `cypress run --spec "cypress/e2e/empty/**/*.cy.ts"` | `playwright test tests/empty/` |

Alle submappen vallen binnen het standaardpatroon (`specPattern` = `cypress/e2e/**/*.cy.{js,jsx,ts,tsx}`,
`testDir` = `./tests`); het pad in het script bepaalt welke map draait. Zie afwijking A5 in `SETUP.md`
voor waarom dat zo moet. Let op: een kale `cypress run` / `playwright test` zonder pad draait álles
(ook `bench/` en `fail/`); de scripts doen dat nooit.

---

## Voor elke meetsessie

1. Netstroom aan, andere zware apps dicht, Spotlight-indexering/Time Machine niet actief.
2. Poort 3001 vrij.
3. `node scripts/check-identical.mjs` → moet eindigen met `IDENTIEK` (haalt de repo-referentie op met git).
4. `node scripts/compare-tests.mjs` → moet eindigen met `Resultaat: gelijk`.

## Alles in één keer

```bash
node scripts/session.mjs
```

Volgorde: `system` → `identical` → `compare` → `verify` → `c6` → `c4` → `c7`. Als `verify` niet
groen is, start er geen meting. Een deel draaien: `node scripts/session.mjs --only verify,c4`.
Extra argumenten voor C6 na `--`, bijvoorbeeld `node scripts/session.mjs --only c6 -- --scales 1 --runs 3`.

---

## Verificatie – alle tests groen, 5× achter elkaar

```bash
node scripts/verify.mjs          # server moet draaien
```

Per modus 5 runs van `test`, afwisselend welke library eerst gaat, met de JSON-reporter (Cypress
`--reporter json`, Playwright `--reporter=json`). Controleert per run: exitcode 0, alle tests geslaagd,
0 flaky (Playwright telt een test die pas na een retry slaagt als flaky), en dat beide libraries
hetzelfde aantal tests met dezelfde namen hebben. Uitvoer: `results/verify.csv`, `results/verify.md`.

## C6 – uitvoertijd

```bash
node scripts/measure-c6.mjs      # standaard: --scales 1,5,10 --runs 5 --modes lokaal,ci
```

Per schaal (1×, 5×, 10× = 12/60/120 tests in 4/20/40 bestanden):

1. `scripts/scale-tests.mjs N` kopieert de 4 bestanden uit `main/` N keer naar `bench/` in **beide**
   projecten (plat: `copy-01-flow.cy.ts` … `copy-10-vacatures.spec.ts`). Plat, zodat de relatieve
   import van de testdata in de kopie hetzelfde pad heeft als in het origineel. `bench/` bevat altijd
   alleen de huidige schaal en wordt na afloop geleegd (ook bij een fout).
2. Per modus (`lokaal`, dan `ci`):
   1. **Telrun** per library met de JSON-reporter, níet gemeten → aantal tests, bestanden en (Playwright)
      `actualWorkers`. Het script stopt als een telrun niet groen is of als het aantal tests verschilt.
   2. **1 opwarmrun** per library, niet meegeteld (staat apart in `results/c6-opwarm.csv`).
   3. **5 gemeten runs**: run 1, 3, 5: Cypress → Playwright; run 2, 4: Playwright → Cypress.
   Er is geen koude run.

Uitvoer:

- `results/c6.csv` – kolommen `library,modus,schaal,run,tijd_ms,aantal_tests,aantal_bestanden,ms_per_test,exitcode`
- `results/c6-summary.csv` en `results/c6-summary.md` – **mediaan** per library, modus en schaal (plus min, max, ms/test, workers)
- `results/c6-telruns.csv` – de telruns (aantal tests, geslaagd, workers)
- `results/c6-opwarm.csv` – de opwarmruns
- `results/c6-logs/` – alleen bij een rode run: de opgeschoonde uitvoer

Losse schaal: `node scripts/measure-c6.mjs --scales 10 --modes ci`.

## C4 – foutmelding

```bash
node scripts/run-c4.mjs          # server moet draaien
```

Draait `test:fail` (map `fail/`, precies 2 tests die met opzet falen) per library en per modus met de
**standaardreporter** (Cypress: `spec`; Playwright: de reporter uit de gegenereerde config, `html`):

1. controle die faalt: na versturen wordt "Bedankt voor je inschrijving!" verwacht in plaats van de echte tekst;
2. stap die niet kan: klikken op de knop "Annuleer sollicitatie", die niet bestaat → timeout.

Vóór elke run haalt het script de artefactmappen van een vorige run weg (`cypress/screenshots`,
`cypress/videos`, `test-results`, `playwright-report`), in beide projecten. Reden: Cypress ruimt die
normaal zelf op (`trashAssetsBeforeRuns: true`), maar dat faalt op de meetmachine (waarneming W9); zonder
opruimen zouden screenshots het achtervoegsel " (1)" krijgen.

Uitvoer:

- `results/c4-cypress-lokaal.txt`, `results/c4-cypress-ci.txt`, `results/c4-playwright-lokaal.txt`,
  `results/c4-playwright-ci.txt` – volledige uitvoer (stdout + stderr)
- `results/c4-artefacten/<library>-<modus>/` – alle bestanden die de run in het project aanmaakte of
  wijzigde, met `BESTANDEN.txt` als overzicht
- `results/c4.csv` – exitcode en tijd per run

Absolute paden worden overal vervangen door `…/` (projectmap) of `~` (thuismap), ook ín zips (de
`trace.zip`'s en de zip die in `playwright-report/index.html` is ingebed): uitpakken, vervangen, opnieuw
inpakken (`scripts/artefacts.mjs`). Daarna controleert het script dat de gebruikersnaam nergens meer
voorkomt. Het HTML-rapport en de traces blijven te openen:
`npx playwright show-report results/c4-artefacten/playwright-ci/playwright-report` en
`npx playwright show-trace <pad>/trace.zip` (vanuit `playwright-app/`).

## C7 – gedrag in CI

```bash
node scripts/run-c7.mjs          # server moet draaien
```

Per library, per modus, drie situaties – niets aan de standaard veranderd:

| Situatie | Script |
| --- | --- |
| alle tests groen | `test` |
| falende tests (die uit C4) | `test:fail` |
| map zonder testbestanden | `test:empty` (map `empty/` bevat alleen `.gitkeep`) |

Uitvoer: `results/c7.csv` (`library,modus,situatie,script,commando,exitcode,tijd_ms,extra_pogingen`)
en `results/c7-logs/<library>-<modus>-<situatie>.txt` (volledige uitvoer). `extra_pogingen` telt de
herhaalpogingen die in de uitvoer staan (Playwright: kopregels `Retry #N`; Cypress: `(Attempt N of M)` met N ≥ 2).

## Overige scripts

| Script | Wat |
| --- | --- |
| `node scripts/system-info.mjs` | OS, CPU, RAM, Node, pnpm, Next, Cypress, Playwright en de exacte Chromium-versies → `results/system.txt` |
| `node scripts/check-identical.mjs [--ref <map>]` | app-code byte-identiek in repo@598e999, base, cypress-app, playwright-app + testdata gelijk |
| `node scripts/compare-tests.mjs` | testnamen, volgorde en aantal stappen per test gelijk → `results/testnamen.md` |
| `node scripts/scale-tests.mjs <N>\|clean` | `bench/` vullen of legen in beide projecten |
| `node scripts/server.mjs [--no-build]` | build + `next start` op 3001 in de voorgrond |
