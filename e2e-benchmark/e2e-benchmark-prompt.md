# Prompt: E2E-benchmark Cypress vs Playwright

Bouw een benchmark waarmee ik **Cypress** en **Playwright** eerlijk kan vergelijken voor E2E-tests in een Next.js-app. Het is voor een onderzoek, dus eerlijkheid en herhaalbaarheid gaan boven mooie code. Werk de punten hieronder precies uit. Als iets niet kan zoals beschreven, of als de officiële documentatie iets anders zegt, stop dan en meld het, in plaats van zelf een oplossing te verzinnen.

Er bestaat al een benchmark voor Jest en Vitest met dezelfde opzet: https://github.com/niekgoedemans-oss/Research-information/tree/598e999/benchmark. Gebruik die als voorbeeld voor de mapindeling, de scripts en de documentatie (SETUP.md, BENCHMARK.md), en hergebruik de app uit `benchmark/base`.

## 1. Versies en omgeving (verplicht)

- Next.js **16.4.6**, App Router, TypeScript (dezelfde app als in `benchmark/base`).
- Cypress **16.3.0**, @playwright/test **1.65.1**.
- Node.js-versie die door beide wordt ondersteund (Cypress 16.3.0: `^22.0.0 || ^24.0.0 || >=26.0.0`, Playwright 1.65.1: `>=20`), dezelfde voor beide projecten.
- Package manager **pnpm**, voor beide projecten hetzelfde.
- Leg alle versies vast (lockfile + een lijst in `SETUP.md`), inclusief OS, CPU, RAM, Node- en pnpm-versie van de machine, en de exacte browserversies die Cypress en Playwright gebruiken.

## 2. Mapstructuur (verplicht)

```
e2e-benchmark/
  base/              kopie van benchmark/base zonder enige testtooling
  cypress-app/       kopie van base + Cypress volgens de Next.js-gids
  playwright-app/    kopie van base + Playwright volgens de Next.js-gids
  scripts/           meet- en schaalscripts
  results/           uitvoer van de metingen
  SETUP.md           exacte installatiestappen per library
  BENCHMARK.md       hoe je elke meting draait
```

- De app-code (`app/`, `components/`, `lib/`) moet in alle drie de mappen **byte-identiek** zijn, en ook gelijk aan `benchmark/base` uit de repo. Voeg een script toe dat dit controleert.
- Pas de app-code niet aan voor een van de libraries. Voeg dus ook geen `data-cy`, `data-testid` of andere testattributen toe.

## 3. Opzet van de libraries (verplicht)

- Richt Cypress in volgens https://nextjs.org/docs/app/guides/testing/cypress en Playwright volgens https://nextjs.org/docs/app/guides/testing/playwright.
- Gebruik de **handmatige stappen** uit de gids, niet de voorbeeldtemplates (`with-cypress` / `with-playwright`). Voor Playwright is dat `pnpm create playwright`. Noteer elke vraag van die installatie en het antwoord dat je gaf.
- Gebruik de **standaardinstellingen** die de installatie oplevert. Leg de volledige gegenereerde `playwright.config.ts` en `cypress.config.ts` vast in `SETUP.md`, vóór en na jouw wijzigingen. Geen prestatie-tuning: niet aan `workers`, `fullyParallel`, `retries`, `timeout`, `video`, `screenshotOnRunFailure`, `testIsolation` of iets vergelijkbaars zitten.
- Toegestane wijzigingen, die je allemaal als afwijking noteert in `SETUP.md`:
  - **Alleen Chromium.** Playwright draait standaard Chromium, Firefox en WebKit. Laat in `projects` alleen Chromium staan. Cypress draait met zijn standaardbrowser (Electron). Noteer welke Chromium-versie elk gebruikt.
  - **baseURL / baseUrl** op `http://localhost:3000`. Beide gidsen noemen dit als optie.
  - Geen `webServer` in de Playwright-config en geen `start-server-and-test`. De server wordt apart gestart (zie punt 6).
- Gebruik geen extra plugins of packages, zoals `@testing-library/cypress`. Wat een library zelf niet kan, is juist een uitkomst van het onderzoek. Noteer het als waarneming.
- Schrijf in `SETUP.md` per library elke stap op: commando, geïnstalleerde packages met versie, aangemaakte of gewijzigde bestanden, en het downloaden van browsers. Ik ga die stappen zelf opnieuw uitvoeren om de opzettijd te meten, dus de lijst moet compleet en in volgorde zijn.

## 4. Externe data (verplicht)

- De app haalt vacatures op en verstuurt sollicitaties via `fetch` naar een externe, niet-bestaande URL (`lib/api.ts`). In de E2E-tests wordt die externe API in beide libraries nagebootst door **netwerkverzoeken in de browser te onderscheppen**: `cy.intercept` in Cypress en `page.route` in Playwright. Gebruik voor beide dezelfde fictieve testdata uit één gedeeld JSON-bestand per project (de inhoud is in beide gelijk).
- Controleer eerst of alle verzoeken naar de externe API vanuit de browser gaan. Als een verzoek op de server gebeurt (bijvoorbeeld in een Server Component), kan geen van beide het onderscheppen. Stop dan en meld het.

## 5. De tests (verplicht)

- Ongeveer **12 E2E-tests** in **4 testbestanden** op de vacaturepagina en de sollicitatieflow, bijvoorbeeld:
  - vacatures: lijst wordt getoond, zoeken filtert de lijst, melding bij geen resultaten;
  - validatie: foutmeldingen bij leeg versturen, ongeldig e-mailadres, ongeldig telefoonnummer;
  - versturen: succesmelding, het verzoek bevat de ingevulde gegevens, foutmelding als de API een fout geeft (bijvoorbeeld status 500);
  - een volledige flow van vacature kiezen tot succesmelding.
- De tests in beide projecten doen **hetzelfde**: dezelfde testnamen, dezelfde stappen in dezelfde volgorde, dezelfde controles. Alleen de syntax van de library verschilt. Lever een tabel op met per test de naam en de stappen, zodat te zien is dat ze gelijk zijn.
- Zoek elementen zoals een gebruiker dat doet, met wat de library **zelf** biedt. In Playwright zijn dat `getByRole`, `getByLabel` en `getByText`. In Cypress zijn dat bijvoorbeeld `cy.contains` en selectors op label, tekst of ARIA-attributen. Geen classnames of test-id's. Noteer per library waar dit lastig of niet mogelijk was.
- Gebruik geen vaste wachttijden (`cy.wait(1000)`, `page.waitForTimeout`). Laat beide libraries zelf wachten zoals hun documentatie aanraadt.
- Tests zijn onafhankelijk van elkaar en van de volgorde.
- Alle tests slagen in beide projecten, ook bij 5 keer achter elkaar draaien, en het aantal tests is in beide gelijk. Laat dat aan het eind zien.

## 6. Metingen (verplicht)

**Server.** Beide gidsen raden aan te testen tegen de productiebuild. Draai per meetsessie één keer `next build` en start daarna één `next start` op poort 3000. Die server draait tijdens alle runs van beide libraries. De build en het starten van de server tellen niet mee in de tijd. Omdat de app-code identiek is, mag één build voor beide gebruikt worden. Leg uit hoe je dat hebt opgelost.

**Twee modi.** De gegenereerde Playwright-config gebruikt mogelijk andere instellingen als `CI` is gezet (bijvoorbeeld voor `workers` en `retries`). Meet daarom elke situatie in twee modi en zet die apart in de resultaten:
- **lokaal**: zonder de omgevingsvariabele `CI`;
- **ci**: met `CI=true`.

Zorg dat geen enkele run blijft hangen op een rapport dat in de browser opent (de HTML-reporter van Playwright kan dat doen). Los dat op met een omgevingsvariabele of CLI-optie uit de officiële docs, niet met een configwijziging, en noteer hoe.

**a. Uitvoertijd (C6)**
- Een schaalscript dat de testbestanden N keer kopieert naar een aparte map (in beide projecten dezelfde kopieën), voor de schalen **1×, 5× en 10×** (± 12, 60 en 120 tests, 4, 20 en 40 bestanden). De kopieën draaien niet mee in de normale run, zonder dat de config daarvoor wordt aangepast.
- Per schaal, per modus en per library: 1 opwarmrun (niet meegeteld) en daarna **5 gemeten runs**. Wissel per run af welke library als eerste gaat. Er is geen koude run.
- Meet de wandkloktijd van het hele testcommando (`cypress run` en `playwright test`). Haal het aantal tests uit een aparte run met de JSON-reporter, niet uit de gemeten runs.
- Schrijf alles naar `results/c6.csv` met de kolommen: library, modus, schaal, run, tijd_ms, aantal_tests, aantal_bestanden, ms_per_test, exitcode. Maak ook een samenvatting met de **mediaan** per library, modus en schaal.
- Noteer per library en modus hoeveel tests of bestanden er tegelijk draaiden (workers), en waar dat getal vandaan komt (config, standaardwaarde of docs).
- Schat vooraf hoe lang de volledige meting duurt en zet dat in `BENCHMARK.md`.

**b. Foutmelding (C4)**
- Een map met precies 2 tests die met opzet falen, in beide projecten dezelfde:
  1. een controle die faalt: na versturen wordt een andere succestekst verwacht dan de echte;
  2. een stap die niet kan: klikken op een knop die niet bestaat, zodat de test faalt op een timeout.
- Deze map draait niet mee in de normale run, alleen via een apart script (`test:fail`).
- Sla de volledige uitvoer met de standaardreporter op in `results/c4-cypress-<modus>.txt` en `results/c4-playwright-<modus>.txt`, voor beide modi.
- Noteer welke bestanden elke library standaard aanmaakt bij een falende test (bijvoorbeeld screenshots, video's, traces of een HTML-rapport), waar ze staan en wat erin te zien is. Kopieer ze naar `results/c4-artefacten/`.

**c. Gedrag in CI (C7)**
- Een script dat per library en per modus drie situaties draait en de exitcode vastlegt in `results/c7.csv`:
  1. alle tests groen,
  2. de falende tests uit 6b,
  3. een map of patroon zonder testbestanden.
- Verander niets aan de standaard. Sla de volledige uitvoer per situatie op in `results/c7-logs/`.
- Noteer of een falende test opnieuw wordt geprobeerd (retries), en hoe vaak.

## 7. Wat je NIET doet

- Geen unit- of componenttests, geen Jest of Vitest, en geen component testing van Cypress.
- Geen extra packages of instellingen die maar bij één library horen, behalve wat de gids voorschrijft en de afwijkingen uit punt 3.
- Geen tests aanpassen zodat één library beter uitkomt.
- Geen betaalde diensten zoals Cypress Cloud.
- De opzettijd niet zelf meten of schatten. Die meet ik zelf met `SETUP.md`.
- Geen absolute paden met de gebruikersnaam in de opgeslagen resultaten. Vervang het pad naar de projectmap door een relatief pad of `…/`.

## 8. Oplevering

- De mappenstructuur uit punt 2, werkend.
- `SETUP.md`, `BENCHMARK.md` en een korte `README.md` met de commando's per meting.
- Een overzicht van alle afwijkingen van de Next.js-gidsen en van de gegenereerde config, met reden.
- De tabel met testnamen en stappen per library (punt 5).
- Een lijst met waarnemingen: wat een library niet of lastig kon, en wat opviel tijdens het opzetten.
- Bevestiging dat alle tests groen zijn en dat het aantal tests in beide projecten gelijk is.
