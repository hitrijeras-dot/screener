# Backtest Jay HL – 10. 10. 2026

- 24 kovancev Bybit perp (BTC, ETH, SOL, XRP, DOGE, AVAX, LINK, SUI, TIA, ARB, OP, INJ, NEAR, APT, WIF, ZRO, TRUMP, JTO, POPCAT, SPX, ENA, SEI, 1000PEPE, VANA), 1D, 2020 → danes.
- Provizija 2 × 0.055 %, en trade naenkrat na kovanec, SL 0.3 % pod HL / nad LH, vstop ob zaprtju signalne sveče, min RR 1.
- Replay (VANA): cona 28. 9. ob potrditvi H, "HL +liq" šele ob zaprtju 9. 10. – brez prerisovanja na zaprtih svečah.

| Varianta | Tradeov | Zadetih | Skupaj | Na trade |
|---|---|---|---|---|
| +čas, cilj 3R | 179 | 30 % | +34.2R | +0.19R |
| +čas, cilj 2R | 205 | 39 % | +31.9R | +0.16R |
| vsi, cilj 3R | 382 | 29 % | +56.5R | +0.15R |
| +čas, cilj H | 181 | 34 % | +23.2R | +0.13R |
| vsi, cilj H (osnova) | 471 | 34 % | +42.9R | +0.09R |
| +liq, cilj H | 93 | 32 % | −5.7R | −0.06R |
| vsi, cilj −0.618 | 409 | 22 % | −38.1R | −0.09R |

- Osnova po smeri: long 237 tradeov +1.8R, short 234 tradeov +41.1R.
- 14 od 24 kovancev v plusu (osnova). Max DD na kovanec do ~12R.
- Mehanski test NE vsebuje Jayevega HTF time shifta (Y/Q/M) in order flowa → naslednji korak: dodaj HTF filter (mesečna/tedenska struktura) in ponovi.
