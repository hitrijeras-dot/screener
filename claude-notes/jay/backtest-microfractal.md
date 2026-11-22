# OnlyWicks Micro-Fractal Scalping v1.8 – mehanski backtest (22. 11. 2026)

Podatki: Bybit 1m, BTCUSDT + ETHUSDT, 20. 7.–22. 11. 2026 (125 dni). Koda: `microfractal_bt.js` (teče v brskalniku na 1m podatkih).

Pravila (mehansko):
1. Sweep na 23m ali 90m: sveča pobere min/max zadnjih k sveč in zapre nazaj.
2. Failure to gap: naslednja sveča ne podre ekstrema sweepa.
3. Swing formacija: v ≤3 svečah zaprtje čez high (short: pod low) sweep sveče, brez novega ekstrema.
4. Nov imbalance: 5m FVG v smeri med sweepom in potrditvijo; vstop limit na robu FVG (čaka 2 h).
5. SL za ekstremom sweepa (0,02 %), TP fiksno R, isti 1m bar SL+TP = SL, časovni izhod 12 h. SL med 0,25 % in 2 %.
6. Seja (dan UTC): max 2 trejda, po TP drugi pol velikosti, 2 SL = konec, en trejd naenkrat. Provizija 0,08 % (maker+taker).
Ni CVD/order flow (ni podatkov) – »control confirmed« ni modeliran.

Rezultat: 144 kombinacij (23m/90m, k 3/6, 1,5/2/3R, čas ves dan / 3. 6H / London+NY, value VA da/ne, FVG da/ne) → 9 pozitivnih, 1 robusten
(obe kovanci in obe polovici v plusu): 23m, k6, 2R, samo 3. 6H (12–18 UTC), brez VA, s FVG: 146 trejdov, 43 %, +9,9R (+0,07R/trejd), DD −9,6R.
Ves dan: 376 trejdov, −49,3R. London+NY: −31,3R. Brez provizije isti najboljši: +31,5R → provizije pojedo 2/3. Sosednji k (4, 5, 10) negativni → krhko.
Pravila seje dodajo ~+1R. VA filter (profil prejšnjega dne) poslabša.
Zaključek: mehanski skelet sam ni prednost; edino, kar jasno pomaga, je čas (3. 6H). Order flow / CVD bi bilo treba preveriti posebej.
