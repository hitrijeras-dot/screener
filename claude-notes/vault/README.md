# EAX Vault app (`vault/`)

App: https://hitrijeras-dot.github.io/screener/vault/

- `vault/vault.json` zapiše Claude v zanki EAX Vault (vsakih 5 min): v EAX tabu (Secret Vault odprt) izvede `extract.js`, rezultat shrani v `vault/vault.json`, commit + push na `main`.
- App bere `vault.json` vsakih 30 s, cene (tickers) vsakih 5 s in sveče (kline, zadnje 3) vsakih 10 s neposredno z Bybit API; ob vrnitvi v app takoj osveži. Podoba v stilu EAX (temna, neon zelena). Pogled kartice ali tabela (razvrščanje s klikom na stolpec). Detajl: kalkulator limita za riziko (količina po qtyStep, max izguba s provizijami), 24h razpon, promet, funding.
- Rezultat trejda v živo: R = (cena − vstop)/(vstop − SL) (za short obratno), % od vstopa, $ = R × riziko (gumb zgoraj, privzeto 10 $).
- Graf: TradingView Lightweight Charts (unpkg, v4.2.0) – premikanje z miško/prstom, zoom; nivoji vstop/SL/TP1/TP2 kot price lines, cona long/short (baseline serije) od časa karte, puščica = čas karte. TF 5m/15m/30m/1H/4H + "TV" = vgrajen pravi TradingView widget (brez nivojev).
- Ni povezave z Bybit računom (zasebni podatki) – app ne ve, ali je trejd res odprt.


## Rubrike, CISD in Sweep (16. 10. 2026)
- Spodnja navigacija (na računalniku levo): **Vault** (kartice/tabela), **Poravnava** (Suen: 1D/1H/5m), **Sweep** (Sweep Model na kovancih iz Vaulta, 6H·5m ali 1D·15m), **Pravila**.
- Suen kriterij (Art of Crypto): 1D = barva včerajšnje dnevne sveče, 1H in 5m = smer zadnjega potrjenega CISD (samo zaprte sveče). ✓ = vsi trije v smeri karte. Filter "✓ Suen" in stolpec "Suen" tudi v Vault pogledu.
- Graf v podrobnostih: en gumb **Sweep + CISD** (16. 10. 13:20 na Juretovo željo združeno, CISD kot v Sweep appu = CISD sweepa iz bloka SM; risanje kot smChart: posweepan nivo, SL ekstrem, CISD/CISD ?, cone FVG/IFVG/OTE/GP/VI/HTF FVG, dotaknjeni fibi, puščica na ekstremu). Izbira se shrani (vault_ovs). Funkcija cisdEvents (Moj Screener CISD) se uporablja samo še za Suen poravnavo 1H/5m.
- Skupna koda indikatorja: `skupno/indikator.js` (blok SM = dobesedna kopija iz `sweep/index.html`; CISD = logika `cisd()` iz Moj Screener, a vrne vse dogodke). Preveri enakost: `python3 claude-notes/vault/preveri_indikator.py`.
- Analiza teče vsako minuto (4 sveče na kovanec: D, 1H, 6H, 5m; pri 1D sweepu še 15m).
