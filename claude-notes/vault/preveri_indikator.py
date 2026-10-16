# Preveri, da je blok /*SM*/ … /*SM-END*/ v skupno/indikator.js enak kot v sweep/index.html.
import sys
def blk(p):
    s=open(p).read();a=s.index('/*SM*/');b=s.index('/*SM-END*/');return s[a:b]
ok=blk('sweep/index.html')==blk('skupno/indikator.js')
print('SM blok enak' if ok else 'RAZLIKA v SM bloku!');sys.exit(0 if ok else 1)
