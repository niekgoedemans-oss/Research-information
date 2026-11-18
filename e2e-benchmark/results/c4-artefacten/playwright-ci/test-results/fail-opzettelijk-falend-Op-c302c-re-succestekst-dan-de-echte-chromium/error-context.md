# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fail/opzettelijk-falend.spec.ts >> Opzettelijk falend >> verwacht een andere succestekst dan de echte
- Location: tests/fail/opzettelijk-falend.spec.ts:21:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Bedankt voor je inschrijving!')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Bedankt voor je inschrijving!') with timeout 5000ms
  - waiting for getByText('Bedankt voor je inschrijving!')

```

```yaml
- main:
  - heading "Vacatures" [level=1]
  - region "Vacatures":
    - text: Zoeken
    - searchbox "Zoeken"
    - text: Locatie
    - combobox "Locatie":
      - option "Alle locaties" [selected]
      - option "Amsterdam"
      - option "Groningen"
      - option "Utrecht"
    - status: 4 vacatures gevonden
    - list:
      - listitem:
        - article "Frontend developer":
          - heading "Frontend developer" [level=3]
          - paragraph: Pixelfabriek BV
          - paragraph: "Locatie: Utrecht"
          - paragraph: "Salaris: € 3.500 – € 4.800 per maand"
      - listitem:
        - article "Backend developer":
          - heading "Backend developer" [level=3]
          - paragraph: Datadijk BV
          - paragraph: "Locatie: Amsterdam"
          - paragraph: "Salaris: € 4.000 – € 5.500 per maand"
      - listitem:
        - article "UX-designer":
          - heading "UX-designer" [level=3]
          - paragraph: Ontwerpstudio Noord
          - paragraph: "Locatie: Groningen"
          - paragraph: "Salaris: € 3.200 – € 4.200 per maand"
      - listitem:
        - article "Data-analist":
          - heading "Data-analist" [level=3]
          - paragraph: Cijferhuis BV
          - paragraph: "Locatie: Utrecht"
          - paragraph: "Salaris: € 3.800 per maand"
  - heading "Open sollicitatie" [level=2]
  - status: Bedankt voor je sollicitatie op Open sollicitatie!
- alert
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
> 27 |     await expect(page.getByText('Bedankt voor je inschrijving!')).toBeVisible();
     |                                                                   ^ Error: expect(locator).toBeVisible() failed
  28 |   });
  29 | 
  30 |   test('klikt op een knop die niet bestaat', async ({ page }) => {
  31 |     await page.getByRole('button', { name: 'Annuleer sollicitatie' }).click();
  32 |   });
  33 | });
  34 | 
```