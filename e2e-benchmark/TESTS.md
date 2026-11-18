# Tests – namen en stappen per library

12 tests in 4 bestanden (`main/`) plus 2 opzettelijk falende tests (`fail/`). In beide projecten
dezelfde bestandsnamen (`.cy.ts` / `.spec.ts`), dezelfde `describe`-namen, dezelfde testnamen in
dezelfde volgorde en dezelfde stappen in dezelfde volgorde. Alleen de syntax verschilt.
`node scripts/compare-tests.mjs` controleert namen, volgorde en aantal stappen automatisch
(→ `results/testnamen.md`); `node scripts/verify.mjs` controleert dat de namen ook in de echte runs
gelijk zijn (→ `results/verify.md`).

Alle testdata komt uit één JSON-bestand per project (`cypress/fixtures/testdata.json` en
`tests/fixtures/testdata.json`, byte-identiek), ingelezen met een gewone `import`. De externe API
(`https://api.vacaturebank.example/v1`) wordt in de browser onderschept: `cy.intercept` / `page.route`.

## Bouwstenen

Notatie: `api` = `testdata.apiBaseUrl`.

| Bouwsteen | Cypress | Playwright |
| --- | --- | --- |
| **V – voorbereiding** (`beforeEach` in vacatures, validatie, versturen, fail; in flow per test uitgeschreven) | | |
| V1 vacatures-API onderscheppen → 200 + `vacancies` | `cy.intercept('GET', `${api}/vacancies`, { body: vacancies })` | `page.route(`${api}/vacancies`, r => r.fulfill({ json: vacancies }))` |
| V2 pagina openen | `cy.visit('/')` | `page.goto('/')` |
| V3 wachten tot de lijst geladen is | `cy.contains('4 vacatures gevonden').should('be.visible')` | `expect(page.getByText('4 vacatures gevonden')).toBeVisible()` |
| **Veld op rol en naam** | `cy.getByRole(rol, { name: label })` (ingebouwd sinds Cypress 16.2.0; het `<label>` geeft het veld zijn toegankelijke naam). Rollen: `textbox` (tekst, e-mail, telefoon, textarea), `searchbox` (Zoeken), `combobox` (Locatie), `checkbox`. Cypress heeft geen `getByLabel` | `page.getByLabel(label)` |
| **F – `vulFormulierIn(g)`** (helper, telt als één stap) | | |
| F1 Naam | `cy.getByRole('textbox', { name: 'Naam' }).type(g.name)` | `page.getByLabel('Naam').fill(g.name)` |
| F2 E-mail | `cy.getByRole('textbox', { name: 'E-mail' }).type(g.email)` | `page.getByLabel('E-mail').fill(g.email)` |
| F3 Telefoonnummer | `cy.getByRole('textbox', { name: 'Telefoonnummer' }).type(g.phone)` | `page.getByLabel('Telefoonnummer').fill(g.phone)` |
| F4 Motivatie | `cy.getByRole('textbox', { name: 'Motivatie' }).type(g.motivation)` | `page.getByLabel('Motivatie').fill(g.motivation)` |
| F5 voorwaarden aanvinken | `cy.getByRole('checkbox', { name: 'Ik ga akkoord met de voorwaarden' }).check()` | `page.getByLabel('Ik ga akkoord met de voorwaarden').check()` |
| **Versturen** | `cy.getByRole('button', { name: 'Verstuur sollicitatie' }).click()` | `page.getByRole('button', { name: 'Verstuur sollicitatie' }).click()` |
| **Tekst zichtbaar** | `cy.contains(tekst).should('be.visible')` | `expect(page.getByText(tekst)).toBeVisible()` |
| **Kop (h3) zichtbaar / afwezig** (Cypress' `getByRole` heeft geen optie voor het kopniveau; de namen zijn uniek) | `cy.getByRole('heading', { name: titel }).should('be.visible' / 'not.exist')` | `expect(page.getByRole('heading', { level: 3, name: titel })).toBeVisible()` / `.toHaveCount(0)` |

## Tabel per test

Stappen na de voorbereiding V1–V3 (waar van toepassing). "=" betekent: beide libraries doen deze stap
met de bouwsteen uit de tabel hierboven.

### vacatures (`describe('Vacatures')`, met V1–V3)

| # | Testnaam | Stap | Cypress | Playwright |
| --- | --- | --- | --- | --- |
| 1 | toont de lijst met vacatures | 1. voor elk van de 4 vacatures: kop zichtbaar | `for … cy.getByRole('heading', { name: v.title }).should('be.visible')` | `for … expect(getByRole('heading', {level: 3, name: v.title})).toBeVisible()` |
| 2 | zoeken filtert de lijst | 1. "developer" in Zoeken | `cy.getByRole('searchbox', { name: 'Zoeken' }).type(search.term)` | `getByLabel('Zoeken').fill(search.term)` |
| | | 2. "2 vacatures gevonden" zichtbaar | = | = |
| | | 3. kop "Frontend developer" zichtbaar | = | = |
| | | 4. kop "Backend developer" zichtbaar | = | = |
| | | 5. kop "UX-designer" afwezig | = | = |
| | | 6. kop "Data-analist" afwezig | = | = |
| 3 | toont een melding als er geen vacatures gevonden worden | 1. "kapper" in Zoeken | `cy.getByRole('searchbox', { name: 'Zoeken' }).type(search.noResultsTerm)` | `getByLabel('Zoeken').fill(search.noResultsTerm)` |
| | | 2. "0 vacatures gevonden" zichtbaar | = | = |
| | | 3. "Geen vacatures gevonden. Probeer een andere zoekterm." zichtbaar | = | = |
| | | 4. kop "Frontend developer" afwezig | = | = |

### validatie (`describe('Validatie')`, met V1–V3)

| # | Testnaam | Stap | Cypress | Playwright |
| --- | --- | --- | --- | --- |
| 4 | toont foutmeldingen bij leeg versturen | 1. versturen | = | = |
| | | 2.–6. zichtbaar: "Naam is verplicht", "E-mail is verplicht", "Telefoonnummer is verplicht", "Motivatie moet minimaal 20 tekens bevatten", "Je moet akkoord gaan met de voorwaarden" | = (5×) | = (5×) |
| 5 | toont een foutmelding bij een ongeldig e-mailadres | 1. formulier invullen met e-mail "sam@voorbeeld" | `vulFormulierIn({...applicant, email: invalid.email})` | `vulFormulierIn(page, {...applicant, email: invalid.email})` |
| | | 2. versturen | = | = |
| | | 3. "Vul een geldig e-mailadres in" zichtbaar | = | = |
| | | 4. veld E-mail heeft `aria-invalid="true"` | `cy.getByRole('textbox', { name: 'E-mail' }).should('have.attr', 'aria-invalid', 'true')` | `expect(getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')` |
| 6 | toont een foutmelding bij een ongeldig telefoonnummer | 1. formulier invullen met telefoon "12345" | `vulFormulierIn({...applicant, phone: invalid.phone})` | `vulFormulierIn(page, {...applicant, phone: invalid.phone})` |
| | | 2. versturen | = | = |
| | | 3. "Vul een geldig Nederlands telefoonnummer in" zichtbaar | = | = |
| | | 4. veld Telefoonnummer heeft `aria-invalid="true"` | `cy.getByRole('textbox', { name: 'Telefoonnummer' }).should('have.attr', …)` | `expect(getByLabel('Telefoonnummer')).toHaveAttribute(…)` |

### versturen (`describe('Versturen')`, met V1–V3)

| # | Testnaam | Stap | Cypress | Playwright |
| --- | --- | --- | --- | --- |
| 7 | toont een succesmelding na versturen | 1. sollicitatie-API onderscheppen → 201 + `applicationResponse` | `cy.intercept('POST', `${api}/applications`, { statusCode: 201, body })` | `page.route(`${api}/applications`, r => r.fulfill({ status: 201, json }))` |
| | | 2. formulier invullen (`applicant`) | = | = |
| | | 3. versturen | = | = |
| | | 4. "Bedankt voor je sollicitatie op Open sollicitatie!" zichtbaar | = | = |
| 8 | het verzoek bevat de ingevulde gegevens | 1. sollicitatie-API onderscheppen → 201 en het verzoek vastleggen | `cy.intercept(…).as('verzoek')` | `page.route(…)` + `const verzoek = page.waitForRequest(`${api}/applications`)` |
| | | 2. formulier invullen (`applicant`) | = | = |
| | | 3. versturen | = | = |
| | | 4. body = `{ vacancyId: 'open', ...applicant, consent: true }` | `cy.wait('@verzoek').its('request.body').should('deep.equal', …)` | `expect((await verzoek).postDataJSON()).toEqual(…)` |
| 9 | toont een foutmelding als de API status 500 geeft | 1. sollicitatie-API onderscheppen → 500 | `cy.intercept('POST', …, { statusCode: 500 })` | `page.route(…, r => r.fulfill({ status: 500 }))` |
| | | 2. formulier invullen (`applicant`) | = | = |
| | | 3. versturen | = | = |
| | | 4. "Versturen is mislukt. Probeer het later opnieuw." zichtbaar | = | = |
| | | 5. knop "Verstuur sollicitatie" nog zichtbaar | `cy.getByRole('button', { name: … }).should('be.visible')` | `expect(getByRole('button', {name: …})).toBeVisible()` |

### flow (`describe('Flow')`, zonder `beforeEach`: elke test zet zelf zijn API-antwoorden)

| # | Testnaam | Stap | Cypress | Playwright |
| --- | --- | --- | --- | --- |
| 10 | volledige flow: vacature zoeken en open sollicitatie versturen | 1. V1 (vacatures → 200) | = | = |
| | | 2. sollicitatie-API onderscheppen → 201 | = (zoals test 7) | = (zoals test 7) |
| | | 3. V2 pagina openen | = | = |
| | | 4. V3 "4 vacatures gevonden" zichtbaar | = | = |
| | | 5. "developer" in Zoeken | = (zoals test 2) | = (zoals test 2) |
| | | 6. "2 vacatures gevonden" zichtbaar | = | = |
| | | 7. kop "Frontend developer" zichtbaar | = | = |
| | | 8. formulier invullen (`applicant`) | = | = |
| | | 9. versturen | = | = |
| | | 10. "Bedankt voor je sollicitatie op Open sollicitatie!" zichtbaar | = | = |
| | | 11. knop "Verstuur sollicitatie" afwezig | `cy.getByRole('button', { name: … }).should('not.exist')` | `expect(getByRole('button', {name: …})).toHaveCount(0)` |
| 11 | locatiefilter toont alleen vacatures op die locatie | 1. V1 · 2. V2 · 3. V3 | = | = |
| | | 4. Locatie "Utrecht" kiezen | `cy.getByRole('combobox', { name: 'Locatie' }).select(search.location)` | `getByLabel('Locatie').selectOption(search.location)` |
| | | 5. "2 vacatures gevonden" zichtbaar | = | = |
| | | 6. kop "Frontend developer" zichtbaar | = | = |
| | | 7. kop "Data-analist" zichtbaar | = | = |
| | | 8. kop "Backend developer" afwezig | = | = |
| 12 | toont een melding als de vacatures niet geladen kunnen worden | 1. vacatures-API onderscheppen → 500 | `cy.intercept('GET', …, { statusCode: 500 })` | `page.route(…, r => r.fulfill({ status: 500 }))` |
| | | 2. V2 pagina openen | = | = |
| | | 3. "Vacatures konden niet worden geladen." zichtbaar | = | = |
| | | 4. tekst "vacatures gevonden" afwezig | `cy.contains('vacatures gevonden').should('not.exist')` | `expect(page.getByText('vacatures gevonden')).toHaveCount(0)` |

Test 10 kiest geen vacature: dat kan in deze app niet (afwijking A8 in `SETUP.md`).

### fail (`describe('Opzettelijk falend')`, met V1–V3) – alleen via `test:fail`

| # | Testnaam | Stap | Cypress | Playwright |
| --- | --- | --- | --- | --- |
| F1 | verwacht een andere succestekst dan de echte | 1. sollicitatie-API → 201 · 2. formulier invullen · 3. versturen | = | = |
| | | 4. "Bedankt voor je inschrijving!" zichtbaar → **faalt** (echte tekst: "Bedankt voor je sollicitatie op Open sollicitatie!") | `cy.contains(…).should('be.visible')` – faalt na 4 s (`defaultCommandTimeout`) | `expect(getByText(…)).toBeVisible()` – faalt na 5 s (expect-timeout) |
| F2 | klikt op een knop die niet bestaat | 1. klik op knop "Annuleer sollicitatie" → **faalt op timeout** | `cy.getByRole('button', { name: 'Annuleer sollicitatie' }).click()` – faalt na 4 s | `getByRole('button', {name: 'Annuleer sollicitatie'}).click()` – faalt na 30 s (test-timeout; geen actie-timeout standaard) |

## Testdata (`testdata.json`, fictief)

- 4 vacatures: Frontend developer (Pixelfabriek BV, Utrecht), Backend developer (Datadijk BV,
  Amsterdam), UX-designer (Ontwerpstudio Noord, Groningen), Data-analist (Cijferhuis BV, Utrecht)
- sollicitant: Sam de Vries, `sam.devries@voorbeeld.example`, `06 12345678`, motivatie ≥ 20 tekens
- ongeldig: e-mail `sam@voorbeeld`, telefoon `12345`
- zoeken: `developer` (2 treffers), `kapper` (0 treffers), locatie `Utrecht` (2 treffers)
- antwoord sollicitatie-API: `{ "id": "sollicitatie-0001" }`
