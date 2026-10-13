# Repo: hitrijeras-dot/screener (GitHub Pages)

Lastnik: Jure. Odgovarjaj **slovensko**, časi po našem času (Ljubljana). Jure ni programer – razlagaj preprosto, korak za korakom.

Repo je objavljen na https://hitrijeras-dot.github.io/screener/ (vsak push na `main` je objava). Vsaka mapa je svoja aplikacija:
- `index.html` – **Moj Screener** (CISD sistem). Ne spreminjaj, razen če Jure izrecno reče.
- `jay/` – samo preusmeritev na `jay2/` (stari Jay HL Screener izbrisan 11. 10. 2026). Ne dodajaj ničesar.
- `jay2/` – **Jay App**: Jay sistem (OnlyWicks "time × value"), videz aplikacije (okenca, ikone, spodnja navigacija). **Vse nove nadgradnje Jay stila delamo tukaj.** Shranjuje v `jay2_*` (ob prvem zagonu prevzame stare `jay_*`).
- `sweep/` – **Sweep** (PWA, namestljiva): screener po indikatorju OnlyWicks Sweep Model (kovanci na točkah, logika `/*SM*/`, graf s preklopom TF), **lasten bias trga po sejah** (neodvisen od EAX), strategija **Sweep 1D** (limiti + paper log). Svoja tema "Repsol" (13. 10. 2026 na Juretovo željo: črna prevladuje, neon oranžna poudarek, neon zelena long, neon rdeča short; pisava Chakra Petch) – namenoma drugačna od Moj Screener; privzeto temna; spodnja navigacija z zasloni #limits (Danes, privzeto) #screener #bias #log #rules. Varnostna kopija prejšnje različice: `sweep-v1/` (ne spreminjaj). Vse o njej v `claude-notes/sweep-1d/README.md`. Logika med `/*CORE*/` in `/*CORE-END*/` mora ostati enaka kot `claude-notes/sweep-1d/koda/engine.py` (končna različica).
- `kader/`, `plonkic/`, `zanka/`, `lamela/`, `elastika/`, `pobarvanka/`, `pravljica/` – druge Juretove aplikacije, ne spreminjaj.
- `claude-notes/` – zapiski za Claude. **Vse o Jay sistemu je v `claude-notes/jay/`** (začni z README.md, pravila.md).

## Jay HL Screener / Jay App – pravila za kodo
- En sam `jay2/index.html` (HTML + CSS + JS v eni datoteki), brez build orodij in knjižnic. Podatki iz javnega Bybit API (`https://api.bybit.com/v5/market/...`) neposredno iz brskalnika.
- Logika setupa (`jayScan`, `jaySetups` med `/*CORE*/` in `/*CORE-END*/` v `jay2/index.html`) mora ostati **enaka kot TradingView indikator** `claude-notes/jay/jay_hl_indikator.pine`. Če spremeniš eno, spremeni obe in to zapiši v `claude-notes/jay/README.md`.
- Signal (potrjen HL/LH) šteje samo na **zaprti** sveči. Odprta sveča = "možen HL ob zaprtju".
- Okvirji: 1D, 6H, 90m, 23m, 5m, 3m, 1m, 1W. 90m in 23m sta sestavljena iz 30m/1m sveč, sidro vsak dan ob 00:00 UTC.
- Čas: 1D/1W = 3. teden (15.–21.) ali prvih 5 dni meseca; pod 1D = 3. 6H dneva (12–18 UTC). 23D = 90-dnevni bloki od 1. januarja, 4 × 23 dni.
- Barve in videz kot Moj Screener (CSS spremenljivke v `:root`, svetla + temna tema). Besedila v slovenščini.
- Tveganje privzeto 1 % računa. Ni finančni nasvet.

## Preden objaviš
1. `node --check` na izluščenem JS.
2. Test z lažnimi Bybit podatki (Playwright `page.route('https://api.bybit.com/**', …)`), poglej posnetek tabele in odprte vrstice.
3. Kratek commit v slovenščini, push na `main`. Povej Juretu, kaj je novo, v 3–5 alinejah.
