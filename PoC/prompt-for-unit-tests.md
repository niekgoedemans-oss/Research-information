# Opdracht: unittests voor de sollicitatieflow (PoC testing)

## Context

Ik doe een onderzoek naar testing libraries voor de Next.js-projecten van Framna. In een proof of concept in het Maandag-project zet ik de handmatige regressietest van QA voor de sollicitatieflow (**"Apply - Direct apply"**) om naar geautomatiseerde tests, verdeeld over unit-, component- en E2E-tests. **Jij schrijft nu de unittests.**

## Waar

- **Map:** `/Users/niek.goedemans/Desktop/Projects/DPF-GIT-G-Web-MaandagPublic/.claude/worktrees/poc-testing`
- **Branch:** `research/poc-testing`. Werk alleen in deze map.
- **Jest 29.7** met twee projects in `jest.config.js`:
  - `unit`: node-omgeving, testMatch `**/*.(test|spec).{js,ts}` en `**/__tests__/**/*.{js,ts}`.
  - `component`: jsdom, `**/*.test.tsx`.

> Unittests zijn dus `.ts`-bestanden en renderen geen componenten.

## Eisen aan elke test (criteria C1–C6)

### C1 – Test gedrag vanuit de gebruiker
Test de validator of het schema dat het formulier echt gebruikt, via de publieke functie: invoer erin, geldig of ongeldig met foutmelding eruit. Test geen interne details, zoals hoe zod het intern doet of private hulpfuncties. Een herschrijving van de code met hetzelfde gedrag mag de test niet laten falen.

### C2 – Kan echt falen
Controleer altijd de uitkomst **én** de foutmelding, en zet naast elk ongeldig geval ook een geldig geval. Zo slaagt de test niet altijd.

Doe per test een controle: breek de regel tijdelijk in de app-code (bijvoorbeeld `MAX_FILE_SIZE` verhogen, of `'apk'` toevoegen aan de toegestane extensies), kijk dat de test faalt, en zet de code daarna exact terug. Meld per test of dat gelukt is.

### C3 – Leesbaar
Eén ding per test. Gebruik `it.each` als er meerdere voorbeelden zijn, zodat elk voorbeeld een eigen test met eigen naam is. De naam begint met het testcase-ID van QA en is te lezen als één zin, bijvoorbeeld:

```ts
it('86934 - wijst een e-mailadres zonder domein af ("test@")', …)
```

### C4 – Duidelijk bij falen
Gebruik controles die bij falen tonen wat er verwacht werd en wat er gebeurde, zoals `toBe` of `toEqual` op de foutmelding, of `toThrow('…')`. Geen `toBeTruthy` op een boolean.

### C5 – Betrouwbaar
Geen netwerk, geen echte datum of toeval, geen gedeelde state tussen tests. Maak testbestanden in de test zelf met `new File(...)` van een exact bekende grootte.

### C6 – Snel
Geen rendering, geen jsdom. Alleen het `unit`-project.

## Hoe je de stappen van QA gebruikt

Hieronder staan per testcase de originele stappen van QA, letterlijk, in het Engels zoals ze in Azure DevOps staan. Ze zijn geschreven als flow in het formulier. Vertaal ze naar het niveau van de validator:

- Stappen als *"clicks submit"*, *"error message below/under the field"* en *"the form should not submit"* gaan over het formulier in de browser. Die vallen bij een unittest weg; het tonen van foutmeldingen wordt getest in de componenttests **86933** en **86939**.
- Zet boven elke test een korte commentaarregel met alleen de stappen van QA die deze unittest echt dekt, met de stapnummers. Bijvoorbeeld:

  ```ts
  // 86934 stap 1–2: invalid email (e.g. "test@") → rejected with the invalid-email message
  ```

- Noem in je verslag per testcase welke stappen niet gedekt zijn in deze laag, en door welke test of laag ze wel gedekt worden.

## De testcases

### 86934 – Invalid Email Format

**Stappen van QA:**

> 1. Given the user is filling in the application form
> 2. When the user enters an invalid email (e.g., "test@")
> 3. And clicks submit
> 4. Then an error message should appear below the email field
> 5. And the form should not be submitted

**Wat je test:**

- `validateEmail(requiredErr, invalidErr)` in `src/utils/formValidations.ts`.
- **Ongeldig:** in ieder geval `"test@"` (het voorbeeld van QA). **Geldig:** een gewoon e-mailadres.
- ⚠️ `src/utils/__tests__/formValidations.test.ts` test `validateEmail` al. Pas die bestaande test niet aan. Voeg alleen toe wat de testcase van QA nog niet dekt, en meld de overlap.

### 86940 – Phone Number Validation

**Stappen van QA:**

> 1. Given the user enters a phone number
> 2. When the input contains letters or too few digits
> 3. And clicks submit
> 4. Then an error message should appear under the phone number field
> 5. And the form should not submit

**Wat je test:**

- `validatePhoneNumber(errors, isRequired)` in `src/utils/formValidations.ts`.
- Kijk eerst hoe het sollicitatieformulier dit schema aanroept, en wat het voor `country` meegeeft (via `globalApplyFormSchema` in `src/page-components/ApplyToVacancy/utils.ts`). Gebruik in de test dezelfde vorm.
- **Ongeldig:** een nummer met letters, en een nummer met te weinig cijfers. **Geldig:** een Nederlands mobiel nummer. Controleer bij het geldige nummer ook wat het schema teruggeeft.

### 86935 – File Upload Validation - Invalid Type

**Stappen van QA:**

> 1. Given the user selects a file for upload
> 2. When the file is a .apk or other unsupported type
> 3. Then the file should not be accepted
> 4. And an error message should be shown

**Wat je test:**

- `getFileUploadScheme({ t })` in `src/components/FileUpload/fileUploadSchema.ts`, met `ACCEPTED_CV_FILE_EXTENSIONS` uit `src/constants/apply-to-vacancy.ts`. Geef een `t` mee die de sleutel teruggeeft.
- Een `.apk` wordt geweigerd met de foutmelding voor het bestandstype. Daarnaast een pdf die wél wordt geaccepteerd.

### 86936 – File Upload Validation - Exceed File Size

**Stappen van QA:**

> 1. Given the user selects a file larger than 6MB
> 2. Then the file should be rejected with an error message

**Wat je test:**

- Hetzelfde schema, met `MAX_FILE_SIZE` uit `src/constants/apply-to-vacancy.ts`.
- Een bestand groter dan 6 MB wordt geweigerd met de foutmelding voor de grootte.
- Test ook de grens: **precies `MAX_FILE_SIZE`** en **één byte meer**. Leg vast wat de code nu doet, en meld het als dat afwijkt van QA (`"<6MB"`).

### 86944 – Upload Motivation Letter as File - Unsupported

**Stappen van QA:**

> 1. Given the user uploads a file like .exe or .zip
> 2. Or the file is >6MB
> 3. Then the form should reject the upload
> 4. And show an error message

**Wat je test:**

- Het schema dat de motivatiebrief gebruikt (`src/components/FileUpload/Motivation/index.tsx`).
- `.exe` en `.zip` worden geweigerd, en een te groot bestand ook.
- Het cv en de motivatiebrief lijken hetzelfde schema te gebruiken (zie ook `src/components/FileUpload/CV/index.tsx`). Controleer dat, en noteer het in je verslag. Dan testen 86935, 86936 en 86944 dezelfde code, wat voor QA twee onderdelen zijn.

## Plaats

Zet de tests in een `__tests__`-map naast de code die je test, als `.test.ts`. Kies een bestandsnaam die duidelijk maakt dat het om de sollicitatievalidatie gaat.

## Regels

- Verander geen app-code. De tijdelijke wijziging voor de C2-controle zet je volledig terug.
- Verander geen bestaande tests.
- Commit en push niets.
- Als iets alleen kan door app-code of de Jest-configuratie aan te passen: **stop dan en vraag het mij eerst.**

## Klaar als

- [ ] `pnpm jest` helemaal groen is (beide projects)
- [ ] `pnpm type-check` slaagt
- [ ] `pnpm exec eslint` en `pnpm exec prettier --check` op de nieuwe bestanden niets melden
- [ ] `git diff` op de app-code leeg is

## Lever op

1. **Per test:** de naam (met ID), het bestand, wat hij controleert, en welke stappen van QA hij wel en niet dekt, met reden en met de test of laag die de overige stappen wel dekt.
2. **C2-controle per test:** wat je tijdelijk hebt gebroken, en dat de test toen faalde.
3. **Bestandsgrens:** wat doet de grens precies? Is 6 MB zelf toegestaan of niet?
4. **Overlap** met `formValidations.test.ts`.
5. **Samenvatting** van `pnpm jest --selectProjects unit`, en de tijd die Jest meldt.
6. **Problemen:** alles wat je tegenkwam en hoe je het oploste, met de letterlijke foutmelding.