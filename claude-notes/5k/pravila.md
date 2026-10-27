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
- **Serija**: zaporedne sveče iste barve. Zgornji rob = najvišje telo, spodnji = najnižje telo.
- **Bullish OB**: zadnja serija rdečih sveč, nad katero je kasneje sveča **zaprla** (impulz gor). Cona = telesa te serije.
- **Bearish OB**: zadnja serija zelenih sveč, pod katero je kasneje sveča zaprla.
- **OB ni več veljaven** (disrespected), ko sveča zapre čez njegov drugi rob (bull OB: zaprtje pod dnom).
- **Order flow**: bullish, ko se bull OB-ji spoštujejo in bear OB-ji prebijajo (in obratno).
- **CISD** = sprememba order flowa: prvo **zaprtje telesa skozi celo telo nasprotnega OB**.
  - **Zgodnji CISD** = prvi prebit nasprotni OB.
  - **Neizpodbiten CISD** = drugi zaporedni prebit OB (ali en prebit dveh OB naenkrat).
  - Razlika do MSS: MSS je že wick čez swing; CISD je samo zaprtje telesa.
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
   - Na dan z rdečo USD novico (1 h pred do 1 h po njej) velja **zgodnji** CISD, drugače **neizpodbiten**.
   - **Vstop**: limit na CISD liniji (zgornji rob prebitega OB).
   - **SL**: za najbližjim swingom = najnižja cena od dotika cone (long) / najvišja (short).
   - **TP**: 2R (privzeto) ali MTF likvidnost, če je dlje kot 2R.

En signal na cono. Vse pogoje "da" → trejd. Kateri koli manjka → ni trejda, ne glede na občutek.

## Stanja v screenerju
| Stanje | Pomen |
|---|---|
| 🎯 Vstop | koraki 1–3 OK, cena je bila v coni, LTF CISD potrjen → vstop/SL/TP izračunani |
| 🟢 V coni | koraki 1–3 OK, cena je v MTF OB → čakaš CISD (in kill zono) |
| 🟡 Blizu cone | koraki 1–3 OK, cena je do 1 × MTF ATR nad/pod cono |
| ⚪ Čaka | koraki 1–3 OK, cona je še daleč |
| ✖ | range, OF ne sovpada ali ni cone |
