# Testnamen per library (statische vergelijking)

## main/

| Bestand | Describe | Test | Stappen Cypress | Stappen Playwright | Gelijk |
| --- | --- | --- | --- | --- | --- |
| flow | Flow | volledige flow: vacature zoeken en open sollicitatie versturen | 11 | 11 | ja |
| flow | Flow | locatiefilter toont alleen vacatures op die locatie | 8 | 8 | ja |
| flow | Flow | toont een melding als de vacatures niet geladen kunnen worden | 4 | 4 | ja |
| vacatures | Vacatures | toont de lijst met vacatures | 1 | 1 | ja |
| vacatures | Vacatures | zoeken filtert de lijst | 6 | 6 | ja |
| vacatures | Vacatures | toont een melding als er geen vacatures gevonden worden | 4 | 4 | ja |
| validatie | Validatie | toont foutmeldingen bij leeg versturen | 6 | 6 | ja |
| validatie | Validatie | toont een foutmelding bij een ongeldig e-mailadres | 4 | 4 | ja |
| validatie | Validatie | toont een foutmelding bij een ongeldig telefoonnummer | 4 | 4 | ja |
| versturen | Versturen | toont een succesmelding na versturen | 4 | 4 | ja |
| versturen | Versturen | het verzoek bevat de ingevulde gegevens | 4 | 4 | ja |
| versturen | Versturen | toont een foutmelding als de API status 500 geeft | 5 | 5 | ja |

## fail/

| Bestand | Describe | Test | Stappen Cypress | Stappen Playwright | Gelijk |
| --- | --- | --- | --- | --- | --- |
| opzettelijk-falend | Opzettelijk falend | verwacht een andere succestekst dan de echte | 4 | 4 | ja |
| opzettelijk-falend | Opzettelijk falend | klikt op een knop die niet bestaat | 1 | 1 | ja |

Bestanden in main/: cypress 4, playwright 4.

Resultaat: **gelijk**.
