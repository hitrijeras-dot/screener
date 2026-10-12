# EAX Vault zanka (5 min)

Opis zanke, ki jo Jay in Claude izvajata na Bybit DEMO.

## Vsak cikel (5 min)
1. Osvezi in preberi CELOTEN EAX Secret Vault (eax.easyalgotools.com/EAX), od prvega kartice do konca strani. Kartica: ime, cena, status (IN PLAY / FIRED / PRIMED / TP1 HIT / INVALIDATED / NO ENTRY), smer, ENTRY (STAMPED), STOP, TP1, TP2.
2. Preveri Bybit DEMO: Positions in Open Orders.
3. Upravljaj SL, uskladi TV listo "EAX Secret Vault" (PRIMED + odprte pozicije), vsak trade oznaci na TV z orodjem Long/Short.
4. Porocilo v slovenscini, lokalni cas.

## Pravila za vstop
- Samo Bybit DEMO.
- Vstop kot navaden maker limit (Post-Only), ne Chase Limit.
- Privzeto tveganje 30 $ (druge zneske doloci Jay, npr. BTW 100 $, CBRS 200 $).
- Nova kartica, ki je ze in play: vseeno daj limit, razen ce je cena ze cez ~50 % poti do TP1.
- Cena na dobri strani vstopa: limit na vstopu kartice.
- Cena ze proti SL: Post-Only limit tik na pasivni strani cene (short nad ceno, long pod ceno).
- Stare kartice, ki tecejo ure ali dneve: samo spremljaj.

## Upravljanje pozicij
- Po TP1 premakni SL na BE, po TP2 premakni SL na TP1.
- Brez Jayevega izrecnega ukaza ne odpiraj, zapiraj ali spreminjaj Bybit tradov (izjema: postavitev limita v zanki).

## Porocanje
- Brez sprememb: ena vrstica "Brez sprememb" + skupni P&L.
- Tabela z vrstico "Skupaj" samo ob spremembah, novih karticah ali ko je cena blizu SL/TP. Zaprti trade samo v stavku pod tabelo.

## Okolje
- Bybit in EAX Vault odprta v polni sirini (emulirani viewport 1400x850).
- Dnevni pregled Scanner X (Easy AI Market Read) ob 14:55 po lokalnem casu, 30 min pred NY sejo.
- Sistemi EAX, Jikoku in Jay so strogo locani.
