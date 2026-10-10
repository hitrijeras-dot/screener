# Claude – postopek EAX -> TradingView (za Jaya)

Pravila: vikend = samo ucenje; Bybit samo DEMO; Jayevih risb ne brisati (najprej draw_list); vstop samo po zaprti 5m svecki s CISD; pred preklicem narocila preveri Positions; SL/TP pozicije ne brisati brez ukaza.

## Koraki
1. portal.easyalgotools.com/EAX-AI -> iframe src (token ne izpisuj) -> location.href=src. Preberi celo stran: Market Overview, Asset Watchlist kartice (POI, S/R), Secret Vault (PRIMED / DEVELOPING / RE-ENTRIES).
2. TV lista "Nova strategija" naj vsebuje SAMO coine iz Secret Vaulta (Jay, 2026-10-10). Trenutno: BTW, FLNC, EDU.
3. Za vsak coin: chart_set_symbol, pocakaj da je symbolExt() nenull, draw_list (obstojecih risb se ne dotikaj), nato POI pravokotnik + D/W pivoti.
4. Pivoti iz Bybit klines (list[1] = prejsnja D/W svece): P=(H+L+C)/3, R1=2P-L, S1=2P-H, R2=P+(H-L), S2=P-(H-L), R3=H+2(P-L), S3=L-2(H-P).
5. Barve: D P siva, D R rdeca, D S zelena, W oranzna; POI rdec (short) / zelen (long). OB vedno po body, ne wick.
6. Shrani: TradingViewApi.saveChart. Ce se graf zamrzne: saveChart + location.reload().

## Zapomni si
- RLC: pred vstopom pocakaj, da 5m EQ lows pobere; SL za sweep wick.
- Narisano 2026-10-10: FLNC, EDU (short), BTW; tudi STRK, ZEC, NEAR, KAIA, US (risbe ostanejo na grafih, v listi jih ni).
