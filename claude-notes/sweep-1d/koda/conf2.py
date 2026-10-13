import os, glob, itertools, pandas as pd
from multiprocessing import Pool
from engine2 import run_all, summary
S20=sorted(os.path.basename(f)[:-4] for f in glob.glob('data/*.csv'))
S15=sorted(os.path.basename(f)[:-4] for f in glob.glob('data15/*.csv'))
def job(a):
    htf,entry,ltf,tp,buf,setn=a
    if setn=='28new':
        if ltf==300: return None
        r=run_all(S15,dirs=('data15',),htf=htf,entry=entry,ltf=0 if ltf==900 else ltf,tp=tp[0],rr=tp[1],sl_buf=buf)
    else:
        r=run_all(S20,htf=htf,entry=entry,ltf=0 if ltf==300 else ltf,tp=tp[0],rr=tp[1],sl_buf=buf)
    s=summary(r); s.update(htf=htf,entry=entry,ltf=ltf,tp=tp[0] if tp[0]!='rr' else f'rr{tp[1]}',buf=buf,set=setn); return s
if __name__=='__main__':
    C=list(itertools.product([86400,43200],['cisd5','cisd5w','cisdr','cisdrw'],[300,900,3600],[('eq',2),('rr',2),('rr',3)],[0.0,0.05],['20','28new']))
    with Pool(2) as p: res=[r for r in p.imap_unordered(job,C) if r]
    pd.DataFrame(res).to_csv('conf2.csv',index=False); print('done',len(res))
