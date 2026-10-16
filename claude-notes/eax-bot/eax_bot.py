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
    "MARKET_IF_BETTER": "1",   # 1 = če je cena že v izgubi od vstopa (boljša cena), vstopi z MARKET naročilom
    "MARKET_MAX_LOSS_R": "0.5",
    "BE_AFTER_TP1": "1",    # 1 = na TP1 zapre del pozicije, ostalo cilja TP2, SL gre na vstop (BE)
    "TP1_CLOSE_PCT": "50",  # koliko % pozicije zapre na TP1
    "BE_OFFSET_PCT": "0.1", # BE malo čez vstop, da pokrije provizije (%)
    "BE_AT_R": "1",         # ko je trejd v plusu toliko R, SL na BE (0 = izklop)# ... a samo, če je cena od vstopa proti SL največ toliko R (0.5 = pol poti do SL)
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

    def position(self, sym):
        r = self.ok(self._req("GET", "/v5/position/list", {"category": "linear", "symbol": sym}, True), "pozicija")
        for p in r.get("list", []):
            if float(p.get("size") or 0) > 0:
                return {"size": float(p["size"]), "avg": float(p.get("avgPrice") or 0), "side": p.get("side")}
        return {"size": 0.0, "avg": 0.0, "side": ""}

    def set_sl(self, sym, sl):
        return self.ok(self._req("POST", "/v5/position/trading-stop", {"category": "linear", "symbol": sym, "tpslMode": "Full",
                                                                       "stopLoss": sl, "slTriggerBy": "LastPrice", "positionIdx": 0}, True), "premik SL")

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
    if (long and px >= t1) or ((not long) and px <= t1):
        return None, "cena je že na TP1"
    market = (long and px <= e) or ((not long) and px >= e)   # cena je v izgubi od vstopa = boljša cena od vstopa
    if market:
        r_now = (px - e) / (e - s) if long else (e - px) / (s - e)
        if cfg["MARKET_IF_BETTER"] != "1":
            return None, f"cena {px} je že čez vstop {e} (Post-Only limit bi takoj izpolnil) – preskočim"
        if (long and px <= s) or ((not long) and px >= s):
            return None, "cena je že na SL"
        if r_now < -float(cfg["MARKET_MAX_LOSS_R"]):
            return None, f"cena je že {r_now:.2f}R od vstopa (meja −{cfg['MARKET_MAX_LOSS_R']}R) – preskočim"
        if abs(px - s) / px * 100 < float(cfg["MIN_SL_PCT"]):
            return None, "do SL je premalo prostora za market vstop"
        e = px
        sl_pct = abs(e - s) / e * 100
    risk = float(cfg["RISK_USD"])
    qty = risk / (abs(e - s) + e * (FEE_T if market else FEE_M) + s * FEE_T)
    qty = math.floor(qty / ins["step"] + 1e-9) * ins["step"]
    if qty < ins["min"]:
        return None, f"količina {qty} je pod minimumom {ins['min']}"
    lev = int(max(1, min(ins["lev"], float(cfg["MAX_LEV"]), math.floor(0.8 / (sl_pct / 100)))))
    link = f"eax-{c['sym']}-{int(time.time())}"[:36]
    body = {"category": "linear", "symbol": sym, "side": "Buy" if long else "Sell", "orderType": "Limit",
            "qty": fmt_step(qty, ins["step"]), "price": fmt_step(e, ins["tick"]), "timeInForce": "PostOnly",
            "orderLinkId": link, "takeProfit": fmt_step(t1, ins["tick"]), "stopLoss": fmt_step(s, ins["tick"]),
            "tpslMode": "Full", "tpTriggerBy": "LastPrice", "slTriggerBy": "LastPrice", "positionIdx": 0}
    if market:
        body["orderType"] = "Market"; body["timeInForce"] = "IOC"; del body["price"]
    fe = FEE_T if market else FEE_M
    t2 = c.get("tp2")
    be = cfg["BE_AFTER_TP1"] == "1" and t2 and ((long and float(t2) > t1) or ((not long) and float(t2) < t1))
    meta = {"long": long, "tp1": fmt_step(t1, ins["tick"]), "sl": fmt_step(s, ins["tick"]), "step": ins["step"], "tick": ins["tick"], "be": bool(be)}
    if be:
        t2 = round_price(float(t2), ins["tick"])
        body["takeProfit"] = fmt_step(t2, ins["tick"])
        meta["tp2"] = body["takeProfit"]
    loss = qty * abs(e - s) + qty * e * fe + qty * s * FEE_T
    gain = qty * abs(t1 - e) - qty * e * fe - qty * t1 * FEE_M
    desc = (f"{c['sym']} {'LONG' if long else 'SHORT'} ({c.get('grade')}) {'MARKET ≈' + fmt_step(e, ins['tick']) + ' (cena v izgubi od vstopa ' + fmt_step(float(c['entry']), ins['tick']) + ')' if market else 'limit ' + body['price']} · SL {body['stopLoss']} ({sl_pct:.2f} %) · "
            + (f"TP1 {meta['tp1']} ({cfg['TP1_CLOSE_PCT']} %) → SL na BE · TP2 {meta['tp2']} · " if be else f"TP1 {body['takeProfit']} · ") +
            f"količina {body['qty']} (≈{qty * e:.0f} $) · vzvod {lev}x · izguba na SL −{loss:.2f} $ · TP1 +{gain:.2f} $")
    return (body, lev, meta), desc


def manage(cfg, bb, link, o):
    """Po vstopu: (če BE_AFTER_TP1) delni TP1; SL na BE pri +BE_AT_R R ali po TP1; konec, ko je pozicija zaprta."""
    m, sym = o["meta"], o["symbol"]
    pos = bb.position(sym)
    if not o.get("tp1_link"):
        if pos["size"] <= 0:
            return
        o["size0"], o["avg"] = pos["size"], pos["avg"]
        q = math.floor(pos["size"] * float(cfg["TP1_CLOSE_PCT"]) / 100 / m["step"] + 1e-9) * m["step"]
        if not m.get("be"):
            o["tp1_link"] = "-"
        elif q <= 0 or q >= pos["size"]:
            log(f"   {o['sym']}: pozicija premajhna za delni TP1 – ostane SL + TP2.")
            o["tp1_link"] = "-"
        else:
            tl = (link + "-t1")[:36]
            bb.create({"category": "linear", "symbol": sym, "side": "Sell" if m["long"] else "Buy", "orderType": "Limit",
                       "qty": fmt_step(q, m["step"]), "price": m["tp1"], "timeInForce": "GTC", "reduceOnly": True,
                       "orderLinkId": tl, "positionIdx": 0})
            o["tp1_link"] = tl
            log(f"🎯 {o['sym']}: delni TP1 {fmt_step(q, m['step'])} @ {m['tp1']} postavljen (reduce-only).")
        return
    if pos["size"] <= 0:
        if o.get("tp1_link") not in (None, "-"):
            bb.cancel(sym, o["tp1_link"])
        log(f"🏁 {o['sym']}: pozicija zaprta ({'SL je bil na BE' if o.get('be_done') else 'SL ali TP'}).")
        o["done"] = "closed"
        return
    if o.get("be_done"):
        return
    avg = o.get("avg") or pos["avg"]
    reason = None
    if pos["size"] < o.get("size0", pos["size"]) - m["step"] / 2:
        reason = "TP1 dosežen"
    elif m.get("sl") and float(cfg["BE_AT_R"]) > 0:
        px = bb.price(sym)
        risk = abs(avg - float(m["sl"]))
        r = ((px - avg) if m["long"] else (avg - px)) / risk if risk else 0
        if r >= float(cfg["BE_AT_R"]):
            reason = f"trejd je +{r:.2f}R"
    if reason:
        off = float(cfg["BE_OFFSET_PCT"]) / 100
        be = round_price(avg * (1 + off) if m["long"] else avg * (1 - off), m["tick"])
        bb.set_sl(sym, fmt_step(be, m["tick"]))
        o["be_done"] = True
        o["phase"] = "be"
        log(f"🔒 {o['sym']}: {reason} – SL premaknjen na BE {fmt_step(be, m['tick'])}.")


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
        if o.get("phase") in ("open", "be"):
            try:
                manage(cfg, bb, link, o)
            except Exception as e:
                log(f"   napaka pri upravljanju {o['sym']}: {e}")
            continue
        try:
            s = bb.order_status(o["symbol"], link)
        except Exception as e:
            log(f"   napaka statusa {link}: {e}")
            continue
        status = (s or {}).get("orderStatus", "?")
        if status == "Filled":
            m = o.get("meta") or {}
            log(f"✅ {o['sym']}: vstop IZPOLNJEN – " + (f"SL in TP2 sta na Bybitu, postavljam delni TP1 ({cfg['TP1_CLOSE_PCT']} %)." if m.get("be") else "SL in TP1 sta na Bybitu.")
                + (f" Pri +{cfg['BE_AT_R']}R gre SL na BE." if float(cfg["BE_AT_R"]) > 0 else ""))
            o["phase"] = "open"
            try:
                manage(cfg, bb, link, o)
            except Exception as e:
                log(f"   napaka pri upravljanju {o['sym']}: {e}")
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
            mine = [o for o in bb.open_orders() if (o.get("orderLinkId") or "").startswith("eax-") and not o.get("reduceOnly")]
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
        body, lev, meta = res
        if cfg["DRY_RUN"] == "1":
            log(f"🧪 (DRY_RUN) BI ODDAL: {desc}")
            st["orders"][body["orderLinkId"]] = {"sym": c["sym"], "symbol": body["symbol"], "t": int(now), "done": "dry"}
            continue
        try:
            bb.set_leverage(body["symbol"], lev)
            bb.create(body)
            log(f"📤 ODDANO: {desc}")
            st["orders"][body["orderLinkId"]] = {"sym": c["sym"], "symbol": body["symbol"], "t": int(now), "body": body, "meta": meta}
            active += 1
        except Exception as e:
            log(f"✖ {c['sym']}: oddaja ni uspela: {e}")


def simulacija(cfg, bb):
    """Brez naročil: za vsako kartico V IGRI z vstopom pokaže, kaj bi bot naredil, če bi bila zdaj nova FIRST ENTRY."""
    v = get_vault(cfg["VAULT_URL"])
    log(f"SIMULACIJA (nič se ne odda) · Vault osvežen {v.get('updated')} · {len(v.get('cards', []))} kartic")
    n = 0
    for c in v.get("cards", []):
        if not (c.get("sec") == "IN PLAY" and c.get("entry") and c.get("stop") and c.get("tp1")):
            continue
        n += 1
        try:
            res, desc = plan(c, cfg, bb)
            log(("✔ BI ODDAL: " if res else "– preskočil: ") + (desc if res else f"{c['sym']}: {desc}") + f"   [na kartici {c.get('type') or '?'}]")
        except Exception as e:
            log(f"✖ {c['sym']}: {e}")
    log(f"Konec simulacije · {n} kartic v igri pregledanih.")


def test_narocilo(cfg, bb):
    """Preizkus povezave na DEMO: odda majhen Post-Only limit daleč od cene, preveri in ga takoj prekliče."""
    if cfg["DEMO"] != "1":
        log("Test naročila teče samo na DEMO (DEMO=1).")
        return
    sym = "BTCUSDT"
    log("1/5 Povezava z Bybit DEMO …")
    n = len(bb.positions())
    log(f"   ✔ ključ deluje · odprtih pozicij {n}")
    ins = bb.instrument(sym)
    px = bb.price(sym)
    e = round_price(px * 0.80, ins["tick"])
    log(f"2/5 BTC cena {px} · testni BUY limit {e} (20 % pod ceno, ne bo se izpolnil), količina {ins['min']}")
    link = f"eax-test-{int(time.time())}"
    bb.create({"category": "linear", "symbol": sym, "side": "Buy", "orderType": "Limit", "qty": fmt_step(ins["min"], ins["step"]),
               "price": fmt_step(e, ins["tick"]), "timeInForce": "PostOnly", "orderLinkId": link,
               "stopLoss": fmt_step(round_price(px * 0.78, ins["tick"]), ins["tick"]), "takeProfit": fmt_step(round_price(px * 0.85, ins["tick"]), ins["tick"]),
               "tpslMode": "Full", "positionIdx": 0})
    log("3/5 ✔ naročilo oddano")
    time.sleep(3)
    s = bb.order_status(sym, link) or {}
    log(f"4/5 status na Bybitu: {s.get('orderStatus')} (pričakovano New)")
    ok = bb.cancel(sym, link)
    time.sleep(2)
    s = bb.order_status(sym, link) or {}
    log(f"5/5 {'✔ preklicano' if ok else '✖ preklic ni uspel – prekliči ročno na Bybitu'} · status {s.get('orderStatus')}")
    log("TEST USPEŠEN – bot lahko oddaja in preklicuje naročila na tvojem demo računu." if ok and s.get("orderStatus") == "Cancelled" else "Test ni v celoti uspel – poglej zgoraj.")


def main():
    cfg = load_cfg()
    if "--simulacija" in sys.argv:
        simulacija(cfg, Bybit(cfg))
        return
    if "--test" in sys.argv:
        try:
            test_narocilo(cfg, Bybit(cfg))
        except Exception as e:
            log(f"✖ Test ni uspel: {e}  (preveri API_KEY/API_SECRET, DEMO=1 in dovoljenja ključa Contract Orders+Positions)")
        return
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
    first = not st.get("started")
    while True:
        try:
            cycle(cfg, bb, st, first)
            first = False
            st["started"] = True
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
