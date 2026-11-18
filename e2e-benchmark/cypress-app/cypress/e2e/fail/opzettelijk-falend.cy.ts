import testdata from '../../fixtures/testdata.json';

const { apiBaseUrl, vacancies, applicant, applicationResponse } = testdata;

// Elementen worden gezocht met cy.getByRole (ingebouwd sinds Cypress 16.2.0): op rol en toegankelijke naam.
// Een formulierveld krijgt zijn toegankelijke naam van zijn <label>.
// Voor tekst zonder rol heeft Cypress geen getByText; daarvoor cy.contains.

function vulFormulierIn(gegevens: typeof applicant) {
  cy.getByRole('textbox', { name: 'Naam' }).type(gegevens.name);
  cy.getByRole('textbox', { name: 'E-mail' }).type(gegevens.email);
  cy.getByRole('textbox', { name: 'Telefoonnummer' }).type(gegevens.phone);
  cy.getByRole('textbox', { name: 'Motivatie' }).type(gegevens.motivation);
  cy.getByRole('checkbox', { name: 'Ik ga akkoord met de voorwaarden' }).check();
}

describe('Opzettelijk falend', () => {
  beforeEach(() => {
    cy.intercept('GET', `${apiBaseUrl}/vacancies`, { body: vacancies });
    cy.visit('/');
    cy.contains('4 vacatures gevonden').should('be.visible');
  });

  it('verwacht een andere succestekst dan de echte', () => {
    cy.intercept('POST', `${apiBaseUrl}/applications`, { statusCode: 201, body: applicationResponse });
    vulFormulierIn(applicant);
    cy.getByRole('button', { name: 'Verstuur sollicitatie' }).click();
    cy.contains('Bedankt voor je inschrijving!').should('be.visible');
  });

  it('klikt op een knop die niet bestaat', () => {
    cy.getByRole('button', { name: 'Annuleer sollicitatie' }).click();
  });
});
