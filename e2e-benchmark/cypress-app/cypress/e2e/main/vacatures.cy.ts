import testdata from '../../fixtures/testdata.json';

const { apiBaseUrl, vacancies, search } = testdata;

// Elementen worden gezocht met cy.getByRole (ingebouwd sinds Cypress 16.2.0): op rol en toegankelijke naam.
// Voor tekst zonder rol (zoals het aantal gevonden vacatures) heeft Cypress geen getByText; daarvoor cy.contains.

describe('Vacatures', () => {
  beforeEach(() => {
    cy.intercept('GET', `${apiBaseUrl}/vacancies`, { body: vacancies });
    cy.visit('/');
    cy.contains('4 vacatures gevonden').should('be.visible');
  });

  it('toont de lijst met vacatures', () => {
    for (const vacancy of vacancies) {
      cy.getByRole('heading', { name: vacancy.title }).should('be.visible');
    }
  });

  it('zoeken filtert de lijst', () => {
    cy.getByRole('searchbox', { name: 'Zoeken' }).type(search.term);
    cy.contains('2 vacatures gevonden').should('be.visible');
    cy.getByRole('heading', { name: 'Frontend developer' }).should('be.visible');
    cy.getByRole('heading', { name: 'Backend developer' }).should('be.visible');
    cy.getByRole('heading', { name: 'UX-designer' }).should('not.exist');
    cy.getByRole('heading', { name: 'Data-analist' }).should('not.exist');
  });

  it('toont een melding als er geen vacatures gevonden worden', () => {
    cy.getByRole('searchbox', { name: 'Zoeken' }).type(search.noResultsTerm);
    cy.contains('0 vacatures gevonden').should('be.visible');
    cy.contains('Geen vacatures gevonden. Probeer een andere zoekterm.').should('be.visible');
    cy.getByRole('heading', { name: 'Frontend developer' }).should('not.exist');
  });
});
