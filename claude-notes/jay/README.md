# Jay sistem (OnlyWicks "time and value") – vse na enem mestu

Stanje: 10. 10. 2026, 17:20 (naš čas). Strogo ločeno od CISD sistema, Sistem EAX in Jikoku.

## Kje je kaj
| Kaj | Kje |
|---|---|
| Pravila po domače | [pravila.md](pravila.md) (+ Claude Doc "OnlyWicks – Time & Value pravila") |
| Indikator za TradingView | [jay_hl_indikator.pine](jay_hl_indikator.pine) → na TV shranjen kot "Jay HL · Time × Value" |
| Backtest strategija (20 variant naenkrat) | [jay_hl_backtest_strategija.pine](jay_hl_backtest_strategija.pine) – na TV ni shranjena, naloži po potrebi |
| Rezultati backtesta | [backtest.md](backtest.md), surovo: backtest-1D-surovo.txt |
| Pregled trga in narisani setupi | [setupi-2026-10-10.md](setupi-2026-10-10.md), surovo: scan-2026-10-10-surovo.txt |
| Screener (telefon) | https://hitrijeras-dot.github.io/screener/jay/ (koda: `/jay/index.html`) |
| Animacija vzorca | animacija-jay-higher-low.html (+ Claude artefakt "Jayev HTF Higher Low") |
| Učenje iz Discorda (samo Jayeve objave) | [discord-jay.md](discord-jay.md) |

## TradingView
- Layout **"Jay Time & Value"** (prej layout "1") – samo za Jayev stil. Na njem: Jay HL indikator, OnlyWicks Daily Process, Oscillator V.6.2. Jure je ostale indikatorje sam odstranil.
- Watchlista **"Jay HL"** (id 350380368) – sekcije: potrjen HL, v coni, moj trade.
- TV paket ne dovoli več layoutov (zato je bil uporabljen layout "1").
- Pozor: pine_new v TV MCP lahko prepiše odprto skripto. Strategijo nalagaj previdno, potem indikator vrni.

## Jayevi okvirji (Jure, 10. 10.)
Vedno 6H, 90m, 23m; včasih tudi 5m, 3m, 1m. Swing ideje na 1D/1W, 23D, mesec, kvartal.

## Delovni postopek (kot pri VANA)
1. Na 1D najdi L → LL → H (zlom zadnjega vrha), fib od zadnjega dna noge do H.
2. Golden pocket 0.618–0.79, staro L (likvidnost) v coni = +liq.
3. Čas: Q/mesec time shift, 3. teden (15.–21.); intraday 3. 6H (14–20 poletni čas), 3. 90m (17:00–18:30).
4. HL potrjen = zelena sveča zaprta nad 0.618 (samo zaprta sveča šteje!).
5. Nariši: L, LL, H, HL, fib, staro L, časovna črta, Long/Short orodje. Dodaj na listo "Jay HL".
6. Tveganje 1 % na trade, SL pod HL, TP H ali vsaj 2R.

## Odprti trade
- VANA long (Jure sam): vstop ~1.06, SL 0.955, TP 1.33.
