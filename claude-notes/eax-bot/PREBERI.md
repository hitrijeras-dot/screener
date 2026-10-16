# EAX bot – avtomatsko trgovanje po EAX Secret Vaultu

Bot vsako minuto pogleda kartice EAX Secret Vaulta. Ko se pojavi **nova kartica FIRST ENTRY**, sam odda na Bybitu
**Post-Only limit** na vstopu, s **SL** in **TP1** že pripetima. Količina je taka, da je izguba na SL s provizijami = `RISK_USD` (privzeto 10 $).
Neizpolnjen limit prekliče, ko kartica izgine iz Vaulta, ko je kartica že na TP1/SL ali po 4 urah.

**Pomembno:** kartice bere iz datoteke, ki jo osvežuje Claude v zanki (vsakih 5 min). Če zanka ne teče, bot nima novih kartic
(v dnevniku napiše »Vault ni osvežen«) in ne trguje. Bot teče samo, dokler je Mac prižgan in okno Terminala odprto.

## Prvi zagon (korak za korakom)
1. Na Bybitu preklopi na **Demo Trading** → profil → **API** → *Create New Key* → *System-generated* →
   dovoljenja **Contract: Orders + Positions** (Read-Write). **Ne** obkljukaj Withdraw/Transfer. Kopiraj *API Key* in *Secret*.
2. Odpri `nastavitve.txt` (dvoklik, odpre se v TextEdit) in vpiši `API_KEY=` in `API_SECRET=`. Shrani.
3. Dvoklikni `zazeni.command`. Odpre se Terminal. (Prvič macOS morda vpraša za namestitev »command line developer tools« – potrdi in počakaj.
   Če macOS reče, da datoteke ne more odpreti: desni klik → Odpri → Odpri.)
4. Bot je najprej v načinu **DRY_RUN=1**: samo izpiše, kaj **bi** naredil. Pusti ga teči nekaj ur in poglej `dnevnik.txt`.
5. Ko si zadovoljen: v `nastavitve.txt` nastavi `DRY_RUN=0`, shrani, zapri Terminal in znova dvoklikni `zazeni.command`.
6. Za pravi račun: nov ključ na pravem računu (enaka dovoljenja), `DEMO=0`. Priporočilo: najprej vsaj teden na demo.

## Datoteke
- `eax_bot.py` – bot (ne spreminjaj)
- `nastavitve.txt` – tvoje nastavitve in ključ
- `dnevnik.txt` – vse, kar je bot naredil
- `stanje.json` – kaj je bot že videl/oddal (če ga izbrišeš, bot ob naslednjem zagonu spet preskoči vse obstoječe kartice)

## Varovalke
- ob zagonu ne trguje kartic, ki so bile v Vaultu že prej
- trguje samo FIRST ENTRY v fazi IN PLAY, ne RE-ENTER
- preskoči, če je cena že čez vstop (Post-Only bi takoj izpolnil), če je SL bližje od 0,3 % ali dlje od 15 %, če je kartica starejša od 30 min
- največ `MAX_OPEN` hkrati, vzvod največ `MAX_LEV`
- ključ brez pravice dviga

Ni finančni nasvet. Trgovanje z vzvodom je tvegano – bot lahko izgubi denar.
