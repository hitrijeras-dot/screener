# Sweep 1D – strategija iz OnlyWicks Sweep Model (backtest 13. 10. 2026)

Jure je 13. 10. 2026 rekel: zapomni si to strategijo, kmalu začneva; zaenkrat samo beleži, kaj bi bilo (paper log); kasneje naj Claude trguje sam po teh pravilih.
Ločeno od Sistem EAX, CISD sistema in Jay HL – pravil ne mešati.

- **Aplikacija:** https://hitrijeras-dot.github.io/screener/sweep/ (`sweep/index.html`) – zavihki *Screener*, *Danes* (aktivni limiti Sweep 1D), *Paper log* (od dnevne sveče 13. 10. 2026), *Pravila*.
- **Screener (zavihek 1, dodan 13. 10. 2026 na Juretovo željo):** najde kovance, ki so **zdaj na točki** po indikatorju Sweep Model – v FVG, na HTF fib pivotu ali v 1-2 coni. Setup 6H (LTF 5m, kot privzeti indikator) ali 1D (LTF 15m); Top 50/100 po prometu ali 20 testiranih. Logika med `/*SM*/` in `/*SM-END*/`:
  - setup = HTF sveča (odprta ali zadnja zaprta, živi še eno HTF svečo) posweepa low/high prejšnje; po ekstremu iste LTF potrditve kot `engine.py` (CISD nivo = open prve sveče v nizu ≥2, FVG ≥ 0,3 ATR, retest, 1-2 cona 0,618–0,786 po CISD, RSI divergenca);
  - FVG: vsi FVG po ekstremu, ki jih close ni prebil; fib: pivot (H+L+C)/3 ± f·(H−L) (0,5 … 2,618) od **najnižjega posweepanega lowa med zadnjimi 4 HTF svečami** (tako dela indikator – preverjeno na HYPE 13. 10.: FIB 0,5/0,618/0,786 = 80,409/80,057/79,557); toleranca "na točki" = 0,25 × ATR(LTF).
  - Preverjeno z indikatorjem na HYPE 6H: sweep ekstrem 80,52 (15:45 UTC) in pending CISD 82,188 se ujemata. Koda indikatorja je zaklenjena, zato drobne razlike niso izključene.
### Screener – točke in filtri (posodobljeno 13. 10. 2026 zvečer)
- Samo kripto: Bybit `instruments-info`, `symbolType` prazen ali `innovation` (izločeni `stock`, `ETF`, `commodity`, `forex`).
- Filtri za vse točke indikatorja (gumbi, več hkrati): **FVG**, **IFVG** (bear FVG iz poteze v sweep, ki ga je close obrnil), **VI** (volume imbalance po sweepu), **CISD** (retest potrjenega CISD nivoja), **1-2** cona, **FIB** pivoti, **GP** (0,618–0,65 prejšnje HTF sveče), **OTE** (0,618–0,786 noge od najvišjega high od referenčne sveče do ekstrema), **Sweep nivo** (retest posweepanega nivoja), **Open HTF**. Plus min. ocena x/5 in smer.
- Klik na vrstico odpre **graf** (SVG, zadnjih 140 LTF sveč) z narisanimi conami (FVG, IFVG, VI, 1-2, GP, OTE), črtami (posweepan nivo, ekstrem/SL, CISD, FIB, Open HTF), začetkom sweep sveče, ▲/▼ na ekstremu in kratkim opisom.
  - **Pozor:** backtest je pokazal, da ti signali sami (6H, vstop ob CISD) nimajo roba. Screener je za iskanje kandidatov, odločitev o vstopu ostane po pravilih.
- **Logika v aplikaciji** (`/*CORE*/ … /*CORE-END*/`) je preverjena proti Python backtestu: 476 poslov se ujema 1:1, rezultat +0,311 R/posel (JS) proti +0,302 R (Python). Če spremeniš pravila, spremeni oboje.
- `?od=2026-09-13` v URL-ju začne paper log na drug datum (za preverjanje).

## Pravila (točno to je testirano)
1. **Setup (1D, UTC – pri nas zapre ob 2:00):** dnevna sveča S posweepa low (long) / high (short) prejšnje dnevne sveče P.
2. **Potrditev:** S se zapre nazaj: `S.close > P.low` (long) / `S.close < P.high` (short).
3. **Vstop:** naslednji dan limit (Post-Only) točno na `P.low` / `P.high`. Velja 24 ur (24 × 1h sveč). Če pred vstopom cena preseže ekstrem S (S.low / S.high), setup odpade.
4. **SL:** `S.low − 0,1 × ATR(14, 1h)` (short: `S.high + 0,1 × ATR`), ATR na sveči vstopa. Razdalja SL 0,4 %–3 %, sicer preskoči.
5. **TP:** sredina P: `(P.high + P.low) / 2`. Če je RR < 1, preskoči.
6. **Izhod po času:** po 48 urah (1h svečah) zapri po close.
7. **Omejitev:** največ 3 posli v isto smer na dan (po času vstopa).
8. Ocena x/5 in potrditve indikatorja (div, FVG, retest, CISD, 1-2 cona) se **ne** uporabljajo – niso izboljšale rezultata.

V TradingView: Sweep Model → *Setup source = HTF-3 (1 day)*.

## Rezultati backtesta (20 Bybit perp kovancev, 5m podatki 16. 4.–13. 10. 2026)
Kovanci: AAVE ADA ARB AVAX BNB BTC DOGE DOT ENA ETH HYPE LINK LTC NEAR SOL SUI TAO TRX WIF XRP.
Provizije: maker 0,02 %, taker 0,055 % + 0,02 % slip (SL in izhod po času kot taker).

| Strategija | Poslov | Win % | R/posel | Skupaj R | Max padec R | A | B | C |
|---|---|---|---|---|---|---|---|---|
| Indikator privzeto (6H, vstop ob 5m CISD, 2R) | 10.728 | 35,6 | −0,21 | −2.232 | 2.279 | −0,18 | −0,23 | −0,27 |
| 6H sweep + retest nivoja (15m) | 2.025 | 41,1 | +0,05 | +92 | 75 | +0,01 | +0,12 | +0,01 |
| **1D sweep + retest nivoja → EQ** | **483** | **44,5** | **+0,30** | **+146** | **23,5** | +0,23 | +0,49 | +0,11 |
| 1D … + max 3 na smer/dan | 390 | 42,3 | +0,23 | +88 | 15,9 | +0,15 | +0,38 | +0,15 |

A = 16. 4.–15. 7. (pri iskanju pravil **nevideno**), B = 15. 7.–13. 9., C = 13. 9.–13. 10.
Vsak mesec pozitiven. 13/20 kovancev v plusu. Najdaljši niz izgub 13. Povprečno trajanje 10 h (90 % v 24 h).

Robustnost (TP 2R osnova, R/posel): 1,5R +0,19 · 3R +0,12 · 4R +0,16 · EQ +0,30 · SL brez bufferja +0,25 · SL +0,5 ATR +0,06 · veljavnost 12h +0,19 / 48h +0,24 · limit mora iti 0,05 % čez nivo +0,14 · min SL 0,6 % +0,15 · izvedba na 15m +0,13.

**Opozorila:** to je prepis logike (koda indikatorja je zaklenjena). Polnjenje limita ob dotiku je optimistično – s strožjim polnjenjem je rob pribl. pol manjši. Prvi test (6H, filtri) je na starejšem obdobju A padel – zato velja samo dnevna različica.

## 10.000 $ in 1 % rizika (100 $/posel)
| Način | Konec | Max padec |
|---|---|---|
| Fiksno 100 $, vsi posli | 24.596 $ | −2.350 $ (−16 %) |
| Obrestno 1 %, vsi posli | 38.129 $ | −7.094 $ (−22 %) |
| Fiksno 100 $, max 3/dan | 18.776 $ | −1.590 $ (−13 %) |
| Obrestno 1 %, max 3/dan | 22.364 $ | −2.748 $ (−15 %) |

## Crypto Fund Trader 10k 2-step (Juretov načrt)
Meje: dnevna izguba 400 $, skupna 1.000 $ (ne pod 9.000 $). Cilja: faza 1 +8 %, faza 2 +5 %, min 5 trgovalnih dni.
- Riziko **75 $** na posel, blizu cilja 50 $; max 3 na smer na dan.
- Nov posel samo, če *današnja izguba + odprti riziko + nov ≤ 350 $* in *stanje − odprti riziko − nov ≥ 9.050 $*.
- Simulacija (vsak dan kot začetek): faza 1 uspešno 94 %, mediana 14 dni; faza 2 mediana 9 dni. Rob pol manjši → 67 % uspeha; brez roba → 24 %.
- Preveri, kdaj CFT resetira dnevni limit (simulacija: 00:00 UTC). Dnevni DD je na equity.

## Ko Claude trguje sam (ko Jure reče "začniva")
1. Vsak dan po 2:00 (lahko tudi kasneje, limit velja do 2:00 naslednji dan): odpri aplikacijo `sweep/` → zavihek *Danes*.
2. Za vsak setup s statusom "čaka na vstop" (ne "bo preskočen") na Bybit postavi **Post-Only limit** na nivo, SL in TP iz tabele; velikost = riziko $ ÷ razdalja SL.
3. Upoštevaj max 3 na smer na dan in CFT varovalki zgoraj. Neizpolnjene limite prekliči ob 2:00 naslednji dan.
4. Pozicijo, ki je odprta 48 h, zapri.
5. Vsak posel označi na TradingView z orodjem Long/Short. Odprte posle in P&L poročaj v tabeli (samo odprte, vrstica Skupaj).

## Koda (`koda/`)
- `engine.py` – replikacija Sweep Model + backtester (parametri v `DEFAULT`; končna različica: `htf=86400, ltf=3600, entry='plevel_limit', after_close=True, close_rule='back', tp='prev_eq', min_rr=1, life=24, max_hold=48, min_risk=0.004, max_risk=0.03, sl_buf_atr=0.1`).
- `blocks.py` – zagon po obdobjih A/B/C (mapi `data_old/` in `data/` s 5m CSV).
- `cft.py` – simulacija CFT challenga. `decode.py` – dekodiranje podatkov, prenesenih iz brskalnika.
- Podatki niso v repu (prevelik). Pridobitev: Bybit `v5/market/kline` (5m, 90 dni na kos) – iz brskalnika, ker okolje do Bybita nima dostopa.
- `rezultati/` – CSV-ji in seznam vseh 483 poslov (`posli-1D-EQ.csv`).
