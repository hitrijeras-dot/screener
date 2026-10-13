import pandas as pd, numpy as np, glob, os
H=3600; D=86400
syms=sorted(os.path.basename(f)[:-4] for f in glob.glob('data/*.csv'))
hb={}
for s in syms:
    d=pd.concat([pd.read_csv('data_old/'+s+'.csv'),pd.read_csv('data/'+s+'.csv')]).drop_duplicates('t').sort_values('t')
    d['dt']=pd.to_datetime(d.t,unit='s')
    x=d.set_index('dt').resample('1h').agg({'o':'first','h':'max','l':'min','c':'last'}).dropna()
    hb[s]=x
idx=hb[syms[0]].index
def cpr(px,h,l,c):
    P=(h+l+c)/3; BC=(h+l)/2; TC=2*P-BC; top=np.maximum(TC,BC); bot=np.minimum(TC,BC)
    return np.where(px>top,1,np.where(px<bot,-1,0))
rows=[]
for s in syms:
    x=hb[s].copy()
    dd=x.resample('1D').agg({'o':'first','h':'max','l':'min','c':'last'})
    ww=x.resample('W-SUN',label='left',closed='left').agg({'o':'first','h':'max','l':'min','c':'last'})
    mm=x.resample('MS').agg({'o':'first','h':'max','l':'min','c':'last'})
    pdd=dd.shift(1).reindex(x.index.floor('D')).values
    # week start Monday
    wk=(x.index - pd.to_timedelta(x.index.dayofweek,unit='D')).floor('D')
    ww.index=ww.index+pd.Timedelta(days=1)  # W-SUN left label is Sunday -> Monday
    pww=ww.shift(1).reindex(wk).values
    pmm=mm.shift(1).reindex(x.index.to_period('M').to_timestamp()).values
    px=x.c.values  # close of this hour bar -> known at end of hour
    f=pd.DataFrame(index=x.index)
    f['D']=np.where(np.isnan(pdd[:,1]),np.nan,cpr(px,pdd[:,1],pdd[:,2],pdd[:,3]))
    f['W']=np.where(np.isnan(pww[:,1]),np.nan,cpr(px,pww[:,1],pww[:,2],pww[:,3]))
    f['M']=np.where(np.isnan(pmm[:,1]),np.nan,cpr(px,pmm[:,1],pmm[:,2],pmm[:,3]))
    # sessions (UTC hours): A 0-8, L 8-13, N 13-21
    hr=x.index.hour.values
    sess=np.where(hr<8,0,np.where(hr<13,1,np.where(hr<21,2,3)))  # 3 = after NY
    day=x.index.floor('D')
    f['sid']=sess; f['day']=day
    # running session stats
    key=pd.Series(day.astype('int64')//10**9*10+np.where(sess==3,2,sess),index=x.index)
    g=x.groupby(key.values)
    so=g.o.transform('first').values; sh=g.h.cummax().values; sl=g.l.cummin().values
    # for hours after NY (21-24) the 'session' is NY completed: use NY values
    f['so']=so; f['sh']=sh; f['sl']=sl; f['sc']=px
    # within key for sess==3 we grouped as NY key, but NY bars only 13-21; hours 21-23 got key NY too, continuing cummax -> fix by recomputing NY final values
    f['piv']=f['D']
    f['flow']=np.sign(px-so)
    # previous session high/low
    sessinfo=x.groupby(key.values).agg(h=('h','max'),l=('l','min'))
    ks=np.array(sorted(sessinfo.index))
    prevmap={k:(sessinfo.loc[ks[i-1]] if i>0 else None) for i,k in enumerate(ks)}
    ph=np.array([prevmap[k]['h'] if prevmap[k] is not None else np.nan for k in key.values])
    pl=np.array([prevmap[k]['l'] if prevmap[k] is not None else np.nan for k in key.values])
    bu=(sl<pl)&(px>pl); be=(sh>ph)&(px<ph)
    f['swp']=np.where(bu&~be,1,np.where(be&~bu,-1,0))
    f['sym']=s
    rows.append(f)
F=pd.concat(rows)
# hours 21-23: x in NY key but with bars after 21 included; acceptable approximation (app freezes NY at 21)
agg=F.groupby(level=0).agg(D=('D','mean'),W=('W','mean'),M=('M','mean'),piv=('piv','mean'),flow=('flow','mean'),swp=('swp','mean'))
agg['htf']=agg[['M','W','D']].mean(axis=1)*100
agg['sess']=(0.5*agg.piv+0.3*agg.flow+0.2*agg.swp)*100
agg['tot']=0.5*agg.htf+0.5*agg.sess
agg.to_pickle('bias_hourly.pkl')
print(agg.tot.describe())
