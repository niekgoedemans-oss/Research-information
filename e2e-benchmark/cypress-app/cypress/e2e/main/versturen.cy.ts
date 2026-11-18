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

describe('Versturen', () => {
  beforeEach(() => {
    cy.intercept('GET', `${apiBaseUrl}/vacancies`, { body: vacancies });
    cy.visit('/');
    cy.contains('4 vacatures gevonden').should('be.visible');
  });

  it('toont een succesmelding na versturen', () => {
    cy.intercept('POST', `${apiBaseUrl}/applications`, { statusCode: 201, body: applicationResponse });
    vulFormulierIn(applicant);
    cy.getByRole('button', { name: 'Verstuur sollicitatie' }).click();
    cy.contains('Bedankt voor je sollicitatie op Open sollicitatie!').should('be.visible');
  });

  it('het verzoek bevat de ingevulde gegevens', () => {
    cy.intercept('POST', `${apiBaseUrl}/applications`, {
      statusCode: 201,
      body: applicationResponse,
    }).as('verzoek');
    vulFormulierIn(applicant);
    cy.getByRole('button', { name: 'Verstuur sollicitatie' }).click();
    cy.wait('@verzoek')
      .its('request.body')
      .should('deep.equal', { vacancyId: 'open', ...applicant, consent: true });
  });

  it('toont een foutmelding als de API status 500 geeft', () => {
    cy.intercept('POST', `${apiBaseUrl}/applications`, { statusCode: 500 });
    vulFormulierIn(applicant);
    cy.getByRole('button', { name: 'Verstuur sollicitatie' }).click();
    cy.contains('Versturen is mislukt. Probeer het later opnieuw.').should('be.visible');
    cy.getByRole('button', { name: 'Verstuur sollicitatie' }).should('be.visible');
  });
});
