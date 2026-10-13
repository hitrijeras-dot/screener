import pandas as pd, numpy as np, sys
from engine import prep
pd.set_option('display.width',250)
CUT=prep('BTCUSDT')[0][0]+60*86400
df=pd.read_pickle(sys.argv[1])
df['set']=np.where(df.t_entry<CUT,'tr','te')
df['d_loc_b']=pd.cut(df.d_loc,[-9,0,0.25,0.5,0.75,1,9])
df['sweep_min_b']=pd.cut(df.sweep_min,[-1,30,90,180,270,360])
df['depth_b']=pd.qcut(df.depth_atr,4)
df['prng_b']=pd.qcut(df.P_rng_atr,4)
df['room_b']=pd.cut(df.room_R,[-99,0,1,2,4,99])
df['risk_b']=pd.cut(df.risk_pct,[0,0.003,0.005,0.008,0.012,0.03])
df['bfs_b']=pd.cut(df.bars_from_sweep,[-1,6,12,24,48,999])
df['sess']=pd.cut(df.hour,[-1,6,12,17,23],labels=['asia','london','ny','late'])
cols=sys.argv[2].split(',') if len(sys.argv)>2 else ['d_bias','d_loc_b','d_swept','above_dopen','above_ema','P_bull','sweep_min_b','depth_b','prng_b','room_b','risk_b','bfs_b','sess','closed_back','htf_bull','score','side','dow']
for cname in cols:
    g=df.groupby([cname,'set'],observed=True).agg(n=('R','size'),g=('gross_R','mean'),net=('R','mean')).round(3).unstack('set')
    print(g); print()
