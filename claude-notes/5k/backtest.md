# 5K backtest (28. 10. 2026)

Koda: veja `backtest` (mapa `bt/`: `fetch.py` podatki, `run.js` test z isto kodo kot `5k/index.html` /*5K-CORE*/,
GitHub Actions `.github/workflows/bt5k.yml` se zažene ob pushu na vejo `backtest`, rezultat v `bt/out/`).
Poročilo (Claude artifact): »5K backtest«.

Nastavitve: Intraday 1D/1H/5m, 30 kovancev (Binance USDT perp – Bybit iz GitHub strežnika vrne 403),
29. 8.–27. 10. 2026, vsako uro izračun korakov 1–4, 5m CISD v kill zonah, limit na CISD liniji (velja 12 h),
SL ekstrem potiska, TP 2R, SL+TP v isti sveči = SL, vedno neizpodbiten CISD, provizije 0,02 % maker / 0,055 % taker.

Rezultat: 977 signalov, 697 trejdov z vstopom, 32,6 % TP (prag pri 2R = 33,3 %), −16 R brez provizij, −118 R s
provizijami, največji padec −129 R, 22 izgub zapored.
- London 191 trejdov, 37,7 %, +25 R (+2,7 R neto) – edina kill zona v plusu.
- New York 30,6 % (−18 R), Azija 30,7 % (−23 R).
- Filtri (brez Azije, SL ≥ 0,5 %) so v 1. polovici obdobja v plusu, v 2. v minusu → niso zanesljivi.
Sklep: v tej obliki sistem ni dobičkonosen.
