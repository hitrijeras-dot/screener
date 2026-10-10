# Backtest 2 – Jay HL na več okvirjih (10. 10. 2026)

Isti `jayScan` kot screener in TV indikator, zagnan v brskalniku na Bybit podatkih. Surovo: `backtest2-surovo.json`
(polja na varianto: tradeov, zadetih, skupaj R, max DD, long N, long R, short N, short R, kovancev v plusu, kovancev s tradei).

## Nastavitve
- Kovanci: top 30 Bybit USDT perp po prometu (23m: top 15).
- Obdobje: 1D ~5 let, 6H ~2 leti, 90m ~4 mesece (iz 30m), 23m ~2 tedna (iz 1m, sidro 00:00 UTC).
- Vstop ob zaprtju signalne sveče, SL 0.3 % pod HL / nad LH, provizija 0.11 % (v R), en trade naenkrat na varianto in kovanec, min RR 1.
- Filtri: **vsi**, **+čas** (1D: 3. teden ali prvih 5 dni meseca; intraday: 3. 6H 12–18 UTC), **HTF** (zadnji potrjen pivot na 1W za 1D, na 1D za intraday: HL/HH = gor, LL/LH = dol; trade samo v tej smeri), **+čas+HTF**, **+liq**.
- Cilji: H (stari vrh/dno), 2R, 3R.

## Najboljše po okvirju
| Okvir | Varianta | Tradeov | Zadetih | Skupaj | Na trade | Max DD | Kovanci v plusu |
|---|---|---|---|---|---|---|---|
| 1D | +liq, cilj H | 96 | 38 % | +32.0R | +0.33R | 5.1R | 13/25 |
| 1D | +liq, cilj 3R | 112 | 34 % | +38.1R | +0.34R | 6.3R | 13/26 |
| 1D | vsi, cilj H | 494 | 35 % | +74.6R | +0.15R | 21.6R | 17/30 |
| 6H | +čas+HTF, cilj 2R | 250 | 40 % | +40.0R | +0.16R | 5.3R | 20/30 |
| 6H | +čas+HTF, cilj 3R | 239 | 29 % | +34.3R | +0.14R | 7.2R | 19/28 |
| 90m | +čas+HTF, cilj 2R | 183 | 39 % | +22.6R | +0.12R | 7.4R | 15/30 |
| 23m | HTF, cilj 3R | 109 | 33 % | +25.5R | +0.23R | 9.5R | 10/15 |
| 23m | +liq, cilj 2R | 118 | 42 % | +21.0R | +0.18R | 10.2R | 9/15 |

## Kar NE dela
- 6H brez filtrov: okrog 0 (vsi|H −0.01R na trade).
- 90m brez filtrov: močno v minusu (≈ −0.18R na trade) – SL je majhen, provizija poje. Tudi +liq na 90m −0.2R.
- 6H +liq: v minusu (−0.09 do −0.10R).
- 1D +čas+HTF: v minusu (−0.04 do −0.13R) – na 1D je HTF (1W) filter prestrog / prepozen.

## Zaključek
- **1D**: indikator ima prednost; najboljši je **+liq** (HL na stari likvidnosti), +0.33R na trade z majhnim DD.
- **6H in 90m**: samo s kombinacijo **3. 6H + smer HTF (1D)** in ciljem **2R**. Brez tega ne.
- **23m**: obeta (HTF, +liq), a samo ~2 tedna podatkov in skoraj vsi HTF tradei so bili longi (trg gor) → še ni zanesljivo.
- Mehanski test: brez order flowa (ABS/IMB), brez Jayevega delnega TP1 in SL na BE, brez VP. Vstop na zaprtju, ne na retestu.

## Predlog za screener / indikator
- 1D: poudari +liq.
- 6H/90m: pokaži setup kot "dober" samo, če je +čas IN v smeri HTF; privzeti cilj 2R.
- 23m: zbiraj zgodovino signalov (naloga 2 v claude-code-naloge.md) in čez mesec ponovi test.
