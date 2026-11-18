# SETUP – exacte installatiestappen

Dit document beschrijft stap voor stap hoe `base/`, `cypress-app/` en `playwright-app/` zijn gemaakt.
Per library staan de stappen **in volgorde**, met commando, geïnstalleerde packages (met versie),
aangemaakte of gewijzigde bestanden en de download van browsers. Daarna volgen de configs vóór en na,
en tot slot alle afwijkingen (A1–A14).

Bronnen (geraadpleegd op 2026-11-16, als Markdown via `https://nextjs.org/docs/app/guides/testing/<naam>.md`):

- Cypress: https://nextjs.org/docs/app/guides/testing/cypress (`lastUpdated: 2026-02-11`) – sectie **Manual setup**
- Playwright: https://nextjs.org/docs/app/guides/testing/playwright (`lastUpdated: 2026-10-15`) – sectie **Manual setup**

De kant-en-klare templates (`with-cypress` / `with-playwright`) zijn **niet** gebruikt.

---

## 1. Machine en versies

| Onderdeel | Waarde |
| --- | --- |
| OS | macOS 27.2 (build 26B123), Darwin 27.2.0, arm64 |
| CPU | Apple M1 Max, 10 logische cores |
| RAM | 32 GB |
| Rosetta 2 | niet actief (relevant voor waarneming W9) |
| Node.js | v24.20.0 – voldoet aan Cypress 16.3.0 (`^22.0.0 \|\| ^24.0.0 \|\| >=26.0.0`) én Playwright 1.65.1 (`>=20`); voor beide projecten dezelfde |
| pnpm | 12.4.2 (ook vastgelegd als `packageManager` in elke `package.json`) |

`node scripts/system-info.mjs` schrijft deze gegevens (plus browserversies) opnieuw naar `results/system.txt`.

### Browsers

| Library | Browser | Exacte versie | Hoe bepaald |
| --- | --- | --- | --- |
| Cypress 16.3.0 | Electron (standaardbrowser van `cypress run`), headless | Electron **43.8.4**, Chromium **150.0.7871.250** | `cypress version`; `process.versions.chrome` van de Cypress-binary; `Cypress.browser.version` in een test |
| Playwright 1.65.1 | project `chromium` (`devices['Desktop Chrome']`), headless | Chrome for Testing **159.0.8154.6** (playwright chromium v1255); headless draait **Chrome Headless Shell 159.0.8154.6** (v1255) | `browser.version()`; downloadregels van `playwright install` |

Andere browsers die `cypress info` vond (Chrome 157, Firefox 160 van de machine zelf) zijn niet gebruikt.

### Versies per project (top-level, uit de lockfiles)

| Package | base | cypress-app | playwright-app |
| --- | --- | --- | --- |
| next | 16.4.6 | 16.4.6 | 16.4.6 |
| react / react-dom | 19.3.0 | 19.3.0 | 19.3.0 |
| typescript | 5.9.3 | 5.9.3 | 5.9.3 |
| @types/node | 20.19.43 | 20.19.43 | 20.19.43 |
| @types/react / @types/react-dom | 19.3.0 | 19.3.0 | 19.3.0 |
| cypress | – | **16.3.0** (binary 16.3.0) | – |
| @playwright/test | – | – | **1.65.1** (+ playwright 1.65.1, playwright-core 1.65.1) |
| aantal packages in lockfile | 75 | 244 (+169) | 78 (+3) |

Gebruikte generator: `create-playwright@1.17.139` (dat is wat `pnpm create playwright` op 2026-11-16
ophaalde). Alle transitieve versies staan in `*/pnpm-lock.yaml`.

> **Bij herhalen voor de opzettijd.** De commando's hieronder volgen de gids letterlijk en pinnen dus
> géén versies (`pnpm add -D cypress`, `pnpm create playwright`). Op 2026-11-16 leverde dat precies
> Cypress 16.3.0 en @playwright/test 1.65.1 op (beide `latest`). Wil je dezelfde versies forceren, gebruik
> dan `pnpm add -D cypress@16.3.0` en controleer na `pnpm create playwright` de versie in `package.json`.
> Let ook op de **caches**: staan `~/Library/Caches/Cypress/16.3.0` (630 MB) of
> `~/Library/Caches/ms-playwright/chromium-1255` e.d. er al, dan slaan Cypress en Playwright de download
> over en meet je een "warme" opzet. Voor een koude opzet die mappen (en eventueel de pnpm-store) eerst
> weghalen.

---

## 2. base/ (gemeenschappelijk startpunt)

`base/` is een letterlijke kopie van `benchmark/base` uit de repo op commit **598e999**
(`598e9996ee105c961c5ee42250bb45202c28c965`). Hoe die app oorspronkelijk is gemaakt, staat in
`benchmark/SETUP.md` van die commit (create-next-app 16.4.6 + vacature-app).

```bash
git clone --filter=blob:none --no-checkout https://github.com/niekgoedemans-oss/Research-information.git ref
git -C ref checkout 598e999 -- benchmark/base
mkdir e2e-benchmark
rsync -a ref/benchmark/base/ e2e-benchmark/base/
cd e2e-benchmark/base
pnpm install --frozen-lockfile
```

- Geïnstalleerd: next 16.4.6, react 19.3.0, react-dom 19.3.0, typescript 5.9.3, @types/node 20.19.43,
  @types/react 19.3.0, @types/react-dom 19.3.0 (75 packages)
- Geen bestanden gewijzigd. (`next-env.d.ts` staat in `.gitignore` en ontstaat bij `next build`.)

## 3. Een project maken vanuit base/

Vanuit `e2e-benchmark/`:

```bash
rsync -a --exclude node_modules --exclude .next --exclude next-env.d.ts base/ playwright-app/   # of cypress-app/
cd playwright-app
pnpm install --frozen-lockfile
```

`package.json` houdt de naam `"base"` (bewust een letterlijke kopie; de naam heeft geen functie).

---

## 4. Playwright – stappen in volgorde

### Deel A – volgens de Next.js-gids

**P-1. `pnpm create playwright`** (gids: "To install Playwright, run the following command")

```bash
pnpm create playwright
```

Bij elke vraag is op Enter gedrukt, dus het standaardantwoord gekozen. De vragen verschijnen in deze
volgorde:

| # | Vraag (letterlijk) | Standaard | Gegeven antwoord |
| --- | --- | --- | --- |
| – | *(Do you want to use TypeScript or JavaScript?)* | – | **niet gesteld** door create-playwright 1.17.139 in dit project; er is TypeScript gegenereerd (`playwright.config.ts`, `tests/example.spec.ts`) |
| 1 | Where to put your end-to-end tests? | `tests` | **tests** |
| 2 | Add a GitHub Actions workflow? (Y/n) | Y | **Y** (standaard) |
| 3 | Install Playwright browsers (can be done manually via 'pnpm exec playwright install')? (Y/n) | Y | **Y** (standaard) |

Op macOS komt de vraag over OS-afhankelijkheden (Linux) niet.

Wat create-playwright daarna zelf doet (uit de uitvoer):

1. `pnpm add --save-dev -w @playwright/test` → **@playwright/test 1.65.1** (pnpm: "Packages: +4 -1"; in de
   lockfile erbij: `@playwright/test@1.65.1`, `playwright@1.65.1`, `playwright-core@1.65.1`).
   Géén `ERR_PNPM_IGNORED_BUILDS`: deze packages hebben geen install-script.
2. "Writing playwright.config.ts." – nieuw (volledige inhoud in §6)
3. "Writing .github/workflows/playwright.yml." – nieuw (GitHub Actions-workflow, ongebruikt in dit onderzoek)
4. "Writing tests/example.spec.ts." – nieuw (twee voorbeeldtests tegen playwright.dev)
5. "Writing package.json." – `"@playwright/test": "^1.65.1"` in `devDependencies`
6. `.gitignore` aangevuld met:
   ```
   # Playwright
   node_modules/
   /test-results/
   /playwright-report/
   /blob-report/
   /playwright/.cache/
   /playwright/.auth/
   ```
7. "Downloading browsers (pnpm exec playwright install)…" naar `~/Library/Caches/ms-playwright/`:

   | Download | Versie | Grootte (zip) |
   | --- | --- | --- |
   | Chrome for Testing | 159.0.8154.6 (playwright chromium v1255) | 191,9 MiB |
   | Chrome Headless Shell | 159.0.8154.6 (playwright chromium-headless-shell v1255) | 100,8 MiB |
   | Firefox | 159.0 (playwright firefox v1572) | 107,6 MiB |
   | WebKit | 27.2 (playwright webkit v2388) | 81,8 MiB |
   | FFmpeg | playwright ffmpeg v1013 | 1,4 MiB |

   Totaal ≈ 483 MiB download; alle drie de browsers, ook al wordt na afwijking A3 alleen Chromium gebruikt.

Gewijzigd/aangemaakt in totaal: `package.json`, `pnpm-lock.yaml`, `.gitignore`, `playwright.config.ts`,
`.github/workflows/playwright.yml`, `tests/example.spec.ts`. `pnpm-workspace.yaml` bleef ongewijzigd.

De gids zegt verder: "Create two new Next.js pages" (Home/About) en een voorbeeldtest. Die stap is
**overgeslagen** (afwijking A10). `npx playwright install-deps` (gids, sectie CI) is alleen voor Linux en
is niet uitgevoerd.

### Deel B – toegestane wijzigingen en de benchmark zelf

**P-2. Config: baseURL en alleen Chromium** (afwijkingen A2, A3) – in `playwright.config.ts`:

- `// baseURL: 'http://localhost:3000',` → `baseURL: 'http://localhost:3001',` (poort: A1)
- de projecten `firefox` en `webkit` verwijderd; `chromium` blijft

Verder niets: `fullyParallel`, `forbidOnly`, `retries`, `workers`, `reporter`, `trace` en het
uitgecommentarieerde `webServer` staan zoals gegenereerd.

**P-3. Voorbeeldtest weg** (A6): `rm tests/example.spec.ts`

**P-4. Testmappen, testdata en tests**

```
tests/
  fixtures/testdata.json      gedeelde fictieve testdata (byte-identiek aan cypress/fixtures/testdata.json)
  main/                       de 12 tests in 4 bestanden (flow, vacatures, validatie, versturen .spec.ts)
  fail/                       2 opzettelijk falende tests (opzettelijk-falend.spec.ts)
  bench/                      leeg (.gitkeep); gevuld door scripts/scale-tests.mjs
  empty/                      alleen .gitkeep
```

**P-5. Scripts in `package.json`** (A5)

```json
"test": "playwright test tests/main/",
"test:bench": "playwright test tests/bench/",
"test:fail": "playwright test tests/fail/",
"test:empty": "playwright test tests/empty/"
```

---

## 5. Cypress – stappen in volgorde

### Deel A – volgens de Next.js-gids

**C-1. Package installeren** (gids: "install `cypress` as a dev dependency")

```bash
pnpm add -D cypress
```

- Geïnstalleerd: **cypress 16.3.0** (+169 packages)
- Gewijzigd: `package.json` (`"cypress": "^16.3.0"`), `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- **pnpm 12 stopt hier met `ERR_PNPM_IGNORED_BUILDS`** ("Ignored build scripts: cypress@16.3.0"). Het
  install-script van Cypress is wat de Cypress-binary downloadt. pnpm zet in `pnpm-workspace.yaml` de regel
  `cypress: set this to true or false`. De binary is op dit moment nog níet gedownload.

**C-2. Build-script van Cypress toestaan** (pnpm-eis, niet uit de gids – afwijking A4)

Wijzig in `pnpm-workspace.yaml` die regel naar:

```yaml
allowBuilds:
  cypress: true
  sharp: false
  unrs-resolver: false
```

```bash
pnpm install
```

- Het postinstall-script downloadt en installeert de **Cypress-binary 16.3.0** (Electron 43.8.4) naar
  `~/Library/Caches/Cypress/16.3.0` (630 MB uitgepakt). Uitvoer eindigt met "Finished Installation".
- Reden voor `true`: zonder binary kan Cypress niet draaien. (Alternatief zou `pnpm exec cypress install`
  zijn; `true` is het dichtst bij wat npm standaard doet en bij wat de gids veronderstelt.)

**C-3. Script `cypress:open` toevoegen** (gids: "Add the Cypress `open` command to the `package.json` scripts field")

```json
"cypress:open": "cypress open"
```

(Het gids-voorbeeld bevat ook `"lint": "eslint"`; dat script bestaat niet in base/ en is niet toegevoegd.)

**C-4. Cypress voor het eerst openen** (gids: "Run Cypress for the first time to open the Cypress testing suite")

```bash
pnpm cypress:open
```

Dit opent het grafische Cypress-venster (Launchpad). Deze stap is **door de onderzoeker met de hand**
gedaan; een script kan dat venster niet bedienen:

| # | Scherm | Keuze |
| --- | --- | --- |
| 1 | keuze testtype (E2E Testing / Component Testing) | **E2E Testing** |
| 2 | Configuration files (lijst met bestanden die worden aangemaakt) | **Continue** |
| 3 | Choose a browser | niets gestart; venster gesloten (Ctrl+C in de terminal) |

Er verschenen geen andere schermen of vragen. Aangemaakt (geen andere bestanden gewijzigd):

- `cypress.config.ts` (TypeScript, omdat het project TypeScript is; inhoud in §6 – gelijk aan het
  TypeScript-voorbeeld van de gids)
- `cypress/support/e2e.ts`
- `cypress/support/commands.ts`
- `cypress/fixtures/example.json` (ongebruikt, blijft staan)

Cypress past `.gitignore` niet aan (`cypress/screenshots` en `cypress/videos` staan er dus niet in).

### Deel B – toegestane wijzigingen en de benchmark zelf

**C-5. Config: baseUrl** (A2) – in `cypress.config.ts` binnen `e2e`: `baseUrl: "http://localhost:3001",` (poort: A1)

Verder niets: geen `retries`, `video`, `screenshotOnRunFailure`, `testIsolation`, `defaultCommandTimeout`,
`viewport*`, `browser` of iets vergelijkbaars. De standaardwaarden (uitgelezen in een test) zijn:
`retries {runMode: 0, openMode: 0}`, `testIsolation: true`, `video: false`, `screenshotOnRunFailure: true`,
`defaultCommandTimeout: 4000`, viewport 1000×660, `specPattern: cypress/e2e/**/*.cy.{js,jsx,ts,tsx}`.

**C-6. Testmappen, testdata en tests**

```
cypress/
  fixtures/testdata.json      gedeelde fictieve testdata (byte-identiek aan tests/fixtures/testdata.json)
  fixtures/example.json       gegenereerd, ongebruikt
  support/e2e.ts, commands.ts gegenereerd, ongewijzigd
  e2e/main/                   de 12 tests in 4 bestanden (flow, vacatures, validatie, versturen .cy.ts)
  e2e/fail/                   2 opzettelijk falende tests (opzettelijk-falend.cy.ts)
  e2e/bench/                  leeg (.gitkeep); gevuld door scripts/scale-tests.mjs
  e2e/empty/                  alleen .gitkeep
```

**C-7. Scripts in `package.json`** (A5)

```json
"test": "cypress run --spec \"cypress/e2e/main/**/*.cy.ts\"",
"test:bench": "cypress run --spec \"cypress/e2e/bench/**/*.cy.ts\"",
"test:fail": "cypress run --spec \"cypress/e2e/fail/**/*.cy.ts\"",
"test:empty": "cypress run --spec \"cypress/e2e/empty/**/*.cy.ts\""
```

De gids noemt voor CI `start-server-and-test` (met `next dev`); dat is **niet** gebruikt (A12).

---

## 6. Configs vóór en na

### playwright.config.ts – zoals gegenereerd (vóór)

```ts
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
```

### playwright.config.ts – na (alleen het verschil)

```diff
   use: {
     /* Base URL to use in actions like `await page.goto('')`. */
-    // baseURL: 'http://localhost:3000',
+    baseURL: 'http://localhost:3001',
 
     /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
     trace: 'on-first-retry',
@@
       use: { ...devices['Desktop Chrome'] },
     },
 
-    {
-      name: 'firefox',
-      use: { ...devices['Desktop Firefox'] },
-    },
-
-    {
-      name: 'webkit',
-      use: { ...devices['Desktop Safari'] },
-    },
-
     /* Test against mobile viewports. */
```

De volledige eindversie staat in `playwright-app/playwright.config.ts`.

### cypress.config.ts – zoals gegenereerd (vóór)

```ts
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
```

### cypress.config.ts – na

```ts
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3001",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
```

---

## 7. Afwijkingen van de Next.js-gidsen en van de gegenereerde config

| # | Afwijking | Library | Reden |
| --- | --- | --- | --- |
| A1 | Server en `baseURL`/`baseUrl` op **poort 3001** in plaats van 3000 | beide | Poort 3000 was op de meetmachine bezet door een ander project; de onderzoeker koos 3001. Voor beide libraries gelijk. |
| A2 | `baseURL` (Playwright) / `baseUrl` (Cypress) gezet | beide | Toegestaan in de opdracht; beide gidsen noemen dit als optie ("Good to know"). |
| A3 | Alleen project `chromium`; `firefox` en `webkit` verwijderd | Playwright | Toegestaan in de opdracht. De gids zegt dat Playwright in drie browsers test; Cypress draait in één (Electron). Firefox en WebKit zijn wel gedownload (P-1). |
| A4 | `allowBuilds: cypress: true` in `pnpm-workspace.yaml` | Cypress | pnpm 12 blokkeert install-scripts standaard; zonder dit script geen Cypress-binary. Niet in de gids (die gaat uit van npm-gedrag). |
| A5 | Normale tests in een submap (`main/`) en elk script met een expliciet pad; `bench/`, `fail/`, `empty/` ernaast, **binnen** `testDir`/`specPattern` | beide | Kopieën en falende tests mogen niet in de normale run, zonder config-wijziging. Cypress weigert `--spec` buiten `specPattern` ("Can't run because no spec files were found", getest); Playwright-padargumenten zijn alleen filters binnen `testDir`, en `-c <map>` laat de hele config vallen. Akkoord onderzoeker. |
| A6 | `tests/example.spec.ts` verwijderd | Playwright | Gegenereerd voorbeeld dat playwright.dev bezoekt (echte externe dienst); geen onderdeel van de benchmark. Zou door A5 ook niet meedraaien. |
| A7 | Gegenereerde `.github/workflows/playwright.yml` en `cypress/fixtures/example.json` blijven staan maar worden niet gebruikt | beide | Standaarduitvoer van de generators; niet weggehaald om zo min mogelijk te wijzigen. |
| A8 | Test "volledige flow" kiest **geen** vacature, maar zoekt een vacature en verstuurt daarna de **open sollicitatie** | beide | De app biedt geen vacaturekeuze: `VacancyLoader` geeft geen `onApply` door aan `VacancyList`, dus de pagina heeft 0 knoppen "Solliciteer op …". App-code mag niet veranderen. Akkoord onderzoeker. |
| A9 | Stap C-4 (`cypress open` → E2E Testing) door de onderzoeker met de hand gedaan | Cypress | Grafisch venster; niet te automatiseren. Wel precies volgens de gids. |
| A10 | De voorbeeldpagina's (Home/About) en voorbeeldtests uit beide gidsen **niet** gemaakt | beide | App-code moet byte-identiek blijven aan `benchmark/base`. |
| A11 | Geen `webServer` (Playwright) en geen `start-server-and-test` (Cypress) | beide | Opdracht: server apart starten. `webServer` stond al uitgecommentarieerd in de gegenereerde config en is zo gelaten. |
| A12 | Server = productiebuild (`next build` + `next start`) uit `base/`, niet `next dev` zoals in het CI-voorbeeld van de Cypress-gids | beide | Beide gidsen raden "running your tests against your production code" aan; één build voor beide (zie BENCHMARK.md). |
| A13 | `PLAYWRIGHT_HTML_OPEN=never` bij elke run | Playwright | Voorkomt dat een lokale run blijft hangen op het HTML-rapport. Officiële env-variabele, geen configwijziging. |
| A14 | `run-c4.mjs` haalt vóór elke C4-run de artefactmappen van een vorige run weg (beide libraries) | beide | Cypress' eigen opruiming (`trashAssetsBeforeRuns`) faalt op deze machine (W9). Raakt de libraries zelf niet. |

Wat níet is gedaan: geen extra packages of plugins (geen `@testing-library/cypress`, geen
`start-server-and-test`), geen custom commands in `cypress/support/commands.ts`, geen aparte tsconfig
voor Cypress, geen wijziging aan `workers`, `fullyParallel`, `retries`, `timeout`, `video`,
`screenshotOnRunFailure`, `testIsolation`, `trace` of `reporter`.
