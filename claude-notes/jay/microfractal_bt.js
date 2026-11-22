// OnlyWicks Micro-Fractal Scalping v1.8 – mehanski backtest (BTC/ETH, 1m podatki Bybit)
// cfg: {stf:23|90, k, R, time:'all'|'6h3'|'lnny', value:'none'|'va', fvgNeed:true, minSl, maxSl, fee}
window.__MF = function (D, cfg) {
  const agg = (B, m) => { const out = []; let cur = null; for (const b of B) { const t = b[0], d0 = t - (t % 86400), k = d0 + Math.floor((t - d0) / (m * 60)) * m * 60;
      if (!cur || cur[0] !== k) { if (cur) out.push(cur); cur = [k, b[1], b[2], b[3], b[4], b[5], k + m * 60]; } else { cur[2] = Math.max(cur[2], b[2]); cur[3] = Math.min(cur[3], b[3]); cur[4] = b[4]; cur[5] += b[5]; } }
    if (cur) out.push(cur); out.forEach(c => { if (c[6] - c[0] > m * 60) c[6] = c[0] + m * 60; const de = c[0] - (c[0] % 86400) + 86400; if (c[6] > de) c[6] = de; }); return out; };
  const M1 = D, idx1 = new Map(); M1.forEach((b, i) => idx1.set(b[0], i));
  const S = agg(M1, cfg.stf), F5 = agg(M1, 5);
  // vrednost: profil prejšnjega dne (VAL/VAH/POC) iz 5m
  const VA = {}; { const byDay = {}; F5.forEach(b => { const d = b[0] - (b[0] % 86400); (byDay[d] = byDay[d] || []).push(b); });
    for (const d in byDay) { const B = byDay[d], lo = Math.min(...B.map(b => b[3])), hi = Math.max(...B.map(b => b[2])), n = 120, st = (hi - lo) / n || 1, bins = new Array(n).fill(0);
      B.forEach(b => { const tp = (b[2] + b[3] + b[4]) / 3; bins[Math.min(n - 1, Math.floor((tp - lo) / st))] += b[5]; });
      let poc = bins.indexOf(Math.max(...bins)), a = poc, z = poc, tot = bins.reduce((x, y) => x + y, 0), acc = bins[poc];
      while (acc < tot * 0.7) { const up = z + 1 < n ? bins[z + 1] : -1, dn = a - 1 >= 0 ? bins[a - 1] : -1; if (up >= dn) { z++; acc += up; } else { a--; acc += dn; } if (a <= 0 && z >= n - 1) break; }
      VA[+d + 86400] = { val: lo + a * st, vah: lo + (z + 1) * st, poc: lo + (poc + 0.5) * st }; } }
  const inTime = t => { const h = (t % 86400) / 3600; if (cfg.time === '6h3') return h >= 12 && h < 18; if (cfg.time === 'lnny') return h >= 7 && h < 21; return true; };
  const sigs = [];
  for (let i = cfg.k + 1; i < S.length - 4; i++) {
    const c = S[i], prev = S.slice(i - cfg.k, i);
    for (const side of ['L', 'S']) {
      const ref = side === 'L' ? Math.min(...prev.map(b => b[3])) : Math.max(...prev.map(b => b[2]));
      const swept = side === 'L' ? (c[3] < ref && c[4] > ref) : (c[2] > ref && c[4] < ref);
      if (!swept || !inTime(c[0])) continue;
      const ext = side === 'L' ? c[3] : c[2];
      if (cfg.value === 'va') { const v = VA[c[0] - (c[0] % 86400)]; if (!v) continue; if (side === 'L' && !(ext <= v.val)) continue; if (side === 'S' && !(ext >= v.vah)) continue; }
      // failure to gap: naslednja sveča ne podre ekstrema
      const n1 = S[i + 1]; if (side === 'L' ? n1[3] < ext : n1[2] > ext) continue;
      // swing formacija: v 3 svečah zaprtje čez high (low) sweep sveče, brez novega ekstrema
      let conf = -1; for (let j = i + 1; j <= i + 3 && j < S.length; j++) { const b = S[j]; if (side === 'L' ? b[3] < ext : b[2] > ext) break; if (side === 'L' ? b[4] > c[2] : b[4] < c[3]) { conf = j; break; } }
      if (conf < 0) continue;
      const tc = S[conf][6];
      // nov imbalance (5m FVG) v smeri med sweepom in potrditvijo
      let fvg = null; for (let j = 2; j < F5.length; j++) { const b = F5[j]; if (b[0] < c[0]) continue; if (b[0] + 300 > tc) break;
        if (side === 'L' && b[3] > F5[j - 2][2]) fvg = { top: b[3], bot: F5[j - 2][2] }; if (side === 'S' && b[2] < F5[j - 2][3]) fvg = { top: F5[j - 2][3], bot: b[2] }; }
      if (cfg.fvgNeed && !fvg) continue;
      const entry = fvg ? (side === 'L' ? fvg.top : fvg.bot) : S[conf][4];
      const sl = side === 'L' ? ext * (1 - 0.0002) : ext * (1 + 0.0002);
      const slp = Math.abs(entry - sl) / entry; if (slp < cfg.minSl || slp > cfg.maxSl) continue;
      const tp = side === 'L' ? entry + (entry - sl) * cfg.R : entry - (sl - entry) * cfg.R;
      sigs.push({ side, tSweep: c[0], tc, entry, sl, tp, slp });
    }
  }
  // izvedba na 1m: limit na vstopu, čaka do 2 h; nato SL/TP (isti bar = SL); časovni izhod 12 h
  const trades = [];
  for (const s of sigs) { let i = idx1.get(Math.ceil(s.tc / 60) * 60); if (i == null) continue; let fill = -1;
    for (let j = i; j < M1.length && M1[j][0] < s.tc + 7200; j++) { const b = M1[j]; if (s.side === 'L' ? b[2] >= s.tp : b[3] <= s.tp) break; if (s.side === 'L' ? b[3] <= s.entry : b[2] >= s.entry) { fill = j; break; } }
    if (fill < 0) continue; let r = null, tx = null;
    for (let j = fill; j < M1.length; j++) { const b = M1[j]; const hitSl = s.side === 'L' ? b[3] <= s.sl : b[2] >= s.sl, hitTp = s.side === 'L' ? b[2] >= s.tp : b[3] <= s.tp;
      if (hitSl) { r = -1; tx = b[0]; break; } if (hitTp && j > fill) { r = cfg.R; tx = b[0]; break; }
      if (b[0] - M1[fill][0] > 43200) { r = (s.side === 'L' ? b[4] - s.entry : s.entry - b[4]) / Math.abs(s.entry - s.sl); tx = b[0]; break; } }
    if (r == null) continue; r -= cfg.fee / s.slp; trades.push({ ...s, tf: M1[fill][0], tx, r }); }
  trades.sort((a, b) => a.tf - b.tf);
  // pravila seje (dan UTC): max 2 trejda, po TP drugi pol velikosti, 2 SL = konec, en trejd naenkrat
  const taken = []; let day = -1, n = 0, sl = 0, first = null, busyTo = 0;
  for (const t of trades) { const d = t.tf - (t.tf % 86400); if (d !== day) { day = d; n = 0; sl = 0; first = null; }
    if (t.tf < busyTo) continue; if (cfg.session && (n >= 2 || sl >= 2)) continue;
    const size = cfg.session && n === 1 && first === 'TP' ? 0.5 : 1; const rr = t.r * size;
    taken.push({ ...t, size, rr }); n++; if (t.r < 0) sl++; if (n === 1) first = t.r > 0 ? 'TP' : 'SL'; busyTo = t.tx; }
  let eq = 0, pk = 0, dd = 0; const mon = {}; taken.forEach(t => { eq += t.rr; pk = Math.max(pk, eq); dd = Math.min(dd, eq - pk); const m = new Date(t.tf * 1000).toISOString().slice(0, 7); mon[m] = +((mon[m] || 0) + t.rr).toFixed(2); });
  return { sigs: sigs.length, n: taken.length, win: taken.length ? Math.round(taken.filter(t => t.r > 0).length / taken.length * 100) : 0, totR: +eq.toFixed(2), avgR: taken.length ? +(eq / taken.length).toFixed(3) : 0, ddR: +dd.toFixed(2), mon, taken };
};
'ok';
