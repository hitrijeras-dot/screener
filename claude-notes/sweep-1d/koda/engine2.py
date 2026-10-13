"""Engine 2 – Sweep Model: vse točke indikatorja kot vstop, vsi HTF, 5m CISD na nivoju.

Setup (long; short = zrcaljene cene): HTF sveča S posweepa low prejšnje sveče P in se ZAPRE nazaj nad P.low.
Ob zaprtju S se postavi vstop (limit ali čakanje na potrditev), veljaven `life` HTF sveč.
Setup odpade, če cena pred vstopom preseže ekstrem S.
Vstopi (entry):
  level   – limit na posweepan nivo P.low
  fvg     – limit na vrh zadnjega bull FVG (≥0.3 ATR) med ekstremom in zaprtjem S
  fvgmid  – limit na sredino tega FVG
  ifvg    – limit na vrh bear FVG iz poteze v sweep, ki ga je zaprtje že obrnilo (inverzija)
  cisd    – limit na CISD nivo (open prve sveče zadnjega niza ≥2 bear sveč pred ekstremom), če je CISD potrjen do zaprtja S
  zone    – limit na 0.705 (sredina 1-2 / OTE cone) impulza ekstrem→najvišji high do zaprtja S, če je CISD potrjen
  gp      – limit na 0.635 (golden pocket) istega impulza, brez CISD pogoja
  fib05   – limit na HTF fib pivot 0.5 sveče P: (H+L+C)/3 − 0.5·(H−L)
  mid     – limit na sredino S (ekstrem↔high S)
  market  – vstop ob odprtju prve LTF sveče po zaprtju S
  cisd5   – počakaj dotik P.low, nato LTF CISD (close nad open prve sveče niza ≥2 bear sveč do lokalnega dna); vstop ob zaprtju; SL pod lokalnim dnom
  cisd5w  – kot cisd5, a SL pod ekstremom S
SL: ekstrem − sl_buf·(P.high−P.low). TP: eq (sredina P), opp (P.high), rrX (X·R).
"""
import numpy as np, pandas as pd, os, glob

BASE = os.path.dirname(os.path.abspath(__file__))
WEEK_OFF = 4 * 86400  # 1. 1. 1970 je četrtek → tedni od ponedeljka

def load_merged(sym, dirs=('data_old', 'data')):
    parts = [pd.read_csv(os.path.join(BASE, d, sym + '.csv')) for d in dirs if os.path.exists(os.path.join(BASE, d, sym + '.csv'))]
    d = pd.concat(parts).drop_duplicates('t').sort_values('t')
    return d.t.values.astype(np.int64), d.o.values, d.h.values, d.l.values, d.c.values

def resample(t, o, h, l, c, sec, off=0):
    g = (t - off) // sec
    idx = np.flatnonzero(np.diff(g, prepend=g[0] - 1))
    O = o[idx]; C = np.append(c[idx[1:] - 1], c[-1])
    H = np.maximum.reduceat(h, idx); L = np.minimum.reduceat(l, idx)
    return g[idx] * sec + off, O, H, L, C, idx

def atr(h, l, c, n=14):
    pc = np.concatenate([[c[0]], c[:-1]])
    tr = np.maximum(h - l, np.maximum(abs(h - pc), abs(l - pc)))
    out = np.empty_like(tr); out[0] = tr[0]
    for i in range(1, len(tr)):
        out[i] = out[i - 1] + (tr[i] - out[i - 1]) / n
    return out

DEF = dict(htf=86400, entry='level', tp='eq', rr=2.0, life=1, hold=2, sl_buf=0.05, min_risk=0.003, max_risk=0.05,
           min_rr=1.0, fvg_atr=0.3, fee_m=0.0002, fee_t=0.00055, slip=0.0002, fill_pen=0.0)

def side_run(t, o, h, l, c, A, p, sym, side):
    sec = p['htf']; off = WEEK_OFF if sec == 604800 else 0
    T, O, H, L, C, idx = resample(t, o, h, l, c, sec, off)
    n = len(t); out = []
    dt = t[1] - t[0]
    life_bars = int(p['life'] * sec // dt); hold_bars = int(p['hold'] * sec // dt)
    E = p['entry']
    for k in range(2, len(T) - 1):
        s = idx[k]; e = idx[k + 1] if k + 1 < len(idx) else n
        if e >= n - 1: break
        Pl, Ph, Pc = L[k - 1], H[k - 1], C[k - 1]
        if not (L[k] < Pl and C[k] > Pl): continue
        # ekstrem znotraj S
        seg = l[s:e]; ei = s + int(np.argmin(seg)); ext = l[ei]
        rngP = Ph - Pl
        if rngP <= 0: continue
        buf = p['sl_buf'] * rngP
        hiS = h[ei:e].max() if ei < e else h[ei]
        # --- nivo vstopa
        lvl = None; mkt = False; conf = None
        if E == 'level': lvl = Pl
        elif E == 'mid': lvl = 0.5 * (hiS + ext)
        elif E == 'fib05': lvl = (Ph + Pl + Pc) / 3 - 0.5 * rngP
        elif E == 'market': mkt = True
        elif E in ('fvg', 'fvgmid'):
            for j in range(e - 1, ei + 1, -1):
                if l[j] > h[j - 2] and (l[j] - h[j - 2]) >= p['fvg_atr'] * A[j] and j - 2 >= ei:
                    lvl = l[j] if E == 'fvg' else 0.5 * (l[j] + h[j - 2]); break
        elif E == 'ifvg':
            st = idx[k - 1]
            for j in range(ei, st + 1, -1):
                top, bot = l[j - 2], h[j]
                if top > bot and (top - bot) >= p['fvg_atr'] * A[j]:
                    if c[j + 1:e].max(initial=-np.inf) > top: lvl = top; break
        elif E in ('cisd', 'zone', 'gp'):
            # CISD nivo
            j = ei if c[ei] < o[ei] else ei - 1; lim = max(idx[k - 1], ei - 12); cl = None
            while j >= lim:
                if c[j] < o[j]:
                    r0 = j
                    while r0 - 1 >= lim and c[r0 - 1] < o[r0 - 1]: r0 -= 1
                    if j - r0 + 1 >= 2: cl = o[r0]; break
                    j = r0 - 1
                else: j -= 1
            confirmed = cl is not None and ei + 1 < e and c[ei + 1:e].max() > cl
            if E == 'cisd' and confirmed: lvl = cl
            elif E == 'zone' and confirmed: lvl = hiS - 0.705 * (hiS - ext)
            elif E == 'gp': lvl = hiS - 0.635 * (hiS - ext)
        elif E in ('cisd5', 'cisd5w', 'cisdr', 'cisdrw'):
            conf = True
        if not mkt and not conf:
            if lvl is None or not (ext < lvl < C[k]): continue
        # --- iskanje vstopa
        end = min(n, e + life_bars); entry = None; fi = None; etype = 'maker'; sl = ext - buf
        if mkt:
            fi = e; entry = o[e]; etype = 'taker'
        elif conf:
            touched = False; LL = np.inf; cl = None
            for j in range(e, end):
                if l[j] < ext: break
                if not touched:
                    if l[j] <= Pl: touched = True
                    else: continue
                if l[j] <= LL:
                    LL = l[j]; cl = None
                    jj = j if c[j] < o[j] else j - 1; lim = max(e - 12, jj - 12)
                    while jj >= lim:
                        if c[jj] < o[jj]:
                            r0 = jj
                            while r0 - 1 >= lim and c[r0 - 1] < o[r0 - 1]: r0 -= 1
                            if jj - r0 + 1 >= 2: cl = o[r0]; break
                            jj = r0 - 1
                        else: jj -= 1
                    continue
                if cl is not None and c[j] > cl:
                    if E in ('cisd5', 'cisd5w'):
                        fi = j; entry = c[j]; etype = 'taker'
                        if E == 'cisd5': sl = LL - buf * 0.5
                        break
                    # retest: limit na CISD nivo po potrditvi
                    if E == 'cisdr': sl = LL - buf * 0.5
                    for jj in range(j + 1, end):
                        if l[jj] < sl: break
                        if l[jj] <= cl: fi = jj; entry = min(cl, o[jj]); break
                    break
        else:
            for j in range(e, end):
                if l[j] < ext: break
                if l[j] <= lvl - p['fill_pen'] * lvl:
                    fi = j; entry = min(lvl, o[j]); break
        if fi is None: continue
        risk = entry - sl; rp = risk / entry
        if risk <= 0 or rp < p['min_risk'] or rp > p['max_risk']: continue
        tpm = p['tp']
        tp = (Pl + Ph) / 2 if tpm == 'eq' else Ph if tpm == 'opp' else entry + p['rr'] * risk
        rr = (tp - entry) / risk
        if rr < p['min_rr']: continue
        # --- izhod
        ex = None; how = None
        if etype == 'maker' and l[fi] <= sl: ex = sl; how = 'sl'; xi = fi
        else:
            stop = min(n, fi + hold_bars + 1)
            for j in range(fi + 1, stop):
                if l[j] <= sl: ex = min(sl, o[j]); how = 'sl'; xi = j; break
                if h[j] >= tp: ex = max(tp, o[j]) if o[j] > tp else tp; how = 'tp'; xi = j; break
            if ex is None:
                xi = stop - 1; ex = c[xi]; how = 'time'
        fin = p['fee_m'] if etype == 'maker' else p['fee_t'] + p['slip']
        fout = p['fee_m'] if how == 'tp' else p['fee_t'] + p['slip']
        R = (ex - entry) / risk - (fin + fout) / rp
        out.append(dict(sym=sym, side=side, t=int(t[fi]), R=R, rr=rr, rp=rp, how=how, hold=int((t[xi] - t[fi]) // 60)))
    return out

_cache = {}
def get(sym, dirs, ltf=0):
    key = (sym, dirs, ltf)
    if key not in _cache:
        t, o, h, l, c = load_merged(sym, dirs)
        if ltf:
            t, o, h, l, c, _ = resample(t, o, h, l, c, ltf)
        _cache[key] = (t, o, h, l, c, atr(h, l, c))
    return _cache[key]

def run(sym, dirs=('data_old', 'data'), **kw):
    p = dict(DEF); p.update(kw)
    t, o, h, l, c, A = get(sym, dirs, p.get('ltf', 0))
    r = side_run(t, o, h, l, c, A, p, sym, 'long')
    r += side_run(t, -o, -l, -h, -c, A, p, sym, 'short')
    return r

A_END = 1784125800; C_START = A_END + 60 * 86400
def blk(ts):
    return np.where(ts < A_END, 'A', np.where(ts < C_START, 'B', 'C'))

def run_all(syms, dirs=('data_old', 'data'), **kw):
    rows = []
    for s in syms: rows += run(s, dirs, **kw)
    df = pd.DataFrame(rows)
    if len(df): df['blk'] = blk(df.t.values)
    return df

def summary(df):
    if df is None or not len(df): return dict(n=0)
    df = df.sort_values('t'); r = df.R.values; eq = np.cumsum(r)
    out = dict(n=len(r), avg=r.mean(), tot=r.sum(), win=(r > 0).mean() * 100, dd=(np.maximum.accumulate(eq) - eq).max(),
               hold_h=df.hold.mean() / 60)
    for b in 'ABC':
        x = df[df.blk == b].R
        out['n' + b] = len(x); out[b] = x.mean() if len(x) else np.nan
    return out
