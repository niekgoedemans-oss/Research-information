# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fail/opzettelijk-falend.spec.ts >> Opzettelijk falend >> klikt op een knop die niet bestaat
- Location: tests/fail/opzettelijk-falend.spec.ts:30:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Annuleer sollicitatie' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - heading "Vacatures" [level=1] [ref=e3]
    - region "Vacatures" [ref=e4]:
      - generic [ref=e5]: Zoeken
      - searchbox "Zoeken" [ref=e6]
      - generic [ref=e7]: Locatie
      - combobox "Locatie" [ref=e8]:
        - option "Alle locaties" [selected]
        - option "Amsterdam"
        - option "Groningen"
        - option "Utrecht"
      - status [ref=e9]: 4 vacatures gevonden
      - list [ref=e10]:
        - listitem [ref=e11]:
          - article [ref=e12]:
            - heading "Frontend developer" [level=3] [ref=e13]
            - paragraph [ref=e14]: Pixelfabriek BV
            - paragraph [ref=e15]: "Locatie: Utrecht"
            - paragraph [ref=e16]: "Salaris: € 3.500 – € 4.800 per maand"
        - listitem [ref=e17]:
          - article [ref=e18]:
            - heading "Backend developer" [level=3] [ref=e19]
            - paragraph [ref=e20]: Datadijk BV
            - paragraph [ref=e21]: "Locatie: Amsterdam"
            - paragraph [ref=e22]: "Salaris: € 4.000 – € 5.500 per maand"
        - listitem [ref=e23]:
          - article [ref=e24]:
            - heading "UX-designer" [level=3] [ref=e25]
            - paragraph [ref=e26]: Ontwerpstudio Noord
            - paragraph [ref=e27]: "Locatie: Groningen"
            - paragraph [ref=e28]: "Salaris: € 3.200 – € 4.200 per maand"
        - listitem [ref=e29]:
          - article [ref=e30]:
            - heading "Data-analist" [level=3] [ref=e31]
            - paragraph [ref=e32]: Cijferhuis BV
            - paragraph [ref=e33]: "Locatie: Utrecht"
            - paragraph [ref=e34]: "Salaris: € 3.800 per maand"
    - heading "Open sollicitatie" [level=2] [ref=e35]
    - form "Solliciteren op Open sollicitatie" [ref=e36]:
      - generic [ref=e37]: Naam
      - textbox "Naam" [ref=e38]
      - generic [ref=e39]: E-mail
      - textbox "E-mail" [ref=e40]
      - generic [ref=e41]: Telefoonnummer
      - textbox "Telefoonnummer" [ref=e42]
      - generic [ref=e43]: Motivatie
      - textbox "Motivatie" [ref=e44]
      - generic [ref=e45]:
        - checkbox "Ik ga akkoord met de voorwaarden" [ref=e46]
        - text: Ik ga akkoord met de voorwaarden
      - button "Verstuur sollicitatie" [ref=e47]
  - alert [ref=e48]
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test';
  2  | import testdata from '../fixtures/testdata.json';
  3  | 
  4  | const { apiBaseUrl, vacancies, applicant, applicationResponse } = testdata;
  5  | 
  6  | async function vulFormulierIn(page: Page, gegevens: typeof applicant) {
  7  |   await page.getByLabel('Naam').fill(gegevens.name);
  8  |   await page.getByLabel('E-mail').fill(gegevens.email);
  9  |   await page.getByLabel('Telefoonnummer').fill(gegevens.phone);
  10 |   await page.getByLabel('Motivatie').fill(gegevens.motivation);
  11 |   await page.getByLabel('Ik ga akkoord met de voorwaarden').check();
  12 | }
  13 | 
  14 | test.describe('Opzettelijk falend', () => {
  15 |   test.beforeEach(async ({ page }) => {
  16 |     await page.route(`${apiBaseUrl}/vacancies`, (route) => route.fulfill({ json: vacancies }));
  17 |     await page.goto('/');
  18 |     await expect(page.getByText('4 vacatures gevonden')).toBeVisible();
  19 |   });
  20 | 
  21 |   test('verwacht een andere succestekst dan de echte', async ({ page }) => {
  22 |     await page.route(`${apiBaseUrl}/applications`, (route) =>
  23 |       route.fulfill({ status: 201, json: applicationResponse }),
  24 |     );
  25 |     await vulFormulierIn(page, applicant);
  26 |     await page.getByRole('button', { name: 'Verstuur sollicitatie' }).click();
  27 |     await expect(page.getByText('Bedankt voor je inschrijving!')).toBeVisible();
  28 |   });
  29 | 
  30 |   test('klikt op een knop die niet bestaat', async ({ page }) => {
> 31 |     await page.getByRole('button', { name: 'Annuleer sollicitatie' }).click();
     |                                                                       ^ Error: locator.click: Test timeout of 30000ms exceeded.
  32 |   });
  33 | });
  34 | 
```