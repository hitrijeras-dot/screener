window.__bt4={status:'start',log:[],done:0,total:0,agg:{},bars:{}};
(async function(){
const BT=window.__bt4,API='https://api.bybit.com/v5/market/',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const DAYS=60,NCOIN=20,CONC=3;
async function get(u){for(let a=0;a<4;a++){try{const r=await fetch(u);const j=await r.json();if(j.retCode===0)return j.result;}catch(e){}await sleep(700)}throw new Error('fetch '+u)}
async function kl(sym,iv,end){const r=await get(API+'kline?category=linear&symbol='+sym+'&interval='+iv+'&limit=1000'+(end?'&end='+end:''));return r.list.reverse().map(x=>({t:+x[0],o:+x[1],h:+x[2],l:+x[3],c:+x[4]}))}
async function hist(sym,iv,pages){let all=[],end=null;for(let p=0;p<pages;p++){const k=await kl(sym,iv,end);if(!k.length)break;all=k.concat(all);end=k[0].t-1;if(k.length<1000)break}return all}
function aggr(k,mins){const ms=mins*6e4,out=[];let cur=null;for(const x of k){const day=Math.floor(x.t/864e5)*864e5,b=day+Math.floor((x.t-day)/ms)*ms;
  if(!cur||cur.t!==b){cur={t:b,o:x.o,h:x.h,l:x.l,c:x.c,e:Math.min(b+ms,day+864e5)};out.push(cur)}else{cur.h=Math.max(cur.h,x.h);cur.l=Math.min(cur.l,x.l);cur.c=x.c}}
  if(out.length>1)out.shift();return out.filter(x=>x.e<=Date.now())}
const scan=new Function('jayPivot','jayTimeOK','return '+jayScan.toString().replace(/\}\s*return \{b:b,s:s,n:k\.length\}/,'if(o.onBar)o.onBar(i,b,s);}return {b:b,s:s,n:k.length}'))(jayPivot,jayTimeOK);
function events(k,tfMin){const ev=[];scan(k,{piv:5,freshD:5,tfMin,onSig:(sig,d)=>ev.push(Object.assign({dir:d==='long'?1:-1},sig))});return ev}
// HTF stanje po zaprtih svečah
function snaps(h,tfMin){const out=[];let lA=-1,sA=-1,pBH=null,pSL=null,pBA=false,pSA=false;
  scan(h,{piv:5,freshD:5,tfMin,onBar:(i,b,s)=>{if(b.armed&&(!pBA||b.H!==pBH))lA=i;if(s.armed&&(!pSA||s.lo!==pSL))sA=i;pBA=b.armed;pSA=s.armed;pBH=b.H;pSL=s.lo;
    out.push({e:h[i].e,bA:b.armed,bH:b.H,bLeg:b.leg,sA:s.armed,sLo:s.lo,sLeg:s.leg,lA,sA2:sA})}});return out}
function htfBias(h,hMs){const P=3,piv=[];for(let c=P;c<h.length-P;c++){let lo=true,hi=true;for(let j=1;j<=P;j++){if(h[c-j].l<=h[c].l||h[c+j].l<h[c].l)lo=false;if(h[c-j].h>=h[c].h||h[c+j].h>h[c].h)hi=false}
  const conf=h[c+P].t+hMs;if(lo)piv.push({k:'L',v:h[c].l,conf});if(hi)piv.push({k:'H',v:h[c].h,conf})}
  piv.sort((a,b)=>a.conf-b.conf);
  return function(t){let lastL=null,prevL=null,lastH=null,prevH=null,latest=null;for(const p of piv){if(p.conf>t)break;if(p.k==='L'){prevL=lastL;lastL=p.v}else{prevH=lastH;lastH=p.v}latest=p}
    if(!latest)return 0;if(latest.k==='L'&&prevL!==null)return lastL>prevL?1:-1;if(latest.k==='H'&&prevH!==null)return lastH>prevH?1:-1;return 0}}
function at(sn,T){let lo=0,hi=sn.length-1,r=null;while(lo<=hi){const m=(lo+hi)>>1;if(sn[m].e<=T){r=sn[m];lo=m+1}else hi=m-1}return r}
function dirOf(x){if(!x)return 0;if(x.bA&&x.sA)return x.lA>=x.sA2?1:-1;return x.bA?1:x.sA?-1:0}
function cona(x,d,en){if(!x)return null;if(d===1&&x.bA){const R=x.bH-x.bLeg;if(en<=x.bH-R*0.5&&en>x.bLeg)return x.bH}
  if(d===-1&&x.sA){const R=x.sLeg-x.sLo;if(en>=x.sLo+R*0.5&&en<x.sLeg)return x.sLo}return null}
const CTX=['vsi','smerD','smer6H','cona6H'],TIM=['ves dan','3.6H'],EXT=['EOD','24h','48h'],BEV=['brez BE','BE@1R'],TPS=['2R','3R','H'];
function sim(tf,k,ev,s6,biasD,coin,t0){const agg=BT.agg[tf]=BT.agg[tf]||{};const slots={};
  for(const c of CTX){for(const t of TIM)for(const m of EXT)for(const be of BEV)for(const p of TPS)slots[[c,t,m,be,p].join('|')]={open:null,N:0,W:0,R:0,Rm:0,peak:0,dd:0,L:0,LR:0,S:0,SR:0,eod:0}}
  const byI={};for(const e of ev)(byI[e.i]=byI[e.i]||[]).push(e);
  for(let i=0;i<k.length;i++){const K=k[i];
    for(const key in slots){const s=slots[key],o=s.open;if(!o||o.i>=i)continue;let px=null,eod=false;
      if(o.dir===1){if(K.l<=o.sl)px=o.sl;else if(K.h>=o.tp)px=o.tp}else{if(K.h>=o.sl)px=o.sl;else if(K.l<=o.tp)px=o.tp}
      if(px===null&&o.be&&!o.moved&&o.dir*((o.dir===1?K.h:K.l)-o.en)>=o.rk){o.sl=o.en;o.moved=true}
      if(px===null&&K.e>=o.dayEnd){px=K.c;eod=true}
      if(px!==null){const g=o.dir*(px-o.en)/o.rk,r=g-0.0011*o.en/o.rk,rm=g-0.00075*o.en/o.rk;
        s.N++;if(r>0)s.W++;s.R+=r;s.Rm+=rm;s.peak=Math.max(s.peak,s.R);s.dd=Math.max(s.dd,s.peak-s.R);if(eod)s.eod++;
        if(o.dir===1){s.L++;s.LR+=r}else{s.S++;s.SR+=r}s.open=null}}
    for(const e of (byI[i]||[])){if(t0&&K.t<t0)continue;const en=K.c,sl=e.dir===1?e.HL*0.997:e.LH*1.003,rk=Math.abs(en-sl);if(!(rk>0))continue;
      const T=K.e,x6=at(s6,T),d6=dirOf(x6),c6=cona(x6,e.dir,en),dD=biasD?biasD(T):0,dayEnd=Math.floor(T/864e5)*864e5+864e5;
      for(const key in slots){const s=slots[key];if(s.open)continue;const [c,t,m,be,p]=key.split('|');
        if(c==='smer6H'&&d6!==e.dir)continue;if(c==='cona6H'&&c6===null)continue;if(c==='smerD'&&dD!==e.dir)continue;
        if(t==='3.6H'&&!e.time)continue;if(m==='EOD'&&dayEnd-T<6e4*5)continue;
        let tp;if(p==='2R')tp=en+e.dir*2*rk;else if(p==='3R')tp=en+e.dir*3*rk;else tp=c==='cona6H'?c6:(e.dir===1?e.H:e.lo);
        if(e.dir*(tp-en)/rk<1)continue;s.open={i,dir:e.dir,en,sl,tp,rk,dayEnd:m==='EOD'?dayEnd:T+(m==='24h'?864e5:1728e5),be:be==='BE@1R',moved:false}}}}
  for(const key in slots){const s=slots[key],a=agg[key]=agg[key]||{N:0,W:0,R:0,Rm:0,dd:0,L:0,LR:0,S:0,SR:0,eod:0,pos:0,coins:0};
    for(const f of ['N','W','R','Rm','L','LR','S','SR','eod'])a[f]+=s[f];a.dd=Math.max(a.dd,s.dd);if(s.N){a.coins++;if(s.R>0)a.pos++}}}
async function coin(sym){
  const m1=await hist(sym,'1',Math.ceil(DAYS*1440/1000));
  const h6=(await hist(sym,'360',1)).map(x=>Object.assign(x,{e:x.t+216e5})).filter(x=>x.e<=Date.now());
  const m30=await hist(sym,'30',5);const h90=aggr(m30,90);
  const hD=(await hist(sym,'D',1)).filter(x=>x.t+864e5<=Date.now()),bD=htfBias(hD,864e5);
  const s6=snaps(h6,360),t0=m1[0].t;
  const k23=aggr(m1,23),k90=h90;
  const SETS=[['90m',k90,90],['23m',k23,23]];
  for(const [tf,k,mn] of SETS){const ev=events(k,mn);sim(tf,k,ev,s6,bD,sym,t0);BT.bars[tf]=(BT.bars[tf]||0)+k.length}
  // 90m vstop: signali na celotni 90m zgodovini se ne štejejo pred t0 (isto obdobje kot 23m/5m)
}
try{const tk=await get(API+'tickers?category=linear');
  const all=tk.list.filter(x=>/USDT$/.test(x.symbol)&&!/^(USDC|USDE|FDUSD|DAI|XAUT|PAXG)/.test(x.symbol)).sort((a,b)=>b.turnover24h-a.turnover24h).map(x=>x.symbol).slice(0,NCOIN);
  BT.coins=all;BT.total=all.length;BT.status='run';let idx=0;
  async function worker(){while(idx<all.length){const sym=all[idx++];try{await coin(sym)}catch(e){BT.log.push(sym+': '+e.message)}BT.done++}}
  await Promise.all(Array.from({length:CONC},worker));BT.status='done';
}catch(e){BT.status='error '+e.message}
})();
'started'
