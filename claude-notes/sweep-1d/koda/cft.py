import pandas as pd, numpy as np
d=pd.read_pickle('daily_EQ.pkl')
d['t_exit']=d.t_entry+np.maximum(d.i_exit-d.i_entry,0)*3600+3599
d=d.sort_values('t_entry').reset_index(drop=True)
def run(start_t, risk, cap, daily_budget=350, total_floor=9000, target=10800, maxdays=60, gate=True):
    df=d[(d.t_entry>=start_t)&(d.t_entry<start_t+maxdays*86400)]
    ev=[(r.t_entry,1,i) for i,r in df.iterrows()]+[(r.t_exit,0,i) for i,r in df.iterrows()]
    ev.sort(key=lambda x:(x[0],x[1]))
    bal=10000.0; open_={}; cnt={}; day=None; day_start=bal; minbal=bal; worst_day=0
    for t,typ,i in ev:
        dy=t//86400
        if dy!=day: day=dy; day_start=bal+0
        r=df.loc[i]
        if typ==1:
            k=(dy,r.side); 
            if cnt.get(k,0)>=cap: continue
            openrisk=sum(open_.values())
            if gate:
                if (day_start-bal)+openrisk+risk>daily_budget: continue
                if bal-openrisk-risk<total_floor+50: continue
            open_[i]=risk; cnt[k]=cnt.get(k,0)+1
        else:
            if i not in open_: continue
            rk=open_.pop(i); bal+=rk*r.R
            worst_day=max(worst_day, day_start-bal)
            # equity-based worst case: realized + all open at SL
            if day_start-bal>400 or bal<=total_floor: return 'FAIL', bal, (t-start_t)/86400, worst_day
            if bal>=target and not open_: return 'PASS', bal, (t-start_t)/86400, worst_day
    return 'OPEN', bal, maxdays, worst_day
if __name__=='__main__':
    t0=d.t_entry.min(); t1=d.t_entry.max()
    starts=np.arange(t0, t1-30*86400, 86400)
    for risk in [50,75,100,150]:
        for cap in [2,3]:
            for target,lab in [(10800,'F1 +8%'),(10500,'F2 +5%')]:
                res=[run(s,risk,cap,target=target) for s in starts]
                st=pd.Series([x[0] for x in res]); days=[x[2] for x in res if x[0]=='PASS']
                wd=max(x[3] for x in res)
                print(f"risk {risk:3d}$ cap{cap} {lab}: pass {100*(st=='PASS').mean():4.0f}%  fail {100*(st=='FAIL').mean():4.0f}%  neodl.(60d) {100*(st=='OPEN').mean():3.0f}%  mediana dni do cilja {np.median(days) if days else float('nan'):4.0f}  najslabši dan -{wd:.0f}$")
