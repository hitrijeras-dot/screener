import os, glob, sys, pandas as pd
from engine2 import run_all, summary
S15=sorted(os.path.basename(f)[:-4] for f in glob.glob('data15/*.csv'))
S20=sorted(os.path.basename(f)[:-4] for f in glob.glob('data20_15/*.csv'))
C=[('1D level eq b0',dict(htf=86400,entry='level',tp='eq',sl_buf=0)),
   ('1D level eq b.02',dict(htf=86400,entry='level',tp='eq',sl_buf=0.02)),
   ('1D level rr2 b0',dict(htf=86400,entry='level',tp='rr',rr=2,sl_buf=0)),
   ('12H fvg eq b0',dict(htf=43200,entry='fvg',tp='eq',sl_buf=0)),
   ('12H fvg rr3 b0',dict(htf=43200,entry='fvg',tp='rr',rr=3,sl_buf=0)),
   ('12H fvg rr2 b0',dict(htf=43200,entry='fvg',tp='rr',rr=2,sl_buf=0)),
   ('12H fvgmid rr3 b0',dict(htf=43200,entry='fvgmid',tp='rr',rr=3,sl_buf=0)),
   ('12H cisd rr3 b0',dict(htf=43200,entry='cisd',tp='rr',rr=3,sl_buf=0)),
   ('12H fib05 eq b0',dict(htf=43200,entry='fib05',tp='eq',sl_buf=0)),
   ('12H level rr3 b0',dict(htf=43200,entry='level',tp='rr',rr=3,sl_buf=0)),
   ('6H ifvg best',dict(htf=21600,entry='ifvg',tp='rr',rr=3,sl_buf=0)),
]
rows=[]
for name,kw in C:
    for fp in (0.0,0.0005):
        for tag,syms,dirs in (('20-15m',S20,('data20_15',)),('28new',S15,('data15',))):
            s=summary(run_all(syms,dirs=dirs,fill_pen=fp,**kw)); s.update(cfg=name,fp=fp,set=tag); rows.append(s); print(name,fp,tag,round(s.get('avg',0),3),s['n'],flush=True)
pd.DataFrame(rows).to_csv('conf.csv',index=False)
