# Jayevi setupi z Discorda vs. naš indikator (10. 10. 2026)

Vir: iskanje na strežniku ONLY_WICKS `from:Up_OnlyJay$ (jay_money14) has:image` → 2774 objav s sliko od 28. 3. do 10. 10. 2026 (544 z opisom; kanali jay-long-term, setups, jay-analysis, pro-chat, profits-n-losses). Ogledani grafi: SUI, MEME, JTO, COMP, TAO, PENGU. Tukaj so samo povzetki, ne kopije objav.

## Kaj sem se naučil (popravki mojega razumevanja)
1. **"L LL HL" je pri Jayu najprej ZAPOREDJE SVEČ na višjem okviru**, ne samo swingi. Primeri: COMP na **23D** svečah (sveča pobere staro dno s senco, telesa ostanejo nad nivojem, naslednja sveča HL), TAO na **6D**, JTO na 6H s projekcijo HTF sveč (označeno L / LL / HL na svečah). Okvirji za swing: 1D, 3D, 6D, 1W, 23D; vikend setupi na 6H.
2. **"1-2 setup"** = sweep dna → sunek gor (gap / displacement) → umik v GP **0.618–0.786 brez gapa navzdol** ("no gap down"). Fib vedno od **sweep dna (100 %)** do **vrha sunka (0 %)**. To je enako našemu L→LL→H→HL. ✔
3. **Cona = GP + nekaj, kar se zloži** ("stack"): prejšnja likvidnost (staro dno/vrh, "prev liq retest"), POC/VAL. Naš "+liq" je pravi filter. ✔
4. **Invalidacija = zaprtje pod škatlo / pod 100 % fib** (dno noge), ne senca pod HL.
5. **Vstop**: v coni lestvica (DCA, "vsaj 3 naročila"), natančen vstop na nižjem okviru: "HL entry on the 90m", "next 6h open-low HL". Čas: naslednji tedenski OL, 3. teden / sreda, nov 23D, Q time shift.
6. **Cilji**: VAH, standardni odkloni / fib ekstenzije **−0.27, −0.65, −1**; TP1 → SL na BE → runner ("tp half sl be").
7. **Dnevno ("snacks")**: BTC/ETH – Monday range ("M range": sweep visokega/nizkega, sreda OH/OL), "3rd 90 suction", "watch the next 6h: OL + HL = snack long, OH + zapolni gap = short", cilj nazaj v value / 50 % M range. Vedno TP1 in SL na BE.

## Primerjava 46 Jayevih swing klicev z našim 1D indikatorjem (Bybit, stanje ob času objave)
| Skupina | Klicev | Mediana max dvig 30 dni | Mediana max padec 30 dni | Dosegli +20 % |
|---|---|---|---|---|
| vsi klici | 44 | +31 % | −11 % | 30 |
| naš 1D je kazal long (čaka / v coni / potrjen) | 15 | +36 % | −12 % | 11 |
| naš 1D ni kazal long | 29 | +30 % | −11 % | 19 |
| **na 1W ali 3D je bilo zaporedje L-LL-HL** | 26 | **+35 %** | **−7 %** | **22** |
| brez W/3D zaporedja | 18 | +15 % | −14 % | 8 |

- Naš 1D screener je ujel samo **15 od 44** Jayevih klicev; pri 10 je 1D celo kazal short strukturo (Jay je klical dno na višjem okviru – COMP, TAO, ICP, WIF …).
- Najboljši ločevalec dobrih klicev je **zaporedje sveč na 1W/3D**, ne 1D swing.
- Slabi klici (SOL, ENSO, VIRTUAL, ETH maja; SPX 28. 9.) so bili večinoma brez HTF zaporedja in v padajočem trgu.

## Backtest: HTF zaporedje sveč (60 kovancev, ~5 let, provizija 0.11 %)
Signal na zaprtju sveče c, a-b-c zaporedne: b.l < a.l (LL), c.l > b.l (HL). SL pod b.l, izid 2R/3R.
| Okvir | Varianta | Tradeov | 3R na trade | Držanje 8 sveč |
|---|---|---|---|---|
| 1W | osnova | 2420 | +0.10R | +6.0 % |
| 1W | HL zapre nad vrhom b | 553 | +0.16R | +12.5 % |
| 1W | prava pobrana likvidnost (b zapre nad a.l) | 830 | +0.17R | +9.0 % |
| 1W | vsak teden (primerjava) | 7607 | −0.01R | +4.9 % |
| 3D | HL zapre nad vrhom b | 1672 | +0.19R | +7.4 % |
| 3D | vsaka sveča (primerjava) | 18634 | −0.12R | +2.4 % |
| 1D | HL zapre nad vrhom b | 4994 | +0.03R | +3.5 % |

## Backtest: naš 1D signal (1-2) + HTF filter (SL pod dnom noge = Jayeva invalidacija)
| Filter | Cilj | Tradeov | Zadetih | Na trade | Donos 30 dni |
|---|---|---|---|---|---|
| vsi 1D signali | 3R | 519 | 29 % | +0.14R | +0.4 % |
| **3D L-LL-HL (zapre nad vrhom LL sveče, zadnje 3 sveče)** | 3R | 147 | 35 % | **+0.38R** | +9.6 % |
| 3D L-LL-HL | 2R | 156 | 42 % | +0.24R | +10.5 % |
| 1W L-LL-HL v zadnjih 4 tednih | 3R | 465 | 32 % | +0.27R | +1.7 % |
| +liq | −0.27 ekst. | 101 | 50 % | +0.33R | +3.7 % |
Po letih (3R): vsi 1D signali −0.34 / +0.47 / −0.10 / −0.29 / +0.75 (2022–2026), s 3D filtrom +0.49 / +0.46 / +0.48 / −0.54 / +1.20. Filter pomaga v 4 od 5 let, 2025 je slab za oba.

## Predlogi (za Claude Code, glej claude-code-naloge.md 7–10)
1. Stolpec / filter **"HTF sveče"**: 3D in 1W zaporedje L-LL-HL (HL sveča zapre nad vrhom LL sveče) v zadnjih 3 svečah.
2. SL možnost **"pod dnom noge (100 %)"** poleg "pod HL".
3. Cilji −0.27 / −0.65 / −1 na risbi in v tabeli; TP1 = 2R ali −0.27, nato BE.
4. Okvir **3D** v screenerju (in 6D/23D za pregled).
5. Kasneje: BTC/ETH Monday range modul in "naslednja 6H: OL + HL" za dnevne "snacks" – posebej testirati.
