from engine import *
import sys, pandas as pd
CUT=prep('BTCUSDT')[0][0]+60*86400
def q(**kw):
    df=run_all(**kw)
    tr=df[df.t_entry<CUT]; te=df[df.t_entry>=CUT]
    f=lambda d: f"n={len(d)} g={d.gross_R.mean():+.3f} net={d.R.mean():+.3f} win={100*(d.R>0).mean():.0f}%"
    print(kw, '| TRAIN', f(tr), '| TEST', f(te), flush=True)
    return df
