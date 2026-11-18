import { test, expect, type Page } from '@playwright/test';
import testdata from '../fixtures/testdata.json';

const { apiBaseUrl, vacancies, applicant, applicationResponse } = testdata;

async function vulFormulierIn(page: Page, gegevens: typeof applicant) {
  await page.getByLabel('Naam').fill(gegevens.name);
  await page.getByLabel('E-mail').fill(gegevens.email);
  await page.getByLabel('Telefoonnummer').fill(gegevens.phone);
  await page.getByLabel('Motivatie').fill(gegevens.motivation);
  await page.getByLabel('Ik ga akkoord met de voorwaarden').check();
}

test.describe('Versturen', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${apiBaseUrl}/vacancies`, (route) => route.fulfill({ json: vacancies }));
    await page.goto('/');
    await expect(page.getByText('4 vacatures gevonden')).toBeVisible();
  });

  test('toont een succesmelding na versturen', async ({ page }) => {
    await page.route(`${apiBaseUrl}/applications`, (route) =>
      route.fulfill({ status: 201, json: applicationResponse }),
    );
    await vulFormulierIn(page, applicant);
    await page.getByRole('button', { name: 'Verstuur sollicitatie' }).click();
    await expect(page.getByText('Bedankt voor je sollicitatie op Open sollicitatie!')).toBeVisible();
  });

  test('het verzoek bevat de ingevulde gegevens', async ({ page }) => {
    await page.route(`${apiBaseUrl}/applications`, (route) =>
      route.fulfill({ status: 201, json: applicationResponse }),
    );
    const verzoek = page.waitForRequest(`${apiBaseUrl}/applications`);
    await vulFormulierIn(page, applicant);
    await page.getByRole('button', { name: 'Verstuur sollicitatie' }).click();
    expect((await verzoek).postDataJSON()).toEqual({ vacancyId: 'open', ...applicant, consent: true });
  });

  test('toont een foutmelding als de API status 500 geeft', async ({ page }) => {
    await page.route(`${apiBaseUrl}/applications`, (route) => route.fulfill({ status: 500 }));
    await vulFormulierIn(page, applicant);
    await page.getByRole('button', { name: 'Verstuur sollicitatie' }).click();
    await expect(page.getByText('Versturen is mislukt. Probeer het later opnieuw.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Verstuur sollicitatie' })).toBeVisible();
  });
});
