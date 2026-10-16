# Preveri, da sta bloka SM in CISD v skupno/indikator.js enaka kot v sweep/index.html.
import sys
def blk(p,a,b):
    s=open(p).read();return s[s.index(a):s.index(b)]
ok=True
for a,b in [('/*SM*/','/*SM-END*/'),('/*CISD*/','/*CISD-END*/')]:
    e=blk('sweep/index.html',a,b)==blk('skupno/indikator.js',a,b);ok&=e;print(a,'enak' if e else 'RAZLIKA!')
sys.exit(0 if ok else 1)
