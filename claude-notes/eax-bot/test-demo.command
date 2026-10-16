#!/bin/bash
# Preizkus ključa na Bybit DEMO: odda majhen BTC limit 20 % pod ceno in ga takoj prekliče.
cd "$(dirname "$0")"
python3 eax_bot.py --test
echo; read -n 1 -s -r -p "Pritisni katerokoli tipko za zapiranje …"
