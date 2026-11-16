# Prompt: mini Next.js-project voor benchmark Jest vs Vitest

Bouw een klein Next.js-project waarmee ik **Jest** en **Vitest** eerlijk kan vergelijken voor unit- en componenttests. Het is voor een onderzoek, dus eerlijkheid en herhaalbaarheid gaan boven mooie code. Werk de punten hieronder precies uit. Als iets niet kan zoals beschreven, of als de officiële documentatie iets anders zegt, stop dan en meld het, in plaats van zelf een oplossing te verzinnen.

## 1. Versies en omgeving (verplicht)

- Next.js **16.4.6**, App Router, TypeScript.
- Jest **30.5.2**, Vitest **5.1.0**.
- Node.js **22.12 of hoger** (eis van Vitest 5), dezelfde versie voor beide projecten.
- Package manager **pnpm**, voor beide projecten hetzelfde.
- Leg alle versies vast (lockfile + een lijst in `SETUP.md`), inclusief OS, CPU, RAM, Node- en pnpm-versie van de machine.

## 2. Mapstructuur (verplicht)

```
benchmark/
  base/          Next.js-app zonder enige testtooling
  jest-app/      kopie van base + Jest volgens de Next.js-gids
  vitest-app/    kopie van base + Vitest volgens de Next.js-gids
  scripts/       meet- en schaalscripts
  results/       uitvoer van de metingen
  SETUP.md       exacte installatiestappen per library
  BENCHMARK.md   hoe je elke meting draait
```

- De app-code (`app/`, `components/`, `lib/`) moet in alle drie de mappen **byte-identiek** zijn. Voeg een script toe dat dit controleert (bijv. een diff of hash van die mappen).

## 3. Opzet van de libraries (verplicht)

- Richt Jest in volgens https://nextjs.org/docs/app/guides/testing/jest en Vitest volgens https://nextjs.org/docs/app/guides/testing/vitest.
- Gebruik de **handmatige stappen** uit de gids, niet de kant-en-klare voorbeeldtemplates (`with-jest` / `with-vitest`).
- Gebruik de **standaardinstellingen** uit de gids. Geen prestatie-tuning: niet aan `pool`, `isolate`, `maxWorkers`, `--runInBand`, cache-instellingen of iets vergelijkbaars zitten. Zet ook **geen** `passWithNoTests` aan.
- Installeert de ene gids iets wat nodig is voor gelijke testcode en de andere niet (bijv. `@testing-library/jest-dom`), voeg het dan aan **beide** toe met dezelfde versie en noteer het als afwijking van de gids in `SETUP.md`.
- Voeg in beide `@testing-library/user-event` toe (dezelfde versie) voor interacties, en noteer dat ook als afwijking.
- Schrijf in `SETUP.md` per library elke stap op: commando, geïnstalleerde packages met versie, aangemaakte of gewijzigde bestanden.

## 4. De app (fictieve data, verplicht)

Een mini-vacaturesite met een sollicitatieflow. Gebruik alleen fictieve data, geen echte bedrijfsnamen of echte API's.

- `lib/` met pure functies, bijvoorbeeld: e-mail valideren, Nederlands telefoonnummer valideren, salaris formatteren, vacatures filteren op zoekterm en locatie, verplichte velden van het formulier controleren.
- `lib/api.ts` met een functie die vacatures ophaalt en een functie die een sollicitatie verstuurt via `fetch` naar een externe (niet-bestaande) URL. Dit is de "externe data" die in tests nagebootst moet worden.
- Client components (`'use client'`), bijvoorbeeld:
  - `VacancyCard`: toont titel, locatie en salaris.
  - `VacancyList`: lijst met zoekveld dat filtert.
  - `ApplicationForm`: velden naam, e-mail, telefoon, motivatie, akkoord-checkbox; toont foutmeldingen bij ongeldige invoer; verstuurt via `lib/api.ts`; toont een succes- of foutmelding na versturen.
- Server components mogen in de app staan, maar worden **niet** getest: async Server Components worden door Jest en Vitest niet ondersteund (zie beide Next.js-gidsen).

## 5. De tests (verplicht)

- Ongeveer **30 unittests** op de functies in `lib/` en ongeveer **30 componenttests** op de client components, verdeeld over ongeveer 10 bestanden.
- De tests zijn in `jest-app` en `vitest-app` **inhoudelijk identiek**. De enige toegestane verschillen zijn imports, `jest.*` vs `vi.*` en de configuratie. Lever een overzicht (diff) waarin te zien is dat alleen die regels verschillen.
- Componenttests gebruiken React Testing Library en zoeken zoals een gebruiker: eerst `getByRole`, daarna label of tekst. Geen classnames of test-id's, tenzij het niet anders kan.
- Externe data wordt in beide nagebootst met **module mocking** van `lib/api.ts` (`jest.mock` / `vi.mock`), op dezelfde manier. Geen echte netwerkverzoeken.
- Gebruik de hoofdnamen van matchers (`toHaveBeenCalled`, `toHaveBeenCalledWith`, `toThrow`), geen aliassen zoals `toBeCalled` of `toThrowError`, zodat de tests ook op Jest 29 draaien.
- Tests zijn onafhankelijk van elkaar en van de volgorde.
- Alle tests slagen in beide projecten, en het aantal tests is in beide gelijk. Laat dat aan het eind zien.

## 6. Metingen (verplicht)

Maak per project scripts in `package.json` en een meetscript in `scripts/`. Alle runs draaien met `CI=true`, zodat geen van beide in watch mode start.

**a. Uitvoertijd (C6)**
- Een schaalscript dat de testbestanden N keer kopieert naar een aparte map (in beide projecten dezelfde kopieën), voor de schalen **1×, 10× en 20×** (± 60, 600 en 1.200 tests).
- Per schaal en per library: 1 opwarmrun (niet meegeteld) en daarna **5 gemeten runs** (warm). Daarnaast **1 koude run** na het legen van de cache van de runner. Zoek in de officiële docs op hoe je de cache van elke runner leegt en noteer dat.
- Meet de wandkloktijd van het hele commando. Haal het aantal tests uit een aparte run met de JSON-reporter, niet uit de gemeten runs.
- Schrijf alles naar `results/c6.csv` met de kolommen: library, schaal, type (koud/warm), run, tijd_ms, aantal_tests, ms_per_test, exitcode. Maak ook een samenvatting met de **mediaan** per library en schaal.

**b. Foutmelding (C4)**
- Een map met precies 2 tests die met opzet falen: 1 unittest (functie geeft een verkeerde waarde terug) en 1 componenttest (verwachte knoptekst klopt niet met de echte). In beide projecten dezelfde.
- Deze map draait **niet** mee in de normale run, alleen via een apart script (`test:fail`).
- Sla de volledige uitvoer met de standaardreporter op in `results/c4-jest.txt` en `results/c4-vitest.txt`.

**c. Gedrag in CI (C7)**
- Een script dat per library drie situaties draait en de exitcode vastlegt in `results/c7.csv`:
  1. alle tests groen,
  2. de falende tests uit 6b,
  3. een map of patroon zonder testbestanden.
- Verander niets aan de standaard (dus geen `passWithNoTests`).

## 7. Wat je NIET doet

- Geen E2E-tests, geen Playwright of Cypress.
- Geen extra packages of instellingen die maar bij één library horen, behalve wat de gids voorschrijft.
- Geen tests aanpassen zodat één library beter uitkomt.

## 8. Oplevering

- De mappenstructuur uit punt 2, werkend.
- `SETUP.md`, `BENCHMARK.md` en een korte `README.md` met de commando's per meting.
- Een overzicht van alle afwijkingen van de Next.js-gidsen, met reden.
- Bevestiging dat alle tests groen zijn en dat het aantal tests in beide projecten gelijk is.
