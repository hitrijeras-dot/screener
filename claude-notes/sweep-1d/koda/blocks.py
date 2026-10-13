import os, importlib, pandas as pd, numpy as np
import engine
def run_dir(d, **kw):
    engine.DATA = os.path.join(os.path.dirname(os.path.abspath(engine.__file__)), d)
    engine._cache.clear()
    return engine.run_all(**kw)
CUT_BC = 1784125800 + 60*86400
def blocks(**kw):
    a = run_dir('data_old', **kw); a['blk']='A'
    bc = run_dir('data', **kw); bc['blk']=np.where(bc.t_entry<CUT_BC,'B','C')
    return pd.concat([a,bc], ignore_index=True)
def rep(df, label=''):
    out=[]
    for b in 'ABC':
        x=df[df.blk==b]
        out.append(f"{b}: n={len(x):4d} g={x.gross_R.mean():+.3f} net={x.R.mean():+.3f}")
    x=df; out.append(f"ALL net={x.R.mean():+.3f} tot={x.R.sum():+.0f}")
    print(f"{label:38s} " + ' | '.join(out), flush=True)
