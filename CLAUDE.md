# Repo: hitrijeras-dot/screener (GitHub Pages)

Lastnik: Jure. Odgovarjaj **slovensko**, časi po našem času (Ljubljana). Jure ni programer – razlagaj preprosto, korak za korakom.

Repo je objavljen na https://hitrijeras-dot.github.io/screener/ (vsak push na `main` je objava). Vsaka mapa je svoja aplikacija:
- `index.html` – **Moj Screener** (CISD sistem). Ne spreminjaj, razen če Jure izrecno reče.
- `jay/` – **Jay HL Screener** (OnlyWicks "time × value" stil). Tu delamo nadgradnje za Jay stil.
- `kader/`, `plonkic/`, `zanka/`, `lamela/`, `elastika/`, `pobarvanka/`, `pravljica/` – druge Juretove aplikacije, ne spreminjaj.
- `claude-notes/` – zapiski za Claude. **Vse o Jay sistemu je v `claude-notes/jay/`** (začni z README.md, pravila.md).

## Jay HL Screener – pravila za kodo
- En sam `jay/index.html` (HTML + CSS + JS v eni datoteki), brez build orodij in knjižnic. Podatki iz javnega Bybit API (`https://api.bybit.com/v5/market/...`) neposredno iz brskalnika.
- Logika setupa (`jayScan`, `jaySetups` med `/*CORE*/` in `/*CORE-END*/`) mora ostati **enaka kot TradingView indikator** `claude-notes/jay/jay_hl_indikator.pine`. Če spremeniš eno, spremeni obe in to zapiši v `claude-notes/jay/README.md`.
- Signal (potrjen HL/LH) šteje samo na **zaprti** sveči. Odprta sveča = "možen HL ob zaprtju".
- Okvirji: 1D, 6H, 90m, 23m, 5m, 3m, 1m, 1W. 90m in 23m sta sestavljena iz 30m/1m sveč, sidro vsak dan ob 00:00 UTC.
- Čas: 1D/1W = 3. teden (15.–21.) ali prvih 5 dni meseca; pod 1D = 3. 6H dneva (12–18 UTC). 23D = 90-dnevni bloki od 1. januarja, 4 × 23 dni.
- Barve in videz kot Moj Screener (CSS spremenljivke v `:root`, svetla + temna tema). Besedila v slovenščini.
- Tveganje privzeto 1 % računa. Ni finančni nasvet.

## Preden objaviš
1. `node --check` na izluščenem JS.
2. Test z lažnimi Bybit podatki (Playwright `page.route('https://api.bybit.com/**', …)`), poglej posnetek tabele in odprte vrstice.
3. Kratek commit v slovenščini, push na `main`. Povej Juretu, kaj je novo, v 3–5 alinejah.
