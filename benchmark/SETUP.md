# SETUP – exacte installatiestappen

Dit document beschrijft stap voor stap hoe `base/`, `jest-app/` en `vitest-app/` zijn gemaakt.
Per library staan de stappen **in volgorde**, met commando, geïnstalleerde packages (met versie) en
aangemaakte of gewijzigde bestanden.

Bronnen (beide `lastUpdated: 2026-08-25`, geraadpleegd op 2026-11-14):

- Jest: https://nextjs.org/docs/app/guides/testing/jest – sectie **Manual setup**
- Vitest: https://nextjs.org/docs/app/guides/testing/vitest – sectie **Manual Setup**

De kant-en-klare templates (`with-jest` / `with-vitest`) zijn **niet** gebruikt.

---

## 1. Machine en versies

| Onderdeel | Waarde |
| --- | --- |
| OS | macOS 27.2 (build 26B123), Darwin 27.2.0, arm64 |
| CPU | Apple M1 Max, 10 logische cores |
| RAM | 32 GB |
| Node.js | v24.20.0 (voldoet aan Vitest 5.1.0: `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0`) |
| pnpm | 12.4.2 (ook vastgelegd als `packageManager` in elke `package.json`) |
| watchman | niet geïnstalleerd (Jest gebruikt het als het er wel is; dat zou de crawl-tijd beïnvloeden) |

`node scripts/system-info.mjs` schrijft deze gegevens opnieuw naar `results/system.txt`.

### Versies per project (top-level, uit de lockfiles)

| Package | base | jest-app | vitest-app |
| --- | --- | --- | --- |
| next | 16.4.6 | 16.4.6 | 16.4.6 |
| react / react-dom | 19.3.0 | 19.3.0 | 19.3.0 |
| typescript | 5.9.3 | 5.9.3 | 5.9.3 |
| @types/node | 20.19.43 | 20.19.43 | 20.19.43 |
| @types/react / @types/react-dom | 19.3.0 | 19.3.0 | 19.3.0 |
| jest | – | **30.5.2** | – |
| jest-environment-jsdom | – | 30.5.2 (bevat jsdom **26.1.0**) | – |
| ts-node | – | 10.9.2 | – |
| @types/jest | – | 30.0.0 | – |
| vitest | – | – | **5.1.0** (bevat vite 8.3.8) |
| @vitejs/plugin-react | – | – | 6.3.0 |
| jsdom | – | – | **31.0.1** |
| vite-tsconfig-paths | – | – | 6.1.1 |
| @testing-library/react | – | 16.3.3 | 16.3.3 |
| @testing-library/dom | – | 10.4.2 | 10.4.2 |
| @testing-library/jest-dom | – | 7.0.1 | 7.0.1 (afwijking V2) |
| @testing-library/user-event | – | 14.6.10 (afwijking J6) | 14.6.10 (afwijking V4) |

Alle transitieve versies staan in `*/pnpm-lock.yaml`. Gebruikte generators: `create-next-app@16.4.6`,
`create-jest@30.5.2` (dat is wat `create-jest@latest` op 2026-11-14 opleverde).

> Let op bij herhalen: de commando's hieronder pinnen de top-level versies, maar zonder lockfile kan
> pnpm nieuwere *transitieve* versies kiezen. Wil je exact dezelfde boom, kopieer dan ook de
> `pnpm-lock.yaml` van het betreffende project en draai `pnpm install --frozen-lockfile`.

---

## 2. base/ (gemeenschappelijk startpunt)

```bash
pnpm create next-app@16.4.6 base --ts --app --no-tailwind --no-src-dir --no-react-compiler \
  --no-eslint --no-biome --no-cache-components --no-rspack --import-alias "@/*" \
  --use-pnpm --disable-git --no-agents-md --no-agent-feedback --yes
```

Daarna is de standaard-app vervangen door de vacature-app (alleen fictieve data):

| Bestand | Actie |
| --- | --- |
| `app/layout.tsx` | vervangen: `next/font/google` verwijderd (dat haalt fonts op bij Google = echte externe dienst), `lang="nl"` |
| `app/page.tsx` | vervangen: synchrone Server Component met `VacancyLoader` en `ApplicationForm` |
| `app/globals.css` | vervangen door minimale stijl |
| `app/page.module.css`, `public/*.svg` | verwijderd (niet meer gebruikt) |
| `lib/types.ts`, `lib/validation.ts`, `lib/format.ts`, `lib/filter.ts`, `lib/api.ts` | nieuw |
| `components/VacancyCard.tsx`, `VacancyList.tsx`, `VacancyLoader.tsx`, `ApplicationForm.tsx` | nieuw (`'use client'`) |
| `README.md` | vervangen |

create-next-app zette zelf al in `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  sharp: false
  unrs-resolver: false
```

---

## 3. Een project maken vanuit base/

```bash
rsync -a --exclude node_modules --exclude .next base/ jest-app/     # of vitest-app/
cd jest-app
pnpm install --frozen-lockfile
```

`package.json` houdt de naam `"base"` (bewust een letterlijke kopie; de naam heeft geen functie).

---

## 4. Jest – stappen in volgorde

### Deel A – volgens de Next.js-gids

**J-1. Packages installeren** (gids: "install `jest` and the following packages as dev dependencies")

```bash
pnpm add -D jest@30.5.2 jest-environment-jsdom@30.5.2 @testing-library/react@16.3.3 \
  @testing-library/dom@10.4.2 @testing-library/jest-dom@7.0.1 ts-node@10.9.2 @types/jest@30.0.0
```

- Geïnstalleerd: jest 30.5.2, jest-environment-jsdom 30.5.2, @testing-library/react 16.3.3,
  @testing-library/dom 10.4.2, @testing-library/jest-dom 7.0.1, ts-node 10.9.2, @types/jest 30.0.0
- Gewijzigd: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- **pnpm 12 stopt hier met `ERR_PNPM_IGNORED_BUILDS`** voor `@parcel/watcher@2.6.0` (afhankelijkheid
  van Jest 30). De packages zijn dan wel toegevoegd aan `package.json`, en pnpm zet in
  `pnpm-workspace.yaml` de regel `'@parcel/watcher': set this to true or false`.

**J-2. Build-script van @parcel/watcher niet toestaan** (pnpm-eis, niet uit de gids – afwijking J2)

Wijzig in `pnpm-workspace.yaml` die regel naar:

```yaml
allowBuilds:
  '@parcel/watcher': false
  sharp: false
  unrs-resolver: false
```

```bash
pnpm install
```

Reden voor `false`: het install-script (`scripts/build-from-source.js`) doet alleen iets als
`npm_config_build_from_source=true`; anders gebruikt het pakket de meegeleverde binary
(`@parcel/watcher-darwin-arm64`). `false` heeft dus geen functioneel effect en sluit aan bij hoe
create-next-app `sharp` en `unrs-resolver` al had ingesteld.

**J-3. Basisconfig genereren** (gids: "Generate a basic Jest configuration file")

```bash
pnpm create jest@latest
```

Interactieve vragen en de gegeven antwoorden (de gids noemt geen antwoorden – afwijking J3; gekozen
zodat ze overeenkomen met de eindconfig uit de gids):

| Vraag | Antwoord |
| --- | --- |
| Would you like to use Jest when running "test" script in "package.json"? | **yes** |
| Would you like to use Typescript for the configuration file? | **yes** |
| Choose the test environment that will be used for testing | **jsdom (browser-like)** |
| Do you want Jest to add coverage reports? | **no** |
| Which provider should be used to instrument code for coverage? | **v8** |
| Automatically clear mock calls, instances, contexts and results before every test? | **no** |

- Aangemaakt: `jest.config.ts` (lange lijst uitgecommentarieerde opties)
- Gewijzigd: `package.json` (`"test": "jest"`)

**J-4. Config omzetten naar `next/jest`** (gids: "Update your config file to use `next/jest`")

Vervang de volledige inhoud van `jest.config.ts` door het TypeScript-voorbeeld uit de gids, met de twee
optionele gids-secties toegepast (zie J-5 en J-6):

```ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)
```

**J-5. Gids-sectie "Optional: Extend Jest with custom matchers"**

- `setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']` (zie J-4)
- Aangemaakt: `jest.setup.ts`

```ts
import '@testing-library/jest-dom'
```

**J-6. Gids-sectie "Optional: Handling Absolute Imports and Module Path Aliases"**

- `moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' }` (zie J-4), afgeleid van `"paths": { "@/*": ["./*"] }`
  in `tsconfig.json` (zoals de gids het voorbeeld van `@/components/*` afleidt).
- Waarom nodig: `next/jest` herschrijft de alias wél in `import`-regels (via SWC), maar **niet** in
  de string van `jest.mock('@/lib/api')`. Zonder deze regel faalt dat met
  `Cannot find module '@/lib/api'`. Gewone imports met `@/` werkten ook zonder.

**J-7. Scripts** (gids: "Add a test script to `package.json`")

```json
"test": "jest",
"test:watch": "jest --watch"
```

### Deel B – afwijkingen voor gelijke testcode (opgedragen in de onderzoeksopzet)

**J-8. user-event** (afwijking J6)

```bash
pnpm add -D @testing-library/user-event@14.6.10
```

- Geïnstalleerd: @testing-library/user-event 14.6.10. Gewijzigd: `package.json`, `pnpm-lock.yaml`.

### Deel C – benchmark-harnas

**J-9. Testmappen kopiëren**: `tests/`, `tests-fail/`, `tests-empty/` (zie §6).

**J-10. Scripts** in `package.json` (afwijking J7, zie §7):

```json
"test": "jest tests/",
"test:watch": "jest --watch",
"test:fail": "jest tests-fail/",
"test:empty": "jest tests-empty/",
"test:bench": "jest tests-bench/",
"test:clear-cache": "jest --clearCache"
```

---

## 5. Vitest – stappen in volgorde

### Deel A – volgens de Next.js-gids

**V-1. Packages installeren** (gids: "# Using TypeScript")

```bash
pnpm add -D vitest@5.1.0 @vitejs/plugin-react@6.3.0 jsdom@31.0.1 @testing-library/react@16.3.3 \
  @testing-library/dom@10.4.2 vite-tsconfig-paths@6.1.1
```

- Geïnstalleerd: vitest 5.1.0 (+ vite 8.3.8), @vitejs/plugin-react 6.3.0, jsdom 31.0.1,
  @testing-library/react 16.3.3, @testing-library/dom 10.4.2, vite-tsconfig-paths 6.1.1
- Gewijzigd: `package.json`, `pnpm-lock.yaml`. `pnpm-workspace.yaml` blijft ongewijzigd (geen
  build-scripts die goedkeuring vragen).
- pnpm meldt `Issues with peer dependencies found`: vitest 5.1.0 wil `@types/node` `^22.0.0 || >=24.0.0`,
  create-next-app levert `^20` (20.19.43). Alleen typen; niet aangepast (zou base of één project laten
  afwijken). Zie §8.

**V-2. Config** (gids: "Create a `vitest.config.mts|js` file")

Aangemaakt: `vitest.config.mts`. De gidsinhoud plus één regel `setupFiles` (afwijking V2/V3, zie deel B):

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

**V-3. Script** (gids: "add a `test` script to your `package.json`")

```json
"test": "vitest"
```

### Deel B – afwijkingen voor gelijke testcode

**V-4. jest-dom en user-event** (afwijkingen V2 en V4)

```bash
pnpm add -D @testing-library/jest-dom@7.0.1 @testing-library/user-event@14.6.10
```

- Geïnstalleerd: @testing-library/jest-dom 7.0.1, @testing-library/user-event 14.6.10.
- Gewijzigd: `package.json`, `pnpm-lock.yaml`.

**V-5. Setupfile** (afwijkingen V2 en V3)

Aangemaakt: `vitest.setup.ts`; in `vitest.config.mts` de regel `setupFiles: ['./vitest.setup.ts']` (zie V-2).

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Afwijking van de Next.js-gids (zie SETUP.md):
// React Testing Library ruimt alleen automatisch op als er een globale afterEach is.
// Jest heeft die; Vitest zonder `globals: true` niet.
afterEach(() => {
  cleanup()
})
```

`@testing-library/jest-dom/vitest` is het officiële Vitest-entrypoint van jest-dom 7 (exports: `.`,
`./vitest`, `./jest-globals`, `./matchers`).

### Deel C – benchmark-harnas

**V-6. Testmappen**: `tests/`, `tests-fail/`, `tests-empty/` (zie §6).

**V-7. Scripts** in `package.json` (afwijking V5, zie §7):

```json
"test": "vitest tests/",
"test:watch": "vitest watch",
"test:fail": "vitest tests-fail/",
"test:empty": "vitest tests-empty/",
"test:bench": "vitest tests-bench/",
"test:clear-cache": "vitest --clearCache"
```

---

## 6. Tests

| Map | Inhoud | Draait in |
| --- | --- | --- |
| `tests/unit/` | 4 bestanden, 33 unittests op `lib/` | `test`, `test:bench` (als kopie) |
| `tests/components/` | 5 bestanden, 32 componenttests | idem |
| `tests/fixtures.ts` | fictieve testdata (geen testbestand) | – |
| `tests-fail/` | 2 opzettelijk falende tests (C4) | alleen `test:fail` |
| `tests-empty/` | alleen een README, geen tests (C7) | alleen `test:empty` |
| `tests-bench/` | tijdelijk, gemaakt door `scripts/scale-tests.mjs` | alleen `test:bench` |

Totaal normale run: **65 tests in 9 bestanden**, in beide projecten.

De Vitest-tests zijn mechanisch afgeleid van de Jest-tests: `jest.` → `vi.` en één regel
`import { … } from 'vitest'` bovenaan. `node scripts/diff-tests.mjs` controleert dat dat de enige
verschillen zijn en schrijft de ruwe diff naar `results/tests.diff`.

Externe data: `lib/api.ts` wordt in beide projecten op dezelfde manier geautomockt
(`jest.mock('@/lib/api')` / `vi.mock('@/lib/api')`, zonder factory), met `jest.resetAllMocks()` /
`vi.resetAllMocks()` in `beforeEach`. Er gaan geen netwerkverzoeken uit; de URL
(`https://api.vacaturebank.example/v1`) gebruikt het gereserveerde `.example`-domein.

---

## 7. Overzicht van alle afwijkingen van de Next.js-gidsen

| # | Library | Afwijking | Reden |
| --- | --- | --- | --- |
| J1 / V1 | beide | Versies expliciet gepind in `pnpm add` | Herhaalbaarheid; de gidsen installeren "latest". |
| J2 | Jest | `'@parcel/watcher': false` in `pnpm-workspace.yaml` | pnpm 12 weigert anders de install (`ERR_PNPM_IGNORED_BUILDS`). Geen functioneel effect (zie J-2). Geen gids-eis, maar een pnpm-eis. |
| J3 | Jest | Antwoorden op `create-jest` vastgelegd | De gids noemt ze niet; gekozen in lijn met de eindconfig. De inhoud wordt in J-4 toch vervangen. |
| J4 | Jest | Optionele gids-secties "custom matchers" en "module path aliases" toegepast | Valt binnen de gids. Matchers: voor jest-dom. Alias: nodig voor `jest.mock('@/lib/api')`. |
| J6 / V4 | beide | `@testing-library/user-event@14.6.10` toegevoegd | Opgedragen in de onderzoeksopzet (interacties). |
| V2 | Vitest | `@testing-library/jest-dom@7.0.1` + `import '@testing-library/jest-dom/vitest'` in `vitest.setup.ts` + `setupFiles` | De Jest-gids installeert jest-dom, de Vitest-gids niet. Nodig voor gelijke matchers (`toBeInTheDocument`, `toHaveAccessibleDescription`, …). Zelfde versie als bij Jest. |
| V3 | Vitest | `afterEach(() => cleanup())` in `vitest.setup.ts` | Zonder `globals: true` ruimt React Testing Library de DOM niet automatisch op tussen tests; Jest doet dat wel. Aangetoond met identieke testcode (Jest groen, Vitest rood: `expected [ Array(2) ] to have a length of 1`). Keuze A van drie opties, gekozen door de onderzoeker. |
| J7 / V5 | beide | `test` krijgt een padfilter (`tests/`); extra scripts `test:fail`, `test:empty`, `test:bench`, `test:clear-cache`; Vitest krijgt `test:watch: "vitest watch"` | Zodat `tests-fail/` en `tests-bench/` niet in de normale run zitten, zonder configwijziging. Het filter werkt in beide gelijk (substring van het pad). `test:watch` heeft bewust **geen** filter: bij Jest schakelt een padfilter "alleen gerelateerde tests" uit (dan draaien alle 65 tests opnieuw i.p.v. de 21 gerelateerde). |
| J8 / V6 | beide | Testmap `tests/` in plaats van `__tests__/` | Jest's standaard `testMatch` behandelt *elk* `.ts`-bestand in `__tests__/` als test (ook `fixtures.ts`). Met `tests/` + `*.test.ts(x)` matchen beide runners dezelfde bestanden zonder configwijziging. |
| – | beide | Geen voorbeeldtest `__tests__/page.test.tsx` uit de gidsen | De onderzoeksopzet vraagt eigen tests; Server Components (zoals `app/page.tsx`) worden niet getest. |

Niet gedaan (bewust): geen `pool`, `isolate`, `maxWorkers`, `--runInBand`, cache-opties,
`passWithNoTests`, `globals`, `clearMocks`, `restoreMocks` of andere tuning.

---

## 8. Waarnemingen die geen afwijking zijn, maar wel relevant voor de analyse

1. **Verschillende jsdom-versies.** `jest-environment-jsdom` 30.5.2 brengt **jsdom 26.1.0** mee; de
   Vitest-gids laat `jsdom` los installeren, wat **31.0.1** opleverde. Dit volgt direct uit de gidsen.
2. **Vite 8 meldt dat `vite-tsconfig-paths` overbodig is** ("Vite now supports tsconfig paths resolution
   natively via the `resolve.tsconfigPaths` option"). De Next.js-gids schrijft de plugin voor; die is
   gevolgd. De melding staat in elke Vitest-uitvoer (ook in `results/c4-vitest.txt`).
3. **Peer-waarschuwing `@types/node`** in vitest-app (zie V-1). Geen runtime-effect.
4. **Jest's `--watch` vereist git/hg.** Zonder repository: `--watch is not supported without git/hg,
   please use --watchAll`. De Jest-docs: `--watch` draait standaard `jest -o`, en `--onlyChanged`
   "only works if you're running tests in a git/hg repository". Vitest heeft dit niet nodig. Zie het
   watch-protocol in `BENCHMARK.md`.
5. **Vitest's watch mode draait ook eerder gefaalde bestanden opnieuw**, naast de gerelateerde.
   Daarom parkeert het watch-protocol `tests-fail/` tijdelijk.
6. **Cachelocaties.** Jest: `cacheDirectory` in de tijdelijke systeemmap (hier
   `/private/var/folders/…/T/jest_dx`, gedeeld door alle Jest-projecten). Vitest 5: results cache in
   `node_modules/.vite/vitest/…/results.json` en de `fsModuleCache` in `node_modules/.vitest-cache`.
7. **Vitest zonder `CI=true` start in watch mode** (`"test": "vitest"`), Jest niet. Daarom draaien alle
   metingen met `CI=true`.
8. **pnpm 12 kent `pnpm -s` niet meer**; de meetscripts roepen de runner daarom rechtstreeks aan (zie
   `BENCHMARK.md`).
9. **Waarom Vitest bij meer testbestanden trager wordt dan Jest (C6).** In de eerste C6-run was
   Vitest op 1× sneller (2,7 s tegen 3,3 s), maar op 10× en 20× ongeveer 2× zo traag (12,2 s tegen
   6,0 s en 20,2 s tegen 8,6 s). Onderzocht op 2026-11-16, op schaal 10× (90 bestanden, 650 tests),
   zonder iets aan de benchmark te veranderen:

   | Wat | Jest | Vitest |
   | --- | --- | --- |
   | Standaard `maxWorkers` (single run, 10 cores) | 9 (`jest --showConfig`) | 9 (`availableParallelism() - 1`, broncode) |
   | Gestarte Node-processen | 1 hoofdproces + **9 workers** | 1 hoofdproces + **90 workers**, één per testbestand |
   | CPU-tijd (user + sys, `/usr/bin/time -p`) | 38 s | 87 s (2,3×) |
   | Extra wandkloktijd per extra testbestand (uit C6, 1× → 20×) | ~33 ms | ~118 ms |

   **Verklaring: het standaard isolatiemodel.** Beide runners isoleren elk testbestand standaard,
   maar op een andere manier:
   - **Jest** houdt zijn 9 worker-processen draaiend. Per testbestand maakt het een nieuwe vm-context
     met een vers moduleregister en een nieuw jsdom-venster. De jsdom-library zelf wordt per worker
     één keer geladen.
   - **Vitest 5** gebruikt standaard `pool: 'forks'` met `isolate: true` (broncode
     `resolved.pool ??= "forks"` en `configDefaults.isolate: true`). Elk testbestand krijgt dan een
     vers Node-proces, dat Node, de Vitest-runtime, jsdom, React en Testing Library opnieuw moet
     laden. Alleen al `require('jsdom')` kost in een vers proces ~190–330 ms (zelf gemeten). Vitest
     rapporteert zelf `environment 51%` van de duur.

   Dit verklaart ook waarom Vitest op 1× wél sneller is: met 9 bestanden en 9 workers krijgt elk
   bestand bij beide runners al een eigen proces, dus het hergebruik bij Jest levert nog niets op. Wat
   overblijft is de opstart van de runner, en daarin is Vitest sneller. Het verschil schaalt daarom
   met het **aantal testbestanden**, niet met het aantal tests: een suite met weinig grote bestanden
   zou een ander beeld geven.

   **Gecontroleerde alternatieve verklaringen** (in een tijdelijke kopie, 3 runs per variant, 10×):
   - *jsdom 31 tegen 26* (waarneming 1): Vitest met jsdom 26.1.0 was 3–7% sneller (11,6–12,4 s tegen
     12,5–12,9 s). Het telt mee, maar verklaart het verschil niet.
   - *Isolatie als oorzaak*, alleen als diagnose: met `--no-isolate` (processen worden hergebruikt)
     daalde Vitest naar ~6,5 s, ongeveer gelijk aan Jest. Daarbij faalden wel 19–29 van de 650 tests,
     omdat mocks en module-state tussen bestanden doorlekten. Dit is geen gelijkwaardige configuratie
     en valt onder de tuning die de onderzoeksopzet uitsluit. Het is niet in de benchmark opgenomen.

   Opnieuw na te gaan: `node scripts/scale-tests.mjs 10`, dan in elk project
   `CI=true /usr/bin/time -p ./node_modules/.bin/<jest|vitest> tests-bench/`, en daarna
   `node scripts/scale-tests.mjs clean`.
