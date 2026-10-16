/*VAULT*/
// EAX Vault kot zaslon Sweep appa (16. 10. 2026 združeno iz vault/). Kartice: ../vault/vault.json (piše jo Claude v zanki vsakih 5 min).
// Uporablja Sweep Model (smScan, htfFvg) in CISD (cisdEvents) iz te datoteke. Vse je zaprto v IIFE, ven gre samo window.VX.
(function(){
const Q=s=>document.querySelector(s),VAPI='https://api.bybit.com/v5/market/';
const ls=(k,d)=>{try{const v=localStorage.getItem('vault_'+k);return v==null?d:v}catch(e){return d}},ss=(k,v)=>{try{localStorage.setItem('vault_'+k,v)}catch(e){}};
const TFS=[['5','5m'],['15','15m'],['30','30m'],['60','1H'],['240','4H'],['tv','TV ↗']];
let RISK=+ls('risk',10),MODE=ls('mode','cards'),F=ls('f','all'),SO=ls('so','time'),TF=ls('tf','15'),SK=ls('sk','r'),SD=+ls('sd',-1),OVS=ls('ovs','1')==='1',SWTF=ls('swtf','6H');
let V={cards:[]},TK={},INS={},cur=null,K=[],CH=null,SER=null,CHkey='',lastTk=0,started=false,ANA=0,anaBusy=false,OV=[],DT=[],BMK=[];
const KC={},AL={},SWR={},FEE_M=.0002,FEE_T=.00055,H1=36e5,D1=864e5;
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const dec=v=>{const a=Math.abs(v);return a>=100?2:a>=1?3:a>=0.01?5:6};
const fmt=v=>v==null||isNaN(v)?'–':(+v).toFixed(dec(v));
const sg=(v,d)=>(v>=0?'+':'')+v.toFixed(d);
const hm=d=>d.toLocaleTimeString('sl-SI',{hour:'2-digit',minute:'2-digit'});
const dhm=d=>{const t=new Date();return (d.toDateString()===t.toDateString()?'danes ':d.getDate()+'. '+(d.getMonth()+1)+'. ')+hm(d)};
const ago=d=>{const m=Math.round((Date.now()-d)/60000);return m<60?m+' min':m<1440?Math.floor(m/60)+'h '+(m%60)+'m':Math.floor(m/1440)+'d '+Math.floor(m%1440/60)+'h'};
const big=v=>v>=1e9?(v/1e9).toFixed(2)+' B':v>=1e6?(v/1e6).toFixed(1)+' M':v>=1e3?(v/1e3).toFixed(0)+' K':(+v).toFixed(0);
const isL=c=>/LONG/.test(c.dir),GR={S:4,A:3,B:2,C:1};
const SEC={'IN PLAY':['V IGRI','vIP','trejd je sprožen'],'PRIMED':['PRIMED','vPR','obrat se oblikuje, pripravi se'],'DEVELOPING':['DEVELOPING','vDV','izčrpan na ekstremu, obrata še ni']};
const px=c=>(TK[c.sym+'USDT']||{}).p||c.px;
function calc(c){const p=px(c);if(!c.entry||!p)return null;const e=c.entry,s=c.stop,t1=c.tp1,L=isL(c),risk=Math.abs(e-s);
 const r=(L?p-e:e-p)/risk,pct=(L?p-e:e-p)/e*100,dist=(p-e)/e*100,toTp=(p-e)/(t1-e);
 const qty=RISK/(risk+e*FEE_M+s*FEE_T),not=qty*e,rr1=Math.abs(t1-e)/risk,rr2=c.tp2?Math.abs(c.tp2-e)/risk:null;
 const lo=Math.min(s,t1,p),hi=Math.max(s,t1,p),span=hi-lo||1,pos=v=>Math.max(0,Math.min(100,(v-lo)/span*100));
 let st,cl;const hitTp=L?p>=t1:p<=t1,hitSl=L?p<=s:p>=s,beyond=L?p<e:p>e,near=Math.abs(dist)<=.3;
 if(hitSl){st='SL dosežen';cl='vS'}else if(hitTp){st='TP1 dosežen';cl='vL'}else if(near){st='na vstopu';cl='vIP'}else if(beyond){st='v coni vstopa';cl='vPR'}else if(toTp>=.7){st='blizu TP1';cl='vL'}else{st=(L?'nad':'pod')+' vstopom · čakaj povratek';cl='vDV'}
 return {p,r,pct,dist,toTp,usd:r*RISK,qty,not,rr1,rr2,st,cl,pE:pos(e),pP:pos(p),L}}
const stageOn=c=>c.sec==='PRIMED'?'PRIMED':'FORMING';
// ---------- podatki
async function loadVault(){try{const r=await fetch('../vault/vault.json?'+Date.now(),{cache:'no-store'});V=await r.json();
  const hd=V.head||'',m=k=>(hd.match(new RegExp('(\\d+) '+k))||[])[1];
  Q('#vxEng').innerHTML=[m('scanned')&&`<span><b>${m('scanned')}</b> pregledanih</span>`,m('anchored')&&`<span><b>${m('anchored')}</b> anchored</span>`,V.live&&`<span>${V.live.replace('live','v igri').replace('closed 24h','zaprtih 24h')}</span>`,V.closed&&`<span>zaprti 24h: ${V.closed.r.split('·').map(x=>`<b class="${/-/.test(x)?'dn':'up'}">${x.trim()}</b>`).join(' · ')}</span>`].filter(Boolean).join('')}catch(e){}
 updLine();render();if(cur){const c=V.cards.find(x=>x.sym===cur.sym);if(c){cur=c;detailInfo()}}}
function updLine(){const el=Q('#vxUpd');if(!V.updated){el.textContent='vault.json ni dosegljiv';return}const u=new Date(V.updated),age=(Date.now()-u)/60000,live=Date.now()-lastTk<20000;
 el.innerHTML=`${live?'<i class="vxdot"></i>v živo · ':''}kartice ${hm(u)}${age>12?' · <span class="dn">zastarele ('+Math.round(age)+' min)</span>':' ('+Math.max(0,Math.round(age))+' min)'}`}
async function loadTk(){try{const r=await (await fetch(VAPI+'tickers?category=linear',{cache:'no-store'})).json();TK={};r.result.list.forEach(t=>TK[t.symbol]={p:+t.lastPrice,ch:+t.price24hPcnt*100,to:+t.turnover24h,fr:+t.fundingRate*100,hi:+t.highPrice24h,lo:+t.lowPrice24h,nf:+t.nextFundingTime});
 lastTk=Date.now();updLine();if(!document.querySelector('#vxList :active'))render();if(cur)detailInfo()}catch(e){}}
async function loadIns(sym){if(INS[sym])return INS[sym];try{const r=await (await fetch(VAPI+'instruments-info?category=linear&symbol='+sym+'USDT')).json();const i=r.result.list[0];INS[sym]={step:+i.lotSizeFilter.qtyStep,tick:+i.priceFilter.tickSize,lev:+i.leverageFilter.maxLeverage}}catch(e){INS[sym]=null}return INS[sym]}
async function kl(sym,iv,lim){const key=sym+'|'+iv+'|'+lim,o=KC[key];if(o&&Date.now()-o.t<55000)return o.b;
 const r=await (await fetch(`${VAPI}kline?category=linear&symbol=${sym}USDT&interval=${iv}&limit=${lim}`,{cache:'no-store'})).json();if(r.retCode!==0)throw new Error(r.retMsg);
 const b=r.result.list.map(x=>({t:+x[0],o:+x[1],h:+x[2],l:+x[3],c:+x[4]})).reverse();KC[key]={t:Date.now(),b};return b}
async function vpool(items,n,fn){let i=0;const w=async()=>{while(i<items.length){const k=items[i++];try{await fn(k)}catch(e){}}};await Promise.all(Array.from({length:n},w))}
// ---------- Suen poravnava + Sweep Model za vsak kovanec
const PTN={SWEEP:'Sweep nivo',OPEN:'Open HTF',HFVG:'HTF FVG'},ptLab=p=>p.lab||PTN[p.k]||p.k;
async function anaSym(sym){
 const [D,H,M]=await Promise.all([kl(sym,'D',40),kl(sym,'60',300),kl(sym,'5',600)]);
 const cl=b=>b.slice(0,-1),pd=D[D.length-2],d=pd?(pd.c>=pd.o?'bull':'bear'):null;
 AL[sym]={d,pd,td:D[D.length-1],Hk:cl(H).slice(-150),h:cisdLast(cl(H)),m:cisdLast(cl(M)),t:Date.now()};
 const now=Date.now(),is6=SWTF==='6H',htf=is6?await kl(sym,'360',40):D,ltf=is6?M:await kl(sym,'15',600),p=ltf[ltf.length-1].c;
 const f6=is6?htfFvg(htf,p):null,fD=htfFvg(D,p);
 const rows=smScan(htf,ltf,is6?6*H1:D1,now).map(x=>{x.sym=sym;x.f6=f6;x.fD=fD;[[f6,'6H FVG'],[fD,'1D FVG']].forEach(([f,l])=>{if(!f)return;x.draw.boxes.push({k:l,lo:f.lo,hi:f.hi,t0:f.t0});if(f.d===0)x.points.push({k:'HFVG',lab:l+' ('+f.kind+')',lvl:f.hi,lo:f.lo,hi:f.hi})});return x});
 SWR[sym]={rows,tf:SWTF,t:now}}
async function anaAll(){if(anaBusy||!V.cards.length)return;anaBusy=true;try{await vpool(V.cards.map(c=>c.sym),4,anaSym);ANA=Date.now()}finally{anaBusy=false}
 if(!document.querySelector('#vxList :active'))render();if(cur){detailInfo();drawOv()}}
const cdir=c=>isL(c)?'bull':'bear';
function suen(c){const a=AL[c.sym];if(!a)return null;const dd=cdir(c),v=[a.d,a.h&&a.h.dir,a.m&&a.m.dir],n=v.filter(x=>x===dd).length;return {a,dd,n,al:!!(v[0]&&v[0]===v[1]&&v[1]===v[2]),ok:n===3,m5:!!(a.m&&a.m.dir===a.d)}}
// Suenov trade checklist (7 točk): 1–6 izračuna app, 7 (profil seje AMD/ABC) odkljukaš sam (vault_amd_<kartica>)
const nyH=t=>+new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'numeric',hourCycle:'h23'}).format(new Date(t));
const KZN={London:'8–11',NY:'13–16',Azija:'2–6'},kzOf=t=>{const h=nyH(t);return h>=2&&h<5?'London':h>=7&&h<10?'NY':h>=20?'Azija':null};
const amdKey=c=>'amd_'+c.sym+'_'+(c.firedAt||c.time||'');
function suen7(c){const a=AL[c.sym];if(!a||!a.pd)return null;const L=isL(c),dd=cdir(c),pd=a.pd,td=a.td||pd,ref=c.entry||px(c),it=[];
 const dol=L?td.h<pd.h:td.l>pd.l;
 it.push({ok:a.d===dd&&dol,t:'Daily bias jasen (PO3 + DOL)',n:`včeraj ${a.d==='bull'?'zelena':'rdeča'} · cilj ${L?'PDH':'PDL'} ${fmt(L?pd.h:pd.l)} ${dol?'še ni pobran':'že pobran'}`});
 it.push({ok:!!(a.h&&a.h.dir===dd),t:'H1 orderflow v smeri biasa',n:a.h?`zadnji 1H CISD ${a.h.dir==='bull'?'▲':'▼'} pred ${tfAgo(a.h,H1)}`:'ni 1H CISD'});
 const eq=(pd.h+pd.l)/2;it.push({ok:L?ref<eq:ref>eq,t:'PD array v smeri biasa',n:`${c.entry?'vstop':'cena'} ${fmt(ref)} ${ref<eq?'pod':'nad'} 50 % včeraj (${fmt(eq)}) → ${ref<eq?'discount':'premium'}`});
 const tt=c.firedAt?Date.parse(c.firedAt):Date.now(),z=kzOf(tt);it.push({ok:!!z,t:'V killzone / news oknu',n:(c.firedAt?'karta ob '+hm(new Date(tt)):'zdaj')+' · '+(z?z+' ('+KZN[z]+')':'izven killzone (London 8–11, NY 13–16, Azija 2–6)')});
 let st=null,sn='kartica nima SL';if(c.stop&&a.Hk&&a.Hk.length>60){const H=a.Hk,ft=c.firedAt?Date.parse(c.firedAt):Date.now();let ix=-1,ext=L?Infinity:-Infinity;
  H.forEach((k,i)=>{if(k.t<=ft&&k.t>=ft-12*H1){if(L?k.l<ext:k.h>ext){ext=L?k.l:k.h;ix=i}}});
  if(ix>5){let sw=false;for(let j=ix-3;j>=Math.max(2,ix-48);j--){const v=L?H[j].l:H[j].h,piv=L?(H[j-1].l>v&&H[j-2].l>v&&H[j+1].l>v&&H[j+2].l>v):(H[j-1].h<v&&H[j-2].h<v&&H[j+1].h<v&&H[j+2].h<v);if(piv&&(L?v>ext:v<ext)){sw=true;break}}
   const beyond=L?c.stop<=ext*1.002:c.stop>=ext*0.998;st=sw&&beyond;sn=`1H ${L?'low':'high'} ${fmt(ext)} ${sw?'je posweepal prejšnji swing':'ni sweep'} · SL ${fmt(c.stop)} ${beyond?'za njim':'ni za njim'}`}else sn='premalo 1H sveč'}
 it.push({ok:st,t:'Strong high/low (≈)',n:sn});
 it.push({ok:!!(a.m&&a.m.dir===dd&&a.d===dd),t:'5m CISD v smeri dnevnega biasa',n:a.m?`zadnji 5m CISD ${a.m.dir==='bull'?'▲':'▼'} pred ${tfAgo(a.m,3e5)} · nivo ${fmt(a.m.lvl)}`:'ni 5m CISD'});
 const amd=ls(amdKey(c),'')==='1';it.push({ok:amd,t:'Jasen profil seje (AMD / ABC)',n:amd?'odkljukal ti':'preveri na grafu in odkljukaj',man:true});
 const n=it.filter(x=>x.ok).length;return {it,n,auto:it.slice(0,6).filter(x=>x.ok).length}}
const s7b=c=>{const q=suen7(c);return q?`<span class="vb ${q.n>=6?'vL':q.n>=5?'vPR':'vDV'}" title="Suen trade checklist">SUEN ${q.n}/7</span>`:''};
function s7list(c,edit){const q=suen7(c);if(!q)return '<div class="vxsm mut">računam …</div>';
 return `<div class="vxchk">`+q.it.map((x,i)=>`<div class="${x.ok?'ok':x.ok===null?'na':'no'}"><span class="ic">${x.ok?'✓':x.ok===null?'–':'✗'}</span><div><b>${i+1}. ${x.t}</b><small>${x.n}</small>${x.man&&edit?`<label class="amd"><input type="checkbox" data-amd="${amdKey(c)}" ${x.ok?'checked':''}> profil seje je jasen</label>`:''}</div></div>`).join('')+`</div><div class="vxsm" style="margin-top:6px"><b>${q.n}/7</b> · Suen: ${q.n===7?'vse izpolnjeno → poln riziko':q.n===6?'ena točka manjka → pol rizika':'premalo točk → ne vstopi'}</div>`}
const arw=(d,t)=>`<span class="vxar ${d||'no'}">${t?t+' ':''}${d==='bull'?'▲':d==='bear'?'▼':'–'}</span>`;
const tfAgo=(e,ms)=>e?ago(e.tC+ms):'';
function suenRow(c){const s=suen(c);if(!s)return '';return `<div class="vxsu">${s7b(c)}${arw(s.a.d,'1D')} ${arw(s.a.h&&s.a.h.dir,'1H')} ${arw(s.a.m&&s.a.m.dir,'5m')}<span class="mut">5m CISD ${s.a.m?'pred '+tfAgo(s.a.m,3e5):'–'}</span></div>`}
function swMain(c){const s=SWR[c.sym];if(!s||!s.rows.length)return null;const want=isL(c)?'long':'short';return s.rows.find(x=>x.side===want&&!x.hist)||s.rows.find(x=>!x.hist)||s.rows[0]}
function swRow(c){const x=swMain(c);if(!x)return '';const m=x.side===(isL(c)?'long':'short');return `<div class="vxsu"><span class="vb ${m?'vL':'vDV'}">SWEEP ${SWR[c.sym].tf} ${x.side==='long'?'L':'S'}${m?' ✓':''}</span>${x.points.length?x.points.map(p=>`<span class="hit">${ptLab(p)}</span>`).join(''):'<span class="mut">ni na točki</span>'}</div>`}
// ---------- seznam
function filtered(){let cs=V.cards.slice();if(F==='fe')cs=cs.filter(c=>c.type==='FIRST ENTRY');else if(F==='suen')cs=cs.filter(c=>{const q=suen7(c);return q&&q.n>=6});else if(F!=='all')cs=cs.filter(c=>c.sec===F);
 const k={time:c=>-(new Date(c.firedAt||0)),grade:c=>-(GR[c.grade]||0),r:c=>{const g=calc(c);return g?-g.r:99},dist:c=>{const g=calc(c);return g?Math.abs(g.dist):99},sym:c=>c.sym,suen:c=>{const q=suen7(c);return q?-q.n:9}}[SO];
 return cs.sort((a,b)=>{const x=k(a),y=k(b);return x<y?-1:x>y?1:0})}
function chips(){const opts=[['all','Vse'],['fe','★ First entry'],['suen','Suen 6+/7'],['IN PLAY','V igri'],['PRIMED','Primed'],['DEVELOPING','Developing']];
 Q('#vxFlt').innerHTML=opts.map(([k,l])=>{const n=k==='all'?V.cards.length:k==='fe'?V.cards.filter(c=>c.type==='FIRST ENTRY').length:k==='suen'?V.cards.filter(c=>{const q=suen7(c);return q&&q.n>=6}).length:V.cards.filter(c=>c.sec===k).length;return `<button class="pt ${F===k?'on':''}" data-f="${k}">${l} ${n}</button>`}).join('')}
function badges(c){const L=isL(c);return `<span class="vb ${SEC[c.sec][1]}">${SEC[c.sec][0]}</span><span class="vb ${L?'vL':'vS'}">${L?'LONG ↑':'SHORT ↓'}</span><span class="vb g${c.grade}">${c.grade}-GRADE</span>`+(c.type==='FIRST ENTRY'?'<span class="vb vFE">★ FIRST ENTRY</span>':c.type?'<span class="vb vDV">RE-ENTER</span>':'')+(c.badges||[]).map(b=>`<span class="vb vPR">${b}</span>`).join('')}
function rsiRow(R){R=R||{};return ['1H','4H','12H','D','W'].filter(k=>R[k]!=null).map(k=>`<span class="vrs ${R[k]>=70?'hi':R[k]<=30?'lo':''}">${k} <b>${R[k]}</b></span>`).join('')}
function resBox(g){if(!g)return '';const cl=g.r>=0?'up':'dn';return `<div class="vxres"><b class="${cl}">${sg(g.r,2)}R</b><span class="${cl}">${sg(g.pct,2)} %</span><span class="${cl}">${sg(g.usd,2)} $</span><span class="mut" style="margin-left:auto">pri ${RISK} $</span></div>`}
function card(c){const L=isL(c),g=calc(c),t=TK[c.sym+'USDT']||{};
 let h=`<button class="vxc ${L?'L':'S'}" data-s="${c.sym}"><div class="vxh"><span class="coin">${c.sym}</span><div class="px"><b>${fmt(px(c))}</b><small class="${(t.ch!=null?t.ch:parseFloat(c.chg)||0)>=0?'up':'dn'}">${t.ch!=null?sg(t.ch,2)+' %':c.chg}</small></div></div><div class="vbd">${badges(c)}</div>`;
 h+=`<div class="vxtm"><span>${c.firedAt?dhm(new Date(c.firedAt)):c.time}${c.sec==='IN PLAY'&&c.firedAt?' · teče '+ago(new Date(c.firedAt)):''}</span><span>${c.off||''}</span></div>`;
 if(g){h+=`<div><span class="vb ${g.cl}">${g.st}</span> <span class="mut vxsm">od vstopa ${sg(g.dist,2)} %</span></div>`+resBox(g);
  h+=`<div class="vxtrack"><span class="f" style="left:${Math.min(g.pE,g.pP)}%;width:${Math.abs(g.pP-g.pE)}%;background:${g.r>=0?'var(--long)':'var(--short)'}"></span><span class="e" style="left:${g.pE}%"></span><span class="m" style="left:${g.pP}%"></span></div><div class="vxtl"><span>${L?'STOP':'TP1'}</span><span>ENTRY</span><span>${L?'TP1':'STOP'}</span></div>`;
  h+=`<div class="vx3"><div><span class="lab">Entry</span><b>${fmt(c.entry)}</b><small>${(c.entryNote||'stamped').replace(' · chasing','').replace('price ','')}</small></div><div><span class="lab">Stop</span><b class="dn">${fmt(c.stop)}</b><small>${(c.risk||'').replace(' risk',' riziko')}</small></div><div><span class="lab">TP1 · ${c.tp1r||''}</span><b class="up">${fmt(c.tp1)}</b><small>${c.tp1pct||''}</small></div></div>`;
  h+=`<div class="vxsm mut">TP2 ${c.tp2r||''} <b>${fmt(c.tp2)}</b> (${c.tp2pct||''}) · od tu <b>${c.fromHere||'–'}</b><br>Pozicija pri ${RISK} $: <b>${+g.qty.toPrecision(4)} ${c.sym}</b> · ${g.not.toFixed(0)} $</div>`}
 else h+=`<div class="vxstg">${(c.stage&&c.stage.length?c.stage:['FORMING','PRIMED','READY']).map(x=>`<span class="${x===stageOn(c)?'on':''}">${x}</span>`).join('')}</div><div class="vxsm mut">${c.stageNote||SEC[c.sec][2]}</div>`;
 h+=suenRow(c)+swRow(c);
 h+=`<div class="vxsu">${rsiRow(c.rsi)}</div><div class="vxsu">${(c.triggers||[]).map(x=>`<span class="vrs ${c.trigState==='live'?'lo':''}">${x}</span>`).join('')}<span class="vrs ${c.trigState==='live'?'lo':''}">${c.trigState==='live'?'● live':'◌ waiting'}</span></div>`;
 h+=`<div class="vxsm mut">${c.sr?c.sr+'<br>':''}24h promet <b>${t.to?big(t.to)+' $':'–'}</b> · funding <b>${t.fr!=null?sg(t.fr,4)+' %':'–'}</b></div>`;
 return h+'</button>'}
const COLS=[['sym','Kovanec'],['sec','Faza'],['dir','Smer'],['grade','Ocena'],['type','Tip'],['time','Čas'],['px','Cena'],['ch','24h %'],['r','Rezultat'],['usd','$'],['dist','Od vstopa'],['su','Suen'],['sw','Sweep'],['st','Status'],['entry','Entry'],['stop','Stop'],['tp1','TP1'],['tp2','TP2'],['rsi1','RSI 1H'],['rsi4','RSI 4H'],['vol','24h promet'],['fr','Funding']];
function tval(c,k){const g=calc(c),t=TK[c.sym+'USDT']||{};switch(k){case'sym':return c.sym;case'sec':return c.sec;case'dir':return c.dir;case'grade':return GR[c.grade]||0;case'type':return c.type;case'time':return +new Date(c.firedAt||0);case'px':return px(c);case'ch':return t.ch;case'r':return g?g.r:null;case'usd':return g?g.usd:null;case'dist':return g?g.dist:null;case'su':{const q=suen(c);return q?q.n+(q.ok?.5:0):null}case'sw':{const x=swMain(c);return x?x.points.length:null}case'st':return g?g.st:'';case'entry':return c.entry;case'stop':return c.stop;case'tp1':return c.tp1;case'tp2':return c.tp2;case'rsi1':return (c.rsi||{})['1H'];case'rsi4':return (c.rsi||{})['4H'];case'vol':return t.to;case'fr':return t.fr}}
function table(cs){cs=cs.slice().sort((a,b)=>{const x=tval(a,SK),y=tval(b,SK);if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return (x<y?-1:x>y?1:0)*SD});
 let h='<div class="tw"><table class="t"><thead><tr>'+COLS.map(([k,l])=>`<th data-k="${k}" class="${k==='sym'?'tl':''}" style="cursor:pointer${SK===k?';color:var(--buoy)':''}">${l}${SK===k?(SD<0?' ↓':' ↑'):''}</th>`).join('')+'</tr></thead><tbody>';
 cs.forEach(c=>{const g=calc(c),t=TK[c.sym+'USDT']||{},L=isL(c),R=c.rsi||{},q=suen(c),x=swMain(c),rc=v=>v==null?'–':`<span class="${v>=70?'dn':v<=30?'up':''}">${v}</span>`;
  h+=`<tr class="rw" data-s="${c.sym}"><td class="tl"><b class="coin">${c.sym}</b></td><td><span class="vb ${SEC[c.sec][1]}">${SEC[c.sec][0]}</span></td><td class="${L?'up':'dn'}">${L?'LONG ↑':'SHORT ↓'}</td><td><span class="vb g${c.grade}">${c.grade}</span></td><td>${c.type==='FIRST ENTRY'?'<span class="vb vFE">★ FIRST</span>':c.type?'re-enter':'–'}</td><td>${c.firedAt?dhm(new Date(c.firedAt)):''}</td><td>${fmt(px(c))}</td><td class="${(t.ch||0)>=0?'up':'dn'}">${t.ch!=null?sg(t.ch,2):'–'}</td><td class="${g?(g.r>=0?'up':'dn'):''}"><b>${g?sg(g.r,2)+'R':'–'}</b></td><td class="${g?(g.usd>=0?'up':'dn'):''}">${g?sg(g.usd,2):'–'}</td><td>${g?sg(g.dist,2)+' %':'–'}</td><td>${q?`${arw(q.a.d)}${arw(q.a.h&&q.a.h.dir)}${arw(q.a.m&&q.a.m.dir)}${q.ok?' <b class="up">✓</b>':''}`:'…'}</td><td>${x?`<span class="${x.side==='long'?'up':'dn'}">${x.side==='long'?'L':'S'}</span> ${x.points.map(ptLab).join(', ')||'–'}`:'–'}</td><td>${g?`<span class="vb ${g.cl}">${g.st}</span>`:'–'}</td><td>${fmt(c.entry)}</td><td class="dn">${fmt(c.stop)}</td><td class="up">${fmt(c.tp1)}</td><td>${fmt(c.tp2)}</td><td>${rc(R['1H'])}</td><td>${rc(R['4H'])}</td><td>${t.to?big(t.to):'–'}</td><td>${t.fr!=null?sg(t.fr,4)+' %':'–'}</td></tr>`});
 return h+'</tbody></table></div>'}
function alignView(cs){
 const box=(t,d,sub,dd)=>`<div><span class="lab">${t}</span><b>${arw(d)} <span class="${d===dd?'up':'mut'}" style="font-size:10.5px">${d?(d===dd?'kot karta':'proti'):''}</span></b><small>${sub||'&nbsp;'}</small></div>`;
 const rows=cs.map(c=>({c,s:suen(c),q:suen7(c)})).sort((a,b)=>(b.q?b.q.n:-1)-(a.q?a.q.n:-1));
 return '<p class="sum">Suenov trade checklist (Art of Crypto), 7 točk: 1–6 izračuna app, 7. (profil seje AMD/ABC) odkljukaš sam v oknu kovanca. 7/7 = poln riziko, 6/7 = pol rizika, manj = ne vstopi. Spodaj še 1D/1H/5m smeri.</p><div class="cards">'+rows.map(({c,s})=>{const L=isL(c),a=s&&s.a;
  return `<button class="vxc ${L?'L':'S'}" data-s="${c.sym}"><div class="vxh"><span class="coin">${c.sym}</span><div class="px">${s7b(c)}</div></div><div class="vbd"><span class="vb ${SEC[c.sec][1]}">${SEC[c.sec][0]}</span><span class="vb ${L?'vL':'vS'}">${L?'LONG ↑':'SHORT ↓'}</span><span class="vb g${c.grade}">${c.grade}</span>${c.type==='FIRST ENTRY'?'<span class="vb vFE">★ FIRST ENTRY</span>':''}</div>`+
  (a?`<div class="vx3">${box('1D · včeraj',a.d,a.pd?(a.pd.c>=a.pd.o?'zelena':'rdeča')+' sveča':'',s.dd)}${box('1H CISD',a.h&&a.h.dir,a.h?'pred '+tfAgo(a.h,H1):'ni',s.dd)}${box('5m CISD',a.m&&a.m.dir,a.m?'pred '+tfAgo(a.m,3e5):'ni',s.dd)}</div><div class="vxsm mut">5m nivo <b>${a.m?fmt(a.m.lvl):'–'}</b> · 1D=1H=5m <b class="${s.al?'up':''}">${s.al?'da':'ne'}</b> · 5m v smeri 1D <b class="${s.m5?'up':''}">${s.m5?'da':'ne'}</b></div>`+s7list(c,false):'<div class="vxsm mut">računam …</div>')+'</button>'}).join('')+'</div>'}
function render(){if(!started)return;chips();document.querySelectorAll('#vxMode button').forEach(b=>b.classList.toggle('on',b.dataset.m===MODE));Q('#vxSo').value=SO;Q('#vxSo').style.display=MODE==='cards'?'':'none';
 const cs=filtered(),el=Q('#vxList');if(!cs.length){el.innerHTML='<div class="empty">Ni kartic.</div>';return}
 if(MODE==='table'){const sx=(el.querySelector('.tw')||{}).scrollLeft||0;el.innerHTML=table(cs);if(sx)el.querySelector('.tw').scrollLeft=sx;return}
 if(MODE==='align'){el.innerHTML=alignView(cs);return}
 let h='';['IN PLAY','PRIMED','DEVELOPING'].forEach(s=>{const g=cs.filter(c=>c.sec===s);if(!g.length)return;h+=`<div class="vxsec"><span class="vb ${SEC[s][1]}">${SEC[s][0]}</span><span class="mut">${g.length} · ${SEC[s][2]}</span></div><div class="cards">${g.map(card).join('')}</div>`});
 el.innerHTML=h}
// ---------- podrobnosti (okno s grafom)
function detailInfo(){const c=cur;if(!c)return;const g=calc(c),t=TK[c.sym+'USDT']||{},L=isL(c),ins=INS[c.sym];
 Q('#vxDt').textContent=c.sym;Q('#vxDb').innerHTML=badges(c);
 Q('#vxDs').textContent=[c.firedAt?'karta '+dhm(new Date(c.firedAt)):'',c.sec==='IN PLAY'&&c.firedAt?'teče '+ago(new Date(c.firedAt)):'',c.off].filter(Boolean).join(' · ');
 Q('#vxDp').textContent=fmt(px(c));Q('#vxDc').innerHTML=t.ch!=null?`<span class="${t.ch>=0?'up':'dn'}">${sg(t.ch,2)} % 24h</span>`:'';
 Q('#vxRes').innerHTML=g?`<div style="margin-top:10px"><span class="vb ${g.cl}">${g.st}</span> <span class="mut vxsm">od vstopa ${sg(g.dist,2)} %</span></div>`+resBox(g):'';
 if(g){let q=g.qty;const step=ins&&ins.step;if(step)q=Math.floor(q/step+1e-9)*step;const qd=step?Math.max(0,-Math.floor(Math.log10(step)+1e-9)):4;const maxLoss=q*Math.abs(c.entry-c.stop)+q*c.entry*FEE_M+q*c.stop*FEE_T;const lev=Math.max(1,Math.min(ins?ins.lev:10,Math.floor(0.8/(Math.abs(c.entry-c.stop)/c.entry))));
  Q('#vxCalc').style.display='';Q('#vxCalc').innerHTML=`<h3>Limit za tvoj riziko (${RISK} $)</h3><div class="vxdg"><div><span class="lab">Smer · Post-Only</span><b class="${L?'up':'dn'}">${L?'Long limit':'Short limit'}</b></div><div><span class="lab">Cena (entry)</span><b>${fmt(c.entry)}</b></div><div><span class="lab">Količina</span><b>${q.toFixed(qd)} ${c.sym}</b><small>${(q*c.entry).toFixed(2)} $ vrednost</small></div><div><span class="lab">SL</span><b class="dn">${fmt(c.stop)}</b></div><div><span class="lab">TP1</span><b class="up">${fmt(c.tp1)}</b><small>+${(q*Math.abs(c.tp1-c.entry)).toFixed(2)} $ · RR ${g.rr1.toFixed(2)}</small></div><div><span class="lab">TP2</span><b class="up">${fmt(c.tp2)}</b><small>${g.rr2?'+'+(q*Math.abs(c.tp2-c.entry)).toFixed(2)+' $ · RR '+g.rr2.toFixed(2):''}</small></div><div><span class="lab">Max izguba s provizijami</span><b class="dn">−${maxLoss.toFixed(2)} $</b></div><div><span class="lab">Vzvod (likv. za SL)</span><b>do ${lev}x</b><small>isolated</small></div></div>`}
 else Q('#vxCalc').style.display='none';
 const R=c.rsi||{},k=[];
 if(c.entry)k.push(['Entry',fmt(c.entry),c.entryNote||'stamped'],['Stop',fmt(c.stop),c.risk],['TP1 · '+c.tp1r,fmt(c.tp1),c.tp1pct],['TP2 · '+c.tp2r,fmt(c.tp2),c.tp2pct],['Od tu',c.fromHere||'–',c.fromNote],['Vault stanje',c.r||'–',c.run]);
 else k.push(['Faza',stageOn(c),(c.stage||[]).join(' → ')],['Opomba',SEC[c.sec][0],c.stageNote||SEC[c.sec][2]]);
 k.push(['RSI 1H / 4H / 12H',[R['1H'],R['4H'],R['12H']].map(x=>x??'–').join(' / '),'D '+(R.D??'–')+' · W '+(R.W??'–')],['S/R',c.sr||'–',''],['Triggerji',(c.triggers||[]).join(' + '),c.trigState],['24h razpon',t.hi?fmt(t.lo)+' – '+fmt(t.hi):'–',t.hi?'cena na '+((px(c)-t.lo)/((t.hi-t.lo)||1)*100).toFixed(0)+' % razpona':''],['24h promet',t.to?big(t.to)+' $':'–',''],['Funding',t.fr!=null?sg(t.fr,4)+' %':'–',t.nf?'naslednji ob '+hm(new Date(t.nf)):'']);
 if(ins)k.push(['Bybit',`tick ${ins.tick} · korak ${ins.step}`,'max vzvod '+ins.lev+'x']);
 Q('#vxKv').innerHTML=k.map(([a,b,s])=>`<div><span class="lab">${a}</span><b>${b}</b>${s?`<small>${s}</small>`:''}</div>`).join('');
 detailInd()}
function detailInd(){const c=cur;if(!c)return;const s=suen(c),x=swMain(c),L=isL(c);
 if(!s)Q('#vxSu').innerHTML='<h3>Suen · 1D / 1H / 5m</h3><p>Računam …</p>';
 else{const a=s.a,box=(t,d,sub)=>`<div><span class="lab">${t}</span><b>${arw(d)} <span class="${d===s.dd?'up':'mut'}" style="font-size:11px">${d===s.dd?'v smeri karte':d?'proti karti':''}</span></b><small>${sub}</small></div>`;
  Q('#vxSu').innerHTML=`<h3>Suen · 1D / 1H / 5m <span class="vb ${s.ok?'vL':'vDV'}" style="float:right">${s.ok?'✓ PORAVNANO S KARTO':s.n+'/3 v smeri karte'}</span></h3><div class="vxdg">`+
  box('1D bias (včeraj)',a.d,a.pd?`O ${fmt(a.pd.o)} → C ${fmt(a.pd.c)}`:'')+box('1H zadnji CISD',a.h&&a.h.dir,a.h?`nivo ${fmt(a.h.lvl)} · pred ${tfAgo(a.h,H1)}`:'ni najden')+box('5m zadnji CISD',a.m&&a.m.dir,a.m?`nivo ${fmt(a.m.lvl)} · pred ${tfAgo(a.m,3e5)}`:'ni najden')+
  `</div><p style="margin:8px 0 0">${s.m5?'5m CISD je v smeri dnevnega biasa.':'5m CISD <b>ni</b> v smeri dnevnega biasa.'} ${s.al?'Vsi trije okvirji so poravnani.':'Okvirji niso poravnani.'}</p><h3 style="margin-top:14px">Trade checklist (Suen) ${s7b(c)}</h3>`+s7list(c,true)}
 const tfl=SWTF==='6H'?'6H':'1D';
 if(!SWR[c.sym])Q('#vxSw').innerHTML='<h3>Sweep Model</h3><p>Računam …</p>';
 else if(!x)Q('#vxSw').innerHTML=`<h3>Sweep Model · ${tfl}</h3><p>Ni aktivnega ${tfl} sweepa na tem kovancu.</p>`;
 else{const sg2=x.side==='long'?1:-1,m=x.side===(L?'long':'short');
  Q('#vxSw').innerHTML=`<h3>Sweep Model · ${tfl} <span class="side ${x.side}" style="float:right">${x.side==='long'?'LONG':'SHORT'} SWEEP${m?' ✓ kot karta':' · proti karti'}</span></h3><div class="vxdg"><div><span class="lab">Posweepan nivo</span><b>${fmt(x.sweptLvl)}</b><small>sweep ${dhm(new Date(x.extT))}</small></div><div><span class="lab">Ekstrem (SL)</span><b class="dn">${fmt(x.ext)}</b><small>do SL ${((x.px-x.ext)/x.px*100*sg2).toFixed(2)} %</small></div><div><span class="lab">CISD</span><b>${x.lvl==null?'–':fmt(x.lvl)}</b><small>${x.lvl==null?'':x.cisd?'potrjen':'še čaka'}</small></div><div><span class="lab">${tfl} sveča</span><b>${x.closed?(x.closedBack?'zaprta nazaj':'ni zaprta nazaj'):'še odprta'}</b><small>ocena ${x.score}/5</small></div></div>`+
  `<p class="story">${x.points.length?'Cena je zdaj na: '+x.points.map(p=>`<span class="hit">${ptLab(p)}</span>`).join(''):'Cena trenutno ni na nobeni točki.'}</p>`}}
function ovBtns(){Q('#vxOvs').innerHTML=`<span class="mut">Na grafu:</span><button class="pt tog ${OVS?'on':''}" data-o="s">${OVS?'✓ ':''}Sweep + CISD (${SWTF==='6H'?'6H':'1D'})</button><select id="vxSwtf" title="Sweep okvir"><option value="6H">6H · 5m</option><option value="D">1D · 15m</option></select>`;Q('#vxSwtf').value=SWTF}
let lwP=null;const lw=()=>window.LightweightCharts?Promise.resolve():(lwP||(lwP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js';s.onload=res;s.onerror=()=>{lwP=null;rej()};document.head.appendChild(s)})));
const TZ=-new Date().getTimezoneOffset()*60;
function killChart(){if(CH){try{CH.remove()}catch(e){}}CH=null;SER=null;CHkey='';OV=[];DT=[];Q('#vxLeg2').innerHTML=''}
function tvEmbed(){killChart();Q('#vxCh').innerHTML=`<iframe src="https://s.tradingview.com/widgetembed/?symbol=BYBIT%3A${cur.sym}USDT.P&interval=15&theme=${document.documentElement.dataset.theme==='light'?'light':'dark'}&style=1&timezone=Europe%2FLjubljana&locale=sl&hidesidetoolbar=0&saveimage=0&withdateranges=1" allowfullscreen></iframe>`;Q('#vxLeg').innerHTML='Pravi TradingView graf (BYBIT perp). Nivojev kartice tukaj ni – za vstop/SL/TP in Sweep izberi 5m–4H.'}
async function loadK(){if(!cur)return;if(TF==='tv'){if(!Q('#vxCh iframe'))tvEmbed();return}const sym=cur.sym,tf=TF,upd=CH&&CHkey===sym+tf;
 try{await lw();const r=await (await fetch(`${VAPI}kline?category=linear&symbol=${sym}USDT&interval=${tf}&limit=${upd?3:600}`,{cache:'no-store'})).json();if(!cur||cur.sym!==sym||TF!==tf)return;
  const rows=r.result.list.reverse().map(k=>[+k[0],+k[1],+k[2],+k[3],+k[4]]);if(upd){rows.forEach(x=>{const i=K.findIndex(y=>y[0]===x[0]);if(i>=0)K[i]=x;else K.push(x)})}else K=rows;draw(sym+tf)}catch(e){if(!CH)Q('#vxCh').innerHTML='<div class="empty">Graf se ni naložil.</div>'}}
function draw(key){const c=cur;if(!c||!K.length||TF==='tv'||!window.LightweightCharts)return;
 const data=K.map(k=>({time:k[0]/1000+TZ,open:k[1],high:k[2],low:k[3],close:k[4]}));
 if(CH&&CHkey===key){data.slice(-3).forEach(d=>SER.update(d));if(data[data.length-1].time!==DT[DT.length-1]){DT=data.map(d=>d.time);drawOv()}return}
 killChart();Q('#vxCh').innerHTML='';CHkey=key;
 const up=css('--long'),dn=css('--short'),mut=css('--mut'),line=css('--line'),bg=css('--s1'),ent='#4da3ff',buoy=css('--buoy'),p=dec(c.entry||K[K.length-1][4]);
 CH=LightweightCharts.createChart(Q('#vxCh'),{autoSize:true,layout:{background:{type:'solid',color:bg},textColor:mut,fontSize:11,fontFamily:'Figtree, system-ui, sans-serif'},grid:{vertLines:{color:css('--grid')},horzLines:{color:css('--grid')}},
  rightPriceScale:{borderColor:line,scaleMargins:{top:.08,bottom:.08}},timeScale:{borderColor:line,timeVisible:true,secondsVisible:false,rightOffset:8},crosshair:{mode:LightweightCharts.CrosshairMode.Normal},localization:{locale:'sl-SI',priceFormatter:v=>v.toFixed(p)}});
 SER=CH.addCandlestickSeries({upColor:up,downColor:dn,borderUpColor:up,borderDownColor:dn,wickUpColor:up,wickDownColor:dn,priceFormat:{type:'price',precision:p,minMove:Math.pow(10,-p)}});
 SER.setData(data);
 const leg=[],ln=(v,col,t,st)=>{if(v==null)return;SER.createPriceLine({price:v,color:col,lineWidth:2,lineStyle:st||0,axisLabelVisible:true,title:t});leg.push(`<span><i style="background:${col}"></i>${t} ${fmt(v)}</span>`)};
 let mi=-1;if(c.firedAt){const ft=new Date(c.firedAt).getTime()/1000+TZ;mi=data.findIndex(d=>d.time>ft-+TF*60);if(mi<0&&ft<data[0].time)mi=0}
 if(c.entry){ln(c.entry,ent,'Entry');ln(c.stop,dn,'Stop');ln(c.tp1,up,'TP1 '+(c.tp1r||''));ln(c.tp2,up,'TP2 '+(c.tp2r||''),2);
  if(mi>=0){const zone=data.slice(mi),mk=(v,col)=>{const s2=CH.addBaselineSeries({baseValue:{type:'price',price:c.entry},topFillColor1:col,topFillColor2:col,bottomFillColor1:col,bottomFillColor2:col,topLineColor:'rgba(0,0,0,0)',bottomLineColor:'rgba(0,0,0,0)',priceLineVisible:false,lastValueVisible:false,crosshairMarkerVisible:false});s2.setData(zone.map(x=>({time:x.time,value:v})))};
   mk(c.tp1,'rgba(45,255,143,.10)');mk(c.stop,'rgba(255,45,85,.12)')}}
 BMK=mi>=0?[{time:data[mi].time,position:isL(c)?'belowBar':'aboveBar',color:buoy,shape:isL(c)?'arrowUp':'arrowDown',text:'karta '+hm(new Date(c.firedAt))}]:[];
 Q('#vxLeg').innerHTML=leg.join('')+'<span>Vleci z miško / prstom · kolesce = zoom · dvoklik na os = ponastavi</span>';
 DT=data.map(d=>d.time);OV=[];drawOv();
 const n=data.length;CH.timeScale().setVisibleLogicalRange({from:Math.max(0,n-120),to:n+8})}
function clearOv(){if(CH)OV.forEach(s=>{try{CH.removeSeries(s)}catch(e){}});OV=[]}
// Sweep + CISD kot en indikator, narisan kot smChart v tem appu
function drawOv(){if(!CH||!SER||!cur||TF==='tv'||!DT.length)return;clearOv();const c=cur,tfs=+TF*60,end=DT[DT.length-1],mk=BMK.slice(),leg=[];
 const snap=t=>Math.max(DT[0],Math.floor(t/1000/tfs)*tfs+TZ),ap={autoscaleInfoProvider:()=>null,priceLineVisible:false,crosshairMarkerVisible:false};
 const seg=(y,t0,col,w,st,title)=>{const a=snap(t0);if(!(end>a))return;const s=CH.addLineSeries({...ap,color:col,lineWidth:w,lineStyle:st,lastValueVisible:!!title,title:title||''});s.setData([{time:a,value:y},{time:end,value:y}]);OV.push(s)};
 const box=(lo,hi,t0,col)=>{const a=snap(t0);if(!(end>a))return;const s=CH.addBaselineSeries({...ap,lastValueVisible:false,baseValue:{type:'price',price:lo},topFillColor1:col,topFillColor2:col,bottomFillColor1:'rgba(0,0,0,0)',bottomFillColor2:'rgba(0,0,0,0)',topLineColor:'rgba(0,0,0,0)',bottomLineColor:'rgba(0,0,0,0)',lineWidth:1});s.setData([{time:a,value:hi},{time:end,value:hi}]);OV.push(s)};
 const CY='#00d9ff',OR=css('--buoy'),sw=SWR[c.sym],x=OVS&&sw?swMain(c):null;
 if(x){const ZC={'6H FVG':'77,208,168','1D FVG':'77,163,255','FVG':'0,217,255','IFVG':'181,107,255','VI':'154,154,168','1-2':'255,122,0','GP':'255,212,0','OTE':'255,61,240'},hit={};x.points.forEach(p=>hit[p.k]=1);
  x.draw.boxes.forEach(b=>box(b.lo,b.hi,b.t0,`rgba(${ZC[b.k]||'255,122,0'},${hit[b.k]?.22:.07})`));
  const hitF=x.points.filter(p=>p.k==='FIB').map(p=>p.lvl);
  x.draw.lines.filter(l=>/Posweepan|Ekstrem|CISD/.test(l.k)||(l.k==='Open HTF'&&hit.OPEN)||(/^FIB/.test(l.k)&&(l.touched||hitF.includes(l.y)))).forEach(l=>{
   const col=/Ekstrem/.test(l.k)?(x.side==='long'?css('--short'):css('--long')):/CISD/.test(l.k)?CY:/Posweepan/.test(l.k)?OR:css('--mut');
   const nm=/Ekstrem/.test(l.k)?'SL':/Posweepan/.test(l.k)?'Sweep':l.k==='Open HTF'?'Open':l.k.replace('FIB ','Fib ');
   seg(l.y,l.t0,col,/Posweepan|Ekstrem/.test(l.k)?2:1,/FIB|Open/.test(l.k)?1:2,nm)});
  mk.push({time:snap(x.extT),position:x.side==='long'?'belowBar':'aboveBar',color:OR,shape:x.side==='long'?'arrowUp':'arrowDown',text:''});
  leg.push(`<span><i style="background:${OR}"></i>Sweep ${sw.tf} · ${x.side==='long'?'long':'short'}</span><span><i style="background:${CY}"></i>CISD ${x.lvl==null?'–':fmt(x.lvl)+(x.cisd?' potrjen':' čaka')}</span>`+(x.points.length?`<span>Cena je na: <b style="color:var(--buoy)">${x.points.map(ptLab).join(', ')}</b></span>`:'<span>Cena trenutno ni na nobeni točki.</span>'))}
 else if(OVS)leg.push(`<span>Sweep + CISD: ${sw?'ni aktivnega '+sw.tf+' sweepa na tem kovancu':'računam …'}</span>`);
 mk.sort((a,b)=>a.time-b.time);SER.setMarkers(mk);Q('#vxLeg2').innerHTML=leg.join('')}
async function openCard(sym){const c=V.cards.find(x=>x.sym===sym);if(!c){if(V.cards.length)location.hash='vault';return}
 const same=cur&&cur.sym===sym;cur=c;Q('#vxDet').classList.add('on');document.body.style.overflow='hidden';
 Q('#vxTfs').innerHTML=TFS.map(([k,l])=>`<button class="${TF===k?'on':''}" data-t="${k}">${l}</button>`).join('');ovBtns();
 Q('#vxLk').innerHTML=`<a href="https://www.tradingview.com/chart/?symbol=BYBIT:${c.sym}USDT.P" target="_blank" rel="noopener">TradingView ↗</a><a href="https://www.bybit.com/trade/usdt/${c.sym}USDT" target="_blank" rel="noopener">Bybit ↗</a>`;
 if(!AL[sym]||!SWR[sym]||SWR[sym].tf!==SWTF)anaSym(sym).then(()=>{if(cur&&cur.sym===sym){detailInfo();drawOv()}}).catch(()=>{});
 detailInfo();loadIns(sym).then(detailInfo);if(!same){K=[];killChart()}await loadK()}
function closeCard(){if(!cur&&!Q('#vxDet').classList.contains('on'))return;cur=null;killChart();Q('#vxDet').classList.remove('on');document.body.style.overflow=''}
// ---------- dogodki
Q('#vxFlt').onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;F=b.dataset.f;ss('f',F);render()};
Q('#vxSo').onchange=e=>{SO=e.target.value;ss('so',SO);render()};
Q('#vxMode').onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;MODE=b.dataset.m;ss('mode',MODE);render()};
Q('#vxList').onclick=e=>{const th=e.target.closest('th[data-k]');if(th){const k=th.dataset.k;if(SK===k)SD=-SD;else{SK=k;SD=-1}ss('sk',SK);ss('sd',SD);render();return}const b=e.target.closest('[data-s]');if(b)location.hash='vault/'+b.dataset.s};
Q('#vxRisk').onclick=()=>{const v=prompt('Riziko na trejd v $ (Vault)',RISK);if(v&&+v>0){RISK=+v;ss('risk',RISK);Q('#vxRisk').textContent='Riziko '+RISK+' $';render();if(cur)detailInfo()}};
Q('#vxRf').onclick=()=>{loadVault();loadTk();anaAll();if(cur&&TF!=='tv')loadK()};
Q('#vxBk').onclick=()=>{history.length>1?history.back():location.hash='vault'};
Q('#vxTfs').onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;TF=b.dataset.t;ss('tf',TF);Q('#vxTfs').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.t===TF));K=[];killChart();loadK()};
Q('#vxSu').onchange=e=>{const k=e.target.dataset&&e.target.dataset.amd;if(!k)return;ss(k,e.target.checked?'1':'');detailInd();render()};
Q('#vxOvs').onclick=e=>{const b=e.target.closest('[data-o]');if(!b)return;OVS=!OVS;ss('ovs',OVS?'1':'0');ovBtns();drawOv()};
Q('#vxOvs').onchange=e=>{if(e.target.id!=='vxSwtf')return;SWTF=e.target.value;ss('swtf',SWTF);ovBtns();if(cur)anaSym(cur.sym).then(()=>{detailInfo();drawOv()});anaAll()};
Q('#vxCh')._redraw=()=>{if(cur&&TF!=='tv'){const k=CHkey;killChart();draw(k)}};
Q('#vxRisk').textContent='Riziko '+RISK+' $';
function start(){if(started)return;started=true;loadVault().then(()=>{loadTk();anaAll();if(PEND){const s=PEND;PEND=null;openCard(s)}});
 setInterval(()=>{if(!document.hidden)loadTk()},5000);setInterval(()=>{if(!document.hidden)loadVault()},30000);setInterval(()=>{if(!document.hidden)anaAll()},60000);
 setInterval(()=>{if(!document.hidden&&cur&&TF!=='tv')loadK()},10000);setInterval(updLine,15000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){loadVault();loadTk();if(cur&&TF!=='tv')loadK()}})}
let PEND=null;
// klic iz show(): sub = simbol (#vault/SYM) ali null
window.VX={route(on,sub){if(!on){closeCard();return}start();if(sub){if(V.cards.length)openCard(sub);else PEND=sub}else closeCard()},syms:()=>V.cards.map(c=>c.sym),load:async()=>{if(!V.cards.length)await loadVault();return V.cards.map(c=>c.sym)}};
})();
(function(){var h=location.hash.slice(1);if(h==='vault'||h.indexOf('vault/')===0)VX.route(true,h.indexOf('vault/')===0?decodeURIComponent(h.slice(6)):null)})();
/*VAULT-END*/
