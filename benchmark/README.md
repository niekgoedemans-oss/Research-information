# Benchmark Jest vs Vitest (Next.js 16.4.6)

Mini-vacaturesite (fictieve data) met identieke unit- en componenttests in Jest 30.5.2 en Vitest 5.1.0.

```
benchmark/
  base/          Next.js-app zonder testtooling
  jest-app/      kopie van base + Jest volgens de Next.js-gids
  vitest-app/    kopie van base + Vitest volgens de Next.js-gids
  scripts/       meet-, schaal- en controlescripts (alleen Node-ingebouwde modules)
  results/       uitvoer van de metingen
  SETUP.md       exacte installatiestappen per library + alle afwijkingen van de gidsen
  BENCHMARK.md   hoe je elke meting draait (incl. watch-protocol)
```

Vereist: Node.js ≥ 22.12 (gebruikt: 24.20.0) en pnpm 12.4.2. Na een verse checkout eerst in elk
project `pnpm install --frozen-lockfile`.

## Commando's

| Wat | Commando (vanuit `benchmark/`) | Uitvoer |
| --- | --- | --- |
| Machinegegevens | `node scripts/system-info.mjs` | `results/system.txt` |
| App-code byte-identiek? | `node scripts/check-identical.mjs` | console, exit 0/1 |
| Tests alleen toegestaan verschillend? | `node scripts/diff-tests.mjs` | `results/tests.diff`, exit 0/1 |
| C6 uitvoertijd (1×, 10×, 20×) | `node scripts/measure-c6.mjs` | `results/c6.csv`, `results/c6-summary.{csv,md}` |
| C4 foutmelding | `node scripts/run-c4.mjs` | `results/c4-jest.txt`, `results/c4-vitest.txt` |
| C7 exitcodes in CI | `node scripts/run-c7.mjs` | `results/c7.csv`, `results/c7-logs/` |
| C6 watch mode (handmatig) | zie `BENCHMARK.md` → "C6d" | eigen notities |

Per project (in `jest-app/` of `vitest-app/`), altijd met `CI=true` behalve bij watch mode:

```bash
CI=true pnpm test              # normale suite: 65 tests in 9 bestanden
```
```bash
CI=true pnpm test:fail         # 2 opzettelijk falende tests (C4)
```
```bash
CI=true pnpm test:empty        # map zonder testbestanden (C7)
```
```bash
pnpm test:watch                # watch mode (zie protocol in BENCHMARK.md)
```

## Wat er niet getest wordt

`app/page.tsx` en `app/layout.tsx` zijn Server Components en worden bewust niet getest: beide
Next.js-gidsen melden dat async Server Components niet door Jest/Vitest worden ondersteund.
Geen E2E-tests.
