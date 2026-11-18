# Waarnemingen

Meetsessie 2026-11-17, 12:35–13:24 (≈ 49 min incl. build; schatting vooraf 50–55 min). Machine en
versies: `results/system.txt`. Alle afwijkingen (A1–A14) staan in `SETUP.md` §7.

Dit is de tweede meting. De eerste (2026-11-16, 22:16–23:06) gebruikte in de Cypress-tests een eigen
helper `veld()` omdat ten onrechte werd aangenomen dat Cypress niet op rol kan zoeken (zie W6). De
Cypress-tests zijn daarna herschreven naar `cy.getByRole` en de hele sessie is opnieuw gedraaid. Een
tussentijdse poging op 2026-11-17 ochtend is afgebroken omdat de laptop zwaar belast was (load ≈ 32,
runs van 130–1111 s in plaats van ≈ 11 s); daarvan is niets bewaard.

## Bevestiging: alles groen, aantallen gelijk

| Controle | Uitkomst | Bron |
| --- | --- | --- |
| App-code byte-identiek in repo@598e999, base, cypress-app, playwright-app | 13/13 bestanden, totaalhash `1c967e02…` in alle vier | `node scripts/check-identical.mjs` |
| Testdata gelijk | `testdata.json` sha256 `fced6276…` in beide projecten | idem |
| Testnamen, volgorde, aantal stappen | gelijk voor alle 12 + 2 tests | `results/testnamen.md` |
| Normale suite 5× per library, per modus | **20/20 runs exit 0**, elke run **12/12 geslaagd**, 0 gefaald, 0 flaky, 4 bestanden; testnamen gelijk | `results/verify.md` |
| Schaalruns C6 (telruns + opwarm + gemeten) | 12/60/120 tests in 4/20/40 bestanden in **beide** libraries; alle 60 gemeten runs, 12 opwarmruns en 12 telruns exit 0 | `results/c6-telruns.csv`, `results/c6.csv` |
| Geen gebruikersnaam in resultaten | 0 treffers in `results/`, ook niet in de 6 zips (traces en ingebedde HTML-rapporten) | controle na de sessie |

## Resultaten in het kort

**C6 – uitvoertijd (mediaan, ms)** – volledige tabel in `results/c6-summary.md`

| Schaal | Cypress lokaal | Playwright lokaal (5 workers) | Cypress ci | Playwright ci (1 worker) |
| --- | --- | --- | --- | --- |
| 1× (12 tests) | 10 528 | 1 662 | 10 582 | 2 944 |
| 5× (60 tests) | 45 585 | 4 098 | 45 923 | 12 114 |
| 10× (120 tests) | 90 481 | 7 053 | 90 489 | 23 418 |

Spreiding (max − min als % van de mediaan): Cypress 0,2–2,1 %, Playwright 0,9–6,8 %. De grootste relatieve
spreiding zit bij Playwright lokaal 5× (3,91–4,19 s); er zijn geen uitschieters.
Cypress is in beide modi vrijwel even snel (het leest `CI` niet; verschil ≤ 0,7 %); Playwright is in
ci-modus 1,8–3,3× trager dan lokaal, puur door `workers: 1` uit de gegenereerde config. Ook met 1 worker
is Playwright 3,6–3,9× sneller dan Cypress; lokaal (5 workers) 6,3–12,8×. Interpretatie: let op W10
(typen vs `fill`) en W7 (andere Chromium-versie).

Vergeleken met de eerste meting (16-11, met `veld()`) verandert het beeld niet: dezelfde volgorde en
ongeveer dezelfde verhoudingen. Cypress 10× is 1,6–2,4 % trager dan toen (90,5 s tegen 88,3/89,1 s), Cypress
1× 4–9 % sneller; Playwright wijkt 0,5–16 % af, het meest bij de kortste run (lokaal 1×: 1,66 s tegen
1,98 s). Het overstappen op `cy.getByRole` heeft de uitvoertijd dus niet merkbaar veranderd.

**C4 – foutmelding** – `results/c4-*.txt`, `results/c4-artefacten/`

| | Cypress lokaal | Cypress ci | Playwright lokaal | Playwright ci |
| --- | --- | --- | --- | --- |
| exitcode | 2 | 2 | 1 | 1 |
| duur | 12,0 s | 11,9 s | 30,9 s | 108,6 s |
| faalt na | 4 s (beide tests) | 4 s | 5 s (assert) / 30 s (klik) | idem, × 3 pogingen |
| aangemaakte bestanden | 2 | 2 | 6 | 33 |

**C7 – exitcodes** – `results/c7.csv`, `results/c7-logs/`

| Situatie | Cypress lokaal | Cypress ci | Playwright lokaal | Playwright ci |
| --- | --- | --- | --- | --- |
| alle tests groen | 0 | 0 | 0 | 0 |
| 2 falende tests | **2** | **2** | 1 | 1 |
| map zonder testbestanden | 1 | 1 | 1 | 1 |
| herhaalpogingen bij falen | 0 | 0 | 0 | **4** (2 tests × 2 retries) |

## Waarnemingen

### Opzet

- **W1 – Cypress-opzet vereist een grafisch venster.** De handmatige stappen van de gids lopen via
  `cypress open` en klikken in de Launchpad (E2E Testing → Continue); pas dan bestaan `cypress.config.ts`
  en `cypress/`. Dat kon niet gescript worden en is door de onderzoeker gedaan (A9). Playwright is volledig
  via de terminal (`pnpm create playwright`, drie vragen).
- **W2 – pnpm 12 blokkeert het install-script van Cypress.** `pnpm add -D cypress` eindigt met
  `ERR_PNPM_IGNORED_BUILDS`, zonder Cypress-binary. Pas na `allowBuilds: cypress: true` + `pnpm install`
  wordt de binary (630 MB) gedownload (A4). Playwright heeft geen install-script; de browserdownload is een
  vraag van create-playwright.
- **W3 – create-playwright downloadt standaard alle browsers.** Chromium, Chrome Headless Shell, Firefox,
  WebKit en FFmpeg (≈ 483 MiB), ook al gebruikt deze opzet alleen Chromium (A3). De standaard voor "Add a
  GitHub Actions workflow?" is **Y**, dus er komt een ongebruikte workflow bij (A7). De vraag
  "TypeScript or JavaScript?" werd in dit project niet gesteld.
- **W4 – De gidsen zijn summier.** De Playwright-gids verwijst voor de stappen naar de Playwright-docs;
  de Cypress-gids beschrijft `cypress open` maar niet wat er in de Launchpad gebeurt. Geen van beide noemt
  pnpm-specifieke zaken. De Cypress-gids noemt voor CI `start-server-and-test` met `next dev`, terwijl
  dezelfde gids aanraadt tegen de productiebuild te testen.
- **W5 – Kopieën en aparte mappen.** Cypress weigert `--spec` buiten `specPattern` ("Can't run because
  no spec files were found"); Playwright-padargumenten filteren alleen binnen `testDir` en `-c <map>` laat
  de hele config vallen. Zonder config-wijziging kan een aparte map dus alleen bínnen het standaardpatroon,
  met een pad in elk script (A5).

### Elementen zoeken zoals een gebruiker

- **W6 – Beide zoeken op rol en toegankelijke naam; Cypress heeft daarvoor één commando, Playwright drie.**
  - Cypress 16.3.0 heeft `cy.getByRole` ingebouwd (sinds 16.2.0;
    https://docs.cypress.io/api/commands/getbyrole). Velden (`textbox`), zoekveld (`searchbox`), Locatie
    (`combobox`), de checkbox, koppen en knoppen worden daarmee gezocht op rol + naam. Het `<label>` geeft
    een veld zijn naam, ook bij de checkbox waar het label om de input heen staat. Geen helper of omweg nodig.
  - **Correctie:** in de eerste meting (16-11) was dit commando gemist en zocht een lokale helper `veld()`
    het `<label>` op tekst en daarna het veld via `for`/`id`; koppen en knoppen gingen met
    `cy.contains('h3' | 'button', tekst)`. Die versie staat niet meer in het project.
  - Cypress heeft geen `getByLabel` of `getByText`. Tekst zonder rol (aantal gevonden vacatures,
    foutmeldingen, succesmelding) gaat met `cy.contains(tekst)`; Playwright gebruikt `getByText`.
  - `cy.getByRole` kent geen `level`-optie: koppen worden alleen op naam gezocht. Playwright zoekt hier op
    `{ level: 3, name }`. Een naam als string moet bij Cypress volledig overeenkomen; Playwright zoekt
    standaard hoofdletterongevoelig op een deel van de naam (`exact: true` maakt het exact).
  - Cypress' eigen best practices raden nog steeds `data-*`-attributen aan
    (https://docs.cypress.io/app/core-concepts/best-practices#Selecting-Elements); dat mocht hier niet.
  - Playwright: alles met `getByRole`, `getByLabel` en `getByText`.
- **W7 – Andere browserversie.** Cypress gebruikt Electron 43.8.4 met **Chromium 150.0.7871.250**;
  Playwright **Chromium 159.0.8154.6**, headless als *chrome-headless-shell*. Beide "Chromium", maar
  9 hoofdversies en een andere headless-variant uit elkaar – een mogelijke stoorfactor bij C6.
- **W8 – Electron is deprecated.** Elke `cypress run` meldt "Browser: Electron 150 (headless)
  (deprecated)" en *"Warning: The Electron browser is deprecated as a test browser and will be removed in
  a future version of Cypress."* Electron is in 16.3.0 nog wel de standaard; daarom is hij volgens de
  opdracht gebruikt. Bij een volgende Cypress-versie is de standaardbrowser mogelijk anders.

### Gedrag tijdens de tests

- **W9 – `trashAssetsBeforeRuns` faalt op deze Mac.** Cypress meldt bij elke run waarbij er al
  screenshots liggen: *"Warning: We failed to trash the existing run results"* met
  `Error: spawn Unknown system error -86`. Oorzaak: het meegeleverde hulpprogramma
  `Cypress.app/…/node_modules/trash/lib/macos-trash` is alleen **x86_64**, en Rosetta 2 is niet actief op
  deze Apple Silicon-Mac (fout 86 = `EBADARCH`). De exitcode verandert niet, maar screenshots stapelen op
  (`… (failed) (1).png`, `(2).png`). De waarschuwing staat in alle zes de Cypress-logs in
  `results/c7-logs/` (C4 ruimt vooraf zelf op, A14). C6 is niet geraakt: de mappen waren leeg en groene runs
  maken geen screenshots.
- **W10 – Typen versus invullen.** Cypress `type()` typt teken voor teken, zonder pauze tussen de toetsen
  (`delay` is sinds Cypress 16.0.0 standaard `0` volgens de History-tabel op
  https://docs.cypress.io/api/commands/type; de meegeleverde types in `cypress.d.ts` noemen nog 10 ms);
  Playwright `fill()` zet de waarde in één keer. Cypress heeft geen ingebouwd `fill`. De formuliertests
  typen 115 tekens per keer dat het formulier wordt ingevuld; hoeveel van het tijdsverschil in C6 hierdoor komt, is niet apart gemeten.
- **W11 – Wachten op een verzoek.** Cypress: `.as('verzoek')` op de intercept en `cy.wait('@verzoek')`
  ná de klik (wachten op een route, geen vaste wachttijd). Playwright: `page.waitForRequest()` moet vóór de
  klik worden gestart, anders kan het verzoek gemist worden.
- **W12 – CORS geen probleem.** De app doet cross-origin `fetch` naar `api.vacaturebank.example`, de POST
  met `Content-Type: application/json` (vereist normaal een preflight). Zowel `cy.intercept` als
  `page.route` handelden dit zonder extra instellingen af. Vooraf gecontroleerd: beide API-verzoeken gaan
  vanuit de browser (`useEffect` en `onSubmit` in client components); de server doet geen externe verzoeken.
- **W13 – Wachten op hydration.** Alle tests wachten eerst op "4 vacatures gevonden". Pas dan heeft
  `useEffect` gedraaid en is React gehydrateerd; anders zou een klik op het (al server-gerenderde)
  formulier vóór hydration een gewone formulierverzending kunnen geven. Dat geldt voor beide libraries
  gelijk.
- **W14 – Viewport verschilt standaard.** Cypress 1000×660, Playwright (Desktop Chrome) 1280×720. Niet
  aangepast (geen tuning).

### Foutmelding en artefacten (C4)

- **W15 – Timeouts.** Cypress: elke stap faalt na `defaultCommandTimeout` = 4 s, ook de klik op een
  niet-bestaande knop. Playwright: een assert faalt na 5 s (expect-timeout), maar een actie (`click`) heeft
  standaard **geen eigen timeout** en wacht tot de test-timeout van 30 s. In ci-modus komt daar 2× een retry
  bij: 108,6 s voor 2 falende tests tegen 11,9 s bij Cypress.
- **W16 – Wat een falende test oplevert.**

  | | Cypress (lokaal = ci) | Playwright lokaal | Playwright ci (retries 2, `trace: 'on-first-retry'`) |
  | --- | --- | --- | --- |
  | Terminal | spec-reporter: per test de fout + bestand:regel (`webpack://base/./cypress/e2e/fail/…cy.ts:28:49`), tabel met resultaten. Vindt `cy.getByRole` niets, dan staat erbij welke rollen mét toegankelijke naam wél op de pagina staan (bv. `button: "Verstuur sollicitatie"`) | per test fout, codefragment met `>`-markering, call log (bij de knop alleen "waiting for getByRole(…)"), pad naar error-context | idem + per poging een blok "Retry #1/#2" |
  | Screenshot | `cypress/screenshots/<spec>/<describe> -- <test> (failed).png` (2 stuks): hele runner met command log (falende stap rood) én de app op het moment van falen | geen (staat standaard uit) | geen |
  | Video | geen (`video: false` standaard) | geen | geen |
  | Tekstcontext | – | `test-results/<test>/error-context.md`: testnaam, locatie, fout, en een ARIA-snapshot (YAML) van de pagina. Begint met instructies voor een AI-assistent ("Explain why, be concise …") | idem, per poging (6 stuks) |
  | Trace | – | – | `test-results/<test>-retry1/trace.zip` (2 stuks): tijdlijn, DOM-snapshots, netwerk, console; te openen met `npx playwright show-trace` |
  | HTML-rapport | – | `playwright-report/index.html` (rapportdata als base64-zip in de HTML) + `data/*.md` | idem + `data/*.zip` (traces) + `trace/` (ingebouwde trace-viewer, 19 bestanden) |
  | Overig | – | `test-results/.last-run.json` (ids van gefaalde tests, voor `--last-failed`) | idem |

  Alles staat in `results/c4-artefacten/<library>-<modus>/` met een `BESTANDEN.txt`.
- **W17 – Absolute paden in artefacten.** De Playwright-traces en de rapportdata in `index.html` bevatten
  absolute paden (stacktraces met de gebruikersnaam). Die zijn opgeschoond door de zips uit te pakken, de
  paden te vervangen en opnieuw in te pakken (`scripts/artefacts.mjs`). Cypress-screenshots bevatten geen
  paden; de Cypress-terminaluitvoer wel (opgeschoond).
- **W18 – Kleurcodes in ci-modus.** Cypress zet met `CI=true` ANSI-kleurcodes in de uitvoer, ook naar een
  bestand (`results/c4-cypress-ci.txt`). Zonder `CI` niet. Playwright zet in geen van beide modi kleurcodes
  in een bestand.

### CI-gedrag (C7)

- **W19 – Exitcode bij falende tests verschilt.** Cypress geeft het **aantal gefaalde tests** als
  exitcode (hier 2); Playwright geeft altijd 1. Een CI-systeem dat alleen op ≠ 0 let, ziet geen verschil;
  een script dat op `== 1` controleert wel.
- **W20 – Lege map: beide falen.** Cypress: "Can't run because no spec files were found", exit 1.
  Playwright: "Error: No tests found", exit 1. Beide hebben de CLI-vlag `--pass-with-no-tests` om dat
  toe te staan; niet gebruikt (standaard).
- **W21 – Retries.** Cypress: `retries.runMode` = 0, dus geen herhaling in beide modi. Playwright: lokaal 0,
  ci 2 (gegenereerde config) → elke falende test 3 pogingen, in totaal 4 extra pogingen. Een test die pas
  bij een retry slaagt, telt Playwright als "flaky" met exitcode 0; in deze meting kwam dat niet voor
  (0 flaky in alle verify- en telruns).

### Meten

- **W22 – JSON-uitvoer.** Playwright `--reporter=json` geeft één JSON-rapport, inclusief `actualWorkers`.
  Cypress `--reporter json` (Mocha) geeft per spec een los JSON-object tussen de eigen Cypress-uitvoer door
  op stdout, zonder aantal workers. `scripts/lib.mjs` haalt de objecten uit de tekst en telt ze op.
- **W23 – Workers.** Cypress draait spec-bestanden altijd één voor één (parallel alleen via Cypress Cloud).
  Playwright lokaal: 5 workers (standaard 50 % van 10 cores) en `fullyParallel: true`; ci: 1 worker.
  Bevestigd in de uitvoer ("Running 12 tests using 5 workers" / "using 1 worker").
