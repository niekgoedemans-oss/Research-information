import testdata from "../../fixtures/testdata.json";

const { apiBaseUrl, vacancies, applicant, search, applicationResponse } =
  testdata;

// Elementen worden gezocht met cy.getByRole (ingebouwd sinds Cypress 16.2.0): op rol en toegankelijke naam.
// Een formulierveld krijgt zijn toegankelijke naam van zijn <label>.
// Voor tekst zonder rol heeft Cypress geen getByText; daarvoor cy.contains.

function vulFormulierIn(gegevens: typeof applicant) {
  cy.getByRole("textbox", { name: "Naam" }).type(gegevens.name);
  cy.getByRole("textbox", { name: "E-mail" }).type(gegevens.email);
  cy.getByRole("textbox", { name: "Telefoonnummer" }).type(gegevens.phone);
  cy.getByRole("textbox", { name: "Motivatie" }).type(gegevens.motivation);
  cy.getByRole("checkbox", {
    name: "Ik ga akkoord met de voorwaarden",
  }).check();
}

describe("Flow", () => {
  it("volledige flow: vacature zoeken en open sollicitatie versturen", () => {
    cy.intercept("GET", `${apiBaseUrl}/vacancies`, { body: vacancies });
    cy.intercept("POST", `${apiBaseUrl}/applications`, {
      statusCode: 201,
      body: applicationResponse,
    });
    cy.visit("/");
    cy.contains("4 vacatures gevonden").should("be.visible");
    cy.getByRole("searchbox", { name: "Zoeken" }).type(search.term);
    cy.contains("2 vacatures gevonden").should("be.visible");
    cy.getByRole("heading", { name: "Frontend developer" }).should(
      "be.visible",
    );
    vulFormulierIn(applicant);
    cy.getByRole("button", { name: "Verstuur sollicitatie" }).click();
    cy.contains("Bedankt voor je sollicitatie op Open sollicitatie!").should(
      "be.visible",
    );
    cy.getByRole("button", { name: "Verstuur sollicitatie" }).should(
      "not.exist",
    );
  });

  it("locatiefilter toont alleen vacatures op die locatie", () => {
    cy.intercept("GET", `${apiBaseUrl}/vacancies`, { body: vacancies });
    cy.visit("/");
    cy.contains("4 vacatures gevonden").should("be.visible");
    cy.getByRole("combobox", { name: "Locatie" }).select(search.location);
    cy.contains("2 vacatures gevonden").should("be.visible");
    cy.getByRole("heading", { name: "Frontend developer" }).should(
      "be.visible",
    );
    cy.getByRole("heading", { name: "Data-analist" }).should("be.visible");
    cy.getByRole("heading", { name: "Backend developer" }).should("not.exist");
  });

  it("toont een melding als de vacatures niet geladen kunnen worden", () => {
    cy.intercept("GET", `${apiBaseUrl}/vacancies`, { statusCode: 500 });
    cy.visit("/");
    cy.contains("Vacatures konden niet worden geladen.").should("be.visible");
    cy.contains("vacatures gevonden").should("not.exist");
  });
});
