# Backtest 3 – dnevno trgovanje (day trade), 10. 10. 2026

Vprašanje (Jure): ali se da Jay HL trejdati na manjšem okviru in trade zapreti isti dan?

## Kako
- **Brskalnik** (Bybit, skripte v `orodja/bt3.js`, `orodja/bt4.js`): top 20 kovancev, zadnjih **60 dni**, vstop na 5m / 23m / 90m (iz 1m in 30m sveč, sidro 00:00 UTC), isti `jayScan` kot screener.
- **TradingView** (`jay_hl_dan_backtest.pine`, na TV shranjena kot "Jay HL Dan BT"): 23m od **1. 5. 2026** (~5 mesecev) na BTC, ETH, SOL, XRP; 90m in 6H na XRP od 2025 / 2021.
- Kontekst: vsi / smer D (zadnji swing 3/3 na 1D) / smer 6H (jayScan na 6H) / cona 6H (cena v ≥ 0.5 umiku zadnje 6H noge, cilj = 6H H).
- Čas: ves dan / samo 3. 6H (12–18 UTC = 14–20 naš čas).
- Izhod: SL, TP (2R / 3R / H) ali po času: **EOD** (00:00 UTC = 02:00 naš čas), **24 h**, **48 h**. Varianta s SL na BE pri +1R.
- Provizija 0.11 % (taker), en trade naenkrat na varianto in kovanec.

## Rezultati
### Strogo dnevno (zapri do 02:00)
| Okvir | Najboljše | Rezultat |
|---|---|---|
| 5m | vse variante | −0.15 do −0.3R na trade (provizija + šum) – **ne dela** |
| 90m | vse razen cona 6H (26 tradeov) | v minusu; na TV (XRP od 2025) vse v minusu |
| 23m | cona 6H, cilj H | brskalnik +0.31R (121 tradeov), TV na BTC/ETH/SOL/XRP v minusu |
| 6H | (TV XRP od 2021) | z EOD izhodom ≈ 0 – EOD ubije rob, ki ga ima 6H, ko trade drži do cilja |

### Vstop čez dan, držanje do 24/48 h
- Brskalnik (60 dni): 23m, smer D + 3. 6H + 3R + 24 h → 235 tradeov, 39 % zadetih, **+0.25R/trade**, 15/20 kovancev v plusu.
- **TV (5 mesecev) tega ne potrdi**: ista varianta BTC −3.9R (30), ETH +5.1R (35), SOL −5.1R (28), XRP −29.2R (28) → skupaj ≈ −33R na 121 tradeov.
- V 60 dneh so bili v plusu skoraj vsi longi (tudi brez filtra: vsi|24h|3R +95R) → rezultat je posledica trga (rast), ne roba.
- BE pri +1R skoraj povsod poslabša rezultat.

## Zaključek
- Mehansko (samo HL/LH signal) **dnevno trgovanje na 5m/23m/90m nima zanesljivega roba**. Zapiranje do konca dneva ubije tudi rob, ki ga ima 6H.
- Rob je tam, kjer trade dobi čas: 1D (+liq) in 6H (3. 6H + smer, 2R) – trade traja ~1–3 dni.
- Za dnevno trgovanje bi bilo treba dodati Jayev "WHO" (footprint: absorpcija, delta, imbalance) in VP – tega ni v OHLC podatkih in mehanski test tega ne zajame.
- Predlog: setup iz 6H (screener), vstop izbereš na 23m/5m ročno, SL za 23m HL, delni TP pri 2R, ostanek do 6H cilja (lahko čez noč).

## TV
- "Jay HL Dan BT" (USER;8acc54e9edb940fdb2c540ec0f2f5197) – zadnja verzija (smer D, izhod EOD/24h/48h, tabela 24 variant).
- "Jay HL Dan BT v2" – podvojena kopija (ista koda), Jure jo lahko izbriše.
- Shranjeno prek pine-facade `save/new` (allow_overwrite=false) in `save/next/<id>` – ne prek urejevalnika, ker `pine_new` + urejevalnik lahko prepiše indikator.
