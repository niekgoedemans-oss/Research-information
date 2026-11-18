# C6 – uitvoertijd (mediaan van 5 gemeten runs)

Gemeten op 2026-11-17T11:37:53.277Z, duur 40.2 min. Machine: zie results/system.txt.
Tijd = wandklok van het hele runnercommando; build en serverstart tellen niet mee.

| library | modus | schaal | tests | bestanden | workers | mediaan (ms) | min | max | ms/test | alle exit 0 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cypress | lokaal | 1× | 12 | 4 | 1 | 10528 | 10491 | 10688 | 877.3 | ja |
| playwright | lokaal | 1× | 12 | 4 | 5 | 1662 | 1643 | 1682 | 138.5 | ja |
| cypress | ci | 1× | 12 | 4 | 1 | 10582 | 10557 | 10706 | 881.8 | ja |
| playwright | ci | 1× | 12 | 4 | 1 | 2944 | 2938 | 2972 | 245.3 | ja |
| cypress | lokaal | 5× | 60 | 20 | 1 | 45585 | 45475 | 46424 | 759.8 | ja |
| playwright | lokaal | 5× | 60 | 20 | 5 | 4098 | 3911 | 4190 | 68.3 | ja |
| cypress | ci | 5× | 60 | 20 | 1 | 45923 | 45296 | 46237 | 765.4 | ja |
| playwright | ci | 5× | 60 | 20 | 1 | 12114 | 11657 | 12181 | 201.9 | ja |
| cypress | lokaal | 10× | 120 | 40 | 1 | 90481 | 90456 | 90634 | 754.0 | ja |
| playwright | lokaal | 10× | 120 | 40 | 5 | 7053 | 7043 | 7108 | 58.8 | ja |
| cypress | ci | 10× | 120 | 40 | 1 | 90489 | 90245 | 90687 | 754.1 | ja |
| playwright | ci | 10× | 120 | 40 | 1 | 23418 | 23333 | 23542 | 195.2 | ja |
