#!/bin/bash
# Pokaže, kaj bi bot naredil s trenutnimi karticami v Vaultu. NIČ ne odda. Ključ ni potreben.
cd "$(dirname "$0")"
python3 eax_bot.py --simulacija
echo; read -n 1 -s -r -p "Pritisni katerokoli tipko za zapiranje …"
