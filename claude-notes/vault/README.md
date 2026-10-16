# EAX Vault app (`vault/`)

App: https://hitrijeras-dot.github.io/screener/vault/

- `vault/vault.json` zapiše Claude v zanki EAX Vault (vsakih 5 min): v EAX tabu (Secret Vault odprt) izvede `extract.js`, rezultat shrani v `vault/vault.json`, commit + push na `main`.
- App bere `vault.json` vsako minuto, cene (tickers) vsakih 15 s in sveče (kline) vsakih 30 s neposredno z Bybit API.
- Rezultat trejda v živo: R = (cena − vstop)/(vstop − SL) (za short obratno), % od vstopa, $ = R × riziko (gumb zgoraj, privzeto 10 $).
- Graf: vstop/SL/TP1 (+TP2, če je blizu), cona long/short od časa karte, rumena črta = čas karte. TF 5m/15m/30m/1H/4H.
- Ni povezave z Bybit računom (zasebni podatki) – app ne ve, ali je trejd res odprt.
