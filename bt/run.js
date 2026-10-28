// Backtest 5K (Intraday 1D/1H/5m) – ista logika kot screener (blok /*5K-CORE*/ iz 5k/index.html).
// Uporaba: node run.js <mapa s podatki> <izhod.json>
const fs=require('fs'),path=require('path');
const DIR=process.argv[2]||'data',OUT=process.argv[3]||'rezultat.json';
const html=fs.readFileSync(path.join(__dirname,'..','5k','index.html'),'utf8');
let core=html.slice(html.indexOf('/*5K-CORE*/'),html.indexOf('/*5K-CORE-END*/'));
core=core.replace('E=k5Engine(lb,CFG.pivLen,CFG.ltfAge);R.lOf=E.of;','E=null;R.lOf=0;'); // LTF OF samo za prikaz – v testu izpuščen (hitrost)
if(core.includes('E=k5Engine(lb'))throw new Error('patch ni uspel');
const MIN=60000,HOUR=3600000,DAY=86400000;
const IVMS={'1':MIN,'5':5*MIN,'15':15*MIN,'60':HOUR,'240':4*HOUR,'D':DAY,'W':7*DAY};
const CFG={pivLen:3,obAge:200,ltfAge:400,liqMul:1,useRange:true,useKZ:true,kzAsia:true,nearAtr:1};
const nyFmt=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour12:false,hour:'2-digit'});
const nyH=ms=>{let h=+nyFmt.format(new Date(ms));return h===24?0:h};
function kzOf(ms){const h=nyH(ms);if(h>=7&&h<10)return 'New York';if(h>=2&&h<5)return 'London';if(h>=20&&CFG.kzAsia)return 'Azija';return ''}
const earlyAt=()=>false; // brez koledarja novic: vedno neizpodbiten CISD
const K=new Function('IVMS','CFG','kzOf','earlyAt',core+';return {k5Eval,k5Ltf};')(IVMS,CFG,kzOf,earlyAt);
const P={htf:'D',mtf:'60',ltf:'5',hN:'1D',mN:'1H',lN:'5m'};
const FEE_MAKER=0.0002,FEE_TAKER=0.00055,PEND_MAX=12*HOUR;
const meta=JSON.parse(fs.readFileSync(path.join(DIR,'meta.json')));
const bs=(A,t)=>{let lo=0,hi=A.length;while(lo<hi){const m=(lo+hi)>>1;if(A[m].t<t)lo=m+1;else hi=m}return lo};
const toB=a=>a.map(x=>({t:x[0],o:x[1],h:x[2],l:x[3],c:x[4]}));
const trades=[];const stat={};
for(const sym of meta.syms){
  const raw=JSON.parse(fs.readFileSync(path.join(DIR,sym+'.json')));
  const D=toB(raw.D),H=toB(raw['60']),F=toB(raw['5']);
  const seen=new Set();let steps=0,zoneSteps=0;
  // indeksi
  let hi=0,di=0,fi=0;
  for(let T=meta.start5;T<meta.end;T+=HOUR){
    while(hi<H.length&&H[hi].t+HOUR<=T)hi++;while(di<D.length&&D[di].t+DAY<=T)di++;
    const hc=H.slice(Math.max(0,hi-400),hi),dc=D.slice(Math.max(0,di-60),di);
    if(hc.length<200||dc.length<20)continue;steps++;
    const px=hc[hc.length-1].c;
    const R=K.k5Eval(P,{c:dc,o:null},{c:hc,o:null},null,px,T);
    if(R.status==='x')continue;zoneSteps++;
    const a0=bs(F,R.from-5*MIN),a1=bs(F,T+HOUR-5*MIN+1);const lb=F.slice(a0,a1);if(!lb.length)continue;
    K.k5Ltf(P,R,lb,T);
    for(const g of R.sigs){if(g.t<T||g.t>=T+HOUR)continue;const key=g.t+'|'+g.en;if(seen.has(key))continue;seen.add(key);
      trades.push({sym,t:g.t,dir:R.bias===1?'L':'S',en:g.en,sl:g.sl,tp:g.tp,kz:kzOf(g.t),zTop:R.zone.top,zBot:R.zone.bot,tgt:R.tgt?R.tgt.v:null})}
  }
  stat[sym]={steps,zoneSteps};
}
// izid vsakega trejda na 5m
const F5={};
for(const tr of trades){
  if(!F5[tr.sym])F5[tr.sym]=toB(JSON.parse(fs.readFileSync(path.join(DIR,tr.sym+'.json')))['5']);
  const F=F5[tr.sym],L=tr.dir==='L';let i=F.findIndex(b=>b.t>tr.t),st='pend';
  for(;i>=0&&i<F.length;i++){const b=F[i];
    if(st==='pend'){if(L?b.h>=tr.tp:b.l<=tr.tp){st='miss';break}if(b.t-tr.t>PEND_MAX){st='poteklo';break}
      if(L?b.l<=tr.en:b.h>=tr.en){st='open';tr.fill=b.t}}
    if(st==='open'){if(L?b.l<=tr.sl:b.h>=tr.sl){st='sl';tr.out=b.t;break}if(L?b.h>=tr.tp:b.l<=tr.tp){st='tp';tr.out=b.t;break}}
  }
  tr.res=st;const risk=Math.abs(tr.en-tr.sl)/tr.en;tr.riskPct=risk*100;
  const fee=st==='tp'?(FEE_MAKER*2)/risk:st==='sl'?(FEE_MAKER+FEE_TAKER)/risk:0;
  tr.R=st==='tp'?2:st==='sl'?-1:0;tr.Rnet=tr.R-(st==='tp'||st==='sl'?fee:0);
}
fs.writeFileSync(OUT,JSON.stringify({meta:{src:meta.src,start:meta.start5,end:meta.end,syms:meta.syms,log:meta.log},stat,trades}));
const done=trades.filter(t=>t.res==='tp'||t.res==='sl');
const sum=a=>a.reduce((x,y)=>x+y,0);
console.log('signali',trades.length,'zaprti',done.length,'TP',done.filter(t=>t.res==='tp').length,'R',sum(done.map(t=>t.R)).toFixed(1),'Rneto',sum(done.map(t=>t.Rnet)).toFixed(1));
