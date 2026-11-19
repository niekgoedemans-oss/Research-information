# Opdracht: componenttests voor de sollicitatieflow (PoC testing)

## Context

Ik doe een onderzoek naar testing libraries voor de Next.js-projecten van Framna. In een proof of concept in het Maandag-project zet ik de handmatige regressietest van QA voor de sollicitatieflow (**"Apply - Direct apply"**) om naar geautomatiseerde tests, verdeeld over unit-, component- en E2E-tests. **Jij schrijft nu de componenttests.**

## Waar

- **Map:** `/Users/niek.goedemans/Desktop/Projects/DPF-GIT-G-Web-MaandagPublic/.claude/worktrees/poc-testing`
- **Branch:** `research/poc-testing`. Werk alleen in deze map.
- **Stack:** Next.js 16.4, React 19, Jest 29.7, React Testing Library 16, user-event 14, jest-dom.
- **`jest.config.js`** heeft twee projects:
  - `unit`: node-omgeving, voor `.js`/`.ts`.
  - `component`: jsdom, testMatch `**/*.test.tsx`, setup `jest.setup.js` + `jest.setup.components.ts`.
- De transforms voor vanilla-extract (`.css.ts`), `@mws/mds` en `uuid` zijn al ingesteld.
- `jest.setup.js` mockt `@/utils/i18n.client`: `t(key)` geeft de sleutel terug. Labels, knoppen en foutmeldingen zijn in tests dus **sleutels**, zoals `firstname-input-label*` en `firstname-required-error`. Dat is bewust zo: de vertalingen staan niet in git en niet in de CI.

## Welk component je test

De stappen van QA gaan over het hele sollicitatieformulier: niet verder kunnen, doorgaan naar de volgende sectie, versturen. Test daarom het echte formulier: **`ApplyForm`** in `src/page-components/ApplyToVacancy/ApplyForm.tsx` (zie `ApplyToVacancyContent.tsx` voor de props die het krijgt).

### Render-helper

- Bouw een render-helper in `src/test-utils/` die het formulier omhult met wat het nodig heeft (bijvoorbeeld een verse `QueryClient` per test met `retry: false`).
- Exporteer RTL vanuit hetzelfde bestand.

### Mocks

Mock wat buiten het formulier ligt op moduleniveau met `jest.mock`:

- `next/navigation`: `useRouter`, `usePathname`, en `useParams` voor de taal.
- De API-aanroepen in `src/requests/...` (versturen en tussentijds opslaan).
- reCAPTCHA: `useGoogleReCaptcha` en de server-action `validateRecaptcha`.
- De gegevens van de ingelogde gebruiker (anoniem).

Voeg een provider, mock of polyfill (`matchMedia`, `IntersectionObserver`, `ResizeObserver`) **pas toe als een test erom vraagt**, en noteer waarom.

### Stopmoment

> ⚠️ Lukt het niet om `ApplyForm` te renderen zonder app-code te veranderen? **Stop dan en meld wat er nodig zou zijn**, vóór je overstapt op losse stapcomponenten met een eigen formulier eromheen. Die keuze maak ik.

## Eisen aan elke test (criteria C1–C6)

### C1 – Test gedrag vanuit de gebruiker
- Zoek elementen op rol en toegankelijke naam (`getByRole`; `getByLabelText` of `getByText` waar geen rol past).
- Gebruik `user-event`, niet `fireEvent`.
- Controleer wat de gebruiker ziet of wat er verstuurd wordt, niet de interne state.
- Geen `data-testid`, geen snapshots, geen controle op CSS-klassen of kleuren.

### C2 – Kan echt falen
Controleer een concrete uitkomst, zoals een foutmelding die er wel of juist niet is, of een mock die wel of niet is aangeroepen met bepaalde gegevens.

Doe per test een controle: breek de regel tijdelijk in de app-code (bijvoorbeeld voornaam optioneel maken in het schema, of `getIsCVRequired` altijd `false` laten teruggeven), kijk dat de test faalt, en zet de code daarna exact terug. Meld per test of dat gelukt is.

### C3 – Leesbaar
Eén gedrag per test. De naam begint met het testcase-ID van QA en is te lezen als één zin, bijvoorbeeld:

```tsx
it('86939 - toont een foutmelding onder de achternaam als die leeg is', …)
```

### C4 – Duidelijk bij falen
Gebruik jest-dom-controles (`toBeInTheDocument`, `toHaveAttribute`, `toBeVisible`) en `toHaveBeenCalledWith`, zodat een falende test laat zien wat er verwacht werd en wat er gebeurde. Geen `toBeTruthy`.

### C5 – Betrouwbaar
Geen netwerk, verse providers en mocks per test, geen afhankelijkheid van de volgorde van tests. Testbestanden maak je met `new File(...)` van een bekende grootte.

### C6 – Snel
Geen echte timers waar niet nodig, geen onnodige waits.

## Hoe je de stappen van QA gebruikt

Hieronder staan per testcase de originele stappen van QA, letterlijk, in het Engels zoals ze in Azure DevOps staan.

- Zet boven elke test een korte commentaarregel met de stapnummers die deze test dekt.
- Noem in je verslag welke stappen niet in deze laag gedekt zijn, en waar wel. Bijvoorbeeld:
  - een succesmelding na versturen hoort bij de **E2E-test 86938**;
  - het formaat van e-mail, telefoon en bestanden hoort bij de **unittests 86934, 86940, 86935, 86936 en 86944**.

## De testcases

### 86933 – Required Fields Validation

**Stappen van QA:**

> 1. Given the user is on the application form
> 2. When the user clicks the submit button without filling required fields
> 3. Then the form should not submit
> 4. And each required field should show an error message

**Wat je test:**

In `ApplyForm` heeft de eerste stap een knop **"Volgende"** in plaats van "submit". Controleer:

- dat elk verplicht veld van die stap een foutmelding toont;
- dat het formulier niet naar de volgende stap gaat;
- dat er niets wordt verstuurd of tussentijds opgeslagen.

### 86939 – Validate First and Last Name

**Stappen van QA:**

> 1. Given the user is on the application form
> 2. When they leave the first name or last name field empty
> 3. And click submit
> 4. Then an error message should appear under the missing fields
> 5. And the form should not submit

**Wat je test:**

Vul alles in behalve de voornaam, en apart behalve de achternaam. Alleen het lege veld toont een foutmelding, en het formulier gaat niet verder.

### 86937 – Optional Fields Are Truly Optional

**Stappen van QA:**

> 1. Given the user fills in only the required fields
> 2. When they click the submit button
> 3. Then the form should submit successfully
> 4. And a success message should be shown

**Wat je test:**

Doorloop alle stappen met alleen de verplichte velden:

- geen tussenvoegsel;
- geen toevoeging bij het huisnummer;
- geen cv (taal `nl-nl`);
- geen motivatie.

Controleer dat de nagebootste verzendfunctie **één keer** wordt aangeroepen. Stap 4 (de succesmelding) hoort bij E2E 86938.

### 86941 – Motivation Optional Check

**Stappen van QA:**

> 1. Given the user fills in all required fields
> 2. And leaves the motivation field empty
> 3. And doesn't upload a motivation letter
> 4. When they submit the form
> 5. Then the form should submit successfully

**Wat je test:**

Zoals 86937, maar de test gaat specifiek over het lege motivatieveld en het ontbreken van een brief.

### 86942 – Write Motivation as Free Text

**Stappen van QA:**

> 1. Given the user types a message in the motivation text field
> 2. And fills in the other required fields
> 3. When the form is submitted
> 4. Then the message should be included in the application payload

**Wat je test:**

- Typ een motivatie via **"Schrijf direct een motivatie"** (`src/components/MotivationInputFields`).
- Controleer dat de nagebootste verzendfunctie de getypte tekst meekrijgt.
- Kijk in `src/requests/vacancies/apply.ts` en `useOnSubmit.ts` in welk veld die zit.

### 86943 – Upload Motivation Letter as File

**Stappen van QA:**

> 1. Given the user chooses to upload a motivation file
> 2. When the file is in a supported format (e.g. PDF, DOCX)
> 3. And is <6MB
> 4. Then the file should be attached successfully

**Wat je test:**

- Upload met `user.upload` een pdf kleiner dan 6 MB als motivatiebrief (`src/components/FileUpload/Motivation`).
- Controleer dat het bestand zichtbaar is toegevoegd, en dat het bij versturen wordt meegegeven.

### 86840 – Resume upload mandatory for Sweden

**Stappen van QA:**

> 1. Given a user is on the Swedish website
> 2. And wants to apply for a job
> 3. When the user fills in the details
> 4. And gets to the "Documents" section
> 5. Then the CV section is mandatory
> 6. And can be validated by clicking next without adding a CV
> 7. Then the user can not continue
> 8. And the CV field is marked red to highlight this is mandatory

**Wat je test:**

- Taal `en-se`, via `useParams`.
- Ga naar de documentenstap en klik op "Volgende" zonder cv.
- Controleer dat er een foutmelding bij het cv staat en dat de stap niet verandert.
- *"Marked red"* controleer je niet op kleur, maar op de foutmelding, of op `aria-invalid` als het veld dat heeft.

### 86841 – Resume upload optional for other countries

**Stappen van QA:**

> 1. Given a user is on any other website than Sweden
> 2. And want to apply for a job
> 3. When the user fills in the details
> 4. And gets to the "Documents" section
> 5. Then the CV section is optional
> 6. And can be validated by clicking next without adding a CV
> 7. Then the user can continue to the next section

**Wat je test:**

- Taal `nl-nl`.
- Zelfde route als 86840, maar nu gaat het formulier door naar de eindcontrole.
- Controleer ook dat het cv als **optioneel** wordt aangeduid.

## Plaats

- **Tests:** als `.test.tsx` in een `__tests__`-map naast `ApplyForm`: `src/page-components/ApplyToVacancy/__tests__/`.
- **Render-helper:** in `src/test-utils/`.

## Regels

- Verander geen app-code. De tijdelijke wijziging voor de C2-controle zet je volledig terug.
- Verander geen bestaande tests.
- Commit en push niets.
- Zet niets dat jsdom nodig heeft in `jest.setup.js`; dat is ook de setup van de unittests.
- Als iets alleen kan door app-code of de bestaande Jest-instellingen te veranderen: **stop dan en vraag het mij eerst.**

## Klaar als

- [ ] `pnpm jest` helemaal groen is (beide projects)
- [ ] `pnpm type-check` slaagt (zet zo nodig `@testing-library/jest-dom` in de `types` van `tsconfig.json`, en meld dat)
- [ ] `pnpm exec eslint` en `pnpm exec prettier --check` op de nieuwe en gewijzigde bestanden niets melden
- [ ] `git diff` op de app-code leeg is

## Lever op

1. **Per test:** de naam (met ID), wat hij controleert, en welke stappen van QA hij wel en niet dekt, met de test of laag die de overige stappen dekt.
2. **C2-controle per test:** wat je tijdelijk hebt gebroken, en dat de test toen faalde.
3. **Toevoegingen:** een lijst van elke toevoeging aan configuratie, setup, mocks, polyfills of de render-helper, met per regel:
   - wat;
   - de letterlijke foutmelding die het nodig maakte (zonder kleurcodes, met ingekorte paden);
   - waarom;
   - of het in de [Next.js-gids voor Jest](https://nextjs.org/docs/app/guides/testing/jest) staat.
4. **Samenvatting** van `pnpm jest --selectProjects component`, de tijd die Jest meldt, en waarschuwingen die bij elke run terugkomen.
5. **Niet getest:** wat je niet hebt kunnen testen of bewust hebt laten liggen, en waarom.