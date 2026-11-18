import { test, expect, type Page } from "@playwright/test";
import testdata from "../fixtures/testdata.json";

const { apiBaseUrl, vacancies, applicant, search, applicationResponse } =
  testdata;

async function vulFormulierIn(page: Page, gegevens: typeof applicant) {
  await page.getByLabel("Naam").fill(gegevens.name);
  await page.getByLabel("E-mail").fill(gegevens.email);
  await page.getByLabel("Telefoonnummer").fill(gegevens.phone);
  await page.getByLabel("Motivatie").fill(gegevens.motivation);
  await page.getByLabel("Ik ga akkoord met de voorwaarden").check();
}

test.describe("Flow", () => {
  test("volledige flow: vacature zoeken en open sollicitatie versturen", async ({
    page,
  }) => {
    await page.route(`${apiBaseUrl}/vacancies`, (route) =>
      route.fulfill({ json: vacancies }),
    );
    await page.route(`${apiBaseUrl}/applications`, (route) =>
      route.fulfill({ status: 201, json: applicationResponse }),
    );
    await page.goto("/");
    await expect(page.getByText("4 vacatures gevonden")).toBeVisible();
    await page.getByLabel("Zoeken").fill(search.term);
    await expect(page.getByText("2 vacatures gevonden")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Frontend developer" }),
    ).toBeVisible();
    await vulFormulierIn(page, applicant);
    await page.getByRole("button", { name: "Verstuur sollicitatie" }).click();
    await expect(
      page.getByText("Bedankt voor je sollicitatie op Open sollicitatie!"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Verstuur sollicitatie" }),
    ).toHaveCount(0);
  });

  test("locatiefilter toont alleen vacatures op die locatie", async ({
    page,
  }) => {
    await page.route(`${apiBaseUrl}/vacancies`, (route) =>
      route.fulfill({ json: vacancies }),
    );
    await page.goto("/");
    await expect(page.getByText("4 vacatures gevonden")).toBeVisible();
    await page.getByLabel("Locatie").selectOption(search.location);
    await expect(page.getByText("2 vacatures gevonden")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Frontend developer" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Data-analist" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Backend developer" }),
    ).toHaveCount(0);
  });

  test("toont een melding als de vacatures niet geladen kunnen worden", async ({
    page,
  }) => {
    await page.route(`${apiBaseUrl}/vacancies`, (route) =>
      route.fulfill({ status: 500 }),
    );
    await page.goto("/");
    await expect(
      page.getByText("Vacatures konden niet worden geladen."),
    ).toBeVisible();
    await expect(page.getByText("vacatures gevonden")).toHaveCount(0);
  });
});
