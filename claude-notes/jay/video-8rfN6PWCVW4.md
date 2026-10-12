# Video 8rfN6PWCVW4 – Smart Money Trader: "The ONLY Entry Setup That Works With Smart Money"

Pregledano 12. 10. 2026. Povzetek je v nasih besedah, brez prepisanega besedila videa.

## Osnovno
- Kanal: Smart Money Trader (youtube.com/@smart-money-trader), ~38,7 tis. narocnikov.
- Dolzina: ~4 min (kratek promo/razlaga, ne celoten tecaj).
- Opis: ena povezava na prodajno stran "SMC X – The Entry System" (smartmoneytrader.co) + povezava na vse indikatorje (smartmoneytrader.co/indicators). Povezav na TradingView, GitHub ali Pastebin v opisu ni. Pripetega komentarja nisem nalozil.

## Skript
- SMC X je placljiv indikator (na strani cena 399 $ znizana na 199 $, "lifetime"). Na TradingView ga javno nisem nasel; iskanje je vrnilo samo druge (odprtokodne in invite-only) SMC/CISD skripte, ki niso potrjeno isti.
- Zato Pine kode NI. Spodaj je samo povzetek videa in primerjava z Jay sistemom. Nobenih lastnosti indikatorja (repaint, nastavitve, backtest) ne morem preveriti.

## Kaj razlaga avtor (CISD = Compression, Inducement, Sweep, Displacement)
Pozor: tu CISD ni "change in state of delivery", ampak 4-delno zaporedje:
1. Compression: cena se upocasni, sveče se zmanjsajo, struktura se skrci; likvidnost se nabira na obeh straneh.
2. Inducement: past (lazni OB, sibek CHoCH, plitek imbalance), ki zvabi maloprodajo v napacno smer.
3. Sweep: pobrana likvidnost (npr. prejsnje dno), stopi se sprozijo.
4. Displacement: cena cisto odskoci stran od sweepa; to je sprozilec vstopa.
- Vstop: na nizjem casovnem okvirju pocakas, da se displacement izrise, nato vstopis.
- SL: za sweepom. TP: naslednja cista likvidnostna raven.
- Pravilo: ni zaporedja, ni trade. Isti model za crypto, forex, indekse.
- V videu ni konkretnih okvirjev, stevilk, backtesta ali pogojev, kdaj ne dela.

## Primerjava z Jay sistemom (time x value)
Podobno:
- Sweep likvidnosti pod dnom (Jay: L -> LL) in nato odmik navzgor.
- Vstop sele po potrditvi (Jay: zaprta zelena sveča nad 0.618; video: displacement), SL za strukturo/sweepom, cilj likvidnost/stari vrh.
- Nic vstopa brez celotnega zaporedja; signal na zaprti sveci.
Drugace:
- Jay ima cas (6H/90m/23m fraktali, 3. teden, 3. 6H) in vrednost (HL v golden pocketu 0.618-0.786, VAL/POC) kot obvezen del. Video casa in fib cone sploh ne omenja.
- Jay vstopa na retestu HL (umik), video na displacementu (po odskoku, torej bolj "hoja za cenom").
- Video je splosen SMC model brez pravil o okvirjih in brez statistike; Jay ima backtest (npr. 3D filter +0.38R).
- Compression ~ baza/skrcenje pred sweepom v Jay receptu; inducement nima neposredne Jay oznake.
Zakljucek: video ne dodaja pravil, ki jih Jay sistem ze nima; morda uporabno kot dodaten filter "displacement po sweepu" na LTF za vstop znotraj Jay cone. Ker je skript zaprt in placljiv, ga ni mogoce preveriti ali testirati.
