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


## ZDRUŽENO S SWEEP APPOM (16. 10. 2026, 13:30)
Na Juretovo željo je Vault zdaj **zaslon v Sweep appu**: `sweep/#vault` (kovanec: `#vault/SYM`). Videz Repsol (Sweep).
- Koda: `sweep/index.html`, blok `/*VAULT*/ … /*VAULT-END*/` (ločen `<script>` na koncu, vse v IIFE, ven samo `window.VX`). Izvorna kopija modula: `claude-notes/vault/vx_module.js`.
- CSS razredi `vx*`, `vb`, `vrs`, `lab`. Nav ima 6 gumbov (Danes, Vault, Screener, Bias, Log, Pravila).
- Zaslon Vault: Kartice / Tabela / Poravnava (Suen). Podrobnosti = okno `#vxDet` z Lightweight Charts (naložen šele ob odprtju), gumb Sweep + CISD, izbira 6H·5m / 1D·15m, okenci Suen in Sweep Model, kalkulator limita.
- Screener ima univerzum »Kovanci iz EAX Vaulta« (`VX.load()`).
- CISD blok (`cisdEvents`, `cisdLast`) je v sweep/index.html takoj za `/*SM-END*/`; enak kot v `skupno/indikator.js` (preveri `python3 claude-notes/vault/preveri_indikator.py`).
- `vault/index.html` je samo preusmeritev na `../sweep/#vault`. `vault/vault.json` ostane – zanka ga piše kot prej, Sweep ga bere z `../vault/vault.json`.
- Lokalnih nastavitev ključi ostanejo `vault_*` (riziko 10 $, mode, f, so, tf, ovs, swtf).

## Pravilo +1R → BE (16. 10. 2026, Jure)
- **Zanka:** pri vsakem odprtem trejdu na Bybit demo izračunaj R (vstop, SL s pozicije). Ko je ≥ +1R, Juretu takoj javi »premakni SL na BE« s točno ceno (vstop + 0,1 % za long, − 0,1 % za short). Claude naročil/SL sam ne spreminja.
- **EAX bot** (`claude-notes/eax-bot/`): `BE_AT_R=1` – bot sam premakne SL na BE pri +1R (in po delnem TP1).
- Dogovor: bot bo v naslednjem koraku bral kartice **neposredno iz EAX** (ne iz vault.json), da ni odvisen od zanke. Ko je Mac spet povezan: preveri, od kod EAX stran dobi podatke (network), sicer bot odpre EAX v svojem oknu (Jure se enkrat prijavi).
- Posodobljen eax_bot.py še ni na Juretovem Namizju (Mac je bil ugasnjen) – ob naslednji povezavi ga skopiraj v ~/Desktop/EAX-bot in dodaj `BE_AT_R=1` na konec nastavitve.txt (brez branja datoteke).

## Suenov trade checklist 7 točk (16. 10. 2026 zvečer, samo v app – ne v bot)
Funkcija `suen7(c)` v bloku /*VAULT*/: 1) daily bias = barva včeraj + DOL (PDH/PDL še ni pobran) v smeri karte; 2) zadnji 1H CISD v smeri karte;
3) PD array: vstop (ali cena) pod/nad 50 % včerajšnjega razpona (discount za long, premium za short); 4) karta sprožena v killzone (NY čas: London 2–5, NY 7–10, Azija 20–24 → pri nas 8–11, 13–16, 2–6);
5) strong high/low (≈): 1H ekstrem 12 h pred karto je posweepal prejšnji pivot in SL je za njim; 6) 5m CISD v smeri karte in biasa; 7) profil seje AMD/ABC – Jure odkljuka v oknu kovanca (localStorage vault_amd_<sym>_<firedAt>).
Prikaz: značka SUEN x/7 na karticah, seznam v Poravnavi in v oknu kovanca; filter »Suen 6+/7«; razvrščanje »Suen poravnava«. Risk dial je samo napis (7/7 poln, 6/7 pol, manj ne vstopi) – bot tega ne uporablja (Jure: »samo v app«).
