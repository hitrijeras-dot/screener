# EAX Vault app (`vault/`)

App: https://hitrijeras-dot.github.io/screener/vault/

- `vault/vault.json` zapiše Claude v zanki EAX Vault (vsakih 5 min): v EAX tabu (Secret Vault odprt) izvede `extract.js`, rezultat shrani v `vault/vault.json`, commit + push na `main`.
- App bere `vault.json` vsakih 30 s, cene (tickers) vsakih 5 s in sveče (kline, zadnje 3) vsakih 10 s neposredno z Bybit API; ob vrnitvi v app takoj osveži. Podoba v stilu EAX (temna, neon zelena). Pogled kartice ali tabela (razvrščanje s klikom na stolpec). Detajl: kalkulator limita za riziko (količina po qtyStep, max izguba s provizijami), 24h razpon, promet, funding.
- Rezultat trejda v živo: R = (cena − vstop)/(vstop − SL) (za short obratno), % od vstopa, $ = R × riziko (gumb zgoraj, privzeto 10 $).
- Graf: TradingView Lightweight Charts (unpkg, v4.2.0) – premikanje z miško/prstom, zoom; nivoji vstop/SL/TP1/TP2 kot price lines, cona long/short (baseline serije) od časa karte, puščica = čas karte. TF 5m/15m/30m/1H/4H + "TV" = vgrajen pravi TradingView widget (brez nivojev).
- Ni povezave z Bybit računom (zasebni podatki) – app ne ve, ali je trejd res odprt.
