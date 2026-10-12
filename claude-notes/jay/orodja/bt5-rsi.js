function jayPivot(k,c,P,hi){
  if(c-P<0||c+P>=k.length)return false;
  var v=hi?k[c].h:k[c].l;
  for(var j=1;j<=P;j++){var a=hi?k[c-j].h:k[c-j].l;if(hi?a>=v:a<=v)return false}
  for(j=1;j<=P;j++){var b=hi?k[c+j].h:k[c+j].l;if(hi?b>v:b<v)return false}
  return true;
}
/* Čas: 1D/1W = 3. teden v mesecu ali prvih 5 dni meseca; pod 1D = 3. 6H dneva (12–18 UTC = 14–20 poletni čas) */
function jayTimeOK(t,freshD,tfMin){if(tfMin&&tfMin<1440){var h=new Date(t).getUTCHours();return h>=12&&h<18}
  var d=new Date(t).getUTCDate();return (d>=15&&d<=21)||d<=freshD}
function jayScan(k,o){
  var P=o.piv||5,LP=o.look||6,A=o.gpA||0.618,B=o.gpB||0.79,tol=o.liqTol==null?0.015:o.liqTol,fD=o.freshD||5;
  var pls=[],phs=[];
  var b={L:null,Lx:null,LL:null,LLx:null,armed:false,leg:null,legX:null,H:null,Hx:null,touched:false,done:false,HL:null,HLx:null,sig:null};
  var s={H:null,Hx:null,HH:null,HHx:null,armed:false,leg:null,legX:null,lo:null,lox:null,touched:false,done:false,LH:null,LHx:null,sig:null};
  for(var i=0;i<k.length;i++){
    var bNew=false,sNew=false,c=i-P,pl=null,ph=null;
    if(c>=P){if(jayPivot(k,c,P,false))pl=k[c].l;if(jayPivot(k,c,P,true))ph=k[c].h}
    var lowR=Infinity,highR=-Infinity;for(var j=Math.max(0,i-P);j<=i;j++){if(k[j].l<lowR)lowR=k[j].l;if(k[j].h>highR)highR=k[j].h}
    if(pl!==null){
      var n=pls.length,prevPL=n?pls[n-1].v:null;
      if(n&&pl<prevPL){var sw=null,swX=null;for(var q=Math.max(0,n-LP);q<n;q++){var v=pls[q].v;if(v>pl&&(sw===null||v<sw)){sw=v;swX=pls[q].x}}
        b.L=sw;b.Lx=swX;b.LL=pl;b.LLx=c;b.armed=false}
      var m=phs.length,lastPH=m?phs[m-1]:null;
      if(o.short!==false&&s.HH!==null&&c>s.HHx&&n&&pl<prevPL&&lastPH&&lastPH.x>=s.HHx&&lastPH.v<=s.HH){
        s.armed=true;s.leg=lastPH.v;s.legX=lastPH.x;s.lo=pl;s.lox=c;s.touched=highR>=s.lo+(s.leg-s.lo)*A;s.done=false;s.LH=s.touched?highR:null;s.LHx=i;sNew=true}
      pls.push({v:pl,x:c});if(pls.length>40)pls.shift();
    }
    if(ph!==null){
      var m2=phs.length,prevPH=m2?phs[m2-1].v:null;
      if(m2&&ph>prevPH){var sw2=null,sw2X=null;for(q=Math.max(0,m2-LP);q<m2;q++){v=phs[q].v;if(v<ph&&(sw2===null||v>sw2)){sw2=v;sw2X=phs[q].x}}
        s.H=sw2;s.Hx=sw2X;s.HH=ph;s.HHx=c;s.armed=false}
      var n2=pls.length,lastPL=n2?pls[n2-1]:null;
      if(o.long!==false&&b.LL!==null&&c>b.LLx&&m2&&ph>prevPH&&lastPL&&lastPL.x>=b.LLx&&lastPL.v>=b.LL){
        b.armed=true;b.leg=lastPL.v;b.legX=lastPL.x;b.H=ph;b.Hx=c;b.touched=lowR<=b.H-(b.H-b.leg)*A;b.done=false;b.HL=b.touched?lowR:null;b.HLx=i;bNew=true}
      phs.push({v:ph,x:c});if(phs.length>40)phs.shift();
    }
    var K=k[i];
    if(b.armed&&!bNew){var R=b.H-b.leg,b618=b.H-R*A,b79=b.H-R*B;
      if(K.c<b.leg)b.armed=false;
      else{if(K.l<=b618){b.touched=true;if(b.HL===null||K.l<b.HL){b.HL=K.l;b.HLx=i}}
        if(b.touched&&!b.done&&K.c>K.o&&K.c>b618&&b.HL>=b.leg){b.done=true;
          b.sig={i:i,t:K.t,close:K.c,HL:b.HL,HLx:b.HLx,H:b.H,Hx:b.Hx,leg:b.leg,legX:b.legX,L:b.L,Lx:b.Lx,LL:b.LL,LLx:b.LLx,
            liq:b.L!==null&&b.L<=b618*(1+tol)&&b.L>=b79*(1-tol),time:jayTimeOK(K.t,fD,o.tfMin)};if(o.onSig)o.onSig(b.sig,'long')}}}
    if(s.armed&&!sNew){var R2=s.leg-s.lo,s618=s.lo+R2*A,s79=s.lo+R2*B;
      if(K.c>s.leg)s.armed=false;
      else{if(K.h>=s618){s.touched=true;if(s.LH===null||K.h>s.LH){s.LH=K.h;s.LHx=i}}
        if(s.touched&&!s.done&&K.c<K.o&&K.c<s618&&s.LH<=s.leg){s.done=true;
          s.sig={i:i,t:K.t,close:K.c,LH:s.LH,LHx:s.LHx,lo:s.lo,lox:s.lox,leg:s.leg,legX:s.legX,H:s.H,Hx:s.Hx,HH:s.HH,HHx:s.HHx,
            liq:s.H!==null&&s.H>=s618*(1-tol)&&s.H<=s79*(1+tol),time:jayTimeOK(K.t,fD,o.tfMin)};if(o.onSig)o.onSig(s.sig,'short')}}}
  }
  return {b:b,s:s,n:k.length};
}
function rsi14(c){var n=14,out=new Array(c.length).fill(NaN);if(c.length<=n)return out;var g=0,l=0,d;
  function rv(){return l===0?(g===0?50:100):100-100/(1+g/l)}
  for(var i=1;i<=n;i++){d=c[i]-c[i-1];if(d>=0)g+=d;else l-=d}g/=n;l/=n;out[n]=rv();
  for(i=n+1;i<c.length;i++){d=c[i]-c[i-1];g=(g*(n-1)+Math.max(d,0))/n;l=(l*(n-1)+Math.max(-d,0))/n;out[i]=rv()}return out}
window.__bt5={status:'start',log:[],done:0,total:0,res:null};
(async function(){
const BT=window.__bt5,API='https://api.bybit.com/v5/market/',sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(u){for(let a=0;a<4;a++){try{const r=await fetch(u);const j=await r.json();if(j.retCode===0)return j.result;}catch(e){}await sleep(700)}throw new Error('fetch '+u)}
const IVMS={D:864e5,'360':216e5};
async function hist(sym,iv,pages){let all=[],end=null;for(let p=0;p<pages;p++){const r=await get(API+'kline?category=linear&symbol='+sym+'&interval='+iv+'&limit=1000'+(end?'&end='+end:''));
  const k=r.list.reverse().map(x=>({t:+x[0],o:+x[1],h:+x[2],l:+x[3],c:+x[4]}));if(!k.length)break;all=k.concat(all);end=k[0].t-1;if(k.length<1000)break}
  const ms=IVMS[iv];all.forEach(x=>x.e=x.t+ms);return all.filter(x=>x.e<=Date.now())}
function htfBias(h){const P=3,piv=[];for(let c=P;c<h.length-P;c++){let lo=true,hi=true;for(let j=1;j<=P;j++){if(h[c-j].l<=h[c].l||h[c+j].l<h[c].l)lo=false;if(h[c-j].h>=h[c].h||h[c+j].h>h[c].h)hi=false}
  const conf=h[c+P].e;if(lo)piv.push({k:'L',v:h[c].l,conf});if(hi)piv.push({k:'H',v:h[c].h,conf})}
  piv.sort((a,b)=>a.conf-b.conf);
  return function(t){let lastL=null,prevL=null,lastH=null,prevH=null,latest=null;for(const p of piv){if(p.conf>t)break;if(p.k==='L'){prevL=lastL;lastL=p.v}else{prevH=lastH;lastH=p.v}latest=p}
    if(!latest)return 0;if(latest.k==='L'&&prevL!==null)return lastL>prevL?1:-1;if(latest.k==='H'&&prevH!==null)return lastH>prevH?1:-1;return 0}}
const FEE=0.0011,TPS=['H','2R','3R'];
// RSI filtri: vrne true/false za signal
const RF={
 'brez RSI':()=>true,
 'div na LL':(s,d,r)=>d>0?(s.Lx!=null&&r[s.LLx]>r[s.Lx]):(s.Hx!=null&&r[s.HHx]<r[s.Hx]),
 'LL RSI≤30':(s,d,r)=>d>0?r[s.LLx]<=30:r[s.HHx]>=70,
 'LL RSI≤35':(s,d,r)=>d>0?r[s.LLx]<=35:r[s.HHx]>=65,
 'HL RSI≤40':(s,d,r)=>d>0?r[s.HLx]<=40:r[s.LHx]>=60,
 'HL RSI≤45':(s,d,r)=>d>0?r[s.HLx]<=45:r[s.LHx]>=55,
 'skrita div HL':(s,d,r)=>d>0?r[s.HLx]<r[s.LLx]:r[s.LHx]>r[s.HHx],
 'sig RSI≥50':(s,d,r)=>d>0?r[s.i]>=50:r[s.i]<=50,
 'sig RSI<50':(s,d,r)=>d>0?r[s.i]<50:r[s.i]>50,
 'HTF RSI ok':(s,d,r,hr)=>hr==null?false:(d>0?hr<60:hr>40)
};
function outcome(k,s,d,tp){const en=s.close,ext=d>0?s.HL:s.LH,sl=d>0?ext*0.997:ext*1.003,risk=Math.abs(en-sl);if(!(risk>0))return null;
  let T;if(tp==='H'){T=d>0?s.H:s.lo;const rr=(T-en)*d/risk;if(!(rr>=1))return null}else T=en+d*risk*(tp==='2R'?2:3);
  const fee=FEE*en/risk,RR=(T-en)*d/risk;
  for(let j=s.i+1;j<k.length;j++){const K=k[j];if(d>0?K.l<=sl:K.h>=sl)return{x:j,R:-1-fee};if(d>0?K.h>=T:K.l<=T)return{x:j,R:RR-fee}}
  return null}
const agg={};
function add(key,coin,sigs){const a=agg[key]=agg[key]||{N:0,W:0,R:0,peak:0,cum:0,dd:0,L:0,LR:0,S:0,SR:0,coins:{}};
  sigs.sort((x,y)=>x.t-y.t);let lastX=-1;const cR=[];
  for(const z of sigs){if(z.i<=lastX)continue;lastX=z.o.x;a.N++;if(z.o.R>0)a.W++;a.R+=z.o.R;if(z.d>0){a.L++;a.LR+=z.o.R}else{a.S++;a.SR+=z.o.R}cR.push(z)}
  a.coins[coin]=(a.coins[coin]||0)+cR.reduce((s,z)=>s+z.o.R,0);
  BT.trades=BT.trades||{};(BT.trades[key]=BT.trades[key]||[]).push(...cR.map(z=>({t:z.t,R:z.o.R})))}
try{
 const tk=await get(API+'tickers?category=linear');
 const coins=tk.list.filter(x=>/USDT$/.test(x.symbol)).sort((a,b)=>+b.turnover24h-+a.turnover24h).slice(0,30).map(x=>x.symbol);
 BT.total=coins.length;
 for(const sym of coins){
  try{
   const d1=await hist(sym,'D',2),h6=await hist(sym,'360',3);
   for(const [tf,k,tfMin] of [['1D',d1,1440],['6H',h6,360]]){
     if(k.length<60)continue;
     const r=rsi14(k.map(x=>x.c));
     const bias=tf==='6H'?htfBias(d1):null;
     const rD=rsi14(d1.map(x=>x.c));
     const htfR=t=>{let lo=0,hi=d1.length-1,ix=-1;while(lo<=hi){const m=(lo+hi)>>1;if(d1[m].e<=t){ix=m;lo=m+1}else hi=m-1}return ix>=0?rD[ix]:null};
     const ev=[];jayScan(k,{piv:5,freshD:5,tfMin,onSig:(sig,dd)=>ev.push(Object.assign({d:dd==='long'?1:-1},sig))});
     const bases=tf==='1D'?{'vsi':()=>true,'+liq':s=>s.liq}:{'vsi':()=>true,'+čas+HTF':s=>s.time&&bias(k[s.i].e)===s.d};
     for(const bn in bases)for(const rn in RF)for(const tp of TPS){
       const sigs=[];for(const s of ev){if(!bases[bn](s))continue;const hr=tf==='6H'?htfR(k[s.i].e):null;if(!RF[rn](s,s.d,r,hr))continue;const o=outcome(k,s,s.d,tp);if(o)sigs.push({i:s.i,t:s.t,d:s.d,o})}
       add([tf,bn,rn,tp].join('|'),sym,sigs)}
   }
  }catch(e){BT.log.push(sym+': '+e.message)}
  BT.done++;
 }
 const res={};for(const key in agg){const a=agg[key];const tr=(BT.trades[key]||[]).sort((x,y)=>x.t-y.t);let c=0,p=0,dd=0;for(const z of tr){c+=z.R;p=Math.max(p,c);dd=Math.max(dd,p-c)}
   const cv=Object.values(a.coins).filter((v,i,arr)=>true);res[key]=[a.N,a.N?Math.round(a.W/a.N*100):0,+a.R.toFixed(1),a.N?+(a.R/a.N).toFixed(2):0,+dd.toFixed(1),a.L,+a.LR.toFixed(1),a.S,+a.SR.toFixed(1),Object.values(a.coins).filter(v=>v>0).length,Object.keys(a.coins).filter(c=>a.coins[c]!==0).length]}
 BT.res=res;BT.status='done';
}catch(e){BT.status='err '+e.message}
})();
'started'
