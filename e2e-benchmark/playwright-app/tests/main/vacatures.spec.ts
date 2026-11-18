import { test, expect } from '@playwright/test';
import testdata from '../fixtures/testdata.json';

const { apiBaseUrl, vacancies, search } = testdata;

test.describe('Vacatures', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${apiBaseUrl}/vacancies`, (route) => route.fulfill({ json: vacancies }));
    await page.goto('/');
    await expect(page.getByText('4 vacatures gevonden')).toBeVisible();
  });

  test('toont de lijst met vacatures', async ({ page }) => {
    for (const vacancy of vacancies) {
      await expect(page.getByRole('heading', { level: 3, name: vacancy.title })).toBeVisible();
    }
  });

  test('zoeken filtert de lijst', async ({ page }) => {
    await page.getByLabel('Zoeken').fill(search.term);
    await expect(page.getByText('2 vacatures gevonden')).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Frontend developer' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Backend developer' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'UX-designer' })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 3, name: 'Data-analist' })).toHaveCount(0);
  });

  test('toont een melding als er geen vacatures gevonden worden', async ({ page }) => {
    await page.getByLabel('Zoeken').fill(search.noResultsTerm);
    await expect(page.getByText('0 vacatures gevonden')).toBeVisible();
    await expect(page.getByText('Geen vacatures gevonden. Probeer een andere zoekterm.')).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Frontend developer' })).toHaveCount(0);
  });
});
