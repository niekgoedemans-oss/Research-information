import { test, expect, type Page } from '@playwright/test';
import testdata from '../fixtures/testdata.json';

const { apiBaseUrl, vacancies, applicant, invalid } = testdata;

async function vulFormulierIn(page: Page, gegevens: typeof applicant) {
  await page.getByLabel('Naam').fill(gegevens.name);
  await page.getByLabel('E-mail').fill(gegevens.email);
  await page.getByLabel('Telefoonnummer').fill(gegevens.phone);
  await page.getByLabel('Motivatie').fill(gegevens.motivation);
  await page.getByLabel('Ik ga akkoord met de voorwaarden').check();
}

test.describe('Validatie', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${apiBaseUrl}/vacancies`, (route) => route.fulfill({ json: vacancies }));
    await page.goto('/');
    await expect(page.getByText('4 vacatures gevonden')).toBeVisible();
  });

  test('toont foutmeldingen bij leeg versturen', async ({ page }) => {
    await page.getByRole('button', { name: 'Verstuur sollicitatie' }).click();
    await expect(page.getByText('Naam is verplicht')).toBeVisible();
    await expect(page.getByText('E-mail is verplicht')).toBeVisible();
    await expect(page.getByText('Telefoonnummer is verplicht')).toBeVisible();
    await expect(page.getByText('Motivatie moet minimaal 20 tekens bevatten')).toBeVisible();
    await expect(page.getByText('Je moet akkoord gaan met de voorwaarden')).toBeVisible();
  });

  test('toont een foutmelding bij een ongeldig e-mailadres', async ({ page }) => {
    await vulFormulierIn(page, { ...applicant, email: invalid.email });
    await page.getByRole('button', { name: 'Verstuur sollicitatie' }).click();
    await expect(page.getByText('Vul een geldig e-mailadres in')).toBeVisible();
    await expect(page.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true');
  });

  test('toont een foutmelding bij een ongeldig telefoonnummer', async ({ page }) => {
    await vulFormulierIn(page, { ...applicant, phone: invalid.phone });
    await page.getByRole('button', { name: 'Verstuur sollicitatie' }).click();
    await expect(page.getByText('Vul een geldig Nederlands telefoonnummer in')).toBeVisible();
    await expect(page.getByLabel('Telefoonnummer')).toHaveAttribute('aria-invalid', 'true');
  });
});
