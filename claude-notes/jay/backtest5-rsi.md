# Backtest 5 – RSI filtri na Jay HL (12. 10. 2026)

Ideja (Jure): če gledamo še RSI, bi bili setupi verjetno boljši.
Skripta: `orodja/bt5-rsi.js` (zagnana v TV strani prek blob <script>, Bybit API). Isti jayScan in rsi14 kot Jay App.
Top 30 Bybit USDT perp, 1D ~5 let, 6H ~2 leti. Vstop na zaprtju signalne sveče, SL 0.3 % za HL/LH, provizija 0.11 %, en trade naenkrat.

RSI filtri: div na LL (RSI[LL] > RSI[L]; short zrcalno), LL RSI≤30/≤35 (short ≥70/≥65), HL RSI≤40/≤45 (short ≥60/≥55),
skrita div HL, RSI ob signalu ≥50 / <50, HTF RSI (dnevni RSI <60 za long / >40 za short, samo 6H).

## Najpomembnejše
| Okvir | Osnova | RSI filter | Cilj | Tradeov | Zadetih | Skupaj | Na trade | Max DD | Kovanci + |
|---|---|---|---|---|---|---|---|---|---|
| 1D | vsi | brez | H | 470 | 35 % | +89.2R | +0.19R | 29.4R | 15/30 |
| 1D | vsi | **LL RSI≤35** | H | 228 | 41 % | +101.2R | **+0.44R** | 10.9R | 19/27 |
| 1D | vsi | div na LL | H | 195 | 41 % | +74.8R | +0.38R | 13.2R | 20/29 |
| 1D | +liq | brez | H | 90 | 37 % | +26.6R | +0.30R | 12.1R | 14/27 |
| 1D | +liq | div na LL | 3R | 33 | 48 % | +30.4R | +0.92R | 6.3R | 9/16 (malo vzorca) |
| 6H | +čas+HTF | brez | 2R | 258 | 41 % | +50.0R | +0.19R | 25.0R | 22/30 |
| 6H | +čas+HTF | **HL RSI≤45** | 2R | 81 | 49 % | +36.7R | **+0.45R** | 9.3R | 16/26 |
| 6H | +čas+HTF | HL RSI≤45 | 3R | 80 | 39 % | +41.8R | +0.52R | 8.4R | 17/26 |
| 6H | +čas+HTF | div na LL | 3R | 71 | 37 % | +30.9R | +0.44R | 11.7R | 15/25 |

## Kar ne dela
- 6H brez +čas+HTF: z ali brez RSI ≈ 0 (RSI sam ne naredi roba).
- LL RSI≤30 je slabši od ≤35 (premočan padec = nadaljevanje). Skrita div na HL na 1D v minusu.
- RSI ob signalu (≥50 / <50) ne pomaga bistveno.

## Zaključek
- RSI izboljša že dobre setupe: na trade približno 2× boljše, DD približno 3× manjši, a manj tradeov.
- 1D: HL setup, kjer je bil RSI na LL ≤35 ALI divergenca na LL.
- 6H: +čas+HTF in RSI na HL ≤45 (long; short ≥55), cilj 2R–3R.
- Pozor: testiranih je bilo veliko filtrov na istih podatkih (nevarnost prileganja). Oba filtra delata na longih in shortih → bolj zanesljivo, a vseeno spremljaj v živo.
