import sys, os, glob, itertools, json
import pandas as pd, numpy as np
from multiprocessing import Pool
from engine2 import run_all, summary

SYMS = sorted(os.path.basename(f)[:-4] for f in glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', '*.csv')))
HTFS = [3600, 14400, 21600, 43200, 86400, 604800]
ENTRIES = ['level', 'fvg', 'fvgmid', 'ifvg', 'cisd', 'zone', 'gp', 'fib05', 'mid', 'market', 'cisd5', 'cisd5w']
TPS = [('eq', 2.0), ('opp', 2.0), ('rr', 1.5), ('rr', 2.0), ('rr', 3.0)]
BUFS = [0.0, 0.02, 0.05]

def job(args):
    htf, entry, (tp, rr), buf = args
    df = run_all(SYMS, htf=htf, entry=entry, tp=tp, rr=rr, sl_buf=buf)
    s = summary(df)
    s.update(htf=htf, entry=entry, tp=tp if tp != 'rr' else f'rr{rr}', buf=buf)
    return s

if __name__ == '__main__':
    combos = list(itertools.product(HTFS, ENTRIES, TPS, BUFS))
    with Pool(2) as pool:
        res = []
        for i, r in enumerate(pool.imap_unordered(job, combos, chunksize=4)):
            res.append(r)
            if i % 60 == 0: print(i, len(combos), flush=True)
    pd.DataFrame(res).to_csv('grid2.csv', index=False)
    print('done')
