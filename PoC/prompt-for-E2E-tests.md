# Opdracht: E2E-tests voor de sollicitatieflow met Playwright (PoC testing)

## Context

Ik doe een onderzoek naar testing libraries voor de Next.js-projecten van Framna. In een proof of concept in het Maandag-project zet ik de handmatige regressietest van QA voor de sollicitatieflow (**"Apply - Direct apply"**) om naar geautomatiseerde tests. De unit- en componenttests staan al. **Jij schrijft nu de twee E2E-tests met Playwright.**

## Waar

- **Map:** `/Users/niek.goedemans/Desktop/Projects/DPF-GIT-G-Web-MaandagPublic/.claude/worktrees/poc-testing`
- **Branch:** `research/poc-testing`. Werk alleen in deze map. Lees `AGENTS.md`.
- **Playwright 1.64** staat al in het project:
  - `playwright.config.ts`
  - `e2e/smoke.spec.ts` (2 smoketests)
  - de stap `pnpm test:e2e` in `pipeline/ci.yaml`
- In de CI draait Playwright met **1 worker** en **1 retry**.
- `.env.local` staat in de map. **Toon of kopieer geen waarden daaruit, en commit dat bestand nooit.**
- De app praat met de API van de testomgeving (`tst-api.maandag.com`). Vacatures lezen daaruit is prima. **Er mag nooit iets naar geschreven worden.**

## Hoe je de app draait

- Test tegen de productiebuild: `pnpm build` en daarna `pnpm start`.
- Poort 3000 kan op mijn machine bezet zijn door een andere dev-server. Je mag `playwright.config.ts` zo aanpassen dat `baseURL` (en de `url` van `webServer`) uit een omgevingsvariabele `E2E_BASE_URL` komt, met `http://localhost:3000` als standaard. Draai de app dan op een vrije poort. **Verander verder niets aan de bestaande config.**
- Installeer zo nodig de browser met `pnpm exec playwright install chromium`.

## Het vangnet (harde eis, vóór je iets anders doet)

> ⚠️ Zet in een `beforeEach` een vangnet op de **browsercontext** (`context.route`), niet op `page`. De knop "Nu solliciteren" opent het formulier in een nieuw tabblad, en een route op `page` geldt daar niet.

### Blokkeren

- Elk verzoek dat de app verlaat en **geen GET** is, wordt geblokkeerd of nagebootst.
- De enige uitzondering is het maken van de reCAPTCHA-token: `POST` naar `https://www.google.com/recaptcha/…`
- Blokkeer analytics, VWO en Sentry, zodat tests geen nepbezoeken of meldingen veroorzaken:
  - `googletagmanager`
  - `google-analytics`
  - `visualwebsiteoptimizer`
  - `sentry.io`

### Nabootsen

Het formulier slaat na elke stap tussentijds op. Bootst deze verzoeken na met antwoorden die de app accepteert, zodat de test het echte productiepad volgt:

| Verzoek | Doel | Bestand |
| --- | --- | --- |
| `POST /public/applications` | aanmaken | `src/requests/vacancies/create-partial-application.ts` |
| `POST /public/applications/{id}` | bijwerken | `src/requests/vacancies/update-partial-application.ts` |
| `POST /public/applications/{id}/direct-apply` | versturen | `src/requests/vacancies/partialApply.ts` |
| `POST /public/vacancies/direct-apply/{id}` | terugvalroute (ook afvangen) | `src/requests/vacancies/apply.ts` |

### Controleren

- Houd per test bij welke verzoeken zijn **nagebootst** en welke **geblokkeerd**, en controleer aan het eind dat er niets anders naar buiten is gegaan.
- Controleer met **één eerste run** dat het vangnet werkt, voordat je de echte tests schrijft.

## Wat ik al weet van een eerdere poging

- **Cookiemelding:** er verschijnt een cookiemelding. Klik **"Weigeren"**.
- **Nieuw tabblad:** "Nu solliciteren" op de vacaturepagina heeft `target="_blank"`. Vang het nieuwe tabblad op met `context.waitForEvent('page')`.
- **Privacy-checkbox:** die is visueel verborgen achter een eigen vormgeving. Playwright kan er niet op klikken (`element is not visible`). Klik op het **label**, en controleer daarna `toBeChecked()` op de checkbox.
- **Adreszoeker:** die roept een externe dienst aan. Gebruik **"Adres handmatig invoeren"**.
- **reCAPTCHA v3:** vraagt een score boven 0,5. Een headless browser haalde die lokaal, maar dat is niet zeker. Meld het als het een keer misgaat.
- **Vacature kiezen:** niet op een vast ID, maar pak de eerste uit de vacaturelijst (`/nl-nl/vacatures`). Dat maakt de test minder afhankelijk van één vacature.
- **Teksten:** dit zijn echte vertalingen uit Contentful (Nederlands, bijvoorbeeld "Voornaam*", "Volgende", "Solliciteren"). Ze zijn **geen sleutels** zoals in de componenttests.

## Eisen aan elke test (criteria C1–C6)

### C1 – Test gedrag vanuit de gebruiker
- Zoek op rol en zichtbare naam (`getByRole`, `getByLabel`, `getByText`).
- Geen `data-testid`, geen CSS-selectors als er een rol bestaat.
- Klik en typ zoals een gebruiker.

### C2 – Kan echt falen
Controleer concrete uitkomsten, zoals een kop of tekst die verschijnt en een verzoek dat met de ingevulde gegevens wordt verstuurd.

Doe per test een controle: maak de test tijdelijk kapot, bijvoorbeeld door het nagebootste verzendantwoord een fout (`500`) te laten geven, of een verplicht veld leeg te laten. Kijk dat de test faalt, en zet het daarna terug. Meld wat je hebt geprobeerd.

### C3 – Leesbaar
De naam begint met het testcase-ID van QA en is te lezen als één zin, bijvoorbeeld:

```ts
test('86938 - toont een bevestiging na het doorlopen en versturen van de sollicitatie', …)
```

Gebruik `test.step` voor de stappen van de flow, zodat het rapport laat zien bij welke stap het misging.

### C4 – Duidelijk bij falen
Gebruik web-first controles (`toBeVisible`, `toHaveURL`, `toBeChecked`) met een duidelijke locator, zodat de fout laat zien wat er verwacht werd.

### C5 – Betrouwbaar
Geen vaste waits (`waitForTimeout`). Laat de test elke keer slagen. Draai beide tests 5 keer met `--repeat-each=5` en meld het resultaat.

### C6 – Snel
Houd de flow kort. Geen onnodige stappen of extra pagina's.

## De testcases

Hieronder de originele stappen van QA, letterlijk, in het Engels zoals ze in Azure DevOps staan.

- Zet boven elke test een korte commentaarregel met de stapnummers die de test dekt.
- Wijkt de app af van een stap, maak de test dan **niet "groen" door de stap anders te interpreteren**. Test wat de app doet en meld het verschil in je verslag.

### 86932 – Form Is Visible When Clicking "Solliciteer"

**Stappen van QA:**

> 1. Given the user is on a vacancy detail page
> 2. When the user clicks the "Solliciteer" button
> 3. Then the page should scroll to the application form
> 4. And the first input field should be focused

**Wat je test:**

- Let op: in de app opent de knop **"Nu solliciteren"** het formulier in een **nieuw tabblad**, in plaats van te scrollen.
- Controleer dat het formulier zichtbaar is met het eerste veld (**Voornaam**).
- Kijk of dat veld focus heeft. Zo niet, leg dat dan vast als verschil met QA en laat het niet als eis in de test staan.

### 86938 – Success State

**Stappen van QA:**

> 1. Given the user submits a valid application
> 2. Then the form should disappear or reset
> 3. And a confirmation message should be shown
> 4. And a thank-you email should be sent

**Wat je test:**

Doorloop alle stappen met geldige, verzonnen gegevens:

1. persoonlijke gegevens;
2. contactgegevens en adres;
3. documenten (optioneel in `nl-nl`);
4. de eindcontrole.

Controleer daarna:

- dat bij de eindcontrole de ingevulde gegevens erin staan;
- na versturen: de bevestiging (de kop met de voornaam) en de nieuwe URL;
- dat het nagebootste verzendverzoek de ingevulde gegevens bevatte.

Stap 4, de e-mail, kan een frontendtest niet controleren. Noteer dat als **"niet in deze laag"** (backend of API-test).

> Gebruik verzonnen gegevens, zoals een naam en een e-mailadres op `example.com`. **Geen echte persoonsgegevens.**

## Plaats

- **Tests:** `e2e/apply-flow.spec.ts`.
- **Hulpfuncties** (vangnet, vacature openen, formulier openen): in dat bestand, of in `e2e/helpers/` als het meer dan één bestand wordt.

## Regels

- Verander geen app-code.
- Verander geen bestaande tests (`e2e/smoke.spec.ts`).
- Commit en push niets.
- Als iets alleen kan door app-code te veranderen, of door meer aan de Playwright-config te veranderen dan `E2E_BASE_URL`: **stop dan en vraag het mij eerst.**

## Klaar als

- [ ] de twee nieuwe tests en de bestaande smoketests slagen
- [ ] `--repeat-each=5` op de nieuwe tests 10 van de 10 keer slaagt
- [ ] `pnpm type-check` slaagt
- [ ] `pnpm exec eslint` en `pnpm exec prettier --check` op de nieuwe en gewijzigde bestanden niets melden
- [ ] `git diff` op `src/` leeg is

## Lever op

1. **Per test:** de naam (met ID), welke stappen van QA hij wel en niet dekt, en waar de app afwijkt van de stappen van QA.
2. **Bewijs van het vangnet:** per test de lijst van nagebootste en geblokkeerde verzoeken, en welk verzendpad is gevolgd (tussentijds opslaan of de terugvalroute).
3. **C2-controle per test:** wat je hebt geprobeerd, en dat de test toen faalde.
4. **Herhaalrun:** de uitkomst van `--repeat-each=5`, en of reCAPTCHA ooit faalde.
5. **Uitvoertijd:** de mediaan van 5 runs van alleen de nieuwe tests, lokaal, met:
   - de wandkloktijd van het hele commando;
   - de tijd die Playwright meldt.
6. **Problemen:** alles wat je tegenkwam en hoe je het oploste, met de letterlijke foutmelding, en of het in de [Next.js-gids voor Playwright](https://nextjs.org/docs/app/guides/testing/playwright) staat.