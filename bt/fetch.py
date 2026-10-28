# Prenese sveče (1D, 1H, 5m) za backtest. Najprej Bybit, če ni dostopen, Binance (data.binance.vision).
import json, os, sys, time, urllib.request, io, zipfile, csv, datetime as dt
OUT = sys.argv[1] if len(sys.argv) > 1 else 'data'
DAYS = int(os.environ.get('BT_DAYS', '60'))
NCOIN = int(os.environ.get('BT_COINS', '30'))
os.makedirs(OUT, exist_ok=True)
now = int(time.time() * 1000)
end = now // 86400000 * 86400000          # danes 00:00 UTC (do včeraj zaprto)
start5 = end - DAYS * 86400000
start1h = start5 - 30 * 86400000          # 30 dni za 1H zgodovino
start1d = start5 - 120 * 86400000
def get(u, tries=3):
    for k in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30)
            return r.read()
        except Exception as e:
            err = e; time.sleep(1 + k)
    raise err
log = {}
def bybit_ok():
    try:
        j = json.loads(get('https://api.bybit.com/v5/market/tickers?category=linear'))
        return j
    except Exception as e:
        log['bybit_err'] = str(e); return None
def bybit_k(sym, iv, a, b):
    out = {}; e = b
    while True:
        u = f'https://api.bybit.com/v5/market/kline?category=linear&symbol={sym}&interval={iv}&end={e}&limit=1000'
        L = json.loads(get(u))['result']['list']
        if not L: break
        for x in L:
            t = int(x[0])
            if a <= t < b: out[t] = [t, float(x[1]), float(x[2]), float(x[3]), float(x[4])]
        mn = min(int(x[0]) for x in L)
        if mn <= a or len(L) < 1000: break
        e = mn - 1
    return [out[t] for t in sorted(out)]
def bn_rows(data):
    z = zipfile.ZipFile(io.BytesIO(data)); rows = []
    for n in z.namelist():
        for r in csv.reader(io.TextIOWrapper(z.open(n))):
            if not r or not r[0].isdigit(): continue
            rows.append([int(r[0]), float(r[1]), float(r[2]), float(r[3]), float(r[4])])
    return rows
def bn_k(sym, iv, a, b):
    out = {}; base = 'https://data.binance.vision/data/futures/um'
    d = dt.datetime.utcfromtimestamp(a / 1000).replace(day=1)
    last = dt.datetime.utcfromtimestamp((b - 1) / 1000)
    cur_month = dt.datetime.utcfromtimestamp(now / 1000).replace(day=1)
    while d <= last:
        ym = d.strftime('%Y-%m')
        if d < cur_month:
            try:
                for r in bn_rows(get(f'{base}/monthly/klines/{sym}/{iv}/{sym}-{iv}-{ym}.zip')): out[r[0]] = r
            except Exception: pass
        else:
            day = d
            while day <= last:
                try:
                    for r in bn_rows(get(f'{base}/daily/klines/{sym}/{iv}/{sym}-{iv}-{day.strftime("%Y-%m-%d")}.zip')): out[r[0]] = r
                except Exception: pass
                day += dt.timedelta(days=1)
        d = (d + dt.timedelta(days=32)).replace(day=1)
    return [out[t] for t in sorted(out) if a <= t < b]
T = bybit_ok()
src = 'bybit' if T else 'binance'
if T:
    L = [x for x in T['result']['list'] if x['symbol'].endswith('USDT')]
    L.sort(key=lambda x: -float(x.get('turnover24h') or 0))
    syms = [x['symbol'] for x in L[:NCOIN]]
else:
    syms = ['BTCUSDT','ETHUSDT','SOLUSDT','XRPUSDT','DOGEUSDT','BNBUSDT','ADAUSDT','LINKUSDT','AVAXUSDT','SUIUSDT',
            'LTCUSDT','DOTUSDT','TRXUSDT','NEARUSDT','APTUSDT','ARBUSDT','OPUSDT','INJUSDT','TIAUSDT','SEIUSDT',
            'WIFUSDT','1000PEPEUSDT','ENAUSDT','AAVEUSDT','UNIUSDT','FILUSDT','HBARUSDT','BCHUSDT','TONUSDT','WLDUSDT'][:NCOIN]
ivs = {'bybit': {'D': 'D', '60': '60', '5': '5'}, 'binance': {'D': '1d', '60': '1h', '5': '5m'}}[src]
fn = bybit_k if src == 'bybit' else bn_k
meta = {'src': src, 'start5': start5, 'end': end, 'syms': [], 'log': log}
for s in syms:
    try:
        d = {'D': fn(s, ivs['D'], start1d, end), '60': fn(s, ivs['60'], start1h, end), '5': fn(s, ivs['5'], start5, end)}
        if len(d['5']) < 1000 or len(d['60']) < 500: log[s] = 'premalo podatkov'; continue
        json.dump(d, open(f'{OUT}/{s}.json', 'w')); meta['syms'].append(s); print(s, len(d['D']), len(d['60']), len(d['5']), flush=True)
    except Exception as e:
        log[s] = str(e); print(s, 'ERR', e, flush=True)
json.dump(meta, open(f'{OUT}/meta.json', 'w'))
print('vir', src, 'kovanci', len(meta['syms']))
