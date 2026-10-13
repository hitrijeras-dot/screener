from engine import *
import pandas as pd, numpy as np
CUT=prep('BTCUSDT')[0][0]+60*86400
BASE=dict(entry='plevel_limit', after_close=True, close_rule='back', min_risk=0.003, max_risk=0.012, sl_buf_atr=0.1)
def filt(df, prng=11):
    return df[(~df.d_swept) & (df.P_rng_atr<prng)]
def ev(label='', syms=None, cut=CUT, prng=11, **kw):
    p=dict(BASE); p.update(kw)
    df=filt(run_all(syms, **p), prng)
    tr=df[df.t_entry<cut]; te=df[df.t_entry>=cut]
    f=lambda x: f"n={len(x):4d} g={x.gross_R.mean():+.3f} net={x.R.mean():+.3f} tot={x.R.sum():+6.1f} win={100*(x.R>0).mean():.0f}%"
    print(f"{label:30s} TRAIN {f(tr)} | TEST {f(te)}", flush=True)
    return df
