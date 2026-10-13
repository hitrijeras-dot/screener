import sys, json, base64, gzip, os
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'data15')
def dec(b64):
    txt=gzip.decompress(base64.b64decode(b64)).decode(); head,*lines=txt.split('\n'); sym,d=head.split('|'); sc=10**int(d); pt=pc=0; rows=[]
    for ln in lines:
        dt,do,dh,dl,dc=map(int,ln.split(',')); t=pt+dt; o=pc+do; h=o+dh; l=o-dl; c=o+dc; rows.append((t*900,o/sc,h/sc,l/sc,c/sc)); pt,pc=t,c
    return sym,rows
for p in sys.argv[1:]:
    d=json.load(open(p)); txt=json.loads(d[0]['text'].split('\n\n(captured')[0].strip())
    for blob in txt.split('#'):
        sym,rows=dec(blob.strip())
        with open(os.path.join(OUT,sym+'.csv'),'w') as f:
            f.write('t,o,h,l,c\n'); [f.write('%d,%s,%s,%s,%s\n'%r) for r in rows]
        print(sym,len(rows))
