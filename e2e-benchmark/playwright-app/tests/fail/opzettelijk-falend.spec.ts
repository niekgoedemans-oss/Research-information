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

test.describe('Opzettelijk falend', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${apiBaseUrl}/vacancies`, (route) => route.fulfill({ json: vacancies }));
    await page.goto('/');
    await expect(page.getByText('4 vacatures gevonden')).toBeVisible();
  });

  test('verwacht een andere succestekst dan de echte', async ({ page }) => {
    await page.route(`${apiBaseUrl}/applications`, (route) =>
      route.fulfill({ status: 201, json: applicationResponse }),
    );
    await vulFormulierIn(page, applicant);
    await page.getByRole('button', { name: 'Verstuur sollicitatie' }).click();
    await expect(page.getByText('Bedankt voor je inschrijving!')).toBeVisible();
  });

  test('klikt op een knop die niet bestaat', async ({ page }) => {
    await page.getByRole('button', { name: 'Annuleer sollicitatie' }).click();
  });
});
