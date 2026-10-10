# ICT X (Easy Algo) – kako deluje (10. 10. 2026)

Vir: "ICT X — User Guide" (PDF, 11 strani) s portala Easy Algo → Training Manuals. Jure ga je naložil. Ask Easy (AI na portalu) je odgovoril samo splošno in napotil na priročnik. Tu je samo povzetek, ne kopija.

## Ideja v enem stavku
Višji okvir pove **kje** (pobrana likvidnost na D/W/M sveči, ki ne uspe). Nižji okvir pove **kdaj** (zlom CISD in vrnitev v FVG, ki ga je zlom pustil).

## 4 koraki (long; short zrcalno)
1. **HTF sweep na panelu:** dnevna, tedenska ali mesečna sveča s senco vzame dno prejšnje sveče.
2. **Telo zapre nazaj nad tem dnom** (sweep ne uspe). To je setup, še ni vstop.
3. **Zlom CISD:** sveča na tvojem okviru **zapre** čez linijo CISD. Linija je na **odprtju poteze, ki je pobrala dno** (začetek zadnjega padca). Senca ne šteje.
4. **Vstop:** cena se vrne v **CISD FVG** (gap, ki ga je pustila poteza čez CISD). Alternativa je BOS po CISD.

"Sweep je opozorilo, zlom CISD je sprožilec." Vstop samo na sweepu je najpogostejša napaka.

## Kaj riše
- **HTF panel desno od cene:** D, W in M sveče (privzeto npr. D 3, W 2, M 1), barva = okvir.
  - Polna sveča zaprla gor, prazna dol.
  - D je skrit nad 4H grafom, W/M nad 1D.
- **CRT številke na HTF svečah:**

  | Številka | Pomen |
  |---|---|
  | 1 | razpon; likvidnost leži pod dnom |
  | **2** | **sweep, ki ne uspe**: senca pod dnom 1, telo zapre nazaj. Edini, ki "oboroži" FTD, CISD in alarme. |
  | 3 | displacement: zaprtje čez sweep svečo |
  | 4 | končano: zaprtje čez drugo stran sveče 1 (njen high) |

  Če cena zapre nazaj čez senco sveče 2, je setup mrtev in oznaka izgine.
- **FTD level (bela črta):** pobrana cena (dno sveče 1), projicirana na tvoj graf. Velja, dokler je setup živ.
- **CISD linija** (in neobvezna oznaka CISD).
- **CHoCH / BOS:** vedno izračunana na **1H** (ali na okviru grafa, če je višji). Na 5m imaš 1H strukturo in 5m izvedbo.
- **FVG samo iz strukturnih dogodkov:**
  - **CHoCH FVG:** gap največje displacement sveče, ki je obrnila strukturo.
  - **CISD FVG:** gap iz noge, ki je zlomila CISD. Ti se spoštujejo še tedne kasneje.
  - Ko cena zapre skozi gap, ta postane zlat in dobi oznako **IFVG** (podpora postane odpor).
- **HTF nivoji:** PDH/PDL (cian), PWH/PWL (zlato), PMH/PML (rdeče) in njihovi 50 % (črtkano). Vedno prejšnje obdobje.
- **Alarmi (12):**
  - Opozorila: CISD Setup Long/Short (sproži se že med nastajanjem sveče, lahko izgine) in dotik PDH/PDL, PWH/PWL, PMH/PML.
  - Sprožilci: CISD FVG Long/Short in CHoCH FVG Long/Short (cena se je vrnila v gap).

## SL in TP
Priročnik ju ne določa.
- Logično (in kot pri Mowgliju): **SL** pod sweep (senca sveče 2, FTD) ali pod CISD FVG.
- **Cilji:** high sveče 1 (CRT 4), nasprotni PDH/PWH/PMH in njihov 50 %.

## Povezava z Jayem in našim screenerjem
- **Jayev "L-LL-HL na višjem okviru" je isto kot CRT 1 → 2 → 3** (sweep, ki ne uspe, nato displacement).
- Naš filter "3D HTF sveče" (b.l < a.l, c.l > b.l, **c.c > b.h**) je točno stopnja **3** (zaprtje čez sweep svečo). V testu je bil najboljši (+0.38R namesto +0.14R).
- ICT X gleda D/W/M, mi 3D in 1W.
- **Vstop CISD na nižjem okviru** je naloga 8 v screenerju (backtest A/B/C: zdaj / zaprtje CISD / limit na CISD). ICT X doda še **CISD FVG** kot točko vstopa – tega še nimamo.
- **Kar nimamo:**
  - številk CRT 1–4 na D/W/M;
  - FTD level na grafu;
  - CISD FVG in CHoCH FVG (samo strukturni gapi) in IFVG;
  - PDH/PWH/PMH z 50 %;
  - strukture vedno na 1H.

## Predlog (za Claude Code / TV indikator)
1. V odprti vrstici screenerja "HTF panel": zadnje D (3), W (2) in M (1) sveče s številko CRT stopnje.
2. Na risbi FTD level, linija CISD in CISD FVG po stopnji 2.
3. Backtest: vstop D = limit na CISD FVG (sredina gapa), SL pod senco sveče 2, cilji high sveče 1 / 2R / PWH.
