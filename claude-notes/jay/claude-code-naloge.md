# Naloge za Claude Code – Jay HL Screener (`/jay/`)

Navodila za Claude Code. Najprej preberi `CLAUDE.md` v korenu in `claude-notes/jay/README.md`. Delaj po vrsti, po vsaki nalogi testiraj, commitaj in pushni.

## 1. Alarmi in samodejni pregled
- Stikalo "Samodejno" (vsakih 5 / 15 / 30 min) in gumb "Vklopi obvestila" (Notification API prek service workerja `jay/sw.js`).
- Obvestilo, ko kovanec preide v "Potrjen HL/LH" ali "V coni" (ne ponavljaj za isti setup – ključ: simbol + smer + čas H). Zvok neobvezen.
- V naslovu zavihka pokaži število novih setupov.

## 2. Zgodovina signalov in sproten izid
- Vsak potrjen signal shrani v localStorage (simbol, okvir, smer, čas, vstop, SL, TP, +liq, +čas).
- Ob vsakem pregledu preveri, ali je cena od takrat dosegla TP ali SL → izid v R.
- Zavihek "Zgodovina": tabela + skupni R, % zadetih, ločeno za +čas / +liq.

## 3. HTF filter (Jayev "WHEN")
- Za vsak kovanec izračunaj isti `jayScan` še na 1W (in 1M, če je dovolj podatkov).
- Stolpec "HTF": ↑ (zadnja struktura na 1W je HL/zlom navzgor), ↓ ali –.
- Filter "Samo v smeri HTF" (privzeto vklopljen). Backtest je pokazal, da so longi brez HTF filtra na ničli.

## 4. Pogled na več okvirjev
- V odprti vrstici (detajl) zavihki 1D / 6H / 90m / 23m za isti kovanec, vsak s svojo risbo in stanjem.
- Kratka vrstica "Poravnava": koliko okvirjev kaže isto smer.

## 5. Časovni fraktali na risbi
- Na intraday grafih senčenje 6H blokov (3. 6H poudarjen), 90m kvadrantov in 3. 23m v 3. 90m (zlato).
- Na 1D: 23D bloki (od 1. 1., 90-dnevni bloki ÷ 4), meje mesecev, 3. teden.

## 6. Backtest zavihek
- Za izbrane kovance in okvir zaženi logiko čez zgodovino (kot `jay_hl_backtest_strategija.pine`): vstop ob zaprtju signalne sveče, SL pod HL, cilji H / 2R / 3R, provizija 0.11 %.
- Rezultat: število tradeov, % zadetih, skupni R, max DD v R, po variantah (vsi / +čas / +liq).

## 7. HTF sveče (zaporedje L-LL-HL na 3D in 1W) – iz primerjave z Jayevimi klici
- Glej `discord-setupi-primerjava.md`. 3D sveče sidrane na epoch (Math.floor(t/3 dni)), 1W od ponedeljka 00:00 UTC; samo zaprte sveče.
- Pogoj na zadnjih treh zaprtih svečah a, b, c: b.l < a.l (LL), c.l > b.l (HL) in c.c > b.h (HL sveča zapre nad vrhom LL sveče). Velja, če se je zgodilo v zadnjih 3 svečah (3D) oz. 4 tednih (1W osnova brez c.c > b.h).
- Stolpec "HTF sveče": 3D ✓ / 1W ✓ / –. Filter "Samo s HTF svečami". V backtestu: 1D signal + 3D pogoj = +0.38R na trade (3R) proti +0.14R brez.
- To je nova funkcija IZVEN `/*CORE*/` (filter), zato TV indikator dobi enak filter kot nov vhod (nalogo opravi Claude v klepetu ali ti – zapiši v README).

## 8. SL "pod dnom noge" in cilji ekstenzije
- V detajlu in tabeli dodaj možnost SL: "pod HL" (zdaj) ali "pod dnom noge (100 % fib)" = Jayeva invalidacija.
- Na risbi in v detajlu cilji −0.27, −0.65, −1 (od noge do H). Predlog upravljanja: TP1 pri 2R ali −0.27 (pol pozicije), SL na BE, ostanek do −0.65 / −1.

## 9. Okvir 3D
- Dodaj 3D v izbiro okvirjev (sestavljen iz 1D, kot zgoraj). Swing setupi se pri Jayu pogosto vidijo na 3D/6D/23D.

## 10. Backtest zavihek – nove variante
- Filter "3D HTF sveče", SL "pod dnom noge", cilj "−0.27". Preveri, da da približno iste številke kot v `discord-setupi-primerjava.md`.

## Ne spreminjaj
- `index.html` (Moj Screener) in drugih aplikacij.
- Logike setupa brez sočasne spremembe TV indikatorja.
