"""Replication of the OnlyWicks Sweep Model logic (as read from its inputs and live chart output)
and an event-driven backtester on 5m bars.

Setup  : current HTF candle (default 6H) trades beyond the previous HTF candle's low (bull) / high (bear).
Confirmations on 5m after the sweep extreme (score x/5):
  div    - RSI(14) divergence at the sweep extreme vs previous 5m pivot
  fvg    - 3-candle FVG formed after the extreme, size >= fvg_atr * ATR(14)
  retest - price returns into that FVG (wick touch)
  cisd   - close beyond the open of the first candle of the last >=2-candle delivery series into the extreme
  zone   - after impulse clears the CISD level, retrace into 0.618-0.786 of the impulse leg ("1-2 zone")
Bear setups are run by mirroring prices (x -> -x).
"""
import numpy as np, pandas as pd, glob, os

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.environ.get('DATADIR','data'))

def load(sym):
    d = pd.read_csv(os.path.join(DATA, sym + '.csv'))
    return d.t.values.astype(np.int64), d.o.values, d.h.values, d.l.values, d.c.values

def atr(h, l, c, n=14):
    pc = np.concatenate([[c[0]], c[:-1]])
    tr = np.maximum(h - l, np.maximum(abs(h - pc), abs(l - pc)))
    out = np.empty_like(tr); out[0] = tr[0]
    a = 1.0 / n
    for i in range(1, len(tr)):
        out[i] = out[i - 1] + a * (tr[i] - out[i - 1])
    return out

def rsi(c, n=14):
    d = np.diff(c, prepend=c[0])
    up = np.where(d > 0, d, 0.0); dn = np.where(d < 0, -d, 0.0)
    au = np.empty_like(c); ad = np.empty_like(c); au[0] = ad[0] = 1e-12
    a = 1.0 / n
    for i in range(1, len(c)):
        au[i] = au[i - 1] + a * (up[i] - au[i - 1]); ad[i] = ad[i - 1] + a * (dn[i] - ad[i - 1])
    return 100 - 100 / (1 + au / np.maximum(ad, 1e-12))

DEFAULT = dict(
    htf=21600,          # setup timeframe in seconds (6H)
    life=72,            # bars the setup stays alive after the sweep candle closes
    min_delivery=2,
    fvg_atr=0.3,
    zone=(0.618, 0.786),
    entry='cisd_close', # cisd_close | cisd_limit | fvg_limit | zone_limit | crt_close
    min_score=0,
    require=(),         # components that must be present at entry
    sl_buf_atr=0.1,     # SL beyond the sweep extreme by this many ATR
    tp='rr',            # rr | prev_opp (opposite end of previous HTF candle) | prev_eq (its midpoint)
    rr=2.0,
    min_rr=1.0,         # for structural TPs: skip if RR below this
    max_hold=144,       # bars
    be_at=None,         # move SL to entry after this many R
    min_risk=0.0015,    # skip if SL distance < this fraction of price
    max_risk=0.03,
    fee_maker=0.0002, fee_taker=0.00055, slip=0.0002,
    after_close=False,
    ltf=300,  # only allow entries after the sweep HTF candle has closed back inside
)

def run_side(t, o, h, l, c, A, R, p, side, sym):
    """Bull logic on given arrays (bear = mirrored arrays). Returns list of trade dicts."""
    n = len(t)
    k = t // p['htf']
    starts = np.flatnonzero(np.diff(k, prepend=k[0] - 1))   # first bar of every HTF candle
    trades = []
    sgn = 1 if side == 'long' else -1
    # --- context arrays (computed on the possibly mirrored arrays)
    dk = t // 86400
    dstart = np.flatnonzero(np.diff(dk, prepend=dk[0] - 1))
    dO = o[dstart]; dH = np.maximum.reduceat(h, dstart); dL = np.minimum.reduceat(l, dstart)
    dC = np.append(c[dstart[1:] - 1], c[-1])
    dpos = np.searchsorted(dstart, np.arange(n), side='right') - 1     # day index of each bar
    # 1H EMA50 approx on LTF closes: ema over 12*50 5m bars
    span = int(3600 * 50 / (t[1] - t[0]))
    ema = pd.Series(c).ewm(span=span, adjust=False).mean().values
    # 6H candle direction array
    hk_o = o[starts]; hk_c = np.append(c[starts[1:] - 1], c[-1])
    for si in range(1, len(starts) - 1):
        ps, s = starts[si - 1], starts[si]
        e = starts[si + 1]                       # end (exclusive) of sweep candle
        if s - ps < 2: continue
        P_lo = l[ps:s].min(); P_hi = h[ps:s].max()
        sw = np.flatnonzero(l[s:e] < P_lo)
        if not len(sw): continue
        i0 = s + sw[0]
        expiry = min(n, e + p['life'])
        # --- state
        ext = l[i0]; ext_i = i0
        def reset(ei):
            st = dict(cisd_lvl=None, cisd=False, fvg=None, fvg_i=None, retest=False, zone=False,
                      div=False, hi=-np.inf, order=None)
            # CISD level: last run of >= min_delivery bearish candles ending at/just before ei
            j = ei if c[ei] < o[ei] else ei - 1
            lim = max(ps, ei - 12)
            while j >= lim:
                if c[j] < o[j]:
                    r0 = j
                    while r0 - 1 >= lim and c[r0 - 1] < o[r0 - 1]: r0 -= 1
                    if j - r0 + 1 >= p['min_delivery']:
                        st['cisd_lvl'] = o[r0]; break
                    j = r0 - 1
                else:
                    j -= 1
            # divergence vs previous pivot low (5 left / 5 right) in last 60 bars
            for q in range(ei - 6, max(5, ei - 60), -1):
                if l[q] == l[q - 5:q + 6].min():
                    if l[ei] < l[q] and R[ei] > R[q]: st['div'] = True
                    break
            return st
        st = reset(i0)
        in_trade = None
        i = i0
        while i < n:
            if in_trade is None:
                if i >= expiry: break
                if l[i] < ext:
                    if i < e:
                        ext = l[i]; ext_i = i; st = reset(i)
                    else:
                        break                    # invalidated after sweep candle closed
                if i > ext_i:
                    # --- confirmations (use info up to close of bar i)
                    if st['cisd_lvl'] is not None and not st['cisd'] and c[i] > st['cisd_lvl']:
                        st['cisd'] = True; st['cisd_i'] = i
                    if st['fvg'] is None and i - 2 >= ext_i and l[i] > h[i - 2] and (l[i] - h[i - 2]) >= p['fvg_atr'] * A[i]:
                        st['fvg'] = (h[i - 2], l[i]); st['fvg_i'] = i
                    elif st['fvg'] is not None and not st['retest'] and i > st['fvg_i'] and l[i] <= st['fvg'][1]:
                        st['retest'] = True
                    st['hi'] = max(st['hi'], h[i])
                    if st['cisd'] and not st['zone'] and i > st['cisd_i']:
                        rng = st['hi'] - ext
                        if rng > 0 and l[i] <= st['hi'] - p['zone'][0] * rng: st['zone'] = True
                score = st['div'] + (st['fvg'] is not None) + st['retest'] + st['cisd'] + st['zone']
                comps = dict(div=st['div'], fvg=st['fvg'] is not None, retest=st['retest'], cisd=st['cisd'], zone=st['zone'])
                ok = score >= p['min_score'] and all(comps[r] for r in p['require'])
                if p['after_close'] and i < e - 1: ok = False
                if p['after_close'] and i >= e - 1:
                    cr = p.get('close_rule', 'back')
                    if c[e - 1] <= P_lo: break                                   # no reclaim
                    if cr == 'bull' and c[e - 1] <= o[s]: break                  # sweep candle must close bullish
                    if cr == 'upper' and c[e - 1] < 0.5 * (h[s:e].max() + ext): break  # close in upper half of its range
                entry = None; etype = 'taker'
                if ok and i > ext_i:
                    E = p['entry']
                    if E == 'cisd_close' and st['cisd']:
                        entry = c[i]
                    elif E == 'crt_close' and i >= e - 1:
                        entry = c[i]
                    elif E == 'cisd_limit' and st['cisd']:
                        if st['order'] is None: st['order'] = ('cisd', st['cisd_lvl'], i)
                    elif E == 'fvg_limit' and st['fvg'] is not None:
                        if st['order'] is None: st['order'] = ('fvg', st['fvg'][1], i)
                    elif E == 'fvg_mid_limit' and st['fvg'] is not None:
                        if st['order'] is None: st['order'] = ('fvg', 0.5 * (st['fvg'][0] + st['fvg'][1]), i)
                    elif E == 'plevel_limit':
                        if st['order'] is None: st['order'] = ('plev', P_lo, i)
                    elif E == 'mid_limit':
                        if st['order'] is None: st['order'] = ('mid', 0.5 * (h[s:e].max() + ext), i)
                    elif E == 'zone_limit' and st['cisd']:
                        lvl = st['hi'] - 0.705 * (st['hi'] - ext)
                        st['order'] = ('zone', lvl, st['order'][2] if st['order'] else i)
                # limit fill on a LATER bar than placement
                if entry is None and st['order'] is not None and i > st['order'][2] and l[i] <= st['order'][1] - p.get('fill_pen', 0) * abs(st['order'][1]):
                    entry = min(st['order'][1], o[i]); etype = 'maker'
                if entry is not None:
                    a_ = A[i]
                    sl = ext - p['sl_buf_atr'] * a_
                    risk = entry - sl
                    rp = risk / abs(entry)
                    if risk <= 0 or rp < p['min_risk'] or rp > p['max_risk']:
                        st['order'] = None
                        if etype == 'maker' or p['entry'] in ('cisd_close', 'crt_close'):
                            break
                        i += 1; continue
                    if p['tp'] == 'rr': tp = entry + p['rr'] * risk
                    elif p['tp'] == 'prev_opp': tp = P_hi
                    elif p['tp'] == 'prev_eq': tp = 0.5 * (P_hi + P_lo)
                    rr = (tp - entry) / risk
                    if rr < p['min_rr']:
                        break
                    hour = int((t[i] % 86400) // 3600)
                    di = dpos[i]
                    if di >= 1:
                        pdh, pdl, pdo, pdc = dH[di - 1], dL[di - 1], dO[di - 1], dC[di - 1]
                        d_bias = 1 if pdc > pdo else -1
                        d_loc = (entry - pdl) / (pdh - pdl) if pdh > pdl else 0.5
                        d_swept = l[dstart[di]:i + 1].min() < pdl     # today already took PDL
                        d_open_rel = entry > dO[di]                   # above today's open
                    else:
                        d_bias = 0; d_loc = 0.5; d_swept = False; d_open_rel = False
                    feats = dict(d_bias=d_bias, d_loc=d_loc, d_swept=bool(d_swept), above_dopen=bool(d_open_rel),
                                 above_ema=bool(entry > ema[i]), P_bull=bool(hk_c[si - 1] > hk_o[si - 1]),
                                 sweep_min=int((i0 - s) * (t[1] - t[0]) / 60), P_rng_atr=(P_hi - P_lo) / A[i],
                                 depth_atr=(P_lo - ext) / A[i], room_R=(P_hi - entry) / (entry - (ext - p['sl_buf_atr'] * A[i])),
                                 closed_back=bool(c[e - 1] > P_lo), htf_bull=bool(c[e - 1] > o[s]), dow=int((t[i] // 86400 + 4) % 7))
                    in_trade = dict(sym=sym, side=side, t_entry=int(t[i]), i_entry=i, entry=entry, sl=sl, tp=tp,
                                    rr=rr, risk_pct=rp, etype=etype, score=int(score), hour=hour,
                                    sweep_depth=(P_lo - ext) / abs(P_lo), bars_from_sweep=i - i0,
                                    sl_cur=sl, **comps, **feats)
                    # same-bar handling for limit fills: only the stop can trigger on the fill bar
                    if etype == 'maker' and l[i] <= sl:
                        in_trade['exit'] = sl; in_trade['how'] = 'sl'; in_trade['i_exit'] = i
                        trades.append(in_trade); break
                    i += 1; continue
            else:
                tr = in_trade
                if l[i] <= tr['sl_cur']:
                    tr['exit'] = min(tr['sl_cur'], o[i]); tr['how'] = 'sl' if tr['sl_cur'] < tr['entry'] else 'be'
                elif h[i] >= tr['tp']:
                    tr['exit'] = max(tr['tp'], o[i]) if o[i] > tr['tp'] else tr['tp']; tr['how'] = 'tp'
                elif i - tr['i_entry'] >= p['max_hold']:
                    tr['exit'] = c[i]; tr['how'] = 'time'
                else:
                    if p['be_at'] and h[i] >= tr['entry'] + p['be_at'] * (tr['entry'] - tr['sl']):
                        tr['sl_cur'] = max(tr['sl_cur'], tr['entry'] + abs(tr['entry']) * 0.0008)
                    i += 1; continue
                tr['i_exit'] = i
                trades.append(tr); break
            i += 1
    # convert mirrored prices back + compute R incl. fees
    out = []
    for tr in trades:
        risk = tr['entry'] - tr['sl']
        gross = (tr['exit'] - tr['entry']) / risk
        fin = p['fee_maker'] if tr['etype'] == 'maker' else p['fee_taker'] + p['slip']
        fout = p['fee_maker'] if tr['how'] == 'tp' else p['fee_taker'] + p['slip']
        fees_R = (fin + fout) / tr['risk_pct']
        tr['R'] = gross - fees_R
        tr['gross_R'] = gross
        for kk in ('entry', 'sl', 'tp', 'exit', 'sl_cur'):
            tr[kk] = sgn * tr[kk]
        out.append(tr)
    return out

_cache = {}
def prep(sym, ltf=300):
    key = (sym, ltf)
    if key in _cache: return _cache[key]
    t, o, h, l, c = load(sym)
    if ltf != 300:
        g = t // ltf
        idx = np.flatnonzero(np.diff(g, prepend=g[0] - 1))
        o = o[idx]; c = np.append(c[idx[1:] - 1], c[-1])
        h = np.maximum.reduceat(h, idx); l = np.minimum.reduceat(l, idx); t = g[idx] * ltf
    A = atr(h, l, c); R = rsi(c)
    _cache[key] = (t, o, h, l, c, A, R)
    return _cache[key]

def run(sym, **kw):
    p = dict(DEFAULT); p.update(kw)
    t, o, h, l, c, A, R = prep(sym, p.get('ltf', 300))
    tr = run_side(t, o, h, l, c, A, R, p, 'long', sym)
    tr += run_side(t, -o, -l, -h, -c, A, 100 - R, p, 'short', sym)
    return tr

SYMS = sorted(os.path.basename(f)[:-4] for f in glob.glob(os.path.join(DATA, '*.csv')))

def run_all(syms=None, **kw):
    rows = []
    for s in (syms or SYMS):
        rows += run(s, **kw)
    return pd.DataFrame(rows)

def stats(df, split=None):
    if df is None or not len(df): return dict(n=0)
    df = df.sort_values('t_entry')
    r = df.R.values
    eq = np.cumsum(r); dd = (np.maximum.accumulate(eq) - eq).max() if len(eq) else 0
    wins = r[r > 0].sum(); loss = -r[r < 0].sum()
    return dict(n=len(r), win=round((r > 0).mean() * 100, 1), avgR=round(r.mean(), 3), totR=round(r.sum(), 1),
                pf=round(wins / loss, 2) if loss > 0 else np.inf, maxDD=round(dd, 1))
