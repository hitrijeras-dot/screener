"""Decode gzip+base64 delta-encoded kline dumps saved from the browser into CSV files.
Usage: python3 decode.py <tool-result-file> [...]"""
import sys, json, base64, gzip, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.environ.get('OUTDIR','data'))
os.makedirs(OUT, exist_ok=True)

def decode_blob(b64):
    txt = gzip.decompress(base64.b64decode(b64)).decode()
    head, *lines = txt.split('\n')
    sym, dec = head.split('|')
    sc = 10 ** int(dec)
    pt = pc = 0
    rows = []
    for ln in lines:
        dt, do, dh, dl, dc = map(int, ln.split(','))
        t = pt + dt; o = pc + do; h = o + dh; l = o - dl; c = o + dc
        rows.append((t * 300, o / sc, h / sc, l / sc, c / sc))
        pt, pc = t, c
    return sym, rows

for p in sys.argv[1:]:
    raw = open(p).read()
    d = json.loads(raw)
    txt = d[0]['text'].split('\n\n(captured')[0].strip()
    txt = json.loads(txt)
    for blob in txt.split('#'):
        blob = blob.strip().strip('"')
        if not blob:
            continue
        sym, rows = decode_blob(blob)
        with open(os.path.join(OUT, f'{sym}.csv'), 'w') as f:
            f.write('t,o,h,l,c\n')
            for r in rows:
                f.write('%d,%s,%s,%s,%s\n' % r)
        print(sym, len(rows))
