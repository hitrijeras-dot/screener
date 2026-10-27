# Sistem 5K – Suenovih 5 korakov (ICT "3 % konceptov")

Vir: Suen (The Art of Crypto), video "Learn 97% of ICT Concepts in Under 39 minutes" (27. 10. 2026).
Nov, samostojen sloj – ločen od Juretovega CISD sistema, Sweep, Jay in EAX.

Isto logiko imajo: TradingView indikator `5k_indikator.pine` (ta mapa) in screener `5k/index.html`
(blok med `/*5K-CORE*/` in `/*5K-CORE-END*/`). Če spremeniš eno, spremeni obe.

## Profili (časovni okviri)
| Profil | Smer (HTF) | Cilj + lokacija (MTF) | Vstop (LTF) |
|---|---|---|---|
| Intraday (privzeto, Suenov glavni) | 1D | 1H | 5m |
| Scalp | 4H | 15m | 1m |
| Swing | 1W | 4H | 15m |

## Gradniki (vse samo na ZAPRTIH svečah, vse po TELESIH sveč)
(Preverjeno na kadrih iz videa – 7:35, 18:10, 24:50, 28:10, 31:08, 36:20.)
- **Serija**: zaporedne sveče v eno smer. Male nasprotne sveče vmes je NE prekinejo, dokler nobena ne zapre
  čez odprtje prve sveče serije (kadr 18:10: H1 bullish OB vsebuje tudi dve mali zeleni sveči).
- **CISD** = zaprtje telesa čez **odprtje prve sveče** zadnje nasprotne serije (kadr 24:50).
  - **Zgodnji CISD** = prvi tak prelom. **Neizpodbiten** = drugi zaporedni (ali ena sveča prebije dve seriji naenkrat).
  - Razlika do MSS: MSS je že wick čez swing; CISD je samo zaprtje telesa.
- **OB** nastane ob CISD: **samo telesa zadnje prebite serije** (zadnje nasprotne sveče pred impulzom) – od odprtja
  prve sveče do najnižjega (bull) / najvišjega (bear) telesa. Če velika sveča prebije več serij naenkrat, OB ni cel
  padec, ampak samo zadnja serija (28. 10. 2026, Juretov primer Q: prej je cona zajela ves tedenski padec). Na grafu ima **črtkano 50 % linijo** in se podaljša v desno (kadri 7:03, 28:10, 31:08).
- **OB ni več veljaven**, ko sveča zapre čez njegov drugi rob (bull OB: zaprtje pod dnom). 3+ dotiki = šibek.
- **Order flow (MTF)**: bullish, dokler se bull OB spoštujejo – natančneje: ostane bullish, dokler cena ne zapre
  pod **zaščiten bull OB** (OB, iz katerega je naredila zadnje najvišje zaprtje). Takrat postane bearish (in obratno).
  Zato popravek v cono order flowa ne obrne (CISD na 1H bi ga obrnil pri vsakem popravku).
- **Likvidnost**: neprebit swing high/low (pivot 3 sveče levo/desno). Prebit = wick čez nivo.

## 5 korakov
1. **Smer (HTF)** – barva zadnje zaprte HTF sveče: zelena = samo long, rdeča = samo short.
   Struktura HTF (zadnja dva swinga): HH+HL = trend gor, LH+LL = trend dol, drugače **range → ne trguj**.
2. **Cilj (MTF)** – najbližja neprebita likvidnost v smeri biasa, največ 1 × HTF ATR(14) stran.
   Ni takšne → cilj je 2R.
3. **Lokacija (MTF)** – MTF order flow mora biti v smeri biasa. Področje interesa = najbližji veljaven
   MTF OB v smeri biasa (long: bull OB pod ceno), ki je bil dotaknjen manj kot 3-krat.
   **Ni slepega limita v coni** – med retracom je LTF order flow nasproten.
4. **Čas** – vstop samo v kill zoni (NY čas, upošteva poletni čas):
   Azija 20–24, London 2–5, New York 7–10. Pri nas (CET): Azija 02–06, London 08–11, NY 13–16
   (zadnji teden oktobra in prvi teden novembra 1 h prej).
5. **Potrditev (LTF)** – ko je cena v coni (dotik), čakaj LTF CISD v smeri biasa v kill zoni.
   - **CISD samo iz potiska, ki naredi ekstrem** (28. 10. 2026, Juretov CRV primer): potisk = sveče od najnižjega
     lowa (od zadnjega notranjega preloma ali začetka cone) do novega high-a po dotiku cone; začne se s prvo zeleno
     svečo po tem lowu. **Neizpodbiten CISD** = zaprtje pod odprtjem te prve sveče. Drobne serije (1 sveča, 1 tick)
     sredi gibanja ne štejejo.
   - Na dan z rdečo USD novico (1 h pred do 1 h po njej) velja **zgodnji** CISD = zaprtje pod odprtjem zadnje
     zelene serije.
   - **Vstop**: limit na CISD liniji (odprtje prve sveče potiska). Na grafu: linija "CISD" od te sveče do vstopa.
   - **SL**: nad ekstremom potiska (wick). **TP**: 2R (privzeto) ali MTF likvidnost, če je dlje kot 2R.
   - En signal na potisk. **Po zadetem SL je dovoljen en ponovni vstop** v isti coni (nov ekstrem + nov CISD).
   - Primer CRVUSDT 27. 10. (Scalp 4H/15m/1m): potisk 13:47–13:56 (0.3349 → 0.3370, sweep vrha 0.3368),
     CISD 14:04, vstop 0.3349 (fill 14:13), SL 0.3370, TP 0.3307 zadet ob 15:02.

Vse pogoje "da" → trejd. Kateri koli manjka → ni trejda, ne glede na občutek.

## Stanja v screenerju
| Stanje | Pomen |
|---|---|
| 🎯 Vstop | koraki 1–3 OK, cena je bila v coni, LTF CISD potrjen → vstop/SL/TP izračunani |
| 🟢 V coni | koraki 1–3 OK, cena je v MTF OB → čakaš CISD (in kill zono) |
| 🟡 Blizu cone | koraki 1–3 OK, cena je do 1 × MTF ATR nad/pod cono |
| ⚪ Čaka | koraki 1–3 OK, cona je še daleč |
| ✖ | range, OF ne sovpada ali ni cone |

## Datoteke
- `5k_indikator.pine` – TradingView indikator (na Juretovem računu shranjen kot »5K · Suen 5 korakov«).
- `../../5k/` – screener aplikacija (https://hitrijeras-dot.github.io/screener/5k/), PWA, nočna paleta.
- Kadri iz videa niso v repu (repo je javen) – Jure jih ima v pogovoru.

## Barve (noč)
ozadje #0a0d13 · sveča gor #3ccfb4 · sveča dol #e8717d · likvidnost #e5c07b · CISD #b4a7f5 · vstop #82aaff ·
kill zone: Azija #5b6ee1, London #e5c07b, NY #3ccfb4 (zelo prosojne).
