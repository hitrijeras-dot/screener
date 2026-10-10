window.__bt={status:'start',log:[],res:{},done:0,total:0};
(async function(){
const BT=window.__bt;
const API='https://api.bybit.com/v5/market/';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(u){for(let a=0;a<3;a++){try{const r=await fetch(u);const j=await r.json();if(j.retCode===0)return j.result;}catch(e){}await sleep(500)}throw new Error('fetch '+u)}
async function kl(sym,iv,end){const r=await get(API+'kline?category=linear&symbol='+sym+'&interval='+iv+'&limit=1000'+(end?'&end='+end:''));return r.list.reverse().map(x=>({t:+x[0],o:+x[1],h:+x[2],l:+x[3],c:+x[4]}))}
async function hist(sym,iv,pages){let all=[],end=null;for(let p=0;p<pages;p++){const k=await kl(sym,iv,end);if(!k.length)break;all=k.concat(all);end=k[0].t-1;if(k.length<1000)break;await sleep(40)}return all}
function aggr(k,mins){const ms=mins*6e4,out=[];let cur=null;for(const x of k){const day=Math.floor(x.t/864e5)*864e5,b=day+Math.floor((x.t-day)/ms)*ms;
  if(!cur||cur.t!==b){cur={t:b,o:x.o,h:x.h,l:x.l,c:x.c,e:Math.min(b+ms,day+864e5)};out.push(cur)}else{cur.h=Math.max(cur.h,x.h);cur.l=Math.min(cur.l,x.l);cur.c=x.c}}
  if(out.length>1)out.shift();return out}
// jayScan z dogodki (ista logika kot screener/indikator)
let src=jayScan.toString();
src=src.replace('b.sig={','b.sig=o.onSig(1,{').replace('s.sig={','s.sig=o.onSig(-1,{').split('time:jayTimeOK(K.t,fD,o.tfMin)}').join('time:jayTimeOK(K.t,fD,o.tfMin)})');
const scanEv=new Function('jayPivot','jayTimeOK','return '+src)(jayPivot,jayTimeOK);
function events(k,tfMin){const ev=[];scanEv(k,{piv:5,freshD:5,tfMin:tfMin,onSig:function(d,x){ev.push(Object.assign({dir:d},x));return x}});return ev}
// HTF smer iz pivotov (P=3) na višjem okvirju, samo potrjeni pred časom t
function htfBias(h,hMs){const P=3,piv=[];for(let c=P;c<h.length-P;c++){let lo=true,hi=true;for(let j=1;j<=P;j++){if(h[c-j].l<=h[c].l||h[c+j].l<h[c].l)lo=false;if(h[c-j].h>=h[c].h||h[c+j].h>h[c].h)hi=false}
  const conf=h[c+P].t+hMs;if(lo)piv.push({k:'L',v:h[c].l,conf});if(hi)piv.push({k:'H',v:h[c].h,conf})}
  piv.sort((a,b)=>a.conf-b.conf);
  return function(t){let lastL=null,prevL=null,lastH=null,prevH=null,latest=null;for(const p of piv){if(p.conf>t)break;if(p.k==='L'){prevL=lastL;lastL=p.v}else{prevH=lastH;lastH=p.v}latest=p}
    if(!latest)return 0;if(latest.k==='L'&&prevL!==null)return lastL>prevL?1:-1;if(latest.k==='H'&&prevH!==null)return lastH>prevH?1:-1;return 0}}
const TPS=['H','2R','3R'],FIL=['vsi','cas','htf','cas+htf','liq'];
function sim(k,ev,bias,agg,coin){
  const slots={};for(const f of FIL)for(const tp of TPS)slots[f+'|'+tp]={open:null,N:0,W:0,R:0,peak:0,dd:0,L:0,LR:0,S:0,SR:0};
  const byI={};for(const e of ev){(byI[e.i]=byI[e.i]||[]).push(e)}
  for(let i=0;i<k.length;i++){const K=k[i];
    for(const key in slots){const s=slots[key],o=s.open;if(!o||o.i>=i)continue;let r=null;
      if(o.dir===1){if(K.l<=o.sl)r=-1-o.fee;else if(K.h>=o.tp)r=(o.tp-o.en)/o.rk-o.fee}
      else{if(K.h>=o.sl)r=-1-o.fee;else if(K.l<=o.tp)r=(o.en-o.tp)/o.rk-o.fee}
      if(r!==null){s.N++;if(r>0)s.W++;s.R+=r;s.peak=Math.max(s.peak,s.R);s.dd=Math.max(s.dd,s.peak-s.R);if(o.dir===1){s.L++;s.LR+=r}else{s.S++;s.SR+=r}s.open=null}}
    for(const e of (byI[i]||[])){const en=K.c,sl=e.dir===1?e.HL*0.997:e.LH*1.003,rk=Math.abs(en-sl);if(!(rk>0))continue;
      const tgt=e.dir===1?e.H:e.lo,bz=bias?bias(K.e||K.t):0,htfOK=bz===e.dir;
      for(const f of FIL){const pass=f==='vsi'||(f==='cas'&&e.time)||(f==='htf'&&htfOK)||(f==='cas+htf'&&e.time&&htfOK)||(f==='liq'&&e.liq);if(!pass)continue;
        for(const tp of TPS){const s=slots[f+'|'+tp];if(s.open)continue;const t=tp==='H'?tgt:tp==='2R'?en+e.dir*2*rk:en+e.dir*3*rk;
          if(Math.abs(t-en)/rk<1)continue;s.open={i,dir:e.dir,en,sl,tp:t,rk,fee:0.0011*en/rk}}}}}
  for(const key in slots){const s=slots[key],a=agg[key]=agg[key]||{N:0,W:0,R:0,ddMax:0,L:0,LR:0,S:0,SR:0,pos:0,coins:0};
    a.N+=s.N;a.W+=s.W;a.R+=s.R;a.ddMax=Math.max(a.ddMax,s.dd);a.L+=s.L;a.LR+=s.LR;a.S+=s.S;a.SR+=s.SR;if(s.N){a.coins++;if(s.R>0)a.pos++}}}
try{
  const tk=await get(API+'tickers?category=linear');
  const all=tk.list.filter(x=>/USDT$/.test(x.symbol)&&!/^(USDC|USDE|FDUSD|DAI)/.test(x.symbol)).sort((a,b)=>b.turnover24h-a.turnover24h).map(x=>x.symbol);
  const PLAN=[{tf:'1D',iv:'D',pages:2,min:1440,htf:'W',coins:30},{tf:'6H',iv:'360',pages:3,min:360,htf:'D',coins:30},{tf:'90m',iv:'30',pages:6,min:90,agg:90,htf:'D',coins:30},{tf:'23m',iv:'1',pages:20,min:23,agg:23,htf:'D',coins:15}];
  BT.total=PLAN.reduce((s,p)=>s+p.coins,0);BT.status='run';
  const htfCache={};
  for(const p of PLAN){const agg={};BT.res[p.tf]={agg,bars:0,coins:all.slice(0,p.coins)};
    for(const sym of all.slice(0,p.coins)){
      try{let k=await hist(sym,p.iv,p.pages);if(p.agg)k=aggr(k,p.agg);else{const ms=p.iv==='D'?864e5:(+p.iv)*6e4;k.forEach(x=>x.e=x.t+ms)}
        if(k.length&&k[k.length-1].e>Date.now())k.pop();
        const hk=p.htf+'|'+sym;if(!htfCache[hk]){htfCache[hk]=await hist(sym,p.htf,p.htf==='W'?1:2)}
        const hms=p.htf==='W'?6048e5:864e5,h=htfCache[hk].filter(x=>x.t+hms<=Date.now());
        const ev=events(k,p.min);sim(k,ev,htfBias(h,hms),agg,sym);BT.res[p.tf].bars+=k.length;
      }catch(e){BT.log.push(sym+' '+p.tf+': '+e.message)}
      BT.done++;}
  }
  BT.status='done';
}catch(e){BT.status='error '+e.message}
})();
'started'
