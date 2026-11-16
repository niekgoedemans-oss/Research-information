# BENCHMARK – hoe je elke meting draait

Alle commando's vanuit `benchmark/`. De scripts gebruiken alleen Node-ingebouwde modules; er is geen
`package.json` op dit niveau.

## Voor elke meetsessie

1. Netstroom aan, andere zware apps dicht, Spotlight-indexering/Time Machine niet actief.
2. `node scripts/system-info.mjs` → `results/system.txt`.
3. `node scripts/check-identical.mjs` → moet eindigen met `IDENTIEK` (exitcode 0).
4. `node scripts/diff-tests.mjs` → moet eindigen met `Alleen toegestane verschillen` (exitcode 0).

## Hoe een run wordt uitgevoerd

`scripts/lib.mjs` → `runScript()` voert het **package.json-script** van het project uit zoals pnpm dat
zou doen: via de shell, met `node_modules/.bin` vooraan in `PATH` en altijd met `CI=true`. Het
startcommando van pnpm zelf wordt dus níet meegemeten (dat is voor beide gelijk, maar voegt ruis
toe). stdout/stderr gaan naar `/dev/null` (beide zonder TTY, dus gelijke uitvoermodus).

Gemeten wordt de **wandkloktijd van het hele runner-commando**, van start tot het proces klaar is
(`performance.now()` rond `spawnSync`).

---

## C6a – uitvoertijd

```bash
node scripts/measure-c6.mjs                 # standaard: --scales 1,10,20 --runs 5
```

Per schaal (1×, 10×, 20×):

1. `scripts/scale-tests.mjs` vult `tests-bench/` in **beide** projecten met N kopieën van `tests/`
   (`copy-01/ … copy-NN/`). Er staat altijd maar één schaal tegelijk, zodat geen run bestanden van
   een andere schaal hoeft te doorzoeken.
2. **Aantal tests**: een aparte run van `test:bench` met de JSON-reporter (Jest: `--json --outputFile`,
   Vitest: `--reporter=json --outputFile`), niet gemeten. Het script stopt als het aantal tussen de
   libraries verschilt of als de run niet groen is.
3. **Koude run**: `test:clear-cache`, daarna 1 gemeten run van `test:bench` → `type=koud`.
4. **Opwarmrun**: 1 run per library, niet meegeteld.
5. **5 warme runs**: afwisselend Jest en Vitest als eerste (run 1: jest→vitest, run 2: vitest→jest, …).
6. Na afloop wordt `tests-bench/` verwijderd (ook bij een fout).

Cache legen – volgens de officiële docs:

| Runner | Commando | Bron |
| --- | --- | --- |
| Jest 30.5 | `jest --clearCache` – "Deletes the Jest cache directory and then exits without running tests." Locatie: `jest --showConfig` → `cacheDirectory`. | https://jestjs.io/docs/cli#--clearcache |
| Vitest 5.1.0 | `vitest --clearCache` – "Delete all Vitest caches, including the `fsModuleCache`, without running any tests." (results cache + `node_modules/.vitest-cache`) | https://vitest.dev/guide/cli#clearcache |

"Koud" betekent dus: koude *runner-cache*. De bestandscache van het besturingssysteem wordt niet
geleegd (dat vereist `sudo purge` en valt buiten de runners); noteer dat bij de interpretatie.

Uitvoer:

- `results/c6.csv` – kolommen `library,schaal,type,run,tijd_ms,aantal_tests,ms_per_test,exitcode`
- `results/c6-summary.csv` en `results/c6-summary.md` – per library en schaal de **mediaan** van de
  warme runs (plus min, max, ms per test en de koude run)

Losse schaal draaien: `node scripts/measure-c6.mjs --scales 10`.
Handmatig een schaal klaarzetten: `node scripts/scale-tests.mjs 10`, opruimen met `… clean`.

**Bij de interpretatie:** de schaal vermenigvuldigt zowel het aantal tests als het aantal
testbestanden (9 → 90 → 180). Vitest start standaard één Node-proces per testbestand, Jest
hergebruikt zijn workers. Daardoor groeit de tijd van Vitest sneller met het aantal *bestanden*. Zie
`SETUP.md` §8, waarneming 9, voor de metingen en de gecontroleerde alternatieve verklaringen.

---

## C4 – foutmelding

```bash
node scripts/run-c4.mjs
```

Draait `test:fail` (`jest tests-fail/` / `vitest tests-fail/`) met `CI=true` en de standaardreporter.
De volledige uitvoer (stdout + stderr, in volgorde) staat in `results/c4-jest.txt` en
`results/c4-vitest.txt`. De bestanden bevatten enkele ANSI-kleurcodes (in de codefragmenten); gebruik
`cat` in een terminal om ze netjes te zien.

De 2 tests in `tests-fail/`:

- `format.test.ts` – `formatSalary(3500)` geeft `€ 3.500`, de test verwacht `€ 3.000`.
- `button.test.tsx` – de knop heet `Verstuur sollicitatie`, de test verwacht `Verzenden`.

Let bij het vergelijken op: de regelnummers in de Vitest-uitvoer liggen 1 hoger door de extra regel
`import { … } from 'vitest'`.

---

## C7 – gedrag in CI

```bash
node scripts/run-c7.mjs
```

Per library, met `CI=true` en zonder iets aan de standaard te veranderen (geen `passWithNoTests`):

| Situatie | Script | Commando |
| --- | --- | --- |
| 1. alle tests groen | `test` | `jest tests/` / `vitest tests/` |
| 2. de falende tests uit C4 | `test:fail` | `jest tests-fail/` / `vitest tests-fail/` |
| 3. map zonder testbestanden | `test:empty` | `jest tests-empty/` / `vitest tests-empty/` |

Uitvoer: `results/c7.csv` (`library,situatie,commando,exitcode`) en de volledige uitvoer per situatie in
`results/c7-logs/`.

---

## C6d – watch mode (handmatig protocol)

Doel: meten hoe lang het duurt van het opslaan van één vooraf bepaalde wijziging tot het resultaat
er staat, en welke tests opnieuw draaien.

**De vaste wijziging** (via `scripts/watch-mode.mjs`, zodat hij elke keer byte-gelijk is):
in `lib/filter.ts` wordt

```ts
const query = filter.query.trim().toLowerCase();
```

vervangen door

```ts
const query = filter.query.toLowerCase().trim();
```

Gedrag blijft gelijk (alle tests blijven groen), maar het is een echte codewijziging. `lib/filter.ts`
is gekozen omdat geen van de opzettelijk falende C4-tests ervan afhangt.

**Verwacht resultaat** (vooraf door mij gecontroleerd): beide runners draaien dezelfde 3 bestanden opnieuw,
21 tests: `tests/unit/filter.test.ts`, `tests/components/VacancyList.test.tsx`,
`tests/components/VacancyLoader.test.tsx`.

### Voorbereiding (eenmalig per sessie)

1. Parkeer de falende tests en verwijder eventuele schaalkopieën:
   ```bash
   node scripts/watch-mode.mjs park
   ```
   Reden: Vitest draait in watch mode ook bestanden opnieuw die eerder faalden; dan zouden de
   C4-tests meedraaien.
2. Jest `--watch` werkt alleen in een git/hg-repository (zonder: `--watch is not supported without
   git/hg, please use --watchAll`). Maak in **beide** projecten een repo met schone werkboom (Vitest
   gebruikt git niet, maar zo zijn de omstandigheden gelijk). De `.gitignore` van create-next-app
   sluit `node_modules/` en `.next/` al uit.
   ```bash
   cd jest-app && git init && git add -A && git commit -m "watch-baseline" && cd ..
   ```
   ```bash
   cd vitest-app && git init && git add -A && git commit -m "watch-baseline" && cd ..
   ```
   Controleer met `git status` dat beide schoon zijn. (Doe dit ná `park`, zodat `tests-fail/` niet in
   de commit zit.)
3. Zet een schermopname klaar (QuickTime → Nieuwe schermopname, 60 fps) of een stopwatch.

### Per meting (herhaal 5× per library; wissel de volgorde jest/vitest af)

1. Terminal A – start watch mode **zonder** `CI`:
   ```bash
   cd jest-app && pnpm test:watch        # = jest --watch
   ```
   of
   ```bash
   cd vitest-app && pnpm test:watch      # = vitest watch
   ```
   Wacht tot de startsituatie staat. Jest: `No tests found related to files changed since last commit.`
   + het menu. Vitest: alle 65 tests gedraaid + `Waiting for file changes...`.
2. Wacht 10 seconden zonder iets te doen.
3. Start de opname/stopwatch. Terminal B:
   ```bash
   node scripts/watch-mode.mjs apply jest     # of: apply vitest
   ```
   Het script drukt het exacte tijdstip van opslaan af (ISO + epoch ms).
4. Stop de meting zodra in terminal A de samenvatting staat (Jest: `Tests: … total` / `Ran all test
   suites related to changed files.`; Vitest: `Tests … passed` + `Waiting for file changes...`).
5. Noteer:
   - **latentie**: tijd van opslaan (stap 3) tot samenvatting zichtbaar (stap 4);
   - de **door de runner gerapporteerde duur** (Jest: `Time:`, Vitest: `Duration`) – dat is alleen
     de testrun, zonder de detectietijd;
   - **welke testbestanden** opnieuw draaiden en **hoeveel tests**.
6. Terminal B: `node scripts/watch-mode.mjs revert jest` (of `vitest`).
   **Meet deze terugzetting niet**: Jest vergelijkt met de laatste commit en ziet na het terugzetten
   geen gewijzigde bestanden meer, Vitest draait wel opnieuw. De situaties zijn dan niet gelijk.
7. Stop watch mode (`q` bij Jest, `q` of Ctrl+C bij Vitest).

### Afronden

```bash
node scripts/watch-mode.mjs restore
```
```bash
node scripts/check-identical.mjs
```

De git-repo's in `jest-app/` en `vitest-app/` mag je laten staan of verwijderen (`rm -rf jest-app/.git
vitest-app/.git`); ze hebben geen invloed op de andere metingen.
