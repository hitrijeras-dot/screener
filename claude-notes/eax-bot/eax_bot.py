#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EAX Vault bot – Juretov avtomatski trgovalec za Bybit (USDT perpetual).

Kaj dela (vsako minuto):
  1. Prebere kartice EAX Secret Vaulta iz https://hitrijeras-dot.github.io/screener/vault/vault.json
     (to datoteko osvežuje Claude v zanki vsakih 5 min – če zanka ne teče, bot nima novih kartic).
  2. Za vsako NOVO kartico "FIRST ENTRY" (v igri, z vstopom, SL in TP1) odda Post-Only LIMIT na vstopu,
     s SL in TP1 že pripetima. Količina je izračunana tako, da je izguba na SL s provizijami = RISK_USD.
  3. Neizpolnjen limit prekliče, če kartice ni več v Vaultu, če je kartica že na TP1/SL ali po ORDER_TTL_H urah.

Varovalke: DRY_RUN=1 (privzeto) samo izpiše, kaj bi naredil. Največ MAX_OPEN poslov hkrati.
Ob zagonu NE trguje kartic, ki so bile v Vaultu že prej (samo nove od zagona naprej).
Nastavitve so v datoteki nastavitve.txt (v isti mapi). API ključ ostane samo na tvojem računalniku.
Uporablja samo Python (brez dodatnih paketov). Ni finančni nasvet.
"""
import hashlib, hmac, json, math, os, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
CFG_FILE = os.path.join(HERE, "nastavitve.txt")
STATE_FILE = os.path.join(HERE, "stanje.json")
LOG_FILE = os.path.join(HERE, "dnevnik.txt")
FEE_M, FEE_T = 0.0002, 0.00055          # maker vstop, taker izhod (SL)

DEFAULTS = {
    "API_KEY": "", "API_SECRET": "",
    "DEMO": "1",            # 1 = Bybit demo (api-demo.bybit.com), 0 = pravi račun
    "DRY_RUN": "1",         # 1 = samo izpiše, kaj bi naredil; 0 = res odda naročila
    "RISK_USD": "10",       # izguba na SL s provizijami, v $
    "MAX_OPEN": "3",        # največ odprtih poslov + čakajočih limitov bota hkrati
    "GRADES": "S,A,B,C",    # katere ocene kartic trguje
    "MAX_AGE_MIN": "30",    # kartica mora biti sprožena največ toliko minut nazaj
    "ORDER_TTL_H": "4",     # neizpolnjen limit prekliči po toliko urah
    "MIN_SL_PCT": "0.3",    # preskoči, če je SL bližje od tega (%)
    "MAX_SL_PCT": "15",     # preskoči, če je SL dlje od tega (%)
    "MAX_LEV": "10",        # največji vzvod, ki ga bot nastavi
    "CHECK_SEC": "60",      # kako pogosto preveri (sekunde)
    "VAULT_URL": "https://hitrijeras-dot.github.io/screener/vault/vault.json",
    "BASE_URL": "",         # samo za test; prazno = samodejno glede na DEMO
}


def load_cfg():
    cfg = dict(DEFAULTS)
    if os.path.exists(CFG_FILE):
        for line in open(CFG_FILE, encoding="utf-8"):
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            cfg[k.strip().upper()] = v.strip().strip('"').strip("'")
    if not cfg["BASE_URL"]:
        cfg["BASE_URL"] = "https://api-demo.bybit.com" if cfg["DEMO"] == "1" else "https://api.bybit.com"
    return cfg


def log(msg):
    line = datetime.now().strftime("%d.%m. %H:%M:%S") + "  " + msg
    print(line, flush=True)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


def load_state():
    try:
        return json.load(open(STATE_FILE, encoding="utf-8"))
    except Exception:
        return {"seen": {}, "orders": {}}


def save_state(st):
    tmp = STATE_FILE + ".tmp"
    json.dump(st, open(tmp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    os.replace(tmp, STATE_FILE)


# ---------------- Bybit v5 ----------------
class Bybit:
    def __init__(self, cfg):
        self.base = cfg["BASE_URL"].rstrip("/")
        self.key, self.secret = cfg["API_KEY"], cfg["API_SECRET"]
        self.recv = "10000"
        self.ins = {}

    def _req(self, method, path, params=None, signed=False):
        params = params or {}
        headers = {"Content-Type": "application/json"}
        if method == "GET":
            qs = urllib.parse.urlencode(params)
            url = self.base + path + ("?" + qs if qs else "")
            payload, data = qs, None
        else:
            url = self.base + path
            payload = json.dumps(params, separators=(",", ":"))
            data = payload.encode()
        if signed:
            ts = str(int(time.time() * 1000))
            sign = hmac.new(self.secret.encode(), (ts + self.key + self.recv + payload).encode(), hashlib.sha256).hexdigest()
            headers.update({"X-BAPI-API-KEY": self.key, "X-BAPI-TIMESTAMP": ts, "X-BAPI-RECV-WINDOW": self.recv, "X-BAPI-SIGN": sign})
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=20) as r:
            j = json.loads(r.read().decode())
        return j

    def ok(self, j, what):
        if j.get("retCode") != 0:
            raise RuntimeError(f"{what}: {j.get('retCode')} {j.get('retMsg')}")
        return j.get("result") or {}

    def instrument(self, sym):
        if sym not in self.ins:
            r = self.ok(self._req("GET", "/v5/market/instruments-info", {"category": "linear", "symbol": sym}), "instrument")
            i = r["list"][0]
            self.ins[sym] = {"step": float(i["lotSizeFilter"]["qtyStep"]), "min": float(i["lotSizeFilter"]["minOrderQty"]),
                             "tick": float(i["priceFilter"]["tickSize"]), "lev": float(i["leverageFilter"]["maxLeverage"])}
        return self.ins[sym]

    def price(self, sym):
        r = self.ok(self._req("GET", "/v5/market/tickers", {"category": "linear", "symbol": sym}), "cena")
        return float(r["list"][0]["lastPrice"])

    def open_orders(self):
        r = self.ok(self._req("GET", "/v5/order/realtime", {"category": "linear", "settleCoin": "USDT", "limit": "50"}, True), "odprta naročila")
        return r.get("list", [])

    def order_status(self, sym, link):
        for path in ("/v5/order/realtime", "/v5/order/history"):
            r = self.ok(self._req("GET", path, {"category": "linear", "symbol": sym, "orderLinkId": link}, True), "status naročila")
            if r.get("list"):
                return r["list"][0]
        return None

    def positions(self):
        r = self.ok(self._req("GET", "/v5/position/list", {"category": "linear", "settleCoin": "USDT", "limit": "50"}, True), "pozicije")
        return [p for p in r.get("list", []) if float(p.get("size") or 0) > 0]

    def set_leverage(self, sym, lev):
        j = self._req("POST", "/v5/position/set-leverage", {"category": "linear", "symbol": sym, "buyLeverage": str(lev), "sellLeverage": str(lev)}, True)
        if j.get("retCode") not in (0, 110043):   # 110043 = vzvod je že tak
            log(f"   opozorilo vzvod {sym}: {j.get('retCode')} {j.get('retMsg')}")

    def create(self, body):
        return self.ok(self._req("POST", "/v5/order/create", body, True), "oddaja naročila")

    def cancel(self, sym, link):
        j = self._req("POST", "/v5/order/cancel", {"category": "linear", "symbol": sym, "orderLinkId": link}, True)
        return j.get("retCode") == 0


def fmt_step(v, step):
    d = max(0, -int(math.floor(math.log10(step) + 1e-9))) if step < 1 else 0
    return f"{v:.{d}f}"


def round_price(p, tick):
    return round(round(p / tick) * tick, 12)


def get_vault(url):
    req = urllib.request.Request(url + ("&" if "?" in url else "?") + "t=" + str(int(time.time())), headers={"Cache-Control": "no-cache"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def is_first_entry(c):
    return c.get("type") == "FIRST ENTRY" and c.get("sec") == "IN PLAY" and c.get("entry") and c.get("stop") and c.get("tp1")


def card_key(c):
    return f"{c['sym']}|{c.get('firedAt') or c.get('time')}"


def plan(c, cfg, bb):
    """Izračun limita za kartico. Vrne (body, opis) ali (None, razlog)."""
    sym = c["sym"] + "USDT"
    long = "LONG" in c.get("dir", "")
    e, s, t1 = float(c["entry"]), float(c["stop"]), float(c["tp1"])
    if long and not (s < e < t1) or (not long) and not (t1 < e < s):
        return None, "nivoji niso v pravem vrstnem redu"
    sl_pct = abs(e - s) / e * 100
    if sl_pct < float(cfg["MIN_SL_PCT"]) or sl_pct > float(cfg["MAX_SL_PCT"]):
        return None, f"SL {sl_pct:.2f} % izven meja"
    ins = bb.instrument(sym)
    e, s, t1 = round_price(e, ins["tick"]), round_price(s, ins["tick"]), round_price(t1, ins["tick"])
    px = bb.price(sym)
    if (long and px <= e) or ((not long) and px >= e):
        return None, f"cena {px} je že čez vstop {e} (Post-Only limit bi takoj izpolnil) – preskočim"
    if (long and px >= t1) or ((not long) and px <= t1):
        return None, "cena je že na TP1"
    risk = float(cfg["RISK_USD"])
    qty = risk / (abs(e - s) + e * FEE_M + s * FEE_T)
    qty = math.floor(qty / ins["step"] + 1e-9) * ins["step"]
    if qty < ins["min"]:
        return None, f"količina {qty} je pod minimumom {ins['min']}"
    lev = int(max(1, min(ins["lev"], float(cfg["MAX_LEV"]), math.floor(0.8 / (sl_pct / 100)))))
    link = f"eax-{c['sym']}-{int(time.time())}"[:36]
    body = {"category": "linear", "symbol": sym, "side": "Buy" if long else "Sell", "orderType": "Limit",
            "qty": fmt_step(qty, ins["step"]), "price": fmt_step(e, ins["tick"]), "timeInForce": "PostOnly",
            "orderLinkId": link, "takeProfit": fmt_step(t1, ins["tick"]), "stopLoss": fmt_step(s, ins["tick"]),
            "tpslMode": "Full", "tpTriggerBy": "LastPrice", "slTriggerBy": "LastPrice", "positionIdx": 0}
    loss = qty * abs(e - s) + qty * e * FEE_M + qty * s * FEE_T
    gain = qty * abs(t1 - e) - qty * (e + t1) * FEE_M
    desc = (f"{c['sym']} {'LONG' if long else 'SHORT'} ({c.get('grade')}) limit {body['price']} · SL {body['stopLoss']} ({sl_pct:.2f} %) · "
            f"TP1 {body['takeProfit']} · količina {body['qty']} (≈{qty * e:.0f} $) · vzvod {lev}x · izguba na SL −{loss:.2f} $ · TP1 +{gain:.2f} $")
    return (body, lev), desc


def cycle(cfg, bb, st, first):
    v = get_vault(cfg["VAULT_URL"])
    cards = v.get("cards", [])
    upd = v.get("updated")
    age_v = (time.time() - datetime.fromisoformat(upd.replace("Z", "+00:00")).timestamp()) / 60 if upd else 999
    if age_v > 15:
        log(f"⚠ Vault ni osvežen že {age_v:.0f} min (zanka v Claudu ne teče?) – novih naročil ne oddajam.")
    grades = {g.strip().upper() for g in cfg["GRADES"].split(",") if g.strip()}
    now = time.time()
    by_sym = {c["sym"]: c for c in cards}

    # 1) spremljaj oddana naročila
    for link, o in list(st["orders"].items()):
        if o.get("done"):
            continue
        if cfg["DRY_RUN"] == "1":
            continue
        try:
            s = bb.order_status(o["symbol"], link)
        except Exception as e:
            log(f"   napaka statusa {link}: {e}")
            continue
        status = (s or {}).get("orderStatus", "?")
        if status == "Filled":
            log(f"✅ {o['sym']}: limit IZPOLNJEN – pozicija odprta, SL in TP1 sta na Bybitu.")
            o["done"] = "filled"
        elif status in ("Cancelled", "Rejected", "Deactivated"):
            why = (s or {}).get("rejectReason") or (s or {}).get("cancelType") or ""
            log(f"✖ {o['sym']}: naročilo {status} {why}")
            o["done"] = status
        elif status in ("New", "Untriggered"):
            c = by_sym.get(o["sym"])
            reason = None
            if not c:
                reason = "kartice ni več v Vaultu"
            elif c.get("r") and ("TP1 reached" in c["r"] or "stopped" in c["r"].lower()):
                reason = "kartica je že zaključena (" + c["r"] + ")"
            elif now - o["t"] > float(cfg["ORDER_TTL_H"]) * 3600:
                reason = f"limit ni bil izpolnjen v {cfg['ORDER_TTL_H']} h"
            if reason:
                ok = bb.cancel(o["symbol"], link)
                log(f"↩ {o['sym']}: prekličem limit – {reason}" + ("" if ok else " (preklic ni uspel)"))
                if ok:
                    o["done"] = "cancelled"
    # 2) nove First entry kartice
    fresh = []
    for c in cards:
        if not is_first_entry(c):
            continue
        k = card_key(c)
        if k in st["seen"]:
            continue
        st["seen"][k] = int(now)
        if first:
            log(f"   (ob zagonu) {c['sym']} je že bil v Vaultu – ga ne trgujem.")
            continue
        fresh.append(c)
    if not fresh:
        return
    if age_v > 15:
        return
    active = 0
    if cfg["DRY_RUN"] != "1":
        try:
            pos = bb.positions()
            mine = [o for o in bb.open_orders() if (o.get("orderLinkId") or "").startswith("eax-")]
            active = len(pos) + len(mine)
        except Exception as e:
            log(f"⚠ ne morem prebrati računa: {e} – preskočim ta krog.")
            return
    else:
        active = sum(1 for o in st["orders"].values() if not o.get("done"))
    for c in fresh:
        if (c.get("grade") or "").upper() not in grades:
            log(f"– {c['sym']}: ocena {c.get('grade')} ni v GRADES – preskočim.")
            continue
        try:
            fired = datetime.fromisoformat(c["firedAt"].replace("Z", "+00:00")).timestamp()
        except Exception:
            fired = now
        if now - fired > float(cfg["MAX_AGE_MIN"]) * 60:
            log(f"– {c['sym']}: kartica je stara {int((now - fired) / 60)} min – preskočim.")
            continue
        if active >= int(cfg["MAX_OPEN"]):
            log(f"– {c['sym']}: že {active} odprtih (MAX_OPEN {cfg['MAX_OPEN']}) – preskočim.")
            continue
        try:
            res, desc = plan(c, cfg, bb)
        except Exception as e:
            log(f"✖ {c['sym']}: napaka pri izračunu: {e}")
            continue
        if not res:
            log(f"– {c['sym']}: {desc}")
            continue
        body, lev = res
        if cfg["DRY_RUN"] == "1":
            log(f"🧪 (DRY_RUN) BI ODDAL: {desc}")
            st["orders"][body["orderLinkId"]] = {"sym": c["sym"], "symbol": body["symbol"], "t": int(now), "done": "dry"}
            continue
        try:
            bb.set_leverage(body["symbol"], lev)
            bb.create(body)
            log(f"📤 ODDANO: {desc}")
            st["orders"][body["orderLinkId"]] = {"sym": c["sym"], "symbol": body["symbol"], "t": int(now), "body": body}
            active += 1
        except Exception as e:
            log(f"✖ {c['sym']}: oddaja ni uspela: {e}")


def main():
    cfg = load_cfg()
    once = "--enkrat" in sys.argv
    if cfg["DRY_RUN"] != "1" and (not cfg["API_KEY"] or not cfg["API_SECRET"]):
        log("Manjka API_KEY ali API_SECRET v nastavitve.txt.")
        sys.exit(1)
    bb = Bybit(cfg)
    log(f"EAX bot začel · {'DEMO' if cfg['DEMO'] == '1' else 'PRAVI RAČUN'} · {'DRY_RUN (nič ne odda)' if cfg['DRY_RUN'] == '1' else 'ODDAJA NAROČILA'} · "
        f"riziko {cfg['RISK_USD']} $ · max {cfg['MAX_OPEN']} hkrati · ocene {cfg['GRADES']}")
    if cfg["DRY_RUN"] != "1":
        try:
            n = len(bb.positions())
            log(f"Povezava z Bybitom OK · odprtih pozicij: {n}")
        except Exception as e:
            log(f"✖ Povezava z Bybitom ni uspela: {e}  (preveri ključ, DEMO nastavitev in dovoljenja ključa)")
            sys.exit(1)
    st = load_state()
    first = not st["seen"]
    while True:
        try:
            cycle(cfg, bb, st, first)
            first = False
            save_state(st)
        except Exception as e:
            log(f"⚠ napaka v krogu: {e}")
        if once:
            break
        time.sleep(max(15, int(cfg["CHECK_SEC"])))


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("Bot ustavljen (Ctrl+C).")
