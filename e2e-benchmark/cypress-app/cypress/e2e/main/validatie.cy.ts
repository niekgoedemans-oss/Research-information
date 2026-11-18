import testdata from '../../fixtures/testdata.json';

const { apiBaseUrl, vacancies, applicant, invalid } = testdata;

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

describe('Validatie', () => {
  beforeEach(() => {
    cy.intercept('GET', `${apiBaseUrl}/vacancies`, { body: vacancies });
    cy.visit('/');
    cy.contains('4 vacatures gevonden').should('be.visible');
  });

  it('toont foutmeldingen bij leeg versturen', () => {
    cy.getByRole('button', { name: 'Verstuur sollicitatie' }).click();
    cy.contains('Naam is verplicht').should('be.visible');
    cy.contains('E-mail is verplicht').should('be.visible');
    cy.contains('Telefoonnummer is verplicht').should('be.visible');
    cy.contains('Motivatie moet minimaal 20 tekens bevatten').should('be.visible');
    cy.contains('Je moet akkoord gaan met de voorwaarden').should('be.visible');
  });

  it('toont een foutmelding bij een ongeldig e-mailadres', () => {
    vulFormulierIn({ ...applicant, email: invalid.email });
    cy.getByRole('button', { name: 'Verstuur sollicitatie' }).click();
    cy.contains('Vul een geldig e-mailadres in').should('be.visible');
    cy.getByRole('textbox', { name: 'E-mail' }).should('have.attr', 'aria-invalid', 'true');
  });

  it('toont een foutmelding bij een ongeldig telefoonnummer', () => {
    vulFormulierIn({ ...applicant, phone: invalid.phone });
    cy.getByRole('button', { name: 'Verstuur sollicitatie' }).click();
    cy.contains('Vul een geldig Nederlands telefoonnummer in').should('be.visible');
    cy.getByRole('textbox', { name: 'Telefoonnummer' }).should('have.attr', 'aria-invalid', 'true');
  });
});
