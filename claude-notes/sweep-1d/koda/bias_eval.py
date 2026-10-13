import pandas as pd, numpy as np
B=pd.read_pickle('bias_hourly.pkl')
T=pd.read_pickle('daily_EQ.pkl').copy()
T['te']=pd.to_datetime(T.t_entry,unit='s')
T['d0']=T.te.dt.floor('D')
def val(ts,col):
    v=B[col].reindex(ts)
    return v.values
for col in ['tot','htf','sess']:
    T[col+'_open']=val(T.d0-pd.Timedelta(hours=1),col)
    T[col+'_fill']=val(T.te-pd.Timedelta(hours=1),col)
T['sg']=np.where(T.side=='long',1,-1)
def rep(name,m):
    d=T[m]; out=[name.ljust(42),f"n={len(d):4d}",f"avg={d.R.mean():+.3f}",f"tot={d.R.sum():+6.1f}",f"win={100*(d.R>0).mean():4.1f}%"]
    for b in 'ABC':
        x=d[d.blk==b]; out.append(f"{b}:{x.R.mean():+.2f}({len(x)})")
    print('  '.join(out))
rep('vse',T.R==T.R)
rep('samo long',T.side=='long'); rep('samo short',T.side=='short')
for when in ['open','fill']:
    for col in ['tot','htf','sess']:
        v=T[col+'_'+when]*T.sg
        for th in [0,20]:
            rep(f'{col}@{when} v smeri (>{th})',v>th)
        rep(f'{col}@{when} NI proti (>-20)',v>-20)
        rep(f'{col}@{when} proti (<-20)',v<-20)
    print()
