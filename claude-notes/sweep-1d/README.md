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
### Aplikacija (13. 10. 2026 zvečer, na Juretovo željo: "vse kot app", pregledni grafi, drugačna tema, lasten bias)
- PWA (`manifest.webmanifest`, `sw.js`, ikone), spodnja navigacija: Screener, Bias, Limiti, Log, Pravila (vsak zaslon ima svoj #hash, deluje tudi gumb nazaj). Pilula z biasom v glavi odpre zaslon Bias.
- Graf: preklop TF (1m, 5m, 15m, 1H, 4H, 1D); oznake v desnem robu, razporejene brez prekrivanja; polne so le cone točk, kjer je cena, ostale rahle brez napisov; fib samo dva najbližja ceni.
- **Tema "Repsol"** (13. 10. 2026): črna prevladuje, neon oranžna (#ff7a00) poudarek z rahlim sijem, long #2dff8f, short #ff2d55, cone: FVG cian, IFVG vijolična, 1-2 oranžna, GP rumena, OTE roza. Privzeto temna, gumb ◐ za svetlo.
- **Jezik:** gumb EN/SL v glavi (shrani v `sweep_lang`, ponovno naloži stran). Besedila so slovenska; v angleškem načinu jih sproti zamenja prevajalnik (slovar `EN` + pravila `EN_RX`, MutationObserver), tudi v grafih. Ko dodaš novo besedilo, dodaj tudi prevod v `EN`.
- **TV lista:** 13. 10. 2026 narejena lista "Sweep Model 13.10." po rubrikah (smer · točka), prek TradingView API `/api/v1/symbols_list/custom/` (rubrike = vnosi `###Ime`). Kovanec je lahko v listi samo enkrat: pri obeh smereh višja ocena, pri enaki smer biasa; pri več točkah prednost CISD → 1-2 → FVG → IFVG → Sweep → FIB → GP → OTE.
- **Lasten bias (zaslon Bias):** top 100 kripto. Višji okvirji: % nad/v/pod CPR prejšnjega M/W/D. Seje (UTC 1h sveče): Azija 0–8, London 8–13, NY 13–21; rezultat seje = 0,5 × pivot (neto položaj zaprtja vs dnevni CPR) + 0,3 × smer (neto zaprtje nad/pod odprtjem seje) + 0,2 × sweep (neto: posweepal low prejšnje seje in zaprl nad njim = +1, high in zaprl pod = −1). Skupaj = 0,5 × povprečje M/W/D + 0,5 × trenutna/zadnja seja; ≤ −20 Bearish, ≥ +20 Bullish, sicer Neodločen.

### Prejšnja različica biasa (po metodi Scanner X; nadomeščena z lastnim)
- Scanner X je na portal.easyalgotools.com/scanner-x (iframe scannerx.easyalgotools.com z osebnim žetonom – žetona NIKOLI ne dajaj v repo). Aplikacija ga zato ne bere, ampak bias izračuna po isti metodi iz priročnika: CPR pivot (P=(H+L+C)/3, BC=(H+L)/2, TC=2P−BC) prejšnjega dne/tedna/meseca; kovanec je "nad" nad TC/BC, "pod" pod njima, sicer "vmes".
- Top 100 kripto po prometu na Bybitu. M/W/D: % nad / vmes / pod. Seje (UTC): Azija 0–8, London 8–13:30, NY 13:30–21; vrednost = neto % (nad − pod) glede na dnevni pivot ob zaprtju seje (trenutna seja = LIVE), plus sprememba od prejšnje seje.
- Oznaka: povprečje neto M/W/D ≤ −20 → Bearish, ≥ +20 → Bullish, sicer Neodločen. Osvežitev na 10 min.
- Primerjava 13. 10. 2026 18:40: Scanner X je kazal Bearish, M 61 % pod, W 75 % pod, D 70 % pod, Azija −23 %, London −54,3 %, NY −54,2 % (LIVE).
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

## Različica 2 (13. 10. 2026 zvečer) – kaj je novo in kje je stara
- **Stara različica (v1) je shranjena** v `sweep-v1/` (https://hitrijeras-dot.github.io/screener/sweep-v1/). Jure: "če ne bo ok, si zapomni to serijo" → če v2 ne ustreza, se vrneva na v1 (kopiraj `sweep-v1/` nazaj v `sweep/`, dodaj nazaj `sw.js`).
- **Backtest biasa** (`koda/bias_bt.py`, `koda/bias_eval.py`; bias izračunan iz 20 testiranih kovancev po isti formuli kot v aplikaciji, po urah):
  - Kot **filter** bias ne pomaga: posli proti biasu (tot@open < −20) so imeli +0,32 R/posel, v smeri (> +20) +0,42 R, a samo 88 poslov – preveč izgubljenih poslov in ni stabilno po obdobjih.
  - Kot **velikost rizika** pomaga: pol rizika, ko je bias zadnje seje ob odprtju dneva (= včeraj NY) proti smeri (sess·smer < −20): +127,7 R, maxDD 17,3 R (vs +146 R, DD 23,5 R; razmerje dobiček/DD 7,4 vs 6,2).
  - Long +0,34 R/posel, short +0,26 R/posel → obe smeri ostaneta.
- **Aplikacija v2:** prvi zaslon je **Danes** (Sweep 1D limiti, bias trga + včeraj NY, riziko ½ proti biasu seje – nastavljivo "½ proti biasu / Vedno poln", riziko 50/75/100 $, količina = riziko / razdalja do SL, smer Oba/Long/Short, veljavni setupi na vrhu, 🔔 obvestila v brskalniku ob novem setupu, ko je aplikacija odprta). Screener: privzeto "V smeri biasa" (pri neodločenem obe smeri) in "Do SL ≤ 3 %" (vse/5/3/2 %).

## Velik test "vse možno" (13. 10. 2026 zvečer)
Koda: `koda/engine2.py` (vse točke indikatorja kot vstop), `koda/grid2.py`, `koda/conf.py`. Rezultati: `rezultati/grid2_vse_kombinacije.csv`, `rezultati/potrditev_28_novih.csv`.

**Popravek prejšnjih številk:** simulacija na 1h svečah je bila preveč optimistična (izpustila je posle, ki so se v isti uri odprli in zadeli SL). Na 5m svečah je Sweep 1D na 20 kovancih **+0,18 do +0,25 R/posel** (ne +0,30). Najboljši je SL tik za ekstremom (brez dodatka).

**Mreža 1080 kombinacij** (HTF 1H, 4H, 6H, 12H, 1D, 1W × 12 vstopov: level, FVG, FVG sredina, IFVG, CISD, 1-2 cona, GP, fib 0,5, sredina, market, 5m CISD na nivoju (2 različici) × TP EQ / nasprotni ekstrem / 1,5R / 2R / 3R × SL dodatek 0 / 2 % / 5 %):
- 1H, 4H, 6H: **vse negativno** (ni roba).
- 5m CISD na posweepanem nivoju (Juretov način): **negativno na vseh okvirjih** (−0,09 do −0,28 R).
- Market vstop: negativno povsod.
- Pozitivno le 12H in 1D. 1W ima premalo poslov.

**Potrditev na 28 novih kovancih** (1000PEPE, APT, BAT, FIL, HBAR, INJ, LIT, OGN, ONDO, OP, PUMPFUN, QNT, Q, RENDER, RSR, STRK, STX, S, TIA, UNI, WLD, W, ZEC, ZRO, TRUMP, BLUR, XPL, ICP; 15m izvedba, 16. 4.–13. 10.):
| Različica | 20 starih | 28 novih | 28 novih, strožje polnjenje |
|---|---|---|---|
| Sweep 1D (level, TP EQ, SL 0) | +0,24 R | **+0,06 R** | +0,02 R |
| 1D level, TP 2R | +0,14 | +0,08 | +0,04 |
| 12H fib 0,5, TP EQ | +0,18 | +0,09 | +0,08 |
| 12H level, TP 3R | +0,07 | +0,12 | +0,04 |
| 12H FVG, TP 3R | +0,07 | +0,01 | −0,01 |

**Zaključek:** noben različica nima močnega, potrjenega roba. Sweep 1D je bil delno prilagojen 20 kovancem. Zadnja 2 meseca (blok C) so bila dobra skoraj za vse. Najbolj stabilen kandidat za nadaljnje testiranje: **12H fib 0,5 → TP EQ** (pozitiven v obeh skupinah tudi s strožjim polnjenjem). Pred izzivom CFT: forward test (paper log v aplikaciji + Bybit demo) vsaj 4 tedne.

## Aplikacija: graf s setupom (13. 10. 2026)
V zaslonih Danes in Log klik na vrstico odpre graf (5m/15m/1H/4H/1D): predvčerajšnja in sweep sveča (pasova), limit (oranžna), SL, TP, R/R škatli kot TV Long/Short orodje, ▲/▼ ekstrem, krogca za vstop/izhod, črta "limit poteče", spodaj podatki in opis v slovenščini.

## Potrditev na nivoju (Jure: "tam bi čakal potrditev") – 13. 10. 2026
Setup 1D ali 12H sweep → cena se dotakne posweepanega nivoja → CISD na 5m / 15m / 1H. Vstop: (a) takoj ob zaprtju potrditvene sveče (taker) ali (b) limit na retest CISD nivoja. SL pod lokalnim dnom ali pod ekstremom sweepa. `rezultati/potrditev_cisd.csv`, koda `engine2.py` (entry cisd5, cisd5w, cisdr, cisdrw; param ltf).
- Takojšen vstop po potrditvi: **negativno** (mediana −0,15 do −0,20 R; s SL pod ekstremom −0,07 do −0,11 R).
- Limit na retest CISD: okoli 0 do +0,1 R. Najboljše: 1H CISD + retest, TP 2–3R: +0,05 do +0,12 R na obeh skupinah kovancev, a nestabilno po obdobjih (prvi 3 meseci minus, zadnja 2 plus).
- Zaključek: mehanska potrditev ne izboljša slepega limita. Če čakaš potrditev, vstopi z limitom na retest, ne po trgu. Juretova ročna presoja ni enaka mehanskemu CISD – to bo pokazal dnevnik setupov.

## Točke indikatorja kot filter za Sweep 1D (13. 10. 2026, `koda/feat2.py`)
| Filter | 20 kovancev (5m) | 28 novih (15m) |
|---|---|---|
| vsi | n 317, +0,18 R | n 457, +0,06 R |
| CISD potrjen v sweep sveči | +0,07 | +0,02 |
| brez CISD | **+0,84** (n 46) | **+0,17** (n 116) |
| FVG po ekstremu | +0,19 | +0,07 |
| zaprtje globoko nazaj (>30 % razpona P) | **+0,39** (n 98) | **+0,18** (n 144) |
| zaprtje plitvo (≤30 %) | +0,08 | 0,00 |
Presenetljivo: potrditev indikatorja (CISD/FVG) v sweep sveči ne pomaga, celo slabše. Globoko zaprtje nazaj pomaga v obeh skupinah. Vzorci so majhni – kandidat za nadaljnji test, ne pravilo.

## TradingView indikator "Sweep Screener · Claude" (13. 10. 2026)
`sweep_screener_indikator.pine` – riše isto kot graf v zaslonu Screener (logika `/*SM*/`): posweepan nivo, SL (ekstrem), CISD, FVG, IFVG, VI, 1-2, GP, OTE, fib pivoti (2 najbližja), Open HTF; setup okvir 6H (graf 5m) ali 1D (graf 15m). Plus današnji Sweep 1D limiti (limit, SL, TP, RR, status). Shranjen v Juretovem TV kot zasebna skripta, dodan na layout "Jay Time & Value".
Pine past: zgodovina cen (`high[x]`) samo v globalnem obsegu, ne v funkcijah, ki se kličejo le na zadnji sveči – sicer napačne vrednosti. Indikator mora biti na glavni ceni lestvici (`scale = scale.right`).
TV tema Repsol (13. 10., na Juretovo željo ISTI VEČER POVRNJENO – layout spet na predlogi "jay": belo ozadje, cian/črne sveče; OnlyWicks barve spet črne; predloga Repsol izbrisana). Prej: layout "Jay Time & Value" – ozadje #050505, sveče #2dff8f / #ff2d55, križec #ff7a00 (chart.applyOverrides). OnlyWicks Sweep Model: črne barve (14) zamenjane s svetlo sivo #DBDBDB prek dialoga nastavitev. POZOR: `setInputValues` na invite-only skripti (OnlyWicks) jo pokvari ("Can't parse pine") – barve spreminjaj samo prek dialoga.

## Screener ↔ pravi indikator (13. 10. 2026 pozno zvečer)
Risbe OnlyWicks Sweep Model se dajo prebrati v TV spletu: `TradingViewApi._activeChartWidgetWV.value()._chartWidget.model().model().dataSources()` → vir "Sweep Model" → `_graphics._primitivesCollection.dwglabels/dwgboxes/dwglines.get(...).get(false)._primitivesDataById` (x = indeks v `_graphics._indexes` → `model.timeScale().indexToTimePoint`). Primerjava na LIT, BTC, ZEC, HYPE, STRK, WLD (6H, 5m):
- **OTE v indikatorju = 0,618–0,786 povratka od ekstrema do najdlje po njem** (to je bila pri nas "1-2"). Naša stara OTE (noga v sweep) v indikatorju NE obstaja → odstranjena. "OTE ✓" = cona dotaknjena.
- **CISD**: če je sveča ekstrema sama dostavna (za short zelena), je CISD = open njenega niza, tudi dolžine 1 (LIT 3.3937). Sicer kot prej. Ujemanje: LIT, ZEC, STRK, WLD ×2.
- **FVG**: indikator kaže samo prvi FVG po ekstremu.
- 1-2 cone indikator na teh kovancih ni narisal (sprožilec FVG, "impulse must clear") → iz screenerja umaknjena.
- **Še odprto**: indikator setup označi z "Bull/Bear x/5" le pri nekaterih sweepih (BTC, HYPE, STRK long so imeli samo oznako ekstrema, brez točk); setupi ostanejo vidni več HTF sveč (BTC short iz 10:10 še ob 23:45). OTE ni narisan pri LIT short. Za to rabim večji vzorec (30+ kovancev).
- 14. 10.: Jure ne želi ocene setupa v screenerju → odstranjena (filter "Ocena", stolpec, opis). Graf kot indikator: fib samo dotaknjeni (od začetka sweep sveče) ali tisti, na katerem je cena; GP, VI, Open HTF samo, ko je cena tam.
