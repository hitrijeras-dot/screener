# Jay sistem (OnlyWicks "time and value") – vse na enem mestu

Stanje: 10. 10. 2026, 17:20 (naš čas). Strogo ločeno od CISD sistema, Sistem EAX in Jikoku.

## Kje je kaj
| Kaj | Kje |
|---|---|
| Pravila po domače | [pravila.md](pravila.md) (+ Claude Doc "OnlyWicks – Time & Value pravila") |
| Indikator za TradingView | [jay_hl_indikator.pine](jay_hl_indikator.pine) → na TV shranjen kot "Jay HL · Time × Value" |
| Backtest strategija (20 variant naenkrat) | [jay_hl_backtest_strategija.pine](jay_hl_backtest_strategija.pine) – na TV ni shranjena, naloži po potrebi |
| Rezultati backtesta | [backtest.md](backtest.md), surovo: backtest-1D-surovo.txt |
| Pregled trga in narisani setupi | [setupi-2026-10-10.md](setupi-2026-10-10.md), surovo: scan-2026-10-10-surovo.txt |
| Screener (telefon) | https://hitrijeras-dot.github.io/screener/jay/ (koda: `/jay/index.html`) |
| Animacija vzorca | animacija-jay-higher-low.html (+ Claude artefakt "Jayev HTF Higher Low") |
| Učenje iz Discorda (samo Jayeve objave) | [discord-jay.md](discord-jay.md) |

## TradingView
- Layout **"Jay Time & Value"** (prej layout "1") – samo za Jayev stil. Na njem: Jay HL indikator, OnlyWicks Daily Process, Oscillator V.6.2. Jure je ostale indikatorje sam odstranil.
- Watchlista **"Jay HL"** (id 350380368) – sekcije: potrjen HL, v coni, moj trade.
- TV paket ne dovoli več layoutov (zato je bil uporabljen layout "1").
- Pozor: pine_new v TV MCP lahko prepiše odprto skripto. Strategijo nalagaj previdno, potem indikator vrni.

## Jayevi okvirji (Jure, 10. 10.)
Vedno 6H, 90m, 23m; včasih tudi 5m, 3m, 1m. Swing ideje na 1D/1W, 23D, mesec, kvartal.

## Delovni postopek (kot pri VANA)
1. Na 1D najdi L → LL → H (zlom zadnjega vrha), fib od zadnjega dna noge do H.
2. Golden pocket 0.618–0.79, staro L (likvidnost) v coni = +liq.
3. Čas: Q/mesec time shift, 3. teden (15.–21.); intraday 3. 6H (14–20 poletni čas), 3. 90m (17:00–18:30).
4. HL potrjen = zelena sveča zaprta nad 0.618 (samo zaprta sveča šteje!).
5. Nariši: L, LL, H, HL, fib, staro L, časovna črta, Long/Short orodje. Dodaj na listo "Jay HL".
6. Tveganje 1 % na trade, SL pod HL, TP H ali vsaj 2R.

## Odprti trade
- VANA long (Jure sam): vstop ~1.06, SL 0.955, TP 1.33.

## Screener – nadgradnje (claude-code-naloge.md)
- **1. Alarmi (10. 10.)**: stikalo "Samodejno" (5/15/30 min, pregled teče, dokler je stran odprta), gumb "Vklopi obvestila" (prek `jay/sw.js`). Obvestilo enkrat za "V coni" in enkrat za "Potrjen HL/LH"; ključ = simbol + okvir + smer + čas H, shranjeno v localStorage `jay_seen` (30 dni). Prvi pregled na novem okviru je tih. Novi setupi imajo značko NOVO in štejejo v naslovu zavihka "(n)" do prvega klika.
- **2. Zgodovina (10. 10.)**: zavihek "Zgodovina". Vsak potrjen HL/LH iz pregleda se shrani v localStorage `jay_hist` (zadnjih 500): vstop = zaprtje signalne sveče, SL kot v tabeli, TP = max(H, 2R). Ob vsakem pregledu se preverijo sveče po signalu (tudi odprta); SL in TP v isti sveči = SL. R vključuje provizijo 0.11 %. Povzetek: vsi / +čas / +liq / brez +čas. Odprti trade z drugega okvira dobi do 20 dodatnih branj na pregled.
- **3. HTF filter (10. 10.)**: stolpec "HTF" = isti `jayScan` na zaprtih 1W svečah (in 1M; na okviru 1W je HTF = 1M). ↑ = zadnja še veljavna struktura je zlom navzgor po LL (b.armed), ↓ = zlom navzdol po HH (s.armed), novejša zmaga; – = nič. Gumb "Samo v smeri HTF" (privzeto vklopljen) skrije setupe proti 1W ali brez smeri, obvestila pošlje samo za setupe v smeri HTF. HTF se hrani v spominu 30 min. Zgodovina ima oznako HTF in kartico "V smeri HTF". Logika CORE ni spremenjena (TV indikator HTF filtra nima – na TV preveri 1W ročno).
- **4. Več okvirjev (10. 10.)**: v odprti vrstici gumbi 1D / 6H / 90m / 23m (+ trenutni okvir, če ni med njimi), vsak s svojo risbo in stanjem (isti `jayScan`/`jaySetups`). Puščica na gumbu = zadnja veljavna struktura (kot HTF). "Poravnava: n/4 okvirjev v smeri". Podatki drugih okvirjev se naložijo ob odprtju, hranijo 5 min.
- **5. Časovni fraktali na risbi (10. 10.)**: pod 1D senčenje 3. 6H (12–18 UTC), na 90m in nižje še 3. 90m v vsakem 6H (temneje), na 23m in nižje zlato 3. 23m v 3. 90m (min 226–249 od začetka 6H); črte: nov dan, meje 6H (pod 6H), 90m kvadranti (pod 90m). Na 1D: 3. teden, meje mesecev/kvartalov, 23D bloki (ista formula kot `p23` v indikatorju). Legenda pod risbo.
