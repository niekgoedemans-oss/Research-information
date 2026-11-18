# Verificatie: normale suite 5× per library en modus

Datum: 2026-11-17T11:37:53.211Z

| library | modus | run | exitcode | tests | geslaagd | gefaald | flaky | bestanden |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cypress | lokaal | 1 | 0 | 12 | 12 | 0 | 0 | 4 |
| playwright | lokaal | 1 | 0 | 12 | 12 | 0 | 0 | 4 |
| playwright | lokaal | 2 | 0 | 12 | 12 | 0 | 0 | 4 |
| cypress | lokaal | 2 | 0 | 12 | 12 | 0 | 0 | 4 |
| cypress | lokaal | 3 | 0 | 12 | 12 | 0 | 0 | 4 |
| playwright | lokaal | 3 | 0 | 12 | 12 | 0 | 0 | 4 |
| playwright | lokaal | 4 | 0 | 12 | 12 | 0 | 0 | 4 |
| cypress | lokaal | 4 | 0 | 12 | 12 | 0 | 0 | 4 |
| cypress | lokaal | 5 | 0 | 12 | 12 | 0 | 0 | 4 |
| playwright | lokaal | 5 | 0 | 12 | 12 | 0 | 0 | 4 |
| cypress | ci | 1 | 0 | 12 | 12 | 0 | 0 | 4 |
| playwright | ci | 1 | 0 | 12 | 12 | 0 | 0 | 4 |
| playwright | ci | 2 | 0 | 12 | 12 | 0 | 0 | 4 |
| cypress | ci | 2 | 0 | 12 | 12 | 0 | 0 | 4 |
| cypress | ci | 3 | 0 | 12 | 12 | 0 | 0 | 4 |
| playwright | ci | 3 | 0 | 12 | 12 | 0 | 0 | 4 |
| playwright | ci | 4 | 0 | 12 | 12 | 0 | 0 | 4 |
| cypress | ci | 4 | 0 | 12 | 12 | 0 | 0 | 4 |
| cypress | ci | 5 | 0 | 12 | 12 | 0 | 0 | 4 |
| playwright | ci | 5 | 0 | 12 | 12 | 0 | 0 | 4 |

Testnamen (describe + test) gelijk in beide libraries: **ja** (12 vs 12).

- Flow locatiefilter toont alleen vacatures op die locatie
- Flow toont een melding als de vacatures niet geladen kunnen worden
- Flow volledige flow: vacature zoeken en open sollicitatie versturen
- Vacatures toont de lijst met vacatures
- Vacatures toont een melding als er geen vacatures gevonden worden
- Vacatures zoeken filtert de lijst
- Validatie toont een foutmelding bij een ongeldig e-mailadres
- Validatie toont een foutmelding bij een ongeldig telefoonnummer
- Validatie toont foutmeldingen bij leeg versturen
- Versturen het verzoek bevat de ingevulde gegevens
- Versturen toont een foutmelding als de API status 500 geeft
- Versturen toont een succesmelding na versturen

Resultaat: **alles groen, aantallen en namen gelijk**.
