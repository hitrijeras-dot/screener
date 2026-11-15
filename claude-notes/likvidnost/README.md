# Likvidnost (likvidnost/)

PWA (namestljiva), https://hitrijeras-dot.github.io/screener/likvidnost/ – narejena 15. 11. 2026.

**Kaj kaže:** lista »Top 10 – močni« (LIT fokus + BTC, ETH, SOL, HYPE, ZEC, NEAR, PEPE, XMR, UNI, AAVE).
Za vsak kovanec: enaki wicki EQH (nad njimi stopi shortov) / EQL (pod njimi stopi longov), PDH/PDL, PWH/PWL,
Azija H/L, FVG samo kadar leži tik za likvidnostjo (✚ potrditev), status (A+ blizu / blizu / pripravi se / čakaj).
Graf: TradingView Lightweight Charts v4.1.3 (lokalna kopija `lightweight-charts.js`), zoom/premik, 5m/15m/1H/1D, »Povečaj« čez zaslon.

**Podatki v živo** z javnega Bybit API: cena vsakih 30 s (zadnje sveče izbranega okvirja), cel pregled ravni vsake 3 min, ob vrnitvi v aplikacijo.

**Logika** med `/*LIQ-CORE*/` in `/*LIQ-CORE-END*/` v `index.html` je ista kot extractor na Claude strani
»Screener likvidnosti« (artifact RQ5yzQxN5HTC9D3d8fCuYR). Če spremeniš eno, spremeni obe.
- EQ: fraktal 2/2 na 15m (300 sveč, tol. ±0,12 %) in 3/3 na 1H (240 sveč, ±0,15 %), raven = najvišji/najnižji wick skupine, nepobrana od prvega wicka naprej.
- FVG: 1H ≥ 0,25 %, 15m ≥ 0,15 %, nezapolnjen; potrditev, če leži nad EQH/ravnjo (do +1,5 %) oz. pod EQL (do −1,5 %).
- Status: najbližja nepobrana likvidnost ≤ 2 % in FVG = »A+ blizu«, ≤ 2 % = »blizu«, ≤ 4 % = »pripravi se«.
- 1D trend: včerajšnje zaprtje proti EMA20 na dnevnih zaprtjih.

**Plan (opombe):** `notes.json` = {gen, top[], <KOVANEC>:{bias,cena,likv,plan}} – piše ga Claude (jutranje opravilo ob 07:02 ali na zahtevo).
Aplikacija ga prikaže, če je mlajši od 8 h (ravni se med dnevom premikajo); sicer samodejni plan iz podatkov v živo.
Jure trejda samo z **market** vstopi: sweep ravni + obrat strukture na 5m → market.

## Signal za vstop (15. 11. 2026, 23:30)
`findSignal` (v LIQ-CORE): zadnjih 36 zaprtih 5m sveč (3 h). Raven (EQH/EQL, PDH/PDL, PWH/PWL, Azija), ki je bila do okna nepobrana
(preverjeno na 15m od `from`). **Sweep** = 5m wick čez raven in zaprtje nazaj. **Obrat** = v ≤ 12 svečah zaprtje čez razpon zadnjih 6 sveč do sweepa
(short: pod najnižji low, long: nad najvišji high) → **⚡ VSTOP (market)**. Pade, če zapre 0,4 % čez raven. SL = ekstrem sweepa ± 0,1 %,
TP = najbližja nepobrana likvidnost z R:R 1,5–8 (sicer 2R, »ni likvidnosti«). Rezultat sledi: v teku / TP / SL. Vstop velja 2 h.
Isto pravilo kot backtest LIT 9.–15. 11. 2026. Signali se osvežijo vsako minuto (zadnjih 24 5m sveč za vse kovance).

## Kalkulator in obvestila
- Kalkulator: tveganje € (privzeto 5, shrani se), vstop/SL/TP (iz signala; vstop = trenutna cena), leverage → velikost pozicije = tveganje / SL %, marža, R:R, dobiček pri TP, taker provizija, največji varen leverage (0,8 / SL %, največ 100x).
- 🔔 Obvestila: toast v aplikaciji + sistemsko obvestilo (če dovoljeno; na iPhonu le v nameščeni PWA in ko je aplikacija odprta/v ozadju). Ključi v localStorage `liq_*`.
