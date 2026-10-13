import os,glob,pandas as pd,numpy as np
from engine2 import run_all
S20=sorted(os.path.basename(f)[:-4] for f in glob.glob('data/*.csv'))
S15=sorted(os.path.basename(f)[:-4] for f in glob.glob('data15/*.csv'))
for tag,df in (('20 (5m)',run_all(S20,entry='level',tp='eq',sl_buf=0,feat=True)),('28 novih (15m)',run_all(S15,dirs=('data15',),entry='level',tp='eq',sl_buf=0,feat=True))):
    print('==',tag,'vsi',len(df),round(df.R.mean(),3))
    for nm,m in [('CISD potrjen',df.cisd),('brez CISD',~df.cisd),('FVG',df.fvg),('brez FVG',~df.fvg),('CISD+FVG',df.cisd&df.fvg),
                 ('zaprtje globoko nazaj (>30% P)',df.back>0.3),('zaprtje plitvo (<=30%)',df.back<=0.3),('dolg wick (>50% S)',df.wick>0.5),('kratek wick',df.wick<=0.5)]:
        x=df[m]; print(f'  {nm:32s} n={len(x):4d} avg={x.R.mean():+.3f}  A={x[x.blk=="A"].R.mean():+.3f} B={x[x.blk=="B"].R.mean():+.3f} C={x[x.blk=="C"].R.mean():+.3f}')
