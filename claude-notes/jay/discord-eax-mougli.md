# EAX (Easy Algo) – #secret-vault, objave uporabnika Mowgli (10. 10. 2026)

Vir: Discord strežnik **Easy Algo**, kanal **#secret-vault** (id 1553688173601886268), iskanje `from:Mowgli (mowgli358) in:secret-vault` → 310 objav, 68 slik.
- Kanal obstaja šele od **27. 9. 2026**, zato "zadnjih nekaj mesecev" ni na voljo. Pregledano je obdobje 27. 9.–10. 10.
- Mowgli je "EA Management", avtor EAsy Algo. Vault je **zaprta beta "EAX Strategy Cards"** (Reversal engine) na portalu portal.easyalgotools.com → EAX-AI.
- Tu so samo povzetki, ne kopije objav. Časi so v **UTC**. Kartice kažejo čas UTC+2; preverjeno z ledgerjem: ORDER kartica 16:55 + 3 h 35 min = zaprto 18:30 UTC.

## 1. Model vstopa
Ni ročni sistem, ampak **algoritem za obrate (mean reversion) na izčrpanosti**. Mowgli formul ne pove ("no, you can't have my formulas").

**Kaj mora biti izpolnjeno:**
- **Izčrpana regija:** RSI visok/nizek na 1H, 4H, 12H, D in W, divergence na teh okvirjih in cena pri/čez **dnevni ali tedenski pivot** (D/W R1–R3, S1–S3). Kartica kaže razdaljo do D R2/R3 in W R2/R3 ter oznake "past R1", "resistance hit", "% off high".
- "Višji okviri postavijo trade, nižji tempirajo obrat."
- **Sprožilca (triggers):**
  - **Sweep:** pobran vrh/dno.
  - **Rejection:** "ostra bearish displacement sveča, ki zapre po pobranem vrhu" (pri longu zrcalno), merjena z razmerjem volatilnosti in izčrpanosti.
  - Kartica se izpolni na zaprtih 15-minutnih svečah, podatki se osvežijo vsake 3 minute.

**Okvirji:** kartica ni vezana na en okvir. Nivoji pridejo iz D in W pivotov, RSI in DIV iz 1H–W, potrditev na 15m.

**SL:** iz volatilnosti sveče in sweepa, **največ 8 %** (oznaka "capped"). Če cilj ni dosegljiv, kartica nima vstopa.

**TP:**
- **TP1 = 1.5R.** Scoreboard knjiži izid na TP1 ("najmočnejši rezultat v testih").
- TP2 je na kartici prikazan kot 2–7R (runner za ročno trgovanje).

**Vstop po delih:** ne. En vstop po "stamped" ceni.
- Če cena že pobegne proti TP: "chasing, moved too far", ne vstopaj in raje počakaj na umik.
- Če je cena bližje SL, je to "discount" (boljši R).
- Limit naročila so priporočena (maker fee).

**Ročna potrditev (Mowgli sam):**
- Njegovi indikatorji Trend X, ICT X, SMC X in TDI X.
- "Sweep displacement profile".
- Primer HUMA 10. 10.: CISD sweep nad PDH in PMH (prejšnji dnevni/mesečni high), nato umik v CISD FVG.

## 2. HTF filter / smer trga
- **Ni BTC filtra in ni tedenske/mesečne smeri trenda.** Je protitrendni sistem: išče konec poteze pri D/W pivotih.
- **"HTF" so pivoti D/W in RSI/DIV do W.** Več prižganih HTF polj pomeni močnejšo kartico.
- **Čas / seje:** London, NY, Off-hours, vikend.
  - Lane (filtri) izbiraš po sejah.
  - "NY odprtje, posebno ponedeljek, ima najvišji delež SL za obrate (volumen)."
  - "Shorti najuspešnejši v Londonu."
- **Režim trga:** ko je na tabli preveč shortov hkrati, trg "nagiba bull", zato bodi previden s shorti. Mirni dnevi imajo boljši uspeh.

## 3. Upravljanje
- **TP1 pri 1.5R** = izid v statistiki. Prelomna točka je **40 % zadetkov** (z managementom; brez njega 43.4 %).
- **Stop cut (samo shorti):** pri +1R se SL premakne na **−0.5R**, enkrat in nikoli nazaj. Po njegovem testu na 35.000 tradeih rešuje več, kot izgubi. Longi ohranijo prvotni SL.
- **Runner do TP2** je stvar ročnega trgovanja. Avtomatika gre na statistično povprečje.
- **Kdaj zapre:** TP1, SL ali "stop managed". Kartice z oznako INVALIDATED = SL.

## 4. Oznake
| Oznaka | Pomen |
|---|---|
| **DEVELOPING / FORMING** | Cena je v izčrpani regiji ("exhausted at the extreme, no turn yet"). Sweep da, rejection še ne. Samo opozorilo. |
| **PRIMED** | Več potrditev za obrat: "TURN FORMING, get this on your screen". Še ni vstopa. Hkrati jih je največ ~6. Primerno za ročno TA. |
| READY / FIRED / IN PLAY | Rejection se je zgodil: kartica dobi entry (stamped/automation), stop, TP1 in TP2. |
| **RE-ENTER (re-entry)** | Ta simbol in smer sta že sprožila v zadnjih **3 dneh**. Prava ponovna klica, vodena ločeno kot "caution". V lane jih vključiš z `entry=Repeat`. |
| Grade S / A / B / C | Regija in stopnja izčrpanosti, **ne kakovost**. S = najboljša testirana regija (D/W R2 + RSI + DIV), C = preraztegnjeno (R3). "C je pogosto najboljši." |
| Level L-2 … L5 (ledger −2…5) | Kakovost poteka ob prihodu v regijo (vrata/gate). Uporabljajo se kot filtri v lane. |
| HIGH CONV / LOW CONV | Prepričanje kartice. |
| Lane | Shranjen filter (grade × level × seja × first/re-entry). Npr. `eax1|engine|level=L3,L0|session=Off-Hours|entry=Repeat`. |

## 5. Rezultati (kar objavlja)
Izidi so v **R** (po fees), z zadetki in porazi. Scoreboard pri vsakem lanu kaže tudi interval zaupanja in "established", ko je celoten interval nad 0.
- 29. 9.: zadnji dan −4R izgub proti +10.5R dobičkov. Zadnjih 24 h: 10 tradeov, 70 % zadetkov.
- 2. 10.: 14 zaprtih v 24 h, **9 TP1 – 5 SL** (≈ +8.5R bruto).
- Ledger enega lane (do 7. 10.): od 20 vidnih 14 TP1 in 6 SL (+1.44 … +1.49R oz. −0.53 … −1.06R).
- Lane "London L1 + Re-entry": 22 tradeov, 68.2 %, **+16.0R**. A "od shranitve" je bil samo 1 trade (+1.49R) – sam označi "still thin".
- Lane `L3,L0 / Off-Hours / Repeat`: ~2 trada/dan, 61 %, +0.56R na trade, največ 2 izgubi zapored (backtest).
- Lane, izbran 29. 9.: 5 zaprtih, 50 %, +1.36R/trade ("too thin").
- Slabi: MOVR 7–8 tradeov, 2 zmagi. BILL long 10. 10.: avtomatika −16 % ROI pri 10x (−1.6 %).

**Ocena roba:**
- Številke so večinoma **izbrane za nazaj** (lane izbereš na scoreboardu, ki že vsebuje te trade). Mowgli sam pravi, da je pošten samo del "od shranitve".
- Engine se je v betah večkrat spremenil (30. 9. napaka v vratih, 1. 10. in 5.–7. 10. posodobitve, zapisi resetirani).
- Večina klicev so **shorti na altih po pumpu** (na karticah pogosto +10 do +45 % v dnevu).
- Za oceno roba je treba vzeti pre-registrirane klice (spodnja tabela) in jih simulirati.

## 6. Česa nima naš Jay HL screener
- **Smer:** Jay HL je **trend-continuation** (HL po LL in zlomu navzgor, vstop v GP). EAX vault je **protitrendni obrat** na izčrpanosti. Sistema se dopolnjujeta, nista ista.
- **RSI in divergence na 1H/4H/12H/D/W** (izčrpanost) – nimamo.
- **Dnevni in tedenski pivoti R1–R3 / S1–S3** in razdalja do njih – nimamo (imamo +liq = stari L v GP).
- **PDH/PDL, PMH/PML sweep** + CISD/FVG na nižjem okviru – nimamo (CISD je samo v Moj Screener in backtest tabu).
- **Sprožilec na 15m (sweep + displacement rejection)** – nimamo. Naš signal je zaprta sveča nad 0.618 na istem okviru.
- **Faze kartice** (developing → primed → fired) – deloma: imamo čaka / v coni / možen / potrjen.
- **Re-entry v 3 dneh** kot ločena kategorija – nimamo.
- **Fiksni TP1 1.5R + stop cut na −0.5R pri +1R (samo shorti) + SL kap 8 %** – nimamo. Imamo SL pod HL/nogo, TP max(H, 2R), predlog TP1 → BE.
- **Filtri po sejah** (London/NY/off-hours/vikend) – imamo samo "+čas" (3. 6H = 12–18 UTC).
- **Scoreboard / lane** z intervalom zaupanja in pregledom "od shranitve" – imamo Zgodovino (forward) in Backtest, a brez intervala zaupanja in brez shranjenih kombinacij filtrov.
- **Univerzum ~700 Bybit kovancev** – mi gledamo top po prometu.
- Imamo pa česar EAX nima: časovne fraktale (3. teden, 23D, 3. 6H), HTF sveče L-LL-HL, strukturo L/LL/H/HL in fib GP.

## 7. Klici za simulacijo (Bybit perp, čas UTC)
Vstop je "stamped/automation" cena. SL je prvotni (pred "managed"). TP1 = 1.5R. Kjer TP1 ni bil viden, je izračunan in označen z *.
| # | Kovanec | Čas vstopa (UTC) | Smer | Grade / tip | Vstop | SL | TP1 | TP2 | Izid (vault) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | ZESTUSDT | 24. 9. ~05:00 | short | B, re-entry | 0.18840 | 0.19930 | 0.17205* | – | odprt 27. 9. (+1.12R) |
| 2 | ONDOUSDT | 26. 9. ~11:50 | short | B | 0.55770 | 0.58074 | 0.52314 | 0.48457 | odprt 27. 9. (+0.25R) |
| 3 | SOONUSDT | 27. 9. 09:09 | short | C | 0.30110 | 0.31284 | 0.28349* | – | TP1 (11:00) |
| 4 | JTOUSDT | 27. 9. 11:18 | short | A | 0.62630 | 0.64854 | 0.59294 | 0.56913 | TP1 (19:00) |
| 5 | PYTHUSDT | 27. 9. 13:51 | short | B, re-entry | 0.08417 | 0.08857 | 0.07757* | – | ? |
| 6 | TMXUSDT | 27. 9. 16:58 | long | A, re-entry | 0.01140 | 0.01087 | 0.012195* | – | ? (−0.45R ob 20:54) |
| 7 | SOONUSDT | 27. 9. 17:45 | short | B, re-entry | 0.32220 | 0.34798 | 0.28354 | 0.26027 | ? |
| 8 | KMNOUSDT | 27. 9. 20:28 | short | C, re-entry | 0.04685 | 0.04774 | 0.04551 | 0.04076 | ? |
| 9 | BOBAUSDT | 27. 9. ~20:53 | short | C | 0.02389 | 0.02434 | 0.02321 | 0.02257 | SL (21:45, −1.06R) |
| 10 | GRASSUSDT | 30. 9. 00:31 | short | B, re-entry | 0.74420 | 0.80374 | 0.65490 | 0.46937 | TP1 (po 2 d 18 h) |
| 11 | 4STOCK (ime na Bybitu?) | 1. 10. 16:01 | long | A | 0.00886 | 0.0084446 | 0.0094831 | 0.01044 | TP1 |
| 12 | ALICEUSDT | 1. 10. 20:19 | short | C | 0.23016 | 0.24666 | 0.20541 | 0.18593 | TP1 (2. 10. 01:15), tekel do TP2 |
| 13 | USUSDT | 2. 10. 04:53 | short | A | 0.02864 | 0.03093 | 0.02520 | 0.01661 | SL (7 min) |
| 14 | NIGHTUSDT | 2. 10. 08:23 | short | C | 0.04318 | 0.04484 | 0.04068 | 0.03383 | SL |
| 15 | SANDUSDT | 2. 10. 10:01 | short | C | 0.06197 | 0.06519 | 0.05713 | 0.05137 | SL (10:45) |
| 16 | SANDUSDT | 2. 10. 13:01 | short | C, re-entry | 0.06763 | 0.07273 | 0.05998 | 0.05137 | TP1 |
| 17 | ORDERUSDT | 2. 10. 14:55 | short | A | 0.04029 | 0.04104 | 0.03916 | 0.03799 | TP1 (18:30) |
| 18 | AKTUSDT | 5. 10. 09:25 | short | A | 0.7733 | 0.79478 | 0.74108 | 0.6708 | TP1 (16:30) |
| 19 | RLCUSDT | 6. 10. 09:16 | short | C, re-entry | 0.874 | 0.94392 | 0.76912 | 0.41566 | SL (11:00) |
| 20 | HUMAUSDT | 10. 10. ~13:25 | short | B | 0.03320 | 0.03426 | 0.03161 | 0.02881 | odprt (+0.11R ob 14:50) |
| 21 | BILLUSDT | 10. 10. (avtomatika) | long | ? | 0.00923 | ? | ? | – | izguba (izhod 0.00908) |

Vault izidi teh klicev (kjer znani): 8 TP1, 5 SL (+ BILL izguba). Pri simulaciji upoštevaj stop cut na −0.5R pri shortih po +1R in provizijo.
