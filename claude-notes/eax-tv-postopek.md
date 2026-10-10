# Claude – postopek EAX -> TradingView (za Jaya)

Pravila: vikend = samo ucenje; Bybit samo DEMO; Jayevih risb ne brisati (najprej draw_list); vstop samo po zaprti 5m svecki s CISD; pred preklicem narocila preveri Positions; SL/TP pozicije ne brisati brez ukaza.

## Koraki
1. portal.easyalgotools.com/EAX-AI -> iframe src (token ne izpisuj) -> location.href=src. Preberi celo stran: Market Overview, Asset Watchlist kartice (POI, S/R), Secret Vault (PRIMED / DEVELOPING / RE-ENTRIES).
2. TV lista "Nova strategija" (stanje 2026-10-10): sekciji LONG/SHORT = coini iz Secret Vaulta (BTW, FLNC, EDU); sekciji SMC X LONG (XMR, OGN) in SMC X SHORT (ARPA, PIXEL, BRETT, PENGU) = SMC setupi. Gumb "Kopiraj za TradingView" v screenerju izvozi sekciji SMC X LONG / SMC X SHORT.
3. Za vsak coin: chart_set_symbol, pocakaj da je symbolExt() nenull, draw_list (obstojecih risb se ne dotikaj), nato POI pravokotnik + D/W pivoti.
4. Pivoti iz Bybit klines (list[1] = prejsnja D/W svece): P=(H+L+C)/3, R1=2P-L, S1=2P-H, R2=P+(H-L), S2=P-(H-L), R3=H+2(P-L), S3=L-2(H-P).
5. Barve: D P siva, D R rdeca, D S zelena, W oranzna; POI rdec (short) / zelen (long). OB vedno po body, ne wick.
6. Shrani: TradingViewApi.saveChart. Ce se graf zamrzne: saveChart + location.reload().

## Zapomni si
- Jay: slovenscina, casi po slovenskem casu (Europe/Ljubljana), brez emojijev. Tveganje 1 % racuna na trade.
- Killzone (NY 02-05 / 07-10) = po slovenskem casu London 08-11, NY 13-16 (do 25. 10.; screener preracuna sam).
- Screener ima sekcijo "Odprti trade-i" (shranjeno v brskalniku naprave): ziva cena, PnL, razdalja do SL/TP, obvestilo ob SL/TP.
- RLC: pred vstopom pocakaj, da 5m EQ lows pobere; SL za sweep wick.
- Narisano 2026-10-10: FLNC, EDU (short), BTW; tudi STRK, ZEC, NEAR, KAIA, US (risbe ostanejo na grafih, v listi jih ni).
