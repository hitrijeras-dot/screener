// ============================================================
// SKUPNI INDIKATOR – CISD + Sweep Model (OnlyWicks)
// Uporablja: vault/ (EAX Vault). Sweep app (sweep/) ima isti blok SM (Sweep Model) v svoji kodi.
// Blok SM spodaj je dobesedna kopija iz sweep/index.html – če spremeniš enega, spremeni oba
// (preveri: python3 claude-notes/vault/preveri_indikator.py).
// Sveče: [{t (ms, začetek), o, h, l, c}], od najstarejše do najnovejše.
// ============================================================
/*SM*/
// Sweep Model screener (ista replikacija kot backtest engine.py, run_side): HTF sweep + LTF potrditve + vse točke indikatorja.
var SM={minDelivery:2,fvgAtr:0.3,zone:[0.618,0.786],fibs:[0.5,0.618,0.786,1,1.618,2.618],tolAtr:0.25,gp:[0.618,0.65],ote:[0.618,0.786]};
var SM_PTS=[['FVG','FVG – nepokrit bull/bear FVG po sweepu'],['IFVG','IFVG – obrnjen FVG iz poteze v sweep'],['VI','Volume imbalance po sweepu'],['CISD','Retest CISD nivoja (po potrditvi)'],['FIB','HTF fib pivot (0,5 … 2,618)'],['GP','Golden pocket HTF sveče (0,618–0,65)'],['OTE','OTE – 0,618–0,786 povratka po ekstremu; kot indikator šele, ko impulz (s FVG) preseže celo sweep svečo'],['SWEEP','Retest posweepanega nivoja'],['OPEN','Odprtje HTF sveče (opening line)'],['HFVG','HTF FVG – cena v nepokritem 6H ali 1D FVG']];
function smAtr(b){var a=[];for(var i=0;i<b.length;i++){var pc=i?b[i-1].c:b[i].c,tr=Math.max(b[i].h-b[i].l,Math.abs(b[i].h-pc),Math.abs(b[i].l-pc));a.push(i?a[i-1]+(tr-a[i-1])/14:tr)}return a}
function smRsi(b){var r=[],au=1e-12,ad=1e-12;for(var i=0;i<b.length;i++){var d=i?b[i].c-b[i-1].c:0;au+=((d>0?d:0)-au)/14;ad+=((d<0?-d:0)-ad)/14;r.push(100-100/(1+au/Math.max(ad,1e-12)))}return r}
function smMirror(b){return b.map(function(x){return {t:x.t,o:-x.o,h:-x.l,l:-x.h,c:-x.c}})}
// bull logika; za short pokliči z zrcaljenimi svečami. htf: HTF sveče (zadnja je lahko odprta), ltf: LTF sveče, htfMs: dolžina HTF sveče.
function smBull(htf,ltf,htfMs,now){
  var A=smAtr(ltf),R=smRsi(ltf),best=null;
  // kot indikator (nastavitev: 6H pas s 4 svečami): sweep sveča in njen nivo morata biti v pasu (trenutna + 3 prejšnje). Starejši setup ostane, dokler LTF sveča ne ZAPRE čez njegov ekstrem
  // (wick čez ekstrem v naslednji sveči je le "Retest"), zato iščemo od najstarejše sveče naprej in vzamemo prvi živi setup.
  var kMin=Math.max(1,htf.length-3);
  for(var k=kMin;k<htf.length;k++){
    var P=htf[k-1],S=htf[k],sEnd=S.t+htfMs,closed=sEnd<=now;
    var i0=-1;for(var i=0;i<ltf.length;i++){if(ltf[i].t>=S.t&&ltf[i].t<sEnd&&ltf[i].l<P.l){i0=i;break}}
    if(i0<0)continue;
    var st=null,ext=Infinity,extI=-1,inval=false;
    var reset=function(ei){
      var s={lvl:null,cisd:false,cisdI:-1,fvgs:[],vis:[],retest:false,zone:false,div:false,hi:-Infinity,cisdRet:false};
      // CISD (kot indikator): odprtje zadnje serije ≥ 2 dostavnih (rdečih) sveč, ki se konča na ekstremu ali pred njim
      var j=ei,lim=Math.max(0,ei-12);
      while(j>=lim){ if(ltf[j].c<ltf[j].o){var r0=j;while(r0-1>=lim&&ltf[r0-1].c<ltf[r0-1].o)r0--; if(j-r0+1>=SM.minDelivery){s.lvl=ltf[r0].o;s.lvlT=ltf[r0].t;break} j=r0-1}else j--; }
      for(var q=ei-6;q>Math.max(5,ei-60);q--){var mn=Infinity;for(var z=q-5;z<=q+5&&z<ltf.length;z++)mn=Math.min(mn,ltf[z].l);if(ltf[q].l===mn){if(ltf[ei].l<ltf[q].l&&R[ei]>R[q])s.div=true;break}}
      return s};
    for(var i=i0;i<ltf.length;i++){
      var b=ltf[i];
      if(b.t<sEnd){ if(b.l<ext){ext=b.l;extI=i;st=reset(i)} } else if(b.c<=ext){inval=true;break}
      if(i<=extI)continue;
      if(st.lvl!==null&&!st.cisd&&b.c>st.lvl){st.cisd=true;st.cisdI=i}
      if(i-2>=extI&&b.l>ltf[i-2].h&&(b.l-ltf[i-2].h)>=SM.fvgAtr*A[i])st.fvgs.push({bot:ltf[i-2].h,top:b.l,i:i,dead:false});
      var pv=ltf[i-1];
      if(i-1>extI&&b.c>b.o&&pv.c>pv.o&&b.o>pv.c&&b.l<=pv.h)st.vis.push({bot:pv.c,top:b.o,i:i,dead:false});
      st.fvgs.forEach(function(f){ if(f.dead||i<=f.i)return; if(b.l<=f.top)st.retest=true; if(b.c<f.bot)f.dead=true; });
      st.vis.forEach(function(f){ if(!f.dead&&i>f.i&&b.c<f.bot)f.dead=true; });
      st.hi=Math.max(st.hi,b.h);
      if(st.cisd&&i>st.cisdI&&!st.zone){var rg=st.hi-ext;if(rg>0&&b.l<=st.hi-SM.zone[0]*rg)st.zone=true}
    }
    if(inval||!st)continue;
    // nivo (kot indikator): najbolj skrajen še "deviški" low v pasu (do 3 sveče nazaj), ki ga je sweep vzel; vmes ga ni prebila nobena sveča
    var rfK=k-1;for(var q=k-2;q>=Math.max(0,htf.length-4,k-3);q--){var vq=htf[q].l,vir=true;for(var m=q+1;m<k;m++)if(htf[m].l<vq){vir=false;break}if(vir&&vq>ext&&vq<htf[rfK].l)rfK=q}
    var Rf=htf[rfK];
    // setup šele, ko sweep sveča zapre nazaj nad nivo (odprta sveča: trenutna cena)
    var sC=closed?S.c:ltf[ltf.length-1].c;if(!(sC>Rf.l))continue;
    var px=ltf[ltf.length-1].c,a=A[A.length-1],tol=SM.tolAtr*a,last=ltf[ltf.length-1];
    var near=function(L){return Math.abs(px-L)<=tol}, inside=function(lo,hi){return px>=lo-tol&&px<=hi+tol};
    var piv=(Rf.h+Rf.l+Rf.c)/3,rg=Rf.h-Rf.l,pts=[],dr={boxes:[],lines:[]};
    var BX=function(k,lo,hi,t0){dr.boxes.push({k:k,lo:lo,hi:hi,t0:t0})},LN=function(k,y,t0){dr.lines.push({k:k,y:y,t0:t0})};
    // FVG: prvi še nepokrit FVG po ekstremu (tako riše indikator)
    st.fvgs.filter(function(f){return !f.dead}).slice(0,1).forEach(function(f){BX('FVG',f.bot,f.top,ltf[f.i-2].t);if(inside(f.bot,f.top))pts.push({k:'FVG',lvl:f.top,lo:f.bot,hi:f.top})});
    var ifv=null,legStart=0;for(var z=0;z<ltf.length;z++){if(ltf[z].t>=htf[rfK].t){legStart=z;break}}
    // kot indikator: med FVG-ji (≥ 0,3 ATR) v potezi v sweep (do sveče za ekstremom) izbere tistega, ki ga je close prvi prebil PO ekstremu (pri izenačenju starejšega);
    // če ga je cena kasneje spet prebila nazaj, ostane narisan (IFVG | X), a ni točka
    for(var z=Math.max(2,legStart);z<=Math.min(extI+1,ltf.length-1);z++){var top=ltf[z-2].l,bot=ltf[z].h;if(top>bot&&(top-bot)>=SM.fvgAtr*A[z]){var inv=-1,dead=false;for(var y=z+1;y<ltf.length;y++){if(inv<0){if(ltf[y].c>top)inv=y}else if(ltf[y].c<bot){dead=true;break}}if(inv>extI&&(!ifv||inv<ifv.inv))ifv={bot:bot,top:top,t:ltf[z-2].t,dead:dead,inv:inv}}}
    if(ifv){BX('IFVG',ifv.bot,ifv.top,ifv.t);if(!ifv.dead&&inside(ifv.bot,ifv.top))pts.push({k:'IFVG',lvl:ifv.top,lo:ifv.bot,hi:ifv.top})}
    // VI
    st.vis.forEach(function(f){if(f.dead)return;if(inside(f.bot,f.top)){BX('VI',f.bot,f.top,ltf[f.i].t);pts.push({k:'VI',lvl:f.top,lo:f.bot,hi:f.top})}}); // VI indikator riše le na HTF sveči – na grafu samo, ko je cena tam
    // CISD retest
    if(st.lvl!=null)LN(st.cisd?'CISD':'CISD ?',st.lvl,st.lvlT);
    if(st.cisd&&near(st.lvl))pts.push({k:'CISD',lvl:st.lvl});
    // 1-2 cona
    var r2=st.hi-ext;
    // OTE kot indikator (1-2: trigger FVG, "impulse must clear"): impulz po ekstremu mora preseči celo sweep svečo in imeti FVG
    if(r2>0&&st.fvgs.length>0&&st.hi>S.h){var zt=st.hi-SM.ote[0]*r2,zb=st.hi-SM.ote[1]*r2;st.zt=zt;st.zb=zb;BX('OTE',zb,zt,ltf[extI].t);if(inside(zb,zt)&&px>ext)pts.push({k:'OTE',lvl:zt,lo:zb,hi:zt})}
    // HTF fib pivoti
    var sI=0;for(var z=0;z<ltf.length;z++){if(ltf[z].t>=S.t){sI=z;break}}
    SM.fibs.forEach(function(f){var L=piv-f*rg,tch=false;for(var z=sI;z<ltf.length;z++){if(ltf[z].l<=L&&ltf[z].h>=L){tch=true;break}}if(L>ext-3*rg*0.5)dr.lines.push({k:'FIB '+f,y:L,t0:htf[rfK].t,touched:tch});if(near(L))pts.push({k:'FIB',lab:'FIB '+f,lvl:L})}); // indikator: samo dotaknjeni nivoji
    // golden pocket prejšnje HTF sveče (od high navzdol, če je bila bear, sicer od low navzgor)
    var gA=P.c<P.o?P.h-SM.gp[0]*(P.h-P.l):P.l+SM.gp[0]*(P.h-P.l),gB=P.c<P.o?P.h-SM.gp[1]*(P.h-P.l):P.l+SM.gp[1]*(P.h-P.l);
    if(inside(Math.min(gA,gB),Math.max(gA,gB))){BX('GP',Math.min(gA,gB),Math.max(gA,gB),P.t);pts.push({k:'GP',lvl:gA,lo:Math.min(gA,gB),hi:Math.max(gA,gB)})}
    // (stara OTE noge v sweep odstranjena 13. 10. – indikator je nima)
    // retest posweepanega nivoja
    LN('Posweepan nivo',Rf.l,Rf.t);LN('Ekstrem (SL)',ext,ltf[extI].t);
    if(near(Rf.l)&&px>ext)pts.push({k:'SWEEP',lvl:Rf.l});
    // opening line trenutne HTF sveče
    var cur=htf[htf.length-1];if(cur.t+htfMs>now)LN('Open HTF',cur.o,cur.t);if(cur.t+htfMs>now&&near(cur.o))pts.push({k:'OPEN',lvl:cur.o});
    var score=st.div+(st.fvgs.length>0)+st.retest+st.cisd+st.zone;
    var res={sweptLvl:Rf.l,ext:ext,extT:ltf[extI].t,sT:S.t,closed:closed,closedBack:closed?S.c>P.l:null,lvl:st.lvl,cisd:st.cisd,div:st.div,fvg:st.fvgs.length>0,retest:st.retest,zone:st.zone,score:score,points:pts,px:px,atr:a,pivot:piv,eq:(P.h+P.l)/2,opp:P.h,hi:st.hi,zt:st.zt,zb:st.zb,draw:dr,extI:extI};
    if(!best)best=res; // najstarejši še živi setup
  }
  return best;
}
// HTF FVG (kot FVG na HTF svečah indikatorja): 3-svečni FVG, ki ga cena še ni v celoti zapolnila; vrne najbližjega ceni
function htfFvg(b,px){var best=null;
  for(var i=2;i<b.length-1;i++){var lo,hi,k;   // zadnja (odprta) sveča še ne tvori FVG, ga pa lahko zapolni
    if(b[i].l>b[i-2].h){lo=b[i-2].h;hi=b[i].l;k='bull';for(var j=i+1;j<b.length;j++)hi=Math.min(hi,b[j].l)}
    else if(b[i].h<b[i-2].l){lo=b[i].h;hi=b[i-2].l;k='bear';for(var j=i+1;j<b.length;j++)lo=Math.max(lo,b[j].h)}
    else continue;
    if(hi<=lo)continue;
    var d=px>hi?(hi-px)/px*100:px<lo?(lo-px)/px*100:0,z={lo:lo,hi:hi,kind:k,d:d,t0:b[i-1].t};
    if(!best||Math.abs(d)<Math.abs(best.d))best=z}
  return best}
function fvgTxt(f){if(!f)return '–';return f.d===0?'0 % v coni':Math.abs(f.d).toFixed(2)+' % '+(f.d>0?'↑':'↓')}
function smScan(htf,ltf,htfMs,now){
  var out=[],L=smBull(htf,ltf,htfMs,now);
  var S=smBull(smMirror(htf),smMirror(ltf),htfMs,now);
  // indikator ima en aktiven setup: novejši v nasprotni smeri postane glavni, starejši ostane narisan kot zgodovina (History 1)
  if(L&&S){if(L.sT!==S.sT){if(L.sT>S.sT)S.hist=true;else L.hist=true}else{if(L.extT>S.extT)S=null;else L=null}}
  if(L){L.side='long';out.push(L)}
  if(S){['sweptLvl','ext','lvl','px','pivot','eq','opp','hi','zt','zb'].forEach(function(k){if(S[k]!=null)S[k]=-S[k]});S.points.forEach(function(p){['lvl','lo','hi'].forEach(function(k){if(p[k]!=null)p[k]=-p[k]})});S.draw.boxes.forEach(function(b){var lo=-b.hi;b.hi=-b.lo;b.lo=lo});S.draw.lines.forEach(function(l){l.y=-l.y});S.side='short';out.push(S)}
  return out;
}
/*SM-END*/

/*CISD*/
// CISD kot v Moj Screener (funkcija cisd v index.html), samo da najde VSE dogodke v seriji, ne le zadnjega:
// sveča s posweepa nepreseženi pivot (3 levo, 2 desno) in zapre nazaj; CISD nivo = odprtje zadnje serije
// nasprotnih sveč pred pivotom; potrjen, ko sveča (sweep ali ena od naslednjih 30) ZAPRE čez nivo.
// Podaj samo zaprte sveče (odprta sveča ne šteje).
function cisdEvents(k){
  var n=k.length,out=[],seen={};if(n<15)return out;
  function pivH(i){for(var j=1;j<=3;j++){if(k[i-j].h>=k[i].h)return false}for(j=1;j<=2;j++){if(k[i+j].h>k[i].h)return false}return true}
  function pivL(i){for(var j=1;j<=3;j++){if(k[i-j].l<=k[i].l)return false}for(j=1;j<=2;j++){if(k[i+j].l<k[i].l)return false}return true}
  for(var s=10;s<n;s++){var b=k[s];
    for(var side=0;side<2;side++){var hi=side===0,p=-1;
      for(var i=s-3;i>=Math.max(3,s-70);i--){if(hi?pivH(i):pivL(i)){var ok=true;for(var m=i+1;m<s;m++){if(hi?k[m].h>k[i].h:k[m].l<k[i].l){ok=false;break}}if(ok){p=i;break}}}
      if(p<0)continue;var lp=hi?k[p].h:k[p].l;
      if(!(hi?(b.h>lp&&b.c<lp):(b.l<lp&&b.c>lp)))continue;
      var e=p;while(e>0&&((k[e].c>=k[e].o)!==hi))e--;
      var st=e;while(st>0&&((k[st-1].c>=k[st-1].o)===hi))st--;
      var lvl=k[st].o,ci=-1;
      if(hi?b.c<lvl:b.c>lvl)ci=s;else for(var q=s+1;q<n&&q<=s+30;q++){if(hi?k[q].h>b.h:k[q].l<b.l)break;if(hi?k[q].c<lvl:k[q].c>lvl){ci=q;break}}
      if(ci<0)continue;var key=side+'|'+lvl;if(seen[key])continue;seen[key]=1;
      out.push({dir:hi?'bear':'bull',lvl:lvl,sp:lp,ext:hi?b.h:b.l,tL:k[st].t,tS:b.t,tC:k[ci].t,iC:ci,iS:s});
    }}
  return out.sort(function(a,b){return a.iC-b.iC});
}
function cisdLast(k){var e=cisdEvents(k);return e.length?e[e.length-1]:null}
/*CISD-END*/
